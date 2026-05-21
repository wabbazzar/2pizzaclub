(() => {
    const deck = document.getElementById('intro-deck');
    if (!deck) return;

    const btn = deck.querySelector('.deck-fullscreen');
    if (!btn) return;

    const setLabel = () => {
        const inFs = document.fullscreenElement === deck;
        btn.setAttribute('aria-label', inFs ? 'exit fullscreen' : 'enter fullscreen');
        btn.classList.toggle('is-fullscreen', inFs);
        const label = btn.querySelector('.deck-fs-label');
        if (label) label.textContent = inFs ? 'exit' : 'fullscreen';
    };

    btn.addEventListener('click', async () => {
        try {
            if (document.fullscreenElement === deck) {
                await document.exitFullscreen();
            } else {
                await deck.requestFullscreen();
            }
        } catch (e) {
            // requestFullscreen rejects on iOS Safari / when not user-gesture-eligible
        }
    });

    document.addEventListener('fullscreenchange', setLabel);
    setLabel();
})();
