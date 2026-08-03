import assert from "node:assert/strict";
import test from "node:test";

import { cards } from "./cards.js";
import { createPlayerController, STAGES } from "./player-core.js";

const additions = [
  {
    id: "operation-northwoods",
    evidenceIds: ["1962-northwoods-001"],
    visual: "northwoods",
    question: "WHAT DID THE JOINT CHIEFS PROPOSE STAGING IN U.S. CITIES IN 1962?",
    reveal: "TERROR ATTACKS TO BLAME ON CUBA — PART OF OPERATION NORTHWOODS.",
    source: "https://nsarchive.gwu.edu/CMC-60/joint-chiefs-pretexts-to-invade-Cuba-1962",
  },
  {
    id: "cia-dart-pistol",
    evidenceIds: ["1975-heart-attack-gun-001"],
    visual: "dart-pistol",
    question: "WHAT SECRET WEAPON DID THE CIA SHOW THE SENATE IN 1975?",
    reveal: "A PISTOL THAT FIRED A TINY POISON DART — DESIGNED TO KILL WITHOUT AN OBVIOUS TRACE.",
    source: "https://intelligence.senate.gov/sites/default/files/94intelligence_activities_I.pdf",
  },
  {
    id: "uss-liberty",
    evidenceIds: ["1967-uss-liberty-001"],
    visual: "uss-liberty",
    question: "WHICH U.S. NAVY SHIP DID ISRAELI FORCES ATTACK OFF GAZA IN 1967?",
    reveal: "THE USS LIBERTY — 34 AMERICANS WERE KILLED. ISRAEL SAID IT WAS MISTAKEN IDENTITY.",
    source:
      "https://www.nsa.gov/History/National-Cryptologic-Museum/Exhibits-Artifacts/Exhibit-View/Article/2718838/cold-war-uss-liberty/",
  },
  {
    id: "united-put-options",
    evidenceIds: ["2001-put-options-001"],
    visual: "put-options",
    question: "WHAT OUTNUMBERED UNITED AIRLINES CALL OPTIONS BY MORE THAN 20 TO 1 FIVE DAYS BEFORE 9/11?",
    reveal: "PUT OPTIONS — BETS THAT THE STOCK WOULD FALL. INVESTIGATORS LATER REPORTED NO 9/11 FOREKNOWLEDGE.",
    source: "https://govinfo.library.unt.edu/911/staff_statements/911_TerrFin_Monograph.pdf",
  },
];

test("cards 4 through 7 preserve the locked order, copy, evidence, and sources", () => {
  assert.equal(cards.length, 7);
  for (const [index, expected] of additions.entries()) {
    const card = cards[index + 3];
    assert.equal(card.id, expected.id);
    assert.deepEqual(card.evidenceIds, expected.evidenceIds);
    assert.equal(card.visual.kind, expected.visual);
    assert.equal(card.question, expected.question);
    assert.equal(card.reveal, expected.reveal);
    assert.ok(card.detail.trim());
    assert.ok(card.sources.some((source) => source.url === expected.source));
  }
});

test("seven cards have unique visuals and complete positive stage timings", () => {
  assert.equal(new Set(cards.map((card) => card.visual.kind)).size, cards.length);
  for (const card of cards) {
    assert.deepEqual(Object.keys(card.timing), STAGES);
    assert.ok(STAGES.every((stage) => Number.isFinite(card.timing[stage]) && card.timing[stage] > 0));
    assert.ok(card.evidenceIds.length > 0);
    assert.ok(card.sources.length > 0 && card.sources.every((source) => source.label && source.url));
  }
});

test("controller wraps card 7 back to card 1", () => {
  const controller = createPlayerController({ cards, autoplay: false });
  controller.previous();
  assert.equal(controller.getState().card.id, additions.at(-1).id);
  controller.next();
  assert.equal(controller.getState().card.id, cards[0].id);
  assert.equal(controller.getState().stage, "stinger");
  controller.destroy();
});
