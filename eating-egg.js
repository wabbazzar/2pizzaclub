// Hidden "pyramid smoke" easter egg.
//  - long-press anywhere on empty space → a gold pyramid forms dead-center, its
//    eye opens, then calm smoke wafts in and DISSOLVES the timeline into the
//    /eating/ book (the smoke's density is the reveal mask), handing off to the
//    real interactive book.
// Lazy-loads fluid.js (Pavel Dobryakov, MIT — smoke + composite) and
// html2canvas (snapshots the timeline + book as the two images the smoke
// dissolves between). Nothing loads until the egg fires.
(function () {
    "use strict";

    const REVEAL_URL = "/eating/?smoke=1";   // ?smoke=1 → the book holds its verse hidden until the egg signals the smoke has cleared
    const FLUID_SRC = "/fluid.js?v=6";
    // The egg dissolves between two pre-rendered covers (timeline + book opening).
    // html2canvas can't render the book's scene i (position:fixed + clip-path) and
    // is too slow snapshotting the whole timeline to start the dissolve promptly,
    // so pre-rendered covers keep it instant + faithful. The live interactive book
    // is handed off underneath once the smoke clears.
    const BOOK_COVER = "/eating/art/book-cover.jpg?v=2";      // illustration-only (no text-format jump)
    const TIMELINE_COVER = "/eating/art/timeline-cover.jpg?v=1";
    const PYRAMID_IMG = "/eating/art/pyramid.png?v=2";        // fal.ai pyramid, background cut out (transparent)

    const HOLD_FIRE_MS = 900, HOLD_CAPTURE_MS = 300, CANCEL_MOVE_PX = 24;
    const PYRAMID_RISE_MS = 520, EYE_OPEN_MS = 460, PYRAMID_HOLD_MS = 280, PYRAMID_FADE_MS = 600;
    const DISSOLVE_MS = 2200;  // the egg's smoke dissolve (a touch longer than page-to-page)

    const PYRAMID_HEIGHT_FRAC = 0.40;
    const GOLD_LIGHT = "#ffe9a8", GOLD_MID = "#e6b450", GOLD_DEEP = "#9a6f22";
    const DIM_RGB = "10, 8, 6";
    const SMOKE_COLOR = { r: 0.17, g: 0.13, b: 0.09 };

    const qs = new URLSearchParams(location.search);
    const DEBUG = qs.get("egg") === "debug";
    function dbg(...a) { if (DEBUG) console.log("[eating-egg]", ...a); }

    let stageOpen = false, currentDismiss = null;

    // ---------- pyramid geometry + render ----------

    function centerPyramid(v) {
        const h = Math.min(v.w, v.h) * PYRAMID_HEIGHT_FRAC, side = h * 2 / Math.sqrt(3);
        const cx = v.w / 2, cy = v.h / 2;
        return { apex: [cx, cy - h * 2 / 3], baseR: [cx + side / 2, cy + h / 3], baseL: [cx - side / 2, cy + h / 3], h, side };
    }
    function drawPyramid(ctx, P, rise, eyeOpen, alpha) {
        const { apex, baseR, baseL, h } = P;
        const ease = 1 - Math.pow(1 - rise, 3), s = 0.86 + 0.14 * ease;
        ctx.save(); ctx.globalAlpha = alpha;
        const gx = (apex[0] + baseR[0] + baseL[0]) / 3, gy = (apex[1] + baseR[1] + baseL[1]) / 3;
        ctx.translate(gx, gy); ctx.scale(s, s); ctx.translate(-gx, -gy);
        const grad = ctx.createLinearGradient(0, apex[1], 0, baseR[1]);
        grad.addColorStop(0, GOLD_LIGHT); grad.addColorStop(0.35, GOLD_MID); grad.addColorStop(1, GOLD_DEEP);
        ctx.beginPath(); ctx.moveTo(apex[0], apex[1]); ctx.lineTo(baseR[0], baseR[1]); ctx.lineTo(baseL[0], baseL[1]); ctx.closePath();
        ctx.fillStyle = grad; ctx.shadowColor = "rgba(255,200,90,0.5)"; ctx.shadowBlur = 30 * ease; ctx.fill(); ctx.shadowBlur = 0;
        const seamY = apex[1] + h * 0.28, t = 0.28;
        ctx.beginPath(); ctx.moveTo(apex[0] + (baseL[0] - apex[0]) * t, seamY); ctx.lineTo(apex[0] + (baseR[0] - apex[0]) * t, seamY);
        ctx.strokeStyle = "rgba(154,111,34,0.7)"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(apex[0], apex[1]); ctx.lineTo(baseL[0], baseL[1]);
        ctx.strokeStyle = "rgba(255,240,200,0.35)"; ctx.lineWidth = 1; ctx.stroke();
        drawEye(ctx, apex[0], apex[1] + h * 0.16, P.side * 0.16, eyeOpen);
        ctx.restore();
    }
    function drawEye(ctx, ex, ey, halfW, eyeOpen) {
        const halfH = halfW * 0.62 * Math.max(0.04, eyeOpen);
        ctx.beginPath(); ctx.moveTo(ex - halfW, ey);
        ctx.quadraticCurveTo(ex, ey - halfH, ex + halfW, ey); ctx.quadraticCurveTo(ex, ey + halfH, ex - halfW, ey); ctx.closePath();
        const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, halfW);
        eg.addColorStop(0, "rgba(255,250,230,0.96)"); eg.addColorStop(1, "rgba(220,200,150,0.9)");
        ctx.fillStyle = eg; ctx.fill();
        if (eyeOpen > 0.25) {
            const irisA = Math.min(1, (eyeOpen - 0.25) / 0.6), irisR = Math.min(halfW * 0.5, halfH * 1.4);
            ctx.save(); ctx.globalAlpha = irisA;
            const gl = ctx.createRadialGradient(ex, ey, 1, ex, ey, irisR * 1.8);
            gl.addColorStop(0, "rgba(255,180,70,0.55)"); gl.addColorStop(1, "rgba(255,180,70,0)");
            ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(ex, ey, irisR * 1.8, 0, Math.PI * 2); ctx.fill();
            const ig = ctx.createRadialGradient(ex, ey, 1, ex, ey, irisR);
            ig.addColorStop(0, "#f0c060"); ig.addColorStop(1, "#8a5a12");
            ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(ex, ey, irisR, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#160d04"; ctx.beginPath(); ctx.arc(ex, ey, irisR * 0.42, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        ctx.beginPath(); ctx.moveTo(ex - halfW, ey); ctx.lineTo(ex + halfW, ey);
        ctx.strokeStyle = "rgba(120,84,24,0.6)"; ctx.lineWidth = 1; ctx.stroke();
    }

    // the fal.ai pyramid image, cut to the triangle so it reads as a pyramid against the page
    let pyramidImg = null;
    function ensurePyramidImg() { if (!pyramidImg) { pyramidImg = new Image(); pyramidImg.src = PYRAMID_IMG; } }
    function drawPyramidImg(ctx, P, img, rise, alpha) {
        const { apex, baseR, baseL } = P;
        const ease = 1 - Math.pow(1 - rise, 3), s = 0.86 + 0.14 * ease;
        const gx = (apex[0] + baseR[0] + baseL[0]) / 3, gy = (apex[1] + baseR[1] + baseL[1]) / 3;
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.translate(gx, gy); ctx.scale(s, s); ctx.translate(-gx, -gy);
        // the image's background is cut out, so no clip — its own transparency is the shape.
        // fit it to a square around the triangle (a touch wider) so the pyramid fills the space.
        const w = (baseR[0] - baseL[0]) * 1.06, cx = (baseL[0] + baseR[0]) / 2;
        ctx.drawImage(img, cx - w / 2, apex[1] - (baseR[1] - apex[1]) * 0.04, w, (baseR[1] - apex[1]) * 1.08);
        ctx.restore();
    }

    // ---------- lazy libs + snapshots ----------

    let smokeCanvas = null, libsPromise = null;
    function loadScript(src) {
        return new Promise((res, rej) => {
            const s = document.createElement("script");
            s.src = src; s.onload = res; s.onerror = () => rej(new Error("load failed: " + src));
            document.head.appendChild(s);
        });
    }
    function ensureLibs() {
        if (libsPromise) return libsPromise;
        smokeCanvas = document.createElement("canvas");
        smokeCanvas.id = "smoke-fx-canvas";
        Object.assign(smokeCanvas.style, {
            position: "fixed", inset: "0", width: "100%", height: "100%",
            pointerEvents: "none", zIndex: "2147483636", opacity: "0", transition: "opacity 400ms ease-out",
        });
        document.body.appendChild(smokeCanvas);
        libsPromise = window.SmokeFX ? Promise.resolve() : loadScript(FLUID_SRC);
        return libsPromise;
    }
    function preload(urls) {
        return Promise.all(urls.map((u) => new Promise((res) => {
            const im = new Image(); im.onload = im.onerror = () => res(); im.src = u;
        })));
    }

    // ---------- finger-math smoke strokes (calm) ----------

    let fingers = [], strokeRAF = 0, drawUntil = 0, strokeFrame = 0;
    function strokeStep() {
        const SF = window.SmokeFX, F = SF.config.SPLAT_FORCE;
        // inject on alternating frames only — a continuous full-rate blast is what
        // made the smoke boil; spacing the splats lets the field drift instead.
        const emit = (strokeFrame++ & 1) === 0;
        for (const f of fingers) {
            f.vx += (Math.random() - 0.5) * 0.0007; f.vy += (Math.random() - 0.5) * 0.0007;
            f.vx = Math.max(-0.006, Math.min(0.006, f.vx)); f.vy = Math.max(-0.006, Math.min(0.006, f.vy));
            f.x += f.vx; f.y += f.vy;
            if (f.x < 0.06 || f.x > 0.94) { f.vx *= -1; f.x = Math.max(0.06, Math.min(0.94, f.x)); }
            if (f.y < 0.06 || f.y > 0.94) { f.vy *= -1; f.y = Math.max(0.06, Math.min(0.94, f.y)); }
            if (emit) SF.splat(f.x, f.y, f.vx * F, f.vy * F, SMOKE_COLOR);
        }
        if (performance.now() < drawUntil) strokeRAF = requestAnimationFrame(strokeStep);
    }
    function stopSmoke() {
        cancelAnimationFrame(strokeRAF);
        window.__SMOKE_STOP = true;
        if (smokeCanvas) smokeCanvas.style.opacity = "0";
    }

    // Run the smoke dissolve between two image URLs in the opaque composite
    // canvas; calls onDone() when the new image is fully revealed.
    function dissolve(oldURL, newURL, dur, onReveal, onDone) {
        const SF = window.SmokeFX;
        SF.config.DENSITY_DISSIPATION = 1.0;   // calm defaults (what finger input uses)
        SF.config.VELOCITY_DISSIPATION = 0.35; // low, like the source sim — smoke drifts instead of boiling
        SF.config.CURL = 30;                   // source-sim vorticity: finer, prettier curls
        SF.config.SPLAT_RADIUS = 0.25;         // source-sim radius: tighter wisps, less billow
        window.__SMOKE_STOP = false;
        SF.beginTransition(oldURL, newURL);
        SF.update();
        fingers = [
            { x: 0.50, y: 0.58, vx: 0.000, vy: -0.007 },
            { x: 0.33, y: 0.50, vx: -0.006, vy: -0.003 },
            { x: 0.67, y: 0.50, vx: 0.006, vy: -0.003 },
            { x: 0.40, y: 0.62, vx: -0.004, vy: 0.005 },
            { x: 0.60, y: 0.62, vx: 0.004, vy: 0.005 },
        ];
        drawUntil = performance.now() + dur * 0.66;
        cancelAnimationFrame(strokeRAF); strokeRAF = requestAnimationFrame(strokeStep);
        setTimeout(() => { SF.config.DENSITY_DISSIPATION = 2.0; }, dur * 0.72);
        // global reveal ramp fills any gaps the wisps miss, so it always completes
        const g0 = performance.now();
        (function ramp() {
            const t = (performance.now() - g0 - dur * 0.42) / (dur * 0.4);
            if (t > 0) SF.setGlobalReveal(Math.min(1, t));
            if (t < 1) requestAnimationFrame(ramp); else if (onReveal) onReveal();
        })();
        if (onDone) setTimeout(onDone, dur);
    }

    // ---------- fire ----------

    function fireReveal() {
        if (stageOpen) return;
        stageOpen = true;
        const v = { w: window.innerWidth, h: window.innerHeight };
        const P = centerPyramid(v);

        const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const libs = ensureLibs().catch((e) => { dbg(e); return null; });
        const covers = preload([TIMELINE_COVER]);  // smoke wafts over the timeline; reveals the LIVE book
        ensurePyramidImg();

        const stage = document.createElement("div");
        stage.className = "egg-stage";
        Object.assign(stage.style, { position: "fixed", inset: "0", zIndex: "2147483630", pointerEvents: "none" });
        document.body.appendChild(stage);

        const hint = document.createElement("button");
        hint.type = "button"; hint.className = "egg-hint"; hint.textContent = "✕ exit";
        stage.appendChild(hint);

        const iframe = document.createElement("iframe");
        iframe.src = REVEAL_URL; iframe.title = "eating";
        Object.assign(iframe.style, {
            position: "absolute", inset: "0", width: "100%", height: "100%",
            border: "0", background: "#ede4d3", opacity: "0", transition: "opacity 700ms ease-out",
        });
        stage.appendChild(iframe);  // loads underneath for the live handoff

        const cv = document.createElement("canvas");
        Object.assign(cv.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none" });
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = v.w * dpr; cv.height = v.h * dpr;
        const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        stage.appendChild(cv);

        installDismiss(stage, iframe, hint);

        function handoff() {  // reveal the live interactive book, drop the smoke + canvases
            iframe.style.opacity = "1";
            iframe.style.pointerEvents = "auto";
            stage.style.pointerEvents = "auto";
            setTimeout(stopSmoke, 200);
            setTimeout(() => { cv.remove(); }, 700);
        }

        if (reduced) {  // accessibility: straight cross-fade, no smoke
            requestAnimationFrame(() => { iframe.style.opacity = "1"; });
            setTimeout(() => { stage.style.pointerEvents = "auto"; iframe.style.pointerEvents = "auto"; cv.remove(); }, 700);
            return;
        }

        // pyramid intro on the 2D canvas
        const introMs = PYRAMID_RISE_MS + PYRAMID_HOLD_MS;
        const start = performance.now();
        // Decide PNG-vs-vector ONCE for the whole intro. Re-checking each frame let a
        // mid-intro PNG load swap out the vector fallback — that swap was the flash.
        const useImg = !!(pyramidImg && pyramidImg.complete && pyramidImg.naturalWidth);
        function cvFrame(now) {
            const t = now - start;
            ctx.clearRect(0, 0, v.w, v.h);
            const dim = Math.min(0.82, (t / PYRAMID_RISE_MS) * 0.82);
            ctx.fillStyle = `rgba(${DIM_RGB}, ${dim})`; ctx.fillRect(0, 0, v.w, v.h);
            if (t < introMs) {
                const rise = Math.min(1, t / PYRAMID_RISE_MS);
                if (useImg) drawPyramidImg(ctx, P, pyramidImg, rise, 1);
                else { const eye = Math.min(1, Math.max(0, (t - (PYRAMID_RISE_MS - EYE_OPEN_MS)) / EYE_OPEN_MS)); drawPyramid(ctx, P, rise, eye, 1); }
                requestAnimationFrame(cvFrame);
            } else if (t < introMs + PYRAMID_FADE_MS) {
                const a = 1 - (t - introMs) / PYRAMID_FADE_MS;
                if (useImg) drawPyramidImg(ctx, P, pyramidImg, 1, a); else drawPyramid(ctx, P, 1, 1, a);
                requestAnimationFrame(cvFrame);
            }
        }
        requestAnimationFrame(cvFrame);

        // once the pyramid has formed AND the libs + cover are ready, run the smoke
        Promise.all([libs, covers, new Promise((r) => setTimeout(r, introMs))]).then(() => {
            if (!window.SmokeFX) { cv.style.transition = "opacity 700ms ease-out"; cv.style.opacity = "0"; handoff(); return; }
            const SF = window.SmokeFX;
            smokeCanvas.style.opacity = "1";                          // composite (timeline + smoke) takes the screen
            cv.style.transition = "opacity 500ms ease-out"; cv.style.opacity = "0";  // pyramid dissolves into it
            SF.config.DENSITY_DISSIPATION = 1.0; SF.config.VELOCITY_DISSIPATION = 0.35;
            SF.config.CURL = 30; SF.config.SPLAT_RADIUS = 0.25;
            window.__SMOKE_STOP = false;
            SF.beginTransition(TIMELINE_COVER, TIMELINE_COVER);      // smoke wafts over the timeline
            SF.update();
            fingers = [
                { x: 0.50, y: 0.58, vx: 0.000, vy: -0.007 },
                { x: 0.33, y: 0.50, vx: -0.006, vy: -0.003 },
                { x: 0.67, y: 0.50, vx: 0.006, vy: -0.003 },
                { x: 0.40, y: 0.62, vx: -0.004, vy: 0.005 },
                { x: 0.60, y: 0.62, vx: 0.004, vy: 0.005 },
            ];
            drawUntil = performance.now() + 1400;
            cancelAnimationFrame(strokeRAF); strokeRAF = requestAnimationFrame(strokeStep);
            // the LIVE book (real dims, no shift) emerges as the smoke composite clears
            setTimeout(() => {
                iframe.style.opacity = "1";
                smokeCanvas.style.transition = "opacity 1100ms ease-out"; smokeCanvas.style.opacity = "0";
                cv.style.opacity = "0";
            }, 1500);
            setTimeout(() => {
                window.__SMOKE_STOP = true; cancelAnimationFrame(strokeRAF);
                stage.style.pointerEvents = "auto"; iframe.style.pointerEvents = "auto"; cv.remove();
            }, 2900);
            // once the smoke has cleared off the illustration, let the verse fade in
            setTimeout(() => { try { iframe.contentWindow.postMessage("eating:reveal-text", "*"); } catch (e) {} }, 2500);
        });
    }

    function installDismiss(stage, iframe, hint) {
        let dismissed = false;
        function dismiss() {
            if (dismissed) return;
            dismissed = true; currentDismiss = null; stopSmoke();
            window.removeEventListener("keydown", onKey, true); window.removeEventListener("message", onMsg);
            iframe.style.transition = "opacity 450ms ease-out"; iframe.style.opacity = "0";
            stage.style.pointerEvents = "none";
            setTimeout(() => { stage.remove(); stageOpen = false; }, 600);
        }
        function onKey(ev) { if (ev.key === "Escape") { ev.preventDefault(); dismiss(); } }
        function onMsg(ev) { const d = ev.data; if (d === "eating:exit" || (d && d.type === "eating:exit")) dismiss(); }
        window.addEventListener("keydown", onKey, true);
        window.addEventListener("message", onMsg);
        hint.addEventListener("click", (ev) => { ev.stopPropagation(); dismiss(); });
        currentDismiss = dismiss;
    }

    // ---------- long-press trigger ----------

    function init() {
        let hold = null, suppressScroll = false;
        function ignore(t) { return t && t.closest && !!t.closest('a[href], button, input, textarea, select, label, [role="button"]'); }
        function cancelHold(reason) {
            if (!hold) return;
            clearTimeout(hold.captureTimer); clearTimeout(hold.fireTimer);
            hold = null; suppressScroll = false;
            document.body.classList.remove("egg-arming"); document.body.classList.remove("egg-capturing");
            dbg("cancel", reason);
        }
        function onDown(ev) {
            if (hold || stageOpen) return;
            if (ev.pointerType === "mouse" && ev.button !== 0) return;
            if (ignore(ev.target)) return;
            hold = { x: ev.clientX, y: ev.clientY, pointerId: ev.pointerId, captureTimer: 0, fireTimer: 0 };
            ensurePyramidImg();  // warm the PNG during the 900ms hold so the intro never flashes the vector fallback
            document.body.classList.add("egg-arming");
            hold.captureTimer = setTimeout(() => { if (hold) { document.body.classList.add("egg-capturing"); suppressScroll = true; } }, HOLD_CAPTURE_MS);
            hold.fireTimer = setTimeout(() => { if (hold) { cancelHold("fire"); fireReveal(); } }, HOLD_FIRE_MS);
        }
        function onMove(ev) {
            if (!hold || ev.pointerId !== hold.pointerId) return;
            const dx = ev.clientX - hold.x, dy = ev.clientY - hold.y;
            if (dx * dx + dy * dy > CANCEL_MOVE_PX * CANCEL_MOVE_PX) cancelHold("moved");
        }
        function onUp(ev) { if (hold && ev.pointerId === hold.pointerId) cancelHold("released"); }
        function onCancel(ev) { if (hold && ev.pointerId === hold.pointerId) cancelHold("cancel"); }
        function onCtx(ev) { if (suppressScroll) ev.preventDefault(); }
        window.addEventListener("pointerdown", onDown);
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onCancel);
        window.addEventListener("contextmenu", onCtx);
    }

    window.EatingEgg = { fire: fireReveal, dismiss: () => currentDismiss && currentDismiss() };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
