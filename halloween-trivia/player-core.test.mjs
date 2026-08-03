import assert from "node:assert/strict";
import test from "node:test";

import { createPlayerController, parsePreviewQuery } from "./player-core.js";

const timing = Object.freeze({
  stinger: 1200,
  mystery: 4200,
  reveal: 3600,
  transition: 900,
});

function card(id = "one") {
  return { id, timing };
}

function harness(options = {}) {
  let now = 0;
  let pending = null;
  const delays = [];
  const scheduler = {
    set(callback, delay) {
      pending = { callback, due: now + delay };
      delays.push(delay);
      return pending;
    },
    clear(timer) {
      if (pending === timer) pending = null;
    },
  };
  const controller = createPlayerController({
    cards: [card()],
    autoplay: false,
    clock: () => now,
    scheduler,
    ...options,
  });

  return {
    controller,
    delays,
    setTime(value) {
      now = value;
    },
    fire() {
      assert.ok(pending, "expected a scheduled state advance");
      now = pending.due;
      const { callback } = pending;
      pending = null;
      callback();
    },
  };
}

test("stage order advances through transition and wraps to stinger", () => {
  const run = harness();
  run.controller.play();
  const visited = [run.controller.getState().stage];
  for (let index = 0; index < 4; index += 1) {
    run.fire();
    visited.push(run.controller.getState().stage);
  }
  assert.deepEqual(visited, ["stinger", "mystery", "reveal", "transition", "stinger"]);
});

test("each stage schedules its authored duration", () => {
  const run = harness();
  run.controller.play();
  for (let index = 0; index < 3; index += 1) run.fire();
  assert.deepEqual(run.delays, [1200, 4200, 3600, 900]);
});

test("pause and resume preserve the current stage remainder", () => {
  const run = harness();
  run.controller.play();
  run.setTime(600);
  run.controller.pause();
  assert.equal(run.controller.getState().remaining, 600);
  run.controller.play();
  assert.equal(run.delays.at(-1), 600);
  run.fire();
  assert.equal(run.controller.getState().stage, "mystery");
});

test("restart returns to stinger and restores its full duration", () => {
  const run = harness({ initialStage: "reveal" });
  run.controller.play();
  run.controller.restart();
  assert.deepEqual(
    { stage: run.controller.getState().stage, remaining: run.controller.getState().remaining, delay: run.delays.at(-1) },
    { stage: "stinger", remaining: 1200, delay: 1200 },
  );
});

test("previous and next navigation wrap ten cards and restart their stinger", () => {
  const run = harness({ cards: Array.from({ length: 10 }, (_, index) => card(String(index + 1))) });
  run.controller.previous();
  assert.deepEqual([run.controller.getState().card.id, run.controller.getState().stage], ["10", "stinger"]);
  run.controller.next();
  assert.deepEqual([run.controller.getState().card.id, run.controller.getState().stage], ["1", "stinger"]);
});

test("preview query freezes only on valid requested stages", () => {
  assert.deepEqual(parsePreviewQuery("?autoplay=0&stage=reveal"), { autoplay: false, stage: "reveal" });
  assert.deepEqual(parsePreviewQuery("?autoplay=0&stage=receipt"), { autoplay: false, stage: "stinger" });
  assert.deepEqual(parsePreviewQuery("?autoplay=0&stage=bogus"), { autoplay: false, stage: "stinger" });
  assert.deepEqual(parsePreviewQuery(""), { autoplay: true, stage: "stinger" });
});
