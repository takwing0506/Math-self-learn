/* Grader-only checks. Expected weights are not shown in the student UI. */
const E = require("../form1/unknown-scale/js/engine.js");
const assert = require("assert");

const EXPECTED = [5, 13, -7, -4, 23];

function fmt(n) {
  return n < 0 ? "−" + Math.abs(n) : String(n);
}

function leaks(text, answer) {
  const shown = fmt(answer);
  return (
    text.indexOf("x = " + shown) !== -1 ||
    text.indexOf("x=" + shown) !== -1 ||
    text.indexOf(shown + " = x") !== -1 ||
    text.indexOf(shown + "=x") !== -1
  );
}

function studentText(run, extra) {
  const v = E.view(run);
  return [
    v.equation,
    v.originalEquation,
    v.beforeSeal,
    v.steps.join(" | "),
    v.brief,
    v.title,
    v.tokens.L.map((t) => t.label).join(","),
    v.tokens.R.map((t) => t.label).join(","),
    v.chips.join(","),
    extra || "",
    E.lampHelp(run, "move"),
    E.lampHelp(run, "collect"),
    E.lampHelp(run, "divide"),
    E.lampHelp(run, "denom"),
    E.lampHelp(run, "expand"),
  ].join("\n");
}

function token(run, label) {
  const v = E.view(run);
  const all = v.tokens.L.concat(v.tokens.R);
  const found = all.find((t) => t.label === label);
  assert.ok(found, "missing token " + label + " in " + E.view(run).equation);
  return found;
}

function lamp(run, id) {
  return E.view(run).lamps.find((item) => item.id === id);
}

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log("ok", name);
}

check("five missions, public info has no answer", () => {
  assert.strictEqual(E.missionCount, 5);
  for (let i = 0; i < 5; i += 1) {
    const info = JSON.stringify(E.missionInfo(i));
    assert.strictEqual(info.indexOf("answer"), -1);
    assert.strictEqual(leaks(info, EXPECTED[i]), false);
  }
});

check("opening equations", () => {
  const eqs = [];
  for (let i = 0; i < 5; i += 1) eqs.push(E.view(E.createRun(i, "guide")).equation);
  assert.deepStrictEqual(eqs, [
    "x + 7 = 12",
    "x − 9 = 4",
    "x + 15 = 8",
    "−x + 6 = 10",
    "18 = x − 5",
  ]);
});

check("mission 1 move flips sign and does not reveal x", () => {
  const run = E.createRun(0, "guide");
  assert.strictEqual(E.view(run).suggest, "move");
  assert.strictEqual(lamp(run, "move").state, "need");
  assert.strictEqual(lamp(run, "divide").state, "skip");
  assert.strictEqual(lamp(run, "denom").state, "skip");
  const bad = E.moveTerm(run, token(run, "7").id, false);
  assert.strictEqual(bad.ok, false);
  assert.strictEqual(bad.tilt, "R");
  assert.strictEqual(E.view(run).score, 90);
  assert.strictEqual(E.view(run).equation, "x + 7 = 12");
  assert.ok(bad.message.indexOf("變號") !== -1);
  assert.strictEqual(leaks(bad.message, 5), false);
  const good = E.moveTerm(run, token(run, "7").id, true);
  assert.strictEqual(good.ok, true);
  assert.strictEqual(E.view(run).equation, "x = 12 − 7");
  assert.strictEqual(E.view(run).ready, true);
  assert.strictEqual(E.isLevel(run), true);
  assert.strictEqual(lamp(run, "move").state, "done");
  assert.strictEqual(leaks(studentText(run, good.message), 5), false);
  const blocked = E.mergeSide(run, "R");
  assert.strictEqual(blocked.ok, false);
  assert.strictEqual(E.view(run).equation, "x = 12 − 7");
  assert.strictEqual(E.view(run).score, 90);
});

check("mission 1 both sides then collect", () => {
  const run = E.createRun(0, "guide");
  const added = E.addToPans(run, "both", -7);
  assert.strictEqual(added.ok, true);
  assert.strictEqual(E.view(run).equation, "x + 7 − 7 = 12 − 7");
  assert.strictEqual(E.view(run).suggest, "collect");
  assert.strictEqual(lamp(run, "collect").hint, true);
  assert.strictEqual(E.isLevel(run), true);
  const one = E.addToPans(run, "L", -7);
  assert.strictEqual(one.ok, false);
  assert.strictEqual(one.tilt, "R");
  assert.strictEqual(E.view(run).score, 90);
  assert.strictEqual(E.view(run).equation, "x + 7 − 7 = 12 − 7");
  const merged = E.mergeSide(run, "L");
  assert.strictEqual(merged.ok, true);
  assert.strictEqual(E.view(run).equation, "x = 12 − 7");
  assert.strictEqual(E.view(run).ready, true);
  assert.strictEqual(leaks(studentText(run, merged.message), 5), false);
});

check("mission 2 and 3 check by substitution", () => {
  const m2 = E.createRun(1, "challenge");
  assert.strictEqual(E.view(m2).suggest, null);
  assert.strictEqual(E.lampHelp(m2, "move"), "挑戰模式不提示下一步。");
  E.moveTerm(m2, token(m2, "−9").id, true);
  assert.strictEqual(E.view(m2).equation, "x = 4 + 9");
  const wrong = E.submitCheck(m2, "4");
  assert.strictEqual(wrong.ok, false);
  assert.strictEqual(wrong.leftText, "4 − 9 = −5");
  assert.strictEqual(wrong.rightText, "4");
  assert.strictEqual(leaks(wrong.leftText + wrong.message, 13), false);
  const ok = E.submitCheck(m2, "13");
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(ok.bonus, 0);
  assert.strictEqual(E.view(m2).score, 90);

  const m3 = E.createRun(2, "guide");
  E.moveTerm(m3, token(m3, "15").id, true);
  assert.strictEqual(E.view(m3).equation, "x = 8 − 15");
  assert.strictEqual(leaks(studentText(m3), -7), false);
  const early = E.createRun(2, "guide");
  assert.strictEqual(E.gateCheck(early).ok, false);
  const hit = E.submitCheck(m3, "−7");
  assert.strictEqual(hit.ok, true);
  assert.strictEqual(hit.leftText, "(−7) + 15 = 8");
  assert.strictEqual(hit.bonus, 10);
  assert.strictEqual(E.view(m3).score, 110);
  assert.strictEqual(E.resultOf(early), null);
  assert.strictEqual(E.resultOf(m3).entry, -7);
});

check("mission 4 divide after −x = 4 seals the value", () => {
  const run = E.createRun(3, "guide");
  assert.strictEqual(lamp(run, "divide").state, "need");
  assert.strictEqual(lamp(run, "divide").hint, false);
  E.moveTerm(run, token(run, "6").id, true);
  assert.strictEqual(E.view(run).equation, "−x = 10 − 6");
  assert.strictEqual(E.view(run).suggest, "collect");
  E.mergeSide(run, "R");
  assert.strictEqual(E.view(run).equation, "−x = 4");
  assert.strictEqual(E.view(run).ready, false);
  assert.strictEqual(E.view(run).suggest, "divide");
  assert.ok(E.lampHelp(run, "divide").indexOf("−1") !== -1);
  assert.strictEqual(leaks(E.lampHelp(run, "divide"), -4), false);
  const half = E.divide(run, "L", -1);
  assert.strictEqual(half.ok, false);
  assert.ok(half.tilt);
  assert.strictEqual(E.view(run).equation, "−x = 4");
  const done = E.divide(run, "both", -1);
  assert.strictEqual(done.ok, true);
  const v = E.view(run);
  assert.strictEqual(v.sealed, true);
  assert.strictEqual(v.equation, "x = ？");
  assert.strictEqual(v.beforeSeal, "−x = 4");
  assert.strictEqual(v.ready, true);
  assert.ok(v.tokens.L.some((t) => t.label === "x"));
  assert.ok(v.tokens.R.some((t) => t.label === "？" && t.secret && !t.neg));
  assert.strictEqual(v.chips.length, 0);
  assert.strictEqual(v.xCoeff, null);
  assert.strictEqual(leaks(studentText(run, done.message), -4), false);
  assert.strictEqual(studentText(run).indexOf("−4"), -1);
  const again = E.moveTerm(run, v.tokens.L[0].id, true);
  assert.strictEqual(again.ok, false);
  const back = E.undo(run);
  assert.strictEqual(back.ok, true);
  assert.strictEqual(E.view(run).equation, "−x = 4");
  assert.strictEqual(E.view(run).sealed, false);
  E.divide(run, "both", -1);
  const badGuess = E.submitCheck(run, "4");
  assert.strictEqual(badGuess.ok, false);
  assert.strictEqual(badGuess.leftText, "−(4) + 6 = 2");
  assert.strictEqual(leaks(badGuess.leftText + badGuess.rightText + badGuess.message, -4), false);
  const good = E.submitCheck(run, "−4");
  assert.strictEqual(good.ok, true);
  assert.strictEqual(good.leftText, "−(−4) + 6 = 10");
  assert.strictEqual(good.rightText, "10");
  assert.strictEqual(good.bonus, 0);
});

check("mission 4 divide-first path stays unsealed until the student checks", () => {
  const run = E.createRun(3, "guide");
  E.divide(run, "both", -1);
  assert.strictEqual(E.view(run).equation, "x − 6 = −10");
  assert.strictEqual(E.view(run).sealed, false);
  const moved = E.moveTerm(run, token(run, "−6").id, true);
  assert.strictEqual(E.view(run).equation, "x = −10 + 6");
  assert.strictEqual(moved.ok, true);
  assert.strictEqual(E.view(run).ready, true);
  assert.strictEqual(leaks(studentText(run), -4), false);
  const blocked = E.mergeSide(run, "R");
  assert.strictEqual(blocked.ok, false);
  assert.strictEqual(E.view(run).equation, "x = −10 + 6");
  const ok = E.submitCheck(run, -4);
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(ok.bonus, 10);
});

check("mission 5 x on the right", () => {
  const run = E.createRun(4, "guide");
  E.moveTerm(run, token(run, "−5").id, true);
  assert.strictEqual(E.view(run).equation, "18 + 5 = x");
  assert.strictEqual(E.view(run).ready, true);
  assert.strictEqual(leaks(studentText(run), 23), false);
  const ok = E.submitCheck(run, "＋23");
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(ok.rightText, "23 − 5 = 18");
  assert.strictEqual(ok.leftText, "18");
  assert.strictEqual(ok.bonus, 10);
});

check("score floors at 0 and undo does not refund", () => {
  const run = E.createRun(0, "guide");
  for (let i = 0; i < 12; i += 1) E.addToPans(run, "R", 1);
  assert.strictEqual(E.view(run).score, 0);
  assert.strictEqual(E.view(run).equation, "x + 7 = 12");
  E.moveTerm(run, token(run, "7").id, true);
  assert.strictEqual(E.view(run).equation, "x = 12 − 7");
  E.undo(run);
  assert.strictEqual(E.view(run).equation, "x + 7 = 12");
  assert.strictEqual(E.view(run).score, 0);
});

check("moving the box is legal and keeps the scale level", () => {
  const run = E.createRun(4, "guide");
  const box = E.view(run).tokens.R.find((t) => t.type === "x");
  E.moveTerm(run, box.id, true);
  assert.strictEqual(E.view(run).equation, "18 − x = −5");
  assert.strictEqual(E.isLevel(run), true);
  assert.strictEqual(E.view(run).ready, false);
});

check("parse rejects blanks and fractions", () => {
  assert.strictEqual(E.parseStudent(""), null);
  assert.strictEqual(E.parseStudent("7.5"), null);
  assert.strictEqual(E.parseStudent(" −7 "), -7);
  const run = E.createRun(0, "guide");
  E.moveTerm(run, token(run, "7").id, true);
  const blank = E.submitCheck(run, "  ");
  assert.strictEqual(blank.ok, false);
  assert.strictEqual(E.view(run).checkTries, 0);
  assert.strictEqual(E.view(run).score, 100);
});

console.log(passed + " passed");
