/* Chapter 2: like terms and x on both sides. Answers stay in this file. */
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const E = require("../form1/unknown-scale-like-terms/js/engine.js");

const MINUS = "−";

const PRACTICE = [
  { eq: "3x " + MINUS + " x = 8", answer: 4 },
  { eq: "5x + 2x = 21", answer: 3 },
  { eq: "6x = 10 + x", answer: 2 },
  { eq: "7x " + MINUS + " 3 = 2x + 12", answer: 3 },
  { eq: "2x + 9 = 5x", answer: 3 },
];

const TRAP = [
  { eq: "3x + 5 = 20", answer: 5 },
  { eq: "2x + 4 = 4x", answer: 2 },
  { eq: "5x " + MINUS + " 3 + x = 15", answer: 3 },
];

const CHALLENGE = [
  { eq: "5x = 4 + 9x", answer: -1 },
  { eq: "4 " + MINUS + " 2x = x " + MINUS + " 8", answer: 4 },
  { eq: "x + 4x " + MINUS + " 7 = 2x " + MINUS + " 16", answer: -3 },
];

const FORBIDDEN = "過等號就變號";

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log("ok", name);
}

function shown(n) {
  return n < 0 ? MINUS + Math.abs(n) : String(n);
}

function leaks(text, answer) {
  const value = shown(answer).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    new RegExp("(^|[^0-9x])x = " + value + "(?![0-9x])").test(text) ||
    new RegExp("(^|[^0-9x])x=" + value + "(?![0-9x])").test(text) ||
    new RegExp("(^|[^0-9])" + value + " = x(?![0-9a-zA-Z])").test(text)
  );
}

function openRun(run) {
  let opened = false;
  E.purpose().choices.forEach((_, index) => {
    if (E.answerPurpose(run, index).ok) opened = true;
  });
  assert.strictEqual(opened, true);
}

function auto(run) {
  openRun(run);
  for (let guard = 0; guard < 16; guard += 1) {
    assert.ok((E.view(run).actions || []).every((action) => !action.guided));
    assert.ok((E.view(run).tokens.L.concat(E.view(run).tokens.R)).every((token) => !token.guided));
    if (E.finishGate(run).ok) return E.view(run);
    const h = E.hint(run);
    assert.ok(h, E.view(run).equation);
    assert.notStrictEqual(h.type, "finish");
    let result;
    if (h.type === "merge") result = E.applyDrop(run, h.ids[0], { kind: "term", id: h.ids[1] });
    else if (h.type === "move") result = E.applyDrop(run, h.id, { kind: "pan", side: h.to });
    else result = E.applyScale(run, { type: h.type, value: h.value });
    assert.strictEqual(result.ok, true, (result.message || "") + " / " + E.view(run).equation);
    assert.strictEqual(E.isLevel(run), true, E.view(run).equation);
    if (result.askGoal) {
      const goal = E.answerGoal(run, !!E.view(run).ready);
      assert.strictEqual(goal.ok, true);
      assert.strictEqual(E.view(run).score, 100);
    }
  }
  assert.fail("stuck " + E.view(run).equation);
}

function token(run, side, label) {
  return E.view(run).tokens[side].find((item) => item.label === label);
}

function correctChoice(grader) {
  const found = [];
  for (let i = 0; i < 6; i += 1) if (grader(i).ok) found.push(i);
  assert.strictEqual(found.length, 1);
  return found[0];
}

check("motto, lamps, and counts", () => {
  assert.strictEqual(E.motto, "只有加減項先移項變號；乘除唔好移。");
  assert.strictEqual(E.lamps.merge.name, "合併");
  assert.strictEqual(E.lamps.move.detail, "兩邊同加／同減");
  assert.strictEqual(E.lamps.divide.detail, "兩邊同乘／同除");
  assert.strictEqual(E.practiceCount, 5);
  assert.strictEqual(E.trapCount, 3);
  assert.strictEqual(E.challengeCount, 3);
  assert.strictEqual(E.warmupCount, 4);
  assert.ok(E.lampHelp("merge").indexOf("把同類項合併：3x " + MINUS + " x = 2x") !== -1);
  assert.ok(E.lampHelp("move").indexOf("兩邊同減 4x") !== -1);
  assert.ok(E.lampHelp("divide").indexOf("負") !== -1);
});

check("question tables match the locked equations", () => {
  function eqs(mode, table) {
    return table.map((_, index) => E.view(E.createRun(index, mode)).equation);
  }
  assert.deepStrictEqual(eqs("practice", PRACTICE), PRACTICE.map((item) => item.eq));
  assert.deepStrictEqual(eqs("trap", TRAP), TRAP.map((item) => item.eq));
  assert.deepStrictEqual(eqs("challenge", CHALLENGE), CHALLENGE.map((item) => item.eq));
});

check("entry contrast and the three locked questions", () => {
  assert.deepStrictEqual(E.entry.contrast, ["x " + MINUS + " 9 = 4", "5x = 4 + 9x"]);
  assert.strictEqual(E.entry.steps[0].ask, "兩條方程有咩唔同？");
  assert.strictEqual(E.entry.steps[1].ask, "而家兩邊都有 x，同之前只有一邊有 x，解法會有咩分別？");
  assert.strictEqual(E.entry.steps[2].ask, "可唔可以直接兩邊同除？定係要先處理啲咩？");
  E.entry.steps.forEach((step, index) => {
    const pick = correctChoice((choice) => E.gradeEntry(index, choice));
    const text = step.choices[pick];
    assert.strictEqual(text.indexOf(FORBIDDEN), -1, text);
    assert.strictEqual(E.gradeEntry(index, pick).ok, true);
    assert.strictEqual(E.gradeEntry(index, (pick + 1) % step.choices.length).ok, false);
    assert.strictEqual(leaks(text, -1), false);
  });
  assert.ok(E.entry.steps[2].choices[correctChoice((choice) => E.gradeEntry(2, choice))].indexOf("不要先除") !== -1);
});

check("opening text does not reveal solved forms", () => {
  function scan(mode, table) {
    table.forEach((item, index) => {
      const run = E.createRun(index, mode);
      const view = E.view(run);
      const text = [view.title, view.brief, view.equation, E.lampHelp("merge"), E.lampHelp("move"), E.lampHelp("divide"), JSON.stringify(E.entry)].join("\n");
      assert.strictEqual(leaks(text, item.answer), false, mode + " " + item.eq + "\n" + text);
      assert.strictEqual(view.steps.length, 1);
      assert.strictEqual(view.steps[0].note, "原式");
      assert.strictEqual(view.ready, false);
    });
  }
  scan("practice", PRACTICE);
  scan("trap", TRAP);
  scan("challenge", CHALLENGE);
});

check("warmup identify and the unlike-term phrase", () => {
  const fresh = E.createWarmup();
  const wrong = E.answerWarmup(fresh, true);
  assert.strictEqual(wrong.ok, false);
  assert.strictEqual(fresh.score, 90);
  assert.strictEqual(fresh.index, 0);
  assert.ok(wrong.message.indexOf("未知箱同砝碼唔係同類項，唔可以合併") !== -1);
  assert.ok(wrong.checkLines.join("\n").indexOf("x = 1") !== -1);
  assert.ok(wrong.checkLines.join("\n").indexOf("是 5") !== -1);
  assert.ok(wrong.checkLines.join("\n").indexOf("是 8") !== -1);
  assert.strictEqual(E.answerWarmup(fresh, false).ok, true);
  E.advanceWarmup(fresh);

  const second = E.warmupView(fresh);
  assert.strictEqual(second.expr, "3x " + MINUS + " x");
  assert.strictEqual(second.reveal, "3x " + MINUS + " 1x");
  assert.strictEqual(second.terms[1].label, MINUS + "x");
  assert.strictEqual(second.terms[1].labelOne, MINUS + "1x");
  assert.strictEqual(JSON.stringify(second).indexOf("2x"), -1);
  const missed = E.answerWarmup(fresh, false);
  assert.strictEqual(missed.ok, false);
  assert.ok(missed.message.indexOf("2x") !== -1);
  assert.strictEqual(E.answerWarmup(fresh, true).ok, true);
  E.advanceWarmup(fresh);
  assert.strictEqual(E.answerWarmup(fresh, false).ok, true);
  E.advanceWarmup(fresh);

  const last = E.warmupView(fresh);
  assert.strictEqual(last.expr, "2x + 3x");
  assert.strictEqual(JSON.stringify(last).indexOf("5x"), -1);
  const done = E.answerWarmup(fresh, true);
  assert.strictEqual(done.ok, true);
  assert.strictEqual(done.done, true);
  assert.strictEqual(fresh.score, 80);
});

check("3x − x reveals the coefficient 1 and merges to 2x", () => {
  const run = E.createRun(0, "practice");
  const view = E.view(run);
  assert.strictEqual(view.unitCoach, "3x " + MINUS + " x 寫成 3x " + MINUS + " 1x，係數 1 先看得見。");
  assert.strictEqual(view.equationOne, "3x " + MINUS + " 1x = 8");
  assert.strictEqual(view.guide, undefined);
  assert.ok(view.tokens.L.every((item) => !item.guided));
  assert.strictEqual(view.actions.length, 0);
  assert.strictEqual(view.look, "");
  openRun(run);
  assert.ok(E.view(run).look.indexOf("同色") !== -1);
  const before = run.nextId;
  const plan = E.planMove(run, view.tokens.L[0].id);
  assert.strictEqual(plan.ok, true);
  assert.strictEqual(run.nextId, before);
  assert.strictEqual(E.view(run).equation, PRACTICE[0].eq);
  const merged = E.applyDrop(run, view.tokens.L[0].id, { kind: "term", id: view.tokens.L[1].id });
  assert.strictEqual(merged.ok, true);
  assert.strictEqual(E.view(run).equation, "2x = 8");
  assert.strictEqual(E.view(run).steps[1].lamp, "merge");
  assert.strictEqual(E.view(run).steps[1].note, "把同類項合併：3x " + MINUS + " x = 2x");
  assert.strictEqual(merged.askGoal, true);
  assert.strictEqual(E.hint(run).type, "div");
  assert.strictEqual(E.hint(run).value, 2);
  assert.strictEqual(E.view(run).actions[0].label, "兩邊同除以 2");
  assert.strictEqual(E.view(run).actions[0].guided, undefined);
  const tooSoon = E.answerGoal(run, true);
  assert.strictEqual(tooSoon.affirmed, false);
  assert.strictEqual(E.view(run).score, 100);
  const early = E.finishGate(run);
  assert.strictEqual(early.ok, false);
  assert.ok(early.message.indexOf("2x = 8") !== -1);
  assert.ok(early.message.indexOf("還沒有達到目標") !== -1);
  assert.ok(early.message.indexOf("2x＝10") !== -1);
  assert.ok(early.message.indexOf(MINUS + "x＝4") !== -1);
  assert.strictEqual(early.message.indexOf("請按「兩邊同除以 2」"), -1);
  const divided = E.applyScale(run, { type: "div", value: 2 });
  assert.strictEqual(divided.askGoal, true);
  assert.strictEqual(E.finishGate(run).ok, false);
  assert.strictEqual(E.answerGoal(run, true).affirmed, true);
  assert.strictEqual(E.finishGate(run).ok, true);
  assert.strictEqual(E.view(run).equation, "x = 4");
  assert.strictEqual(E.readSolution(run), 4);
});

check("dragging +4x places −4x and asks before the model changes", () => {
  const run = E.createRun(1, "trap");
  const id = token(run, "R", "4x").id;
  const before = E.view(run).equation;
  const plan = E.planMove(run, id);
  assert.strictEqual(plan.removeLabel, "+4x");
  assert.strictEqual(plan.placeLabel, MINUS + "4x");
  assert.strictEqual(plan.note, "兩邊同減 4x");
  assert.strictEqual(plan.narration, "右盤拿走 +4x，左盤放下 " + MINUS + "4x。");
  assert.strictEqual(E.view(run).equation, before);
  assert.strictEqual(E.needsMoveInquiry(plan, false), true);
  assert.strictEqual(E.needsMoveInquiry(plan, true), false);
  const inquiry = E.moveInquiry(plan);
  assert.strictEqual(inquiry.see.ask, "+4x 過咗去之後變成咩？");
  assert.strictEqual(inquiry.think.ask, "呢一步其實等價於對兩邊做咗咩？");
  assert.strictEqual(inquiry.wonder.ask, "點解唔可以直接「搬過去」而唔變號？");
  ["see", "think", "wonder"].forEach((step) => {
    const pick = correctChoice((choice) => E.gradeInquiry(plan, step, choice));
    const text = inquiry[step].choices[pick];
    assert.strictEqual(text.indexOf(FORBIDDEN), -1, text);
    if (step === "see") assert.strictEqual(text, MINUS + "4x");
    if (step === "think") assert.strictEqual(text, "兩邊同減 4x");
    if (step === "wonder") assert.ok(text.indexOf("兩邊同加或同減") !== -1);
    assert.strictEqual(E.gradeInquiry(plan, step, (pick + 1) % 4).ok, false);
  });
  openRun(run);
  const constant = token(run, "L", "4");
  assert.strictEqual(E.needsMoveInquiry(E.planMove(run, constant.id), false), false);
  const moved = E.applyDrop(run, id, { kind: "pan", side: "L" });
  assert.strictEqual(moved.ok, true);
  assert.ok(moved.message.indexOf("兩邊同減 4x") !== -1);
  assert.ok(moved.message.indexOf(MINUS + "4x") !== -1);
  assert.strictEqual(E.view(run).steps[1].lamp, "move");
  assert.strictEqual(E.view(run).steps[1].note, "兩邊同減 4x");
  assert.strictEqual(E.isLevel(run), true);
});

check("unlike colours are refused and the lamp turns red", () => {
  const run = E.createRun(0, "trap");
  openRun(run);
  const box = token(run, "L", "3x");
  const weight = token(run, "L", "5");
  const before = E.view(run).equation;
  assert.strictEqual(E.classifyDrop(run, box.id, { kind: "term", id: weight.id }).kind, "refuse");
  const refused = E.applyDrop(run, box.id, { kind: "term", id: weight.id });
  assert.strictEqual(refused.ok, false);
  assert.strictEqual(refused.message, "未知箱同砝碼唔係同類項，唔可以合併。");
  assert.ok(refused.checkLines[0].indexOf("x = 1") !== -1);
  assert.ok(refused.checkLines[0].indexOf("是 8") !== -1);
  assert.ok(refused.checkLines[1].indexOf("x = 2") !== -1);
  assert.ok(refused.checkLines[1].indexOf("是 11") !== -1);
  assert.strictEqual(E.view(run).equation, before);
  assert.strictEqual(E.view(run).score, 100);
  assert.strictEqual(E.view(run).lamps.find((lamp) => lamp.id === "merge").state, "bad");
  assert.strictEqual(E.isLevel(run), true);
  E.applyDrop(run, weight.id, { kind: "pan", side: "R" });
  assert.notStrictEqual(E.view(run).lamps.find((lamp) => lamp.id === "merge").state, "bad");
});

check("trap 3 merges 5x with x and does not merge the weight", () => {
  const run = E.createRun(2, "trap");
  openRun(run);
  const five = token(run, "L", "5x");
  const one = token(run, "L", "x");
  const weight = token(run, "L", MINUS + "3");
  const refused = E.applyDrop(run, five.id, { kind: "term", id: weight.id });
  assert.strictEqual(refused.ok, false);
  assert.strictEqual(E.view(run).equation, TRAP[2].eq);
  const merged = E.applyDrop(run, five.id, { kind: "term", id: one.id });
  assert.strictEqual(merged.ok, true);
  assert.strictEqual(E.view(run).equation, "6x " + MINUS + " 3 = 15");
  assert.strictEqual(E.view(run).steps[1].note, "把同類項合併：5x + x = 6x");
  auto(run);
  assert.strictEqual(E.readSolution(run), 3);
});

check("finish rejects 2x = 10, 10 = 2x, and −x = 4", () => {
  function advice(L, R) {
    return E.formAdvice({
      L: L.map((pair, index) => ({ id: "L" + index, type: pair[0], coeff: pair[1] })),
      R: R.map((pair, index) => ({ id: "R" + index, type: pair[0], coeff: pair[1] })),
    });
  }
  const two = advice([["x", 2]], [["n", 10]]);
  assert.strictEqual(two.ok, false);
  assert.ok(two.message.indexOf("還沒有達到目標") !== -1);
  assert.ok(two.message.indexOf("2x＝10") !== -1);
  assert.strictEqual(two.message.indexOf("請按"), -1);
  const flipped = advice([["n", 10]], [["x", 2]]);
  assert.strictEqual(flipped.ok, false);
  assert.ok(flipped.message.indexOf("10 = 2x") !== -1 || flipped.message.indexOf("10＝2x") !== -1);
  const neg = advice([["x", -1]], [["n", 4]]);
  assert.strictEqual(neg.ok, false);
  assert.ok(neg.message.indexOf(MINUS + "x＝4") !== -1);
  assert.strictEqual(neg.message.indexOf("請按"), -1);
  assert.strictEqual(advice([["x", 1]], [["n", 4]]).ok, true);
  assert.strictEqual(advice([["n", 4]], [["x", 1]]).ok, true);
  const negFour = advice([["x", -4]], [["n", 4]]);
  assert.strictEqual(negFour.ok, false);
  assert.ok(negFour.message.indexOf(MINUS + "4x = 4") !== -1);
  assert.ok(negFour.message.indexOf("係數還不是 1") !== -1);
});

check("challenge 1 reaches −1 by −4x = 4 and dividing by −4", () => {
  const run = E.createRun(0, "challenge");
  assert.strictEqual(E.view(run).look, "");
  assert.ok(E.view(run).actions.every((action) => !action.guided));
  openRun(run);
  const nine = token(run, "R", "9x");
  const moved = E.applyDrop(run, nine.id, { kind: "pan", side: "L" });
  assert.strictEqual(moved.ok, true);
  assert.strictEqual(E.view(run).equation, "5x " + MINUS + " 9x = 4");
  assert.strictEqual(E.view(run).steps[1].note, "兩邊同減 9x");
  const left = E.view(run).tokens.L;
  E.applyDrop(run, left[0].id, { kind: "term", id: left[1].id });
  assert.strictEqual(E.view(run).equation, MINUS + "4x = 4");
  assert.strictEqual(E.view(run).steps[2].note, "把同類項合併：5x " + MINUS + " 9x = " + MINUS + "4x");
  const gate = E.finishGate(run);
  assert.strictEqual(gate.ok, false);
  assert.ok(gate.message.indexOf(MINUS + "4x = 4") !== -1);
  assert.ok(gate.message.indexOf("還沒有達到目標") !== -1);
  const button = E.view(run).actions.find((action) => action.type === "div");
  assert.strictEqual(button.label, "兩邊同除以 " + MINUS + "4");
  assert.ok(E.view(run).actions.some((action) => action.label === "兩邊同乘 " + MINUS + "1"));
  const divided = E.applyScale(run, { type: "div", value: -4 });
  assert.strictEqual(divided.ok, true);
  assert.strictEqual(E.view(run).equation, "x = " + MINUS + "1");
  assert.strictEqual(E.view(run).steps[3].lamp, "divide");
  assert.strictEqual(E.view(run).steps[3].note, "兩邊同除以 " + MINUS + "4");
  assert.strictEqual(E.readSolution(run), -1);
  assert.strictEqual(E.isLevel(run), true);
});

check("multiplying by −1 is an alternative on the negative coefficient", () => {
  const run = E.createRun(0, "challenge");
  openRun(run);
  const nine = token(run, "R", "9x");
  E.applyDrop(run, nine.id, { kind: "pan", side: "L" });
  const left = E.view(run).tokens.L;
  E.applyDrop(run, left[0].id, { kind: "term", id: left[1].id });
  const scaled = E.applyScale(run, { type: "mul", value: -1 });
  assert.strictEqual(scaled.ok, true);
  assert.strictEqual(E.view(run).equation, "4x = " + MINUS + "4");
  assert.strictEqual(E.view(run).steps[3].note, "兩邊同乘 " + MINUS + "1");
  E.applyScale(run, { type: "div", value: 4 });
  assert.strictEqual(E.readSolution(run), -1);
});

check("practice guides only practice, and every set solves to the locked answer", () => {
  PRACTICE.forEach((item, index) => {
    const run = E.createRun(index, "practice");
    assert.strictEqual(E.view(run).look, "");
    auto(run);
    assert.strictEqual(E.readSolution(run), item.answer, item.eq);
    assert.strictEqual(E.hint(run).type, "finish");
    assert.strictEqual(E.view(run).goalAffirmed, true);
    assert.strictEqual(E.view(run).ready, true);
    const hit = E.submitCheck(run, shown(item.answer));
    assert.strictEqual(hit.ok, true, hit.message);
    assert.strictEqual(hit.bonus, 10);
    assert.strictEqual(E.resultOf(run).entry, item.answer);
  });
  TRAP.forEach((item, index) => {
    const run = E.createRun(index, "trap");
    assert.strictEqual(E.view(run).look, "");
    auto(run);
    assert.strictEqual(E.readSolution(run), item.answer, item.eq);
  });
  CHALLENGE.forEach((item, index) => {
    const run = E.createRun(index, "challenge");
    assert.strictEqual(E.view(run).look, "");
    auto(run);
    assert.strictEqual(E.readSolution(run), item.answer, item.eq + " -> " + E.view(run).equation);
    assert.strictEqual(E.isLevel(run), true);
  });
});

check("merge can light more than once, and divide is not a drag", () => {
  const run = E.createRun(3, "practice");
  auto(run);
  const merges = E.view(run).steps.filter((step) => step.lamp === "merge");
  assert.ok(merges.length >= 2, JSON.stringify(merges));
  assert.ok(E.view(run).steps.some((step) => step.lamp === "move" && step.note.indexOf("兩邊同") === 0));
  assert.ok(E.view(run).steps.some((step) => step.lamp === "divide"));
  const early = E.createRun(0, "practice");
  const blocked = E.applyScale(early, { type: "div", value: 2 });
  assert.strictEqual(blocked.ok, false);
  assert.ok(blocked.message.indexOf("我們想把方程變成甚麼樣子") !== -1);
  openRun(early);
  const refused = E.applyScale(early, { type: "div", value: 2 });
  assert.strictEqual(refused.ok, false);
  assert.ok(refused.message.indexOf("一邊只剩未知箱") !== -1);
  assert.ok(refused.message.indexOf("乘除不要用拖曳") !== -1);
});

check("wrong substitution deducts 10 and undo does not refund it", () => {
  const run = E.createRun(0, "practice");
  auto(run);
  const wrong = E.submitCheck(run, "1");
  assert.strictEqual(wrong.ok, false);
  assert.strictEqual(wrong.leftText, "3×(1) " + MINUS + " (1) = 2");
  assert.strictEqual(wrong.rightText, "8");
  assert.strictEqual(E.view(run).score, 90);
  assert.strictEqual(leaks(wrong.message, 4), false);
  const again = E.submitCheck(run, "4");
  assert.strictEqual(again.ok, true);
  assert.strictEqual(again.bonus, 0);
  assert.strictEqual(E.view(run).score, 90);
  assert.strictEqual(again.leftText, "3×(4) " + MINUS + " (4) = 8");

  const floor = E.createRun(1, "practice");
  auto(floor);
  for (let i = 0; i < 12; i += 1) E.submitCheck(floor, "0");
  assert.strictEqual(E.view(floor).score, 0);
  const stayed = E.submitCheck(floor, "1");
  assert.ok(stayed.message.indexOf("得分維持 0") !== -1);

  const undone = E.createRun(2, "practice");
  auto(undone);
  E.submitCheck(undone, "0");
  assert.strictEqual(E.view(undone).score, 90);
  E.undo(undone);
  assert.strictEqual(E.view(undone).score, 90);
  assert.notStrictEqual(E.view(undone).equation, "x = 2");
});

check("parse rejects blanks without spending a try", () => {
  assert.strictEqual(E.parseStudent(""), null);
  assert.strictEqual(E.parseStudent("7.5"), null);
  assert.strictEqual(E.parseStudent(" " + MINUS + "1 "), -1);
  const run = E.createRun(0, "practice");
  auto(run);
  const blank = E.submitCheck(run, "  ");
  assert.strictEqual(blank.ok, false);
  assert.strictEqual(E.view(run).checkTries, 0);
  assert.strictEqual(E.view(run).score, 100);
});

check("undo restores the equation and dropping on the same pan does nothing", () => {
  const run = E.createRun(0, "practice");
  openRun(run);
  const ids = E.view(run).tokens.L.map((item) => item.id);
  E.applyDrop(run, ids[0], { kind: "term", id: ids[1] });
  assert.strictEqual(E.view(run).equation, "2x = 8");
  E.undo(run);
  assert.strictEqual(E.view(run).equation, PRACTICE[0].eq);
  assert.strictEqual(E.view(run).steps.length, 1);
  const cancel = E.applyDrop(run, E.view(run).tokens.L[0].id, { kind: "pan", side: "L" });
  assert.strictEqual(cancel.ok, false);
  assert.strictEqual(E.view(run).equation, PRACTICE[0].eq);
});

check("consolidate prompt and student-facing sources", () => {
  assert.strictEqual(E.consolidate.ask, "我有冇先合併同類項？移項有冇變成相反項？");
  const files = [
    "form1/unknown-scale-like-terms/js/engine.js",
    "form1/unknown-scale-like-terms/js/app.js",
    "form1/unknown-scale-like-terms/index.html",
    "form1/unknown-scale-like-terms/css/style.css",
    "form1/index.html",
    "form1/unknown-scale/js/app.js",
  ];
  const blob = files.map((file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8")).join("\n");
  assert.strictEqual(blob.indexOf(FORBIDDEN), -1);
  assert.strictEqual(blob.indexOf("黃虛線"), -1);
  assert.strictEqual(blob.indexOf("is-guide"), -1);
  assert.ok(blob.indexOf("unknown-scale-like-terms/") !== -1);
  assert.ok(blob.indexOf("unknown-scale/") !== -1);
  assert.ok(fs.readFileSync(path.join(__dirname, "..", "form1/unknown-scale/js/engine.js"), "utf8").indexOf("pointerdown") === -1);
});

console.log(passed + " passed");
