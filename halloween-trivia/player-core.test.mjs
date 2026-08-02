import assert from "node:assert/strict";
import test from "node:test";

import { createPlayerController, parsePreviewQuery } from "./player-core.js";

const timing = Object.freeze({
  stinger: 1400,
  mystery: 5000,
  reveal: 2600,
  receipt: 8000,
  transition: 1200,
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
  for (let index = 0; index < 5; index += 1) {
    run.fire();
    visited.push(run.controller.getState().stage);
  }
  assert.deepEqual(visited, ["stinger", "mystery", "reveal", "receipt", "transition", "stinger"]);
});

test("each stage schedules its authored duration", () => {
  const run = harness();
  run.controller.play();
  for (let index = 0; index < 4; index += 1) run.fire();
  assert.deepEqual(run.delays, [1400, 5000, 2600, 8000, 1200]);
});

test("pause and resume preserve the current stage remainder", () => {
  const run = harness();
  run.controller.play();
  run.setTime(600);
  run.controller.pause();
  assert.equal(run.controller.getState().remaining, 800);
  run.controller.play();
  assert.equal(run.delays.at(-1), 800);
  run.fire();
  assert.equal(run.controller.getState().stage, "mystery");
});

test("restart returns to stinger and restores its full duration", () => {
  const run = harness({ initialStage: "receipt" });
  run.controller.play();
  run.controller.restart();
  assert.deepEqual(
    { stage: run.controller.getState().stage, remaining: run.controller.getState().remaining, delay: run.delays.at(-1) },
    { stage: "stinger", remaining: 1400, delay: 1400 },
  );
});

test("previous and next navigation wrap cards and restart their stinger", () => {
  const run = harness({ cards: [card("one"), card("two")] });
  run.controller.previous();
  assert.deepEqual([run.controller.getState().card.id, run.controller.getState().stage], ["two", "stinger"]);
  run.controller.next();
  assert.deepEqual([run.controller.getState().card.id, run.controller.getState().stage], ["one", "stinger"]);
});

test("preview query freezes only on valid requested stages", () => {
  assert.deepEqual(parsePreviewQuery("?autoplay=0&stage=receipt"), { autoplay: false, stage: "receipt" });
  assert.deepEqual(parsePreviewQuery("?autoplay=0&stage=bogus"), { autoplay: false, stage: "stinger" });
  assert.deepEqual(parsePreviewQuery(""), { autoplay: true, stage: "stinger" });
});
