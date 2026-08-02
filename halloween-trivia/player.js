import { cards } from "./cards.js";
import { createPlayerController, parsePreviewQuery } from "./player-core.js";
import { renderPassport } from "./visuals/passport.js";

const renderers = Object.freeze({
  passport: renderPassport,
  lease: renderPassport,
  mkultra: renderPassport,
});
const preview = parsePreviewQuery(window.location.search);

const stage = document.querySelector("#projection-stage");
const visualRoot = document.querySelector("#visual-root");
const stageCopies = [...document.querySelectorAll("[data-stage-copy]")];
const playToggle = document.querySelector("#play-toggle");
const previousButton = document.querySelector("#previous-card");
const nextButton = document.querySelector("#next-card");
const restartButton = document.querySelector("#restart-card");
const fullscreenToggle = document.querySelector("#fullscreen-toggle");
const sourceToggle = document.querySelector("#source-toggle");
const sourcePanel = document.querySelector("#source-panel");
const status = document.querySelector("#player-status");

let renderedCardId = null;

function setText(selector, value) {
  document.querySelector(selector).textContent = value;
}

function populateCard(card, cardIndex, cardCount) {
  setText("[data-card-question]", card.question);
  setText("[data-card-reveal]", card.reveal);
  setText("[data-card-number]", String(cardIndex + 1).padStart(2, "0"));
  setText("[data-card-total]", String(cardCount).padStart(2, "0"));
  setText("[data-source-heading]", card.reveal);
  setText("[data-source-detail]", card.detail);
  setText("[data-source-evidence-ids]", card.evidenceIds.join(" · "));

  const sourceLinks = document.querySelector("[data-source-links]");
  sourceLinks.replaceChildren(
    ...card.sources.map((source) => {
      if (!source.url) {
        const text = document.createElement("p");
        text.textContent = source.label;
        return text;
      }
      const link = document.createElement("a");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `${source.label} — open source`;
      return link;
    }),
  );

  if (renderedCardId !== card.id) {
    const renderer = renderers[card.visual.kind];
    if (!renderer) throw new Error(`No visual renderer registered for ${card.visual.kind}.`);
    renderer(visualRoot, card);
    renderedCardId = card.id;
  }
}

function render(state) {
  populateCard(state.card, state.cardIndex, state.cardCount);
  stage.dataset.stage = state.stage;
  stage.dataset.cardId = state.card.id;

  for (const copy of stageCopies) {
    const active = copy.dataset.stageCopy === state.stage;
    copy.hidden = !active;
    if (active) copy.setAttribute("data-active-copy", "");
    else copy.removeAttribute("data-active-copy");
  }
  playToggle.setAttribute("aria-pressed", String(state.playing));
  playToggle.textContent = state.playing ? "Pause" : "Play";
  playToggle.setAttribute("aria-label", state.playing ? "Pause projection" : "Play projection");
  status.textContent = `${state.card.reveal}. ${state.stage} stage. Projection ${state.playing ? "playing" : "paused"}.`;
}

const controller = createPlayerController({
  cards,
  autoplay: preview.autoplay,
  initialStage: preview.stage,
  onChange: render,
});

function toggleSource(force) {
  const shouldOpen = force ?? sourcePanel.hidden;
  sourcePanel.hidden = !shouldOpen;
  sourceToggle.setAttribute("aria-pressed", String(shouldOpen));
  sourceToggle.setAttribute("aria-expanded", String(shouldOpen));
  sourceToggle.textContent = shouldOpen ? "Hide source" : "Source";
  status.textContent = shouldOpen ? "Source details opened." : "Source details closed.";
  if (shouldOpen) sourcePanel.focus({ preventScroll: true });
  else sourceToggle.focus({ preventScroll: true });
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    status.textContent = "Fullscreen unavailable in this browser. Use the browser fullscreen control.";
  }
}

function updateFullscreenState() {
  const active = Boolean(document.fullscreenElement);
  fullscreenToggle.setAttribute("aria-pressed", String(active));
  fullscreenToggle.textContent = active ? "Exit fullscreen" : "Fullscreen";
  fullscreenToggle.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
  status.textContent = active ? "Fullscreen entered." : "Fullscreen exited.";
}

playToggle.addEventListener("click", () => controller.toggle());
previousButton.addEventListener("click", () => controller.previous());
nextButton.addEventListener("click", () => controller.next());
restartButton.addEventListener("click", () => controller.restart());
fullscreenToggle.addEventListener("click", toggleFullscreen);
sourceToggle.addEventListener("click", () => toggleSource());
document.querySelector("[data-source-close]").addEventListener("click", () => toggleSource(false));
document.addEventListener("fullscreenchange", updateFullscreenState);

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  const key = event.key.toLowerCase();
  if (event.key === " ") {
    event.preventDefault();
    controller.toggle();
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    controller.previous();
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    controller.next();
  } else if (key === "r") {
    event.preventDefault();
    controller.restart();
  } else if (key === "f") {
    event.preventDefault();
    toggleFullscreen();
  } else if (key === "i") {
    event.preventDefault();
    toggleSource();
  } else if (event.key === "Escape" && !sourcePanel.hidden) {
    toggleSource(false);
  }
});

window.addEventListener("pagehide", () => controller.destroy(), { once: true });
