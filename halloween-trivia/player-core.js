export const STAGES = Object.freeze([
  "stinger",
  "mystery",
  "reveal",
  "receipt",
  "transition",
]);

const DEFAULT_SCHEDULER = Object.freeze({
  set(callback, delay) {
    return globalThis.setTimeout(callback, delay);
  },
  clear(timer) {
    globalThis.clearTimeout(timer);
  },
});

export function parsePreviewQuery(search = "") {
  const params = new URLSearchParams(search);
  const requestedStage = params.get("stage");

  return {
    autoplay: params.get("autoplay") !== "0",
    stage: STAGES.includes(requestedStage) ? requestedStage : "stinger",
  };
}

export function createPlayerController({
  cards,
  autoplay = true,
  initialStage = "stinger",
  clock = () => Date.now(),
  scheduler = DEFAULT_SCHEDULER,
  onChange = () => {},
} = {}) {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new TypeError("Player requires at least one card.");
  }

  let cardIndex = 0;
  let stageIndex = Math.max(0, STAGES.indexOf(initialStage));
  let playing = false;
  let timer = null;
  let deadline = null;
  let remaining = durationForCurrentStage();

  function durationForCurrentStage() {
    const value = cards[cardIndex].timing[STAGES[stageIndex]];
    if (!Number.isFinite(value) || value <= 0) {
      throw new TypeError(`Missing positive timing for ${STAGES[stageIndex]}.`);
    }
    return value;
  }

  function snapshot() {
    return Object.freeze({
      card: cards[cardIndex],
      cardIndex,
      cardCount: cards.length,
      stage: STAGES[stageIndex],
      playing,
      remaining,
    });
  }

  function emit() {
    onChange(snapshot());
  }

  function clearScheduledAdvance() {
    if (timer !== null) scheduler.clear(timer);
    timer = null;
    deadline = null;
  }

  function scheduleAdvance() {
    clearScheduledAdvance();
    if (!playing) return;
    deadline = clock() + remaining;
    timer = scheduler.set(() => {
      timer = null;
      deadline = null;
      advance();
    }, remaining);
  }

  function resetStage(nextStageIndex = 0) {
    stageIndex = nextStageIndex;
    remaining = durationForCurrentStage();
    scheduleAdvance();
    emit();
  }

  function advance() {
    if (stageIndex === STAGES.length - 1) {
      cardIndex = (cardIndex + 1) % cards.length;
      resetStage(0);
      return;
    }
    resetStage(stageIndex + 1);
  }

  function play() {
    if (playing) return snapshot();
    playing = true;
    scheduleAdvance();
    emit();
    return snapshot();
  }

  function pause() {
    if (!playing) return snapshot();
    if (deadline !== null) remaining = Math.max(0, deadline - clock());
    playing = false;
    clearScheduledAdvance();
    emit();
    return snapshot();
  }

  function toggle() {
    return playing ? pause() : play();
  }

  function restart() {
    clearScheduledAdvance();
    resetStage(0);
    return snapshot();
  }

  function moveCard(offset) {
    clearScheduledAdvance();
    cardIndex = (cardIndex + offset + cards.length) % cards.length;
    resetStage(0);
    return snapshot();
  }

  function destroy() {
    playing = false;
    clearScheduledAdvance();
  }

  emit();
  if (autoplay) play();

  return Object.freeze({
    getState: snapshot,
    advance,
    play,
    pause,
    toggle,
    restart,
    previous: () => moveCard(-1),
    next: () => moveCard(1),
    destroy,
  });
}
