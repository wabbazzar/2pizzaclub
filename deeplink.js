// deeplink.js — makes #chapter URLs land on their chapter.
//
// The browser scrolls to the hash target against the initial static HTML, but
// narrative.js and evidence.js then inject blurbs and cards above it, pushing
// the target thousands of pixels down. Re-pin the target to the top of the
// viewport until its position stabilizes, then stop. Any user input cancels
// the pinning immediately.
(function () {
    'use strict';

    const id = decodeURIComponent((window.location.hash || '').slice(1));
    if (!id) return;

    let cancelled = false;
    const cancel = () => { cancelled = true; };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) =>
        window.addEventListener(ev, cancel, { passive: true, once: true }));

    const MARGIN = 16;
    const started = performance.now();
    let lastTop = null;
    let stableFrames = 0;

    function tick() {
        if (cancelled) return;
        const target = document.getElementById(id);
        if (target) {
            const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - MARGIN);
            if (lastTop !== null && Math.abs(top - lastTop) < 2) stableFrames += 1;
            else stableFrames = 0;
            lastTop = top;
            if (Math.abs(window.scrollY - top) > 2) window.scrollTo(0, top);
            if (stableFrames >= 10) return; // layout settled — hand scrolling back
        }
        if (performance.now() - started < 4000) requestAnimationFrame(tick);
    }

    window.addEventListener('load', () => requestAnimationFrame(tick));
})();
