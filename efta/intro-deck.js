// Generic fullscreen handler for any .deck-fullscreen button with data-fs-target.
// Uses event delegation so dynamically-injected buttons (e.g. from efta.js
// slide rendering) work without re-binding.
(() => {
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.deck-fullscreen');
        if (!btn) return;
        const target = document.getElementById(btn.dataset.fsTarget);
        if (!target) return;
        try {
            if (document.fullscreenElement === target) {
                await document.exitFullscreen();
            } else {
                await target.requestFullscreen();
            }
        } catch {}
    });

    document.addEventListener('fullscreenchange', () => {
        document.querySelectorAll('.deck-fullscreen').forEach(btn => {
            const target = document.getElementById(btn.dataset.fsTarget);
            const inFs = target && document.fullscreenElement === target;
            btn.classList.toggle('is-fullscreen', !!inFs);
            const label = btn.querySelector('.deck-fs-label');
            if (label) label.textContent = inFs ? 'exit' : 'fullscreen';
            btn.setAttribute('aria-label', inFs ? 'exit fullscreen' : 'enter fullscreen');
        });
    });
})();
