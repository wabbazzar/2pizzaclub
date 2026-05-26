// Hidden "pyramid fracture" easter egg.
//  - long-press anywhere on empty space → a gold pyramid forms dead-center,
//    its eye opens, then the screen cracks outward from the pyramid's corners
//    and shatters to reveal the /eating/ book in a full-screen iframe.
// Depends on fracture.js (window.Fracture) for the shatter math + rendering.
// The pyramid intro + center-seeded triangle are the only departures from the
// wabbazzar.github.io easter egg this is adapted from.
(function () {
    "use strict";

    const REVEAL_URL = "/eating/";

    // Long-press timing (mirrors the wabbazzar egg).
    const HOLD_FIRE_MS = 900;     // total hold until the pyramid forms
    const HOLD_CAPTURE_MS = 300;  // when the scroll lock engages
    const CANCEL_MOVE_PX = 24;    // jitter tolerance — moving farther cancels

    // Pyramid intro timing.
    const PYRAMID_RISE_MS = 520;  // faces fade/scale in
    const EYE_OPEN_MS = 460;      // lid retract, overlaps the tail of the rise
    const PYRAMID_HOLD_MS = 280;  // beat where the open-eyed pyramid just sits
    const PYRAMID_BREAK_FADE_MS = 520; // pyramid fades out as the shatter begins

    // Pyramid geometry: equilateral triangle, height ~40% of min(vw,vh).
    const PYRAMID_HEIGHT_FRAC = 0.40;

    // Gold palette (capstone + cracks share it).
    const GOLD_LIGHT = "#ffe9a8";
    const GOLD_MID = "#e6b450";
    const GOLD_DEEP = "#9a6f22";
    const DIM_RGB = "10, 8, 6";

    const qs = new URLSearchParams(location.search);
    const DEBUG = qs.get("egg") === "debug";
    function dbg(...a) { if (DEBUG) console.log("[eating-egg]", ...a); }

    let stageOpen = false;

    // ---------- centered pyramid geometry ----------

    // Equilateral triangle centered in the viewport, apex up. Returns the 3
    // points [apex, baseRight, baseLeft] plus handy interior metrics for the
    // pyramid render (capstone seam, eye placement).
    function centerPyramid(viewport) {
        const h = Math.min(viewport.w, viewport.h) * PYRAMID_HEIGHT_FRAC;
        const side = h * 2 / Math.sqrt(3);
        const cx = viewport.w / 2;
        const cy = viewport.h / 2;
        const apex = [cx, cy - h * (2 / 3)];
        const baseR = [cx + side / 2, cy + h * (1 / 3)];
        const baseL = [cx - side / 2, cy + h * (1 / 3)];
        return { tri: [apex, baseR, baseL], apex, baseR, baseL, cx, cy, h, side };
    }

    // ---------- pyramid render ----------

    // Draws the gold pyramid at a given rise (0..1 fade/scale-in), eye openness
    // (0..1), and overall alpha (used to fade the pyramid out as it shatters).
    function drawPyramid(ctx, P, rise, eyeOpen, alpha) {
        const { apex, baseR, baseL, cx, cy, h } = P;
        const ease = 1 - Math.pow(1 - rise, 3);
        const s = 0.86 + 0.14 * ease; // subtle scale-up as it rises

        ctx.save();
        ctx.globalAlpha = alpha;
        // scale about the pyramid centroid
        const gx = (apex[0] + baseR[0] + baseL[0]) / 3;
        const gy = (apex[1] + baseR[1] + baseL[1]) / 3;
        ctx.translate(gx, gy);
        ctx.scale(s, s);
        ctx.translate(-gx, -gy);

        // body — vertical gold gradient, lighter at the capstone
        const grad = ctx.createLinearGradient(0, apex[1], 0, baseR[1]);
        grad.addColorStop(0, GOLD_LIGHT);
        grad.addColorStop(0.35, GOLD_MID);
        grad.addColorStop(1, GOLD_DEEP);
        ctx.beginPath();
        ctx.moveTo(apex[0], apex[1]);
        ctx.lineTo(baseR[0], baseR[1]);
        ctx.lineTo(baseL[0], baseL[1]);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(255, 200, 90, 0.5)";
        ctx.shadowBlur = 30 * ease;
        ctx.fill();
        ctx.shadowBlur = 0;

        // capstone seam — horizontal break ~28% down from apex
        const seamY = apex[1] + h * 0.28;
        const t = 0.28; // fraction of height
        const seamLx = apex[0] + (baseL[0] - apex[0]) * t;
        const seamRx = apex[0] + (baseR[0] - apex[0]) * t;
        ctx.beginPath();
        ctx.moveTo(seamLx, seamY);
        ctx.lineTo(seamRx, seamY);
        ctx.strokeStyle = "rgba(154, 111, 34, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // faint edge highlight on the left face for dimensionality
        ctx.beginPath();
        ctx.moveTo(apex[0], apex[1]);
        ctx.lineTo(baseL[0], baseL[1]);
        ctx.strokeStyle = "rgba(255, 240, 200, 0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // the eye, in the capstone region
        drawEye(ctx, apex[0], apex[1] + h * 0.16, P.side * 0.16, eyeOpen);

        ctx.restore();
    }

    // All-seeing eye: a lidded almond that opens (eyeOpen 0..1) to reveal an
    // amber iris + dark pupil with a soft glow.
    function drawEye(ctx, ex, ey, halfW, eyeOpen) {
        const halfH = halfW * 0.62 * Math.max(0.04, eyeOpen);

        // almond
        ctx.beginPath();
        ctx.moveTo(ex - halfW, ey);
        ctx.quadraticCurveTo(ex, ey - halfH, ex + halfW, ey);
        ctx.quadraticCurveTo(ex, ey + halfH, ex - halfW, ey);
        ctx.closePath();
        const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, halfW);
        eg.addColorStop(0, "rgba(255, 250, 230, 0.96)");
        eg.addColorStop(1, "rgba(220, 200, 150, 0.9)");
        ctx.fillStyle = eg;
        ctx.fill();

        if (eyeOpen > 0.25) {
            const irisA = Math.min(1, (eyeOpen - 0.25) / 0.6);
            const irisR = Math.min(halfW * 0.5, halfH * 1.4);
            ctx.save();
            ctx.globalAlpha = irisA;
            // glow
            const gl = ctx.createRadialGradient(ex, ey, 1, ex, ey, irisR * 1.8);
            gl.addColorStop(0, "rgba(255, 180, 70, 0.55)");
            gl.addColorStop(1, "rgba(255, 180, 70, 0)");
            ctx.fillStyle = gl;
            ctx.beginPath(); ctx.arc(ex, ey, irisR * 1.8, 0, Math.PI * 2); ctx.fill();
            // iris
            const ig = ctx.createRadialGradient(ex, ey, 1, ex, ey, irisR);
            ig.addColorStop(0, "#f0c060");
            ig.addColorStop(1, "#8a5a12");
            ctx.fillStyle = ig;
            ctx.beginPath(); ctx.arc(ex, ey, irisR, 0, Math.PI * 2); ctx.fill();
            // pupil
            ctx.fillStyle = "#160d04";
            ctx.beginPath(); ctx.arc(ex, ey, irisR * 0.42, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        // lid line across the eye
        ctx.beginPath();
        ctx.moveTo(ex - halfW, ey);
        ctx.lineTo(ex + halfW, ey);
        ctx.strokeStyle = "rgba(120, 84, 24, 0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // ---------- shatter playback + reveal ----------

    let currentDismiss = null;

    // Opens REVEAL_URL in a full-screen iframe. Plays: dim → pyramid rise +
    // eye open → hold → fracture shatter (seeded by the centered pyramid) →
    // iframe revealed. Installs ESC / exit-button dismissal.
    function fireReveal() {
        if (stageOpen) return;
        stageOpen = true;
        const viewport = { w: window.innerWidth, h: window.innerHeight };
        const P = centerPyramid(viewport);

        const stage = document.createElement("div");
        stage.className = "egg-stage";
        Object.assign(stage.style, {
            position: "fixed", inset: "0", zIndex: "2147483630", pointerEvents: "none",
        });
        document.body.appendChild(stage);

        const hint = document.createElement("button");
        hint.type = "button";
        hint.className = "egg-hint";
        hint.textContent = "✕ exit";
        stage.appendChild(hint);

        const iframe = document.createElement("iframe");
        iframe.src = REVEAL_URL;
        iframe.title = "eating";
        Object.assign(iframe.style, {
            position: "absolute", inset: "0", width: "100%", height: "100%",
            border: "0", background: "#ede4d3", opacity: "0",
            transition: "opacity 900ms ease-out",
        });
        stage.appendChild(iframe);

        const cv = document.createElement("canvas");
        Object.assign(cv.style, {
            position: "absolute", inset: "0", width: "100%", height: "100%",
            pointerEvents: "none",
        });
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = viewport.w * dpr; cv.height = viewport.h * dpr;
        const ctx = cv.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        stage.appendChild(cv);

        const reduced = window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduced) {
            // No shatter: dim + cross-fade straight to the book.
            document.body.classList.add("egg-shattering");
            requestAnimationFrame(() => { iframe.style.opacity = "1"; });
            setTimeout(() => {
                stage.style.pointerEvents = "auto";
                iframe.style.pointerEvents = "auto";
                cv.remove();
            }, 900);
            installDismiss(stage, iframe, hint, cv);
            return;
        }

        const theme = {
            shardColor: "rgba(8, 7, 6, 0.97)",
            crackColor: "rgba(255, 225, 150, 1)",
            crackGlow: "rgba(255, 190, 80, 0.55)",
        };
        const plan = window.Fracture.planFracture(P.tri, viewport, window.Fracture.DEFAULT_PARAMS);

        const introMs = PYRAMID_RISE_MS + PYRAMID_HOLD_MS;
        const start = performance.now();

        function frame(now) {
            const t = now - start;

            if (t < introMs) {
                // Intro: dim ramps up, pyramid rises, eye opens.
                ctx.clearRect(0, 0, viewport.w, viewport.h);
                const dim = Math.min(0.82, (t / PYRAMID_RISE_MS) * 0.82);
                ctx.fillStyle = `rgba(${DIM_RGB}, ${dim})`;
                ctx.fillRect(0, 0, viewport.w, viewport.h);
                const rise = Math.min(1, t / PYRAMID_RISE_MS);
                const eyeOpen = Math.min(1, Math.max(0, (t - (PYRAMID_RISE_MS - EYE_OPEN_MS)) / EYE_OPEN_MS));
                drawPyramid(ctx, P, rise, eyeOpen, 1);
                requestAnimationFrame(frame);
                return;
            }

            // Shatter: drive the fracture, and for the first beat keep the
            // pyramid drawn on top, fading, so it visibly breaks apart.
            const ft = t - introMs;
            const still = window.Fracture.renderFrame(ctx, plan, ft, theme);
            if (ft < PYRAMID_BREAK_FADE_MS) {
                const a = 1 - ft / PYRAMID_BREAK_FADE_MS;
                drawPyramid(ctx, P, 1, 1, a);
            }
            if (ft > plan.network.totalMs * 0.4 && iframe.style.opacity === "0") {
                iframe.style.opacity = "1";
            }
            if (still) {
                requestAnimationFrame(frame);
            } else {
                cv.style.transition = "opacity 250ms ease-out";
                cv.style.opacity = "0";
                setTimeout(() => {
                    stage.style.pointerEvents = "auto";
                    iframe.style.pointerEvents = "auto";
                    cv.remove();
                }, 260);
            }
        }

        // Hide the page content once the pyramid is up and the screen is dim.
        setTimeout(() => document.body.classList.add("egg-shattering"), PYRAMID_RISE_MS);
        requestAnimationFrame(frame);
        setTimeout(() => {
            stage.style.pointerEvents = "auto";
            iframe.style.pointerEvents = "auto";
        }, introMs + plan.totalMs + 120);

        installDismiss(stage, iframe, hint, cv);
    }

    function installDismiss(stage, iframe, hint, cv) {
        let dismissed = false;
        function dismiss() {
            if (dismissed) return;
            dismissed = true;
            currentDismiss = null;
            window.removeEventListener("keydown", onKey, true);
            window.removeEventListener("message", onMsg);
            iframe.style.transition = "opacity 450ms ease-out";
            iframe.style.opacity = "0";
            stage.style.pointerEvents = "none";
            document.body.classList.remove("egg-shattering");
            setTimeout(() => { stage.remove(); stageOpen = false; }, 600);
        }
        function onKey(ev) { if (ev.key === "Escape") { ev.preventDefault(); dismiss(); } }
        function onMsg(ev) {
            const d = ev.data;
            if (d === "eating:exit" || (d && d.type === "eating:exit")) dismiss();
        }
        window.addEventListener("keydown", onKey, true);
        window.addEventListener("message", onMsg);
        hint.addEventListener("click", (ev) => { ev.stopPropagation(); dismiss(); });
        currentDismiss = dismiss;
    }

    // ---------- long-press trigger ----------

    function init() {
        if (!window.Fracture) { console.warn("[eating-egg] fracture.js missing"); return; }

        let hold = null;
        let suppressScroll = false;

        function shouldIgnoreTarget(t) {
            if (!t || !t.closest) return false;
            return !!t.closest('a[href], button, input, textarea, select, label, [role="button"]');
        }
        function cancelHold(reason) {
            if (!hold) return;
            clearTimeout(hold.captureTimer);
            clearTimeout(hold.fireTimer);
            hold = null;
            suppressScroll = false;
            document.body.classList.remove("egg-arming");
            document.body.classList.remove("egg-capturing");
            dbg("hold cancelled:", reason);
        }
        function onDown(ev) {
            if (hold || stageOpen) return;
            if (ev.pointerType === "mouse" && ev.button !== 0) return;
            if (shouldIgnoreTarget(ev.target)) return;
            hold = {
                x: ev.clientX, y: ev.clientY, pointerId: ev.pointerId,
                startedAt: performance.now(), captureTimer: 0, fireTimer: 0, maxMoved: 0,
            };
            document.body.classList.add("egg-arming");
            hold.captureTimer = setTimeout(() => {
                if (!hold) return;
                document.body.classList.add("egg-capturing");
                suppressScroll = true;
            }, HOLD_CAPTURE_MS);
            hold.fireTimer = setTimeout(() => {
                if (!hold) return;
                cancelHold("fire");
                fireReveal();
            }, HOLD_FIRE_MS);
        }
        function onMove(ev) {
            if (!hold || ev.pointerId !== hold.pointerId) return;
            const dx = ev.clientX - hold.x, dy = ev.clientY - hold.y;
            if (dx * dx + dy * dy > CANCEL_MOVE_PX * CANCEL_MOVE_PX) cancelHold("moved");
        }
        function onUp(ev) {
            if (!hold || ev.pointerId !== hold.pointerId) return;
            cancelHold("released");
        }
        function onCancel(ev) {
            if (!hold || ev.pointerId !== hold.pointerId) return;
            cancelHold("pointercancel");
        }
        function onContextMenu(ev) { if (suppressScroll) ev.preventDefault(); }

        window.addEventListener("pointerdown", onDown);
        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onCancel);
        window.addEventListener("contextmenu", onContextMenu);
    }

    // Manual trigger for the prototype harness / testing.
    window.EatingEgg = { fire: fireReveal, dismiss: () => currentDismiss && currentDismiss() };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
