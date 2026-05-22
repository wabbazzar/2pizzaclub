// Fullscreen handler for .deck-fullscreen buttons with data-fs-target.
// Uses event delegation so dynamically-injected buttons work without re-binding.
// Tries native Fullscreen API (with webkit prefix for Safari). On iOS Safari —
// where requestFullscreen on non-video elements is rejected — falls back to a
// CSS pseudo-fullscreen class that pins the target to the viewport.
(() => {
    const isFullscreenSupported = () =>
        document.fullscreenEnabled ||
        document.webkitFullscreenEnabled;

    const currentFullscreenEl = () =>
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        null;

    const requestFs = (el) => {
        if (el.requestFullscreen) return el.requestFullscreen();
        if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
        return Promise.reject(new Error('no-fullscreen-api'));
    };

    const exitFs = () => {
        if (document.exitFullscreen) return document.exitFullscreen();
        if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
        return Promise.reject(new Error('no-exit-fullscreen-api'));
    };

    const enterPseudo = (el) => {
        el.classList.add('is-pseudo-fullscreen');
        document.documentElement.classList.add('body-locked');
    };
    const exitPseudo = (el) => {
        el.classList.remove('is-pseudo-fullscreen');
        document.documentElement.classList.remove('body-locked');
    };
    const inPseudo = (el) => el && el.classList.contains('is-pseudo-fullscreen');

    const updateLabels = () => {
        document.querySelectorAll('.deck-fullscreen').forEach(btn => {
            const target = document.getElementById(btn.dataset.fsTarget);
            const inFs = target && (currentFullscreenEl() === target || inPseudo(target));
            btn.classList.toggle('is-fullscreen', !!inFs);
            const label = btn.querySelector('.deck-fs-label');
            if (label) label.textContent = inFs ? 'exit' : 'fullscreen';
            btn.setAttribute('aria-label', inFs ? 'exit fullscreen' : 'enter fullscreen');
        });
    };

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.deck-fullscreen');
        if (!btn) return;
        e.preventDefault();
        const target = document.getElementById(btn.dataset.fsTarget);
        if (!target) return;

        // Already in some kind of fullscreen → exit.
        if (currentFullscreenEl() === target) {
            try { await exitFs(); } catch {}
            updateLabels();
            return;
        }
        if (inPseudo(target)) {
            exitPseudo(target);
            updateLabels();
            return;
        }

        // Try the native API first.
        if (isFullscreenSupported()) {
            try {
                await requestFs(target);
                updateLabels();
                return;
            } catch {
                // Fall through to pseudo-fullscreen on rejection (iOS Safari).
            }
        }
        enterPseudo(target);
        updateLabels();
    });

    // Keep button label in sync with browser-driven exits (Esc, gesture).
    document.addEventListener('fullscreenchange', updateLabels);
    document.addEventListener('webkitfullscreenchange', updateLabels);

    // Esc out of pseudo-fullscreen too.
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const pseudo = document.querySelector('.is-pseudo-fullscreen');
        if (pseudo) {
            exitPseudo(pseudo);
            updateLabels();
        }
    });
})();
