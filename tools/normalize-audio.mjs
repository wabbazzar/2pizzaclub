// tools/normalize-audio.mjs
//
// Derive the delivery reel.webm from a PRISTINE source (reel.orig.mkv), applying
// EBU R128 loudness normalization to the audio exactly ONCE.
//
//   - Video: copied through untouched when the source is already VP8/VP9 (Instagram
//     serves VP9 DASH), so there is zero video re-encode. Falls back to a single
//     libvpx-vp9 transcode only if the source video is some other codec.
//   - Audio: loudnorm (I=-16 LUFS, TP=-3 soft target, linear=true) + alimiter at a
//     -1.5 dBTP hard ceiling, then libopus 96k — a SINGLE generation off the
//     original AAC.
//
// Why this exists: the previous normalizeAudio() rewrote reel.webm IN PLACE and
// re-encoded opus every run. Each ingest, --skip-capture, batch-normalize, or
// "reprocess catalog" stacked another lossy opus generation on top of the
// MediaRecorder capture's opus — the back catalog went through the encoder 3-4×.
// Peaks stayed capped (so clipping metrics looked clean) while the audio audibly
// rotted. deriveDeliveryWebm is non-destructive and idempotent: it always reads
// the pristine source and never the already-encoded delivery file, so re-running
// it is safe and produces the same result every time.

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

function run(cmd, args) {
    const r = spawnSync(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed: ${r.stderr?.toString().slice(-500)}`);
    return r;
}

function probeVideoCodec(srcPath) {
    const r = spawnSync("ffprobe", [
        "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=codec_name", "-of", "csv=p=0", srcPath
    ], { stdio: ["ignore", "pipe", "pipe"] });
    return (r.stdout?.toString() || "").trim();
}

// Derive outWebmPath from srcPath. srcPath must NOT equal outWebmPath — this is a
// non-destructive transform, the whole point of which is to never re-encode an
// already-normalized delivery file.
export function deriveDeliveryWebm(srcPath, outWebmPath) {
    if (path.resolve(srcPath) === path.resolve(outWebmPath)) {
        throw new Error("deriveDeliveryWebm: src and out are the same file (in-place re-encode is the bug this avoids)");
    }
    if (!fs.existsSync(srcPath)) throw new Error(`deriveDeliveryWebm: missing source ${srcPath}`);

    // pass 1 — measure source loudness
    const r1 = spawnSync("ffmpeg", [
        "-hide_banner", "-nostats", "-i", srcPath,
        "-af", "loudnorm=I=-16:TP=-3:LRA=11:print_format=json",
        "-vn", "-f", "null", "-"
    ], { stdio: ["ignore", "ignore", "pipe"] });
    if (r1.status !== 0) throw new Error(`loudnorm pass1 failed: ${r1.stderr?.toString().slice(-400)}`);
    const stderr = r1.stderr.toString();
    const a = stderr.lastIndexOf("{"), b = stderr.lastIndexOf("}");
    if (a < 0 || b < a) throw new Error("loudnorm pass1: no measurement json");
    const m = JSON.parse(stderr.slice(a, b + 1));

    // video: copy VP8/VP9 through; transcode anything else to VP9 once
    const vcodec = probeVideoCodec(srcPath);
    const vArgs = (vcodec === "vp9" || vcodec === "vp8")
        ? ["-c:v", "copy"]
        : ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32", "-row-mt", "1"];

    const af = `loudnorm=I=-16:TP=-3:LRA=11`
        + `:measured_I=${m.input_i}:measured_TP=${m.input_tp}`
        + `:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}`
        + `:offset=${m.target_offset}:linear=true:print_format=summary`
        + `,alimiter=limit=-1.5dB:level=disabled`;

    const tmp = `${outWebmPath}.tmp.webm`;
    run("ffmpeg", [
        "-y", "-hide_banner", "-loglevel", "error",
        "-i", srcPath, "-map", "0:v:0", "-map", "0:a:0",
        ...vArgs, "-af", af, "-c:a", "libopus", "-b:a", "96k",
        tmp
    ]);
    fs.renameSync(tmp, outWebmPath);

    return {
        videoMode: vArgs[1] === "copy" ? `copy (${vcodec})` : "transcode-vp9",
        input: { I: m.input_i, TP: m.input_tp, LRA: m.input_lra },
        output: { I: m.output_i, TP: m.output_tp, LRA: m.output_lra }
    };
}
