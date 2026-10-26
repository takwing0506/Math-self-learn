/* Chapter 1: both sides move together. Answers stay in this file, not the UI. */
const fs = require("fs");
const path = require("path");
const E = require("../form1/unknown-scale/js/engine.js");
const assert = require("assert");

const MINUS = "−";

const PRACTICE = [
  { eq: "x + 7 = 12", answer: 5 },
  { eq: "x " + MINUS + " 9 = 4", answer: 13 },
  { eq: "x + 15 = 8", answer: -7 },
  { eq: "18 = x " + MINUS + " 5", answer: 23 },
  { eq: "x " + MINUS + " 3 = " + MINUS + "2", answer: 1 },
];

const CHALLENGE = [
  { eq: "4 + x = 1", answer: -3 },
  { eq: MINUS + "x + 6 = 10", answer: -4 },
  { eq: "9 " + MINUS + " x = 4", answer: 5 },
];

const FORBIDDEN = ["移項要變號", "過等號就變號", "把係數移去另一邊"];

function leaks(text, answer) {
  const shown = answer < 0 ? MINUS + Math.abs(answer) : String(answer);
  return (
    text.indexOf("x = " + shown) !== -1 ||
    text.indexOf("x=" + shown) !== -1 ||
    text.indexOf(shown + " = x") !== -1
  );
}

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log("ok", name);
}

function autoPractice(index) {
  const run = E.createRun(index, "practice");
  for (let i = 0; i < 8; i += 1) {
    const v = E.view(run);
    if (v.ready) return run;
    const guided = v.actions.filter((action) => action.guided);
    assert.strictEqual(guided.length, 1, v.equation);
    const result = E.applyAction(run, guided[0]);
    assert.strictEqual(result.ok, true, result.message);
    assert.strictEqual(E.isLevel(run), true, v.equation);
  }
  assert.fail("stuck at " + E.view(run).equation);
}

function finish(run, answer, lamps) {
  assert.strictEqual(E.gateCheck(run).ok, true);
  const early = E.submitCheck(run, String(answer));
  assert.strictEqual(early.ok, false);
  assert.strictEqual(E.view(run).checkTries, 0);
  const wrongLamps = E.confirmLamps(run, lamps[0] === "divide" ? ["move"] : ["divide"]);
  assert.strictEqual(wrongLamps.ok, false);
  assert.strictEqual(E.view(run).score, 100);
  const confirmed = E.confirmLamps(run, lamps);
  assert.strictEqual(confirmed.ok, true);
  const hit = E.submitCheck(run, answer < 0 ? MINUS + Math.abs(answer) : String(answer));
  assert.strictEqual(hit.ok, true, hit.message);
  assert.strictEqual(hit.bonus, 10);
  assert.strictEqual(E.resultOf(run).entry, answer);
  return hit;
}

check("motto and chapter lamps", () => {
  assert.strictEqual(E.motto, "只有加減項先移項變號；乘除唔好移。");
  assert.strictEqual(E.lamps.move.name, "移項");
  assert.strictEqual(E.lamps.move.detail, "兩邊同加／同減");
  assert.strictEqual(E.lamps.divide.name, "除數");
  assert.strictEqual(E.lamps.divide.detail, "兩邊同乘／同除");
  assert.strictEqual(E.practiceCount, 5);
  assert.strictEqual(E.challengeCount, 3);
});

check("practice and challenge are different questions", () => {
  const practice = PRACTICE.map((_, i) => E.view(E.createRun(i, "practice")).equation);
  const challenge = CHALLENGE.map((_, i) => E.view(E.createRun(i, "challenge")).equation);
  assert.deepStrictEqual(practice, PRACTICE.map((item) => item.eq));
  assert.deepStrictEqual(challenge, CHALLENGE.map((item) => item.eq));
  practice.forEach((eq) => assert.strictEqual(challenge.indexOf(eq), -1));
  assert.strictEqual(E.view(E.createRun(0, "practice")).total, 5);
  assert.strictEqual(E.view(E.createRun(0, "challenge")).total, 3);
});

check("opening text does not reveal answers or old lamps", () => {
  function scan(mode, table) {
    table.forEach((item, index) => {
      const run = E.createRun(index, mode);
      const info = JSON.stringify(E.missionInfo(index, mode));
      const view = E.view(run);
      const text = [
        info,
        view.brief,
        view.title,
        view.equation,
        E.lampHelp(run, "move"),
        E.lampHelp(run, "divide"),
      ].join("\n");
      assert.strictEqual(leaks(text, item.answer), false, text);
      assert.strictEqual(view.lamps.length, 2);
      assert.strictEqual(view.lamps[0].id, "move");
      assert.strictEqual(view.lamps[1].id, "divide");
      assert.strictEqual(view.steps.length, 1);
      assert.strictEqual(view.steps[0].note, "原式");
      assert.strictEqual(view.steps[0].lamp, null);
    });
  }
  scan("practice", PRACTICE);
  scan("challenge", CHALLENGE);
});

check("practice guides the additive path and simplifies both sides", () => {
  PRACTICE.forEach((item, index) => {
    const run = autoPractice(index);
    const view = E.view(run);
    assert.strictEqual(view.equation === "x = " + (item.answer < 0 ? MINUS + Math.abs(item.answer) : item.answer)
      || view.equation === (item.answer < 0 ? MINUS + Math.abs(item.answer) : item.answer) + " = x", true, view.equation);
    assert.strictEqual(view.suggest.type, "check");
    assert.ok(view.steps.every((step) => step.lamp === null || step.lamp === "move"));
    assert.deepStrictEqual(E.lampsUsed(run), ["move"]);
    assert.strictEqual(view.lamps.find((lamp) => lamp.id === "divide").state, "skip");
    assert.ok(!view.actions.some((action) => action.group === "scale" || action.group === "x"));
    finish(run, item.answer, ["move"]);
  });
});

check("x−9=4 adds on both pans then cancels zeros together", () => {
  const run = E.createRun(1, "practice");
  assert.strictEqual(E.view(run).suggest.type, "add");
  assert.strictEqual(E.view(run).suggest.value, 9);
  const guided = E.view(run).actions.filter((action) => action.guided);
  assert.strictEqual(guided.length, 1);
  assert.strictEqual(guided[0].label, "兩邊都加 9");
  const added = E.applyAction(run, { type: "add", value: 9 });
  assert.strictEqual(added.ok, true);
  assert.strictEqual(added.banner, "兩邊 +9");
  assert.strictEqual(E.view(run).equation, "x " + MINUS + " 9 + 9 = 4 + 9");
  const freshL = E.view(run).tokens.L.filter((token) => token.fresh).map((token) => token.label);
  const freshR = E.view(run).tokens.R.filter((token) => token.fresh).map((token) => token.label);
  assert.deepStrictEqual(freshL, ["9"]);
  assert.deepStrictEqual(freshR, ["9"]);
  assert.strictEqual(E.view(run).actions.find((action) => action.guided).label, "兩邊一起化簡");
  const simplified = E.applyAction(run, { type: "simplify" });
  assert.strictEqual(simplified.ok, true);
  assert.strictEqual(E.view(run).equation, "x = 13");
  assert.strictEqual(E.view(run).ready, true);
  assert.ok(E.view(run).tokens.R.some((token) => token.label === "13"));
  assert.ok(!JSON.stringify(E.view(run)).includes("？"));
  assert.strictEqual(E.view(run).steps[1].lamp, "move");
  assert.strictEqual(E.view(run).steps[1].note, "兩邊都加 9");
  assert.strictEqual(E.view(run).steps[2].lamp, "move");
  assert.strictEqual(E.view(run).steps[2].note, "兩邊一起化簡");
  assert.ok(added.message.indexOf("變號") === -1);
  assert.ok(simplified.message.indexOf("變號") === -1);
});

check("challenge A constant first", () => {
  const run = E.createRun(0, "challenge");
  assert.strictEqual(E.view(run).suggest, null);
  assert.ok(E.view(run).actions.every((action) => action.guided === false));
  E.applyAction(run, { type: "add", value: -4 });
  assert.strictEqual(E.view(run).equation, "4 + x " + MINUS + " 4 = 1 " + MINUS + " 4");
  E.applyAction(run, { type: "simplify" });
  assert.strictEqual(E.view(run).equation, "x = " + MINUS + "3");
  finish(run, -3, ["move"]);
});

check("challenge B uses divide or multiply by −1, never moving −x", () => {
  const run = E.createRun(1, "challenge");
  const labels = E.view(run).actions.map((action) => action.label);
  assert.ok(labels.indexOf("兩邊同乘 −1") !== -1);
  assert.ok(labels.indexOf("兩邊同除以 −1") !== -1);
  assert.ok(labels.indexOf("兩邊都加 x") === -1);
  assert.strictEqual(E.view(run).lamps.find((lamp) => lamp.id === "divide").state, "need");
  assert.ok(E.lampHelp(run, "divide").indexOf("同乘") !== -1);
  const refused = E.applyAction(run, { type: "addx", value: 1 });
  assert.strictEqual(refused.ok, false);
  E.applyAction(run, { type: "add", value: -6 });
  E.applyAction(run, { type: "simplify" });
  assert.strictEqual(E.view(run).equation, MINUS + "x = 4");
  assert.strictEqual(E.view(run).ready, false);
  const divided = E.applyAction(run, { type: "div", value: -1 });
  assert.strictEqual(divided.ok, true);
  assert.strictEqual(divided.banner, "兩邊 ÷ −1");
  assert.strictEqual(E.view(run).equation, "x = " + MINUS + "4");
  assert.deepStrictEqual(E.lampsUsed(run), ["move", "divide"]);
  const onlyMove = E.confirmLamps(run, ["move"]);
  assert.strictEqual(onlyMove.ok, false);
  finish(run, -4, ["move", "divide"]);

  const other = E.createRun(1, "challenge");
  E.applyAction(other, { type: "mul", value: -1 });
  assert.strictEqual(E.view(other).equation, "x " + MINUS + " 6 = " + MINUS + "10");
  E.applyAction(other, { type: "add", value: 6 });
  E.applyAction(other, { type: "simplify" });
  assert.strictEqual(E.view(other).equation, "x = " + MINUS + "4");
  assert.strictEqual(E.isLevel(other), true);
});

check("challenge C keeps −x in the middle and stays additive", () => {
  const run = E.createRun(2, "challenge");
  assert.strictEqual(E.view(run).lamps.find((lamp) => lamp.id === "divide").state, "skip");
  assert.ok(E.view(run).actions.some((action) => action.label === "兩邊都加 x"));
  const noDivide = E.applyAction(run, { type: "div", value: -1 });
  assert.strictEqual(noDivide.ok, false);
  E.applyAction(run, { type: "addx", value: 1 });
  assert.strictEqual(E.view(run).equation, "9 " + MINUS + " x + x = 4 + x");
  E.applyAction(run, { type: "simplify" });
  assert.strictEqual(E.view(run).equation, "9 = 4 + x");
  E.applyAction(run, { type: "add", value: -4 });
  E.applyAction(run, { type: "simplify" });
  assert.strictEqual(E.view(run).equation, "5 = x");
  assert.deepStrictEqual(E.lampsUsed(run), ["move"]);
  finish(run, 5, ["move"]);
});

check("wrong fill deducts, undo does not refund, score floors at 0", () => {
  const run = autoPractice(1);
  E.confirmLamps(run, ["move"]);
  const wrong = E.submitCheck(run, "4");
  assert.strictEqual(wrong.ok, false);
  assert.strictEqual(wrong.leftText, "4 " + MINUS + " 9 = " + MINUS + "5");
  assert.strictEqual(wrong.rightText, "4");
  assert.strictEqual(E.view(run).score, 90);
  assert.strictEqual(leaks(wrong.message, 13), false);
  E.undo(run);
  assert.strictEqual(E.view(run).score, 90);
  assert.notStrictEqual(E.view(run).equation, "x = 13");
  const again = autoPractice(0);
  E.confirmLamps(again, ["move"]);
  E.submitCheck(again, "0");
  assert.strictEqual(E.view(again).score, 90);
  const second = E.submitCheck(again, "5");
  assert.strictEqual(second.ok, true);
  assert.strictEqual(second.bonus, 0);
  assert.strictEqual(E.view(again).score, 90);

  const floor = autoPractice(0);
  E.confirmLamps(floor, ["move"]);
  for (let i = 0; i < 12; i += 1) E.submitCheck(floor, "0");
  assert.strictEqual(E.view(floor).score, 0);
  const stayed = E.submitCheck(floor, "1");
  assert.strictEqual(stayed.message.indexOf("得分維持 0") !== -1, true);
});

check("parse rejects blanks and fractions without spending a try", () => {
  assert.strictEqual(E.parseStudent(""), null);
  assert.strictEqual(E.parseStudent("7.5"), null);
  assert.strictEqual(E.parseStudent(" " + MINUS + "7 "), -7);
  const run = autoPractice(0);
  E.confirmLamps(run, ["move"]);
  const blank = E.submitCheck(run, "  ");
  assert.strictEqual(blank.ok, false);
  assert.strictEqual(E.view(run).checkTries, 0);
  assert.strictEqual(E.view(run).score, 100);
});

check("student-facing sources drop the old move-across copy", () => {
  const files = [
    "form1/unknown-scale/js/engine.js",
    "form1/unknown-scale/js/app.js",
    "form1/unknown-scale/index.html",
    "form1/unknown-scale/css/style.css",
  ];
  const blob = files.map((file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8")).join("\n");
  FORBIDDEN.forEach((phrase) => assert.strictEqual(blob.indexOf(phrase), -1, phrase));
  const withoutMotto = blob.split(E.motto).join("");
  assert.strictEqual(withoutMotto.indexOf("變號"), -1);
  assert.strictEqual(blob.indexOf("拖到"), -1);
  assert.strictEqual(blob.indexOf("moveTerm"), -1);
  assert.strictEqual(blob.indexOf("pointerdown"), -1);
  assert.strictEqual(typeof E.moveTerm, "undefined");
});

console.log(passed + " passed");
