/* Chapter 3: brackets. Answers for the checks below stay in this file. */
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const E = require("../form1/unknown-scale-brackets/js/engine.js");

const MINUS = "−";

const EXAMPLES = [
  { eq: "3(x + 2) = 18", answer: 4 },
  { eq: "2(x + 3) = x + 10", answer: 4 },
  { eq: "3(x + 2) = 2(x + 5)", answer: 4 },
];
const PRACTICE = [
  { eq: "2(x + 3) = 16", answer: 5 },
  { eq: "2(x + 6) = x + 20", answer: 8 },
  { eq: "4(x + 2) = 3(x + 6)", answer: 10 },
];
const CHALLENGE = [
  { eq: "6(x + 2) = 42", answer: 5 },
  { eq: "4(x + 2) = x + 17", answer: 3 },
  { eq: "2(x + 3) = x + 1", answer: -5 },
];

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
    new RegExp("(^|[^0-9x])x = " + value + "(?![0-9])").test(text) ||
    new RegExp("(^|[^0-9x])x=" + value + "(?![0-9])").test(text) ||
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
  for (let guard = 0; guard < 24; guard += 1) {
    const view = E.view(run);
    if (view.ready) {
      const goal = E.answerGoal(run, true);
      assert.strictEqual(goal.affirmed, true, view.equation);
      assert.strictEqual(E.finishGate(run).ok, true, view.equation);
      assert.strictEqual(E.isLevel(run), true, view.equation);
      return view;
    }
    const h = E.hint(run);
    assert.ok(h && h.type !== "finish", view.equation);
    let result;
    if (h.type === "expand") result = E.applyExpand(run, h.id);
    else if (h.type === "merge") result = E.applyMerge(run, h.side);
    else if (h.type === "move") result = E.applyMove(run, h.id);
    else result = E.applyScale(run, { type: h.type, value: h.value });
    assert.strictEqual(result.ok, true, (result.message || "") + " / " + E.view(run).equation);
    assert.strictEqual(E.isLevel(run), true, E.view(run).equation);
    assert.strictEqual(E.view(run).score, 100, E.view(run).equation);
  }
  assert.fail("stuck " + E.view(run).equation);
}

function classifyAll(run) {
  const steps = E.view(run).steps;
  steps.forEach((step, index) => {
    if (!index) return;
    const pick = E.classChoices().findIndex((label) => {
      if (step.lamp === "expand") return label.indexOf("拆括號") === 0;
      if (step.lamp === "merge") return label.indexOf("合併") === 0;
      if (step.lamp === "move") return label.indexOf("移項") === 0;
      return label.indexOf("除數") === 0;
    });
    const graded = E.gradeClassify(run, index, pick);
    assert.strictEqual(graded.ok, true, step.note + " / " + graded.message);
  });
  assert.strictEqual(E.classifyTask(run).done, true);
}

function reachCheck(run, answer) {
  const solved = auto(run);
  assert.strictEqual(E.readSolution(run), answer, solved.equation);
  classifyAll(run);
  return E.submitCheck(run, shown(answer));
}

check("motto, labels, and varied practice answers are not all 4", () => {
  assert.strictEqual(E.motto, "只有加減項先移項變號；乘除唔好移。");
  assert.strictEqual(E.lamps.expand.name, "拆括號");
  assert.strictEqual(E.lamps.move.detail, "兩邊同加／同減");
  assert.strictEqual(E.lamps.divide.detail, "兩邊同乘／同除");
  assert.strictEqual(E.exampleCount, 3);
  assert.strictEqual(E.practiceCount, 3);
  assert.strictEqual(E.challengeCount, 3);
  assert.deepStrictEqual(PRACTICE.map((item) => item.answer), [5, 8, 10]);
  assert.deepStrictEqual(CHALLENGE.map((item) => item.answer), [5, 3, -5]);
  assert.ok(PRACTICE.every((item) => item.answer !== 4));
  assert.ok(CHALLENGE.every((item) => item.answer !== 4));
  assert.ok(new Set(PRACTICE.map((item) => item.answer)).size > 1);
  assert.ok(new Set(CHALLENGE.map((item) => item.answer)).size > 1);
});

check("question tables match the locked equations", () => {
  function eqs(mode, table) {
    return table.map((_, index) => E.view(E.createRun(index, mode)).equation);
  }
  assert.deepStrictEqual(eqs("example", EXAMPLES), EXAMPLES.map((item) => item.eq));
  assert.deepStrictEqual(eqs("practice", PRACTICE), PRACTICE.map((item) => item.eq));
  assert.deepStrictEqual(eqs("challenge", CHALLENGE), CHALLENGE.map((item) => item.eq));
});

check("opening text does not reveal x", () => {
  function scan(mode, table) {
    table.forEach((item, index) => {
      const run = E.createRun(index, mode);
      const view = E.view(run);
      const text = [view.title, view.brief, view.equation, view.look, view.deskPrompt, E.lampHelp("expand"), E.lampHelp("move"), E.motto].join("\n");
      assert.strictEqual(leaks(text, item.answer), false, mode + " " + item.eq + "\n" + text);
      assert.strictEqual(view.steps[0].note, "原式");
      assert.strictEqual(view.ready, false);
      assert.ok(view.actions.every((action) => !action.guided));
    });
  }
  scan("example", EXAMPLES);
  scan("practice", PRACTICE);
  scan("challenge", CHALLENGE);
});

function finishEasy(w) {
  assert.strictEqual(E.submitFormula(w, "面積 = 長 × 闊").ok, true);
  assert.strictEqual(E.submitNumbers(w, "7×4").ok, true);
  assert.strictEqual(E.submitEasyArea(w, "28").ok, true);
}

function finishStw(w) {
  for (let i = 0; i < 3; i += 1) {
    for (let choice = 0; choice < 4; choice += 1) {
      const trial = E.restoreWorkshop(E.workshopState(w));
      if (E.gradeStw(trial, choice).ok) {
        E.gradeStw(w, choice);
        break;
      }
    }
  }
}

check("easy rectangle finishes formula, substitution, then area before the next page", () => {
  const w = E.createWorkshop();
  const first = E.workshopView(w);
  assert.strictEqual(first.phase, "easy");
  assert.strictEqual(first.strips.map((strip) => strip.length + "x" + strip.width).join(","), "7x4");
  assert.strictEqual(first.strips.length, 1);
  assert.strictEqual(JSON.stringify(first).indexOf("10 和 7"), -1);
  assert.strictEqual(E.submitNumbers(w, "7×4").ok, false);
  assert.strictEqual(E.submitEasyArea(w, "28").ok, false);
  const added = E.submitFormula(w, "長 + 闊");
  assert.strictEqual(added.ok, false);
  assert.strictEqual(w.score, 90);
  assert.strictEqual(added.message.indexOf("長 × 闊"), -1);
  assert.strictEqual(E.submitFormula(w, "長方形的面積是長乘闊").ok, true);
  assert.strictEqual(E.submitNumbers(w, "28").ok, false);
  assert.strictEqual(w.easyStep, 1);
  assert.strictEqual(E.submitNumbers(w, "4 × 7").ok, true);
  assert.strictEqual(E.submitEasyArea(w, "7×4").ok, false);
  assert.strictEqual(w.score, 90);
  const area = E.submitEasyArea(w, "28");
  assert.strictEqual(area.ok, true);
  assert.strictEqual(E.workshopView(w).phase, "hard");
  assert.strictEqual(E.workshopView(w).strips.length, 1);
  assert.strictEqual(E.workshopView(w).strips[0].length, "17");
  assert.strictEqual(E.workshopView(w).canSplit, false);
});

check("STW comes after the tens split and before the expanded formula", () => {
  const w = E.createWorkshop();
  finishEasy(w);
  const before = E.workshopView(w);
  assert.strictEqual(before.think.ask, "17 乘 6 不容易一次心算。可以怎樣算得容易些？");
  assert.strictEqual(before.stw, null);
  assert.strictEqual(before.strips.length, 1);
  const hidden = JSON.stringify(before);
  assert.strictEqual(hidden.indexOf("6×10"), -1);
  assert.strictEqual(hidden.indexOf("6×7"), -1);
  assert.strictEqual(hidden.indexOf("10 和 7"), -1);
  assert.strictEqual(E.splitLength(w).ok, false);
  assert.strictEqual(E.answerHardThink(w, 2).ok, false);
  assert.strictEqual(w.score, 100);
  assert.strictEqual(E.answerHardThink(w, 0).ok, true);
  assert.strictEqual(E.workshopView(w).canSplit, true);
  assert.strictEqual(E.workshopView(w).strips.length, 1);
  E.splitLength(w);
  const view = E.workshopView(w);
  assert.strictEqual(view.phase, "hard");
  assert.strictEqual(view.stw.ask, "兩塊有甚麼是共用的？");
  assert.strictEqual(view.strips.map((strip) => strip.length).join(","), "10,7");
  assert.ok(view.strips.every((strip) => strip.width === "6"));
  assert.strictEqual(view.comparison, "");
  assert.strictEqual(view.formulaReady, false);
  const asks = [];
  for (let i = 0; i < 3; i += 1) {
    const current = E.workshopView(w);
    asks.push(current.stw.ask);
    assert.strictEqual(JSON.stringify(current).indexOf("6×10 + 6×7"), -1);
    let pick = -1;
    for (let choice = 0; choice < 4; choice += 1) {
      const trial = E.restoreWorkshop(E.workshopState(w));
      if (E.gradeStw(trial, choice).ok) pick = choice;
    }
    assert.ok(pick >= 0, asks[i]);
    assert.strictEqual(E.gradeStw(w, (pick + 1) % 4).ok, false);
    assert.strictEqual(w.score, 100);
    assert.strictEqual(E.gradeStw(w, pick).ok, true);
  }
  assert.deepStrictEqual(asks, ["兩塊有甚麼是共用的？", "每一小塊面積怎樣計？", "為甚麼每一項都要乘 6？"]);
  assert.strictEqual(E.workshopView(w).hardStage, "expr");
  assert.strictEqual(E.workshopView(w).comparison, "");
});

check("missing the second product highlights that region and does not reveal it", () => {
  const w = E.createWorkshop();
  finishEasy(w);
  const wrongNumber = E.submitEasyArea(E.createWorkshop(), "20");
  assert.strictEqual(E.createWorkshop().score, 100);
  E.submitFormula(w, "長×闊");
  const fresh = E.createWorkshop();
  E.submitFormula(fresh, "長×闊");
  E.submitNumbers(fresh, "7×4");
  const badArea = E.submitEasyArea(fresh, "20");
  assert.strictEqual(badArea.ok, false);
  assert.strictEqual(fresh.score, 90);
  assert.strictEqual(badArea.message.indexOf("28"), -1);
  E.answerHardThink(w, 0);
  E.splitLength(w);
  finishStw(w);
  const missed = E.submitSplit(w, "6×10+7");
  assert.strictEqual(missed.ok, false);
  assert.deepStrictEqual(missed.highlight, ["7"]);
  assert.strictEqual(missed.message.indexOf("42"), -1);
  assert.strictEqual(missed.message.indexOf("6×7"), -1);
  assert.strictEqual(missed.message.indexOf("60"), -1);
  assert.ok(missed.message.indexOf("長度 7") !== -1);
  assert.strictEqual(w.score, 90);
  assert.strictEqual(E.workshopView(w).strips.find((strip) => strip.length === "7").omitted, true);
  const signed = E.submitSplit(w, "6×10−6×7");
  assert.strictEqual(signed.ok, false);
  assert.deepStrictEqual(signed.highlight, ["7"]);
  assert.ok(signed.message.indexOf("減") !== -1);
  assert.strictEqual(signed.message.indexOf("42"), -1);
  const bare = E.gradeAreas("6×10");
  assert.deepStrictEqual(bare.highlight, ["7"]);
  const other = E.gradeAreas("10+6×7");
  assert.deepStrictEqual(other.highlight, ["10"]);
  const fixed = E.submitSplit(w, "6×10+6×7");
  assert.strictEqual(fixed.ok, true);
  assert.ok(fixed.message.indexOf("6×17 = 102") !== -1);
  assert.ok(fixed.message.indexOf("6×10 + 6×7 = 102") !== -1);
  assert.strictEqual(E.gradeAreas("60+42").ok, true);
  E.undoWorkshop(w);
  assert.strictEqual(w.hardOk, false);
  assert.strictEqual(w.score, 80);
});

check("the third area task accepts any split that adds back to the length", () => {
  const w = E.createWorkshop();
  finishEasy(w);
  E.answerHardThink(w, 0);
  E.splitLength(w);
  finishStw(w);
  E.submitSplit(w, "6×10+6×7");
  assert.strictEqual(E.workshopView(w).phase, "own");
  assert.strictEqual(E.workshopView(w).strips.length, 1);
  assert.strictEqual(E.workshopView(w).strips[0].length, "16");
  assert.strictEqual(E.submitOwnSplit(w, "10", "7").ok, false);
  assert.ok(E.submitOwnSplit(w, "10", "7").message.indexOf("不是 16") !== -1);
  assert.strictEqual(E.submitOwnSplit(w, "0", "16").ok, false);
  assert.strictEqual(w.score, 100);
  assert.strictEqual(E.submitOwnSplit(w, "9", "7").ok, true);
  assert.strictEqual(E.workshopView(w).strips.map((strip) => strip.length).join(","), "9,7");
  const missed = E.submitOwnAreas(w, "5×9+7");
  assert.strictEqual(missed.ok, false);
  assert.deepStrictEqual(missed.highlight, ["p2"]);
  assert.strictEqual(missed.message.indexOf("35"), -1);
  assert.strictEqual(missed.message.indexOf("5×7"), -1);
  assert.strictEqual(E.workshopView(w).strips.find((strip) => strip.id === "p2").omitted, true);
  const other = E.createWorkshop();
  other.hardOk = true;
  other.easyOk = true;
  assert.strictEqual(E.submitOwnSplit(other, "8", "8").ok, true);
  assert.strictEqual(E.submitOwnAreas(other, "5×8+5×8").ok, true);
  assert.strictEqual(E.submitOwnAreas(w, "5×9+5×7").ok, true);
  assert.strictEqual(E.workshopView(w).phase, "match");
  const again = E.createWorkshop();
  again.easyOk = true;
  again.hardOk = true;
  E.submitOwnSplit(again, "10", "6");
  assert.strictEqual(E.submitOwnAreas(again, "5×10+5×6").ok, true);
});

check("algebra match and three-strip omission keep the repair visual", () => {
  const w = E.createWorkshop();
  w.easyOk = true;
  w.hardOk = true;
  w.ownOk = true;
  const view = E.workshopView(w);
  assert.strictEqual(view.phase, "match");
  assert.strictEqual(view.bridge, "");
  assert.strictEqual(JSON.stringify(view).indexOf("4(x + 3) = 4x + 12"), -1);
  const added = E.matchRegion(w, "x", "add");
  assert.strictEqual(added.ok, false);
  assert.ok(added.message.indexOf("相乘") !== -1);
  assert.strictEqual(added.message.indexOf("4x"), -1);
  assert.strictEqual(w.score, 100);
  assert.strictEqual(E.workshopView(w).strips.find((strip) => strip.length === "x").omitted, true);
  const bare = E.matchRegion(w, "c", "bare3");
  assert.strictEqual(bare.ok, false);
  assert.ok(bare.message.indexOf("還沒有乘闊度") !== -1);
  assert.strictEqual(bare.message.indexOf("12"), -1);
  assert.strictEqual(bare.message.indexOf("4×3"), -1);
  assert.strictEqual(E.matchRegion(w, "x", "4x").ok, true);
  assert.strictEqual(E.matchRegion(w, "c", "times").ok, true);
  assert.ok(E.workshopView(w).bridge.indexOf("4(x + 3) = 4x + 12") !== -1);

  const fresh = E.createWorkshop();
  fresh.easyOk = true;
  fresh.hardOk = true;
  fresh.ownOk = true;
  fresh.matched = { x: "4x", c: "twelve" };
  E.setThreeMode(fresh, "challenge");
  const prompt = E.workshopView(fresh).threePrompt;
  assert.ok(prompt.indexOf("自己決定") !== -1);
  assert.strictEqual(prompt.indexOf("4x + 20"), -1);
  assert.strictEqual(prompt.indexOf("4(x + 5)"), -1);
  assert.strictEqual(prompt.indexOf("4x + 8"), -1);
  const missed = E.submitThree(fresh, "4x+2+3");
  assert.strictEqual(missed.ok, false);
  assert.deepStrictEqual(missed.highlight.slice().sort(), ["2", "3"]);
  assert.strictEqual(missed.message.indexOf("20"), -1);
  assert.strictEqual(missed.message.indexOf("4x + 8"), -1);
  assert.strictEqual(E.workshopView(fresh).strips.filter((strip) => strip.omitted).map((strip) => strip.length).join(","), "2,3");
  const one = E.gradeThree("4x+8+3");
  assert.deepStrictEqual(one.highlight, ["3"]);
  assert.strictEqual(one.message.indexOf("12"), -1);
  const signed = E.gradeThree("4x−8+12");
  assert.ok(signed.highlight.indexOf("2") !== -1);
  assert.ok(signed.message.indexOf("減") !== -1);
  assert.strictEqual(signed.message.indexOf("4×2"), -1);
  assert.strictEqual(E.gradeThree("4(x+2+3)").ok, false);
  assert.strictEqual(E.gradeThree("4(x+2+3)").penalize, false);
  E.combineThree(fresh);
  assert.strictEqual(E.workshopView(fresh).strips.map((strip) => strip.length).join(","), "x,5");
  assert.strictEqual(E.submitThree(fresh, "4(x+5)").ok, true);
  assert.strictEqual(fresh.score, 90);
  assert.strictEqual(E.gradeThree("4x+8+12").ok, true);
  assert.strictEqual(E.gradeThree("4x+20").ok, true);
  assert.strictEqual(E.gradeThree("4x+4×2+4×3").ok, true);
  const guided = E.workshopView(E.createWorkshop());
  guided.threeMode = "practice";
});

check("distribution expands every term, including the second and third", () => {
  const run = E.createRun(0, "example");
  openRun(run);
  const bracket = E.view(run).tokens.L[0];
  const before = run.nextId;
  const plan = E.planExpand(run, bracket.id);
  assert.strictEqual(plan.ok, true);
  assert.strictEqual(run.nextId, before);
  assert.strictEqual(plan.equation, "3x + 6 = 18");
  assert.ok(plan.note.indexOf("3(x + 2) = 3x + 6") !== -1);
  assert.strictEqual(plan.equation.indexOf("3x + 2"), -1);
  const expanded = E.applyExpand(run, bracket.id);
  assert.strictEqual(expanded.ok, true);
  assert.strictEqual(E.view(run).equation, "3x + 6 = 18");
  assert.strictEqual(E.view(run).steps[1].lamp, "expand");
  assert.strictEqual(E.isLevel(run), true);

  const both = E.createRun(2, "example");
  openRun(both);
  const right = E.view(both).tokens.R[0];
  E.applyExpand(both, right.id);
  assert.strictEqual(E.view(both).equation, "3(x + 2) = 2x + 10");
  assert.ok(E.view(both).equation.indexOf("2x + 5") === -1);
  const left = E.view(both).tokens.L[0];
  E.applyExpand(both, left.id);
  assert.strictEqual(E.view(both).equation, "3x + 6 = 2x + 10");
  assert.strictEqual(E.isLevel(both), true);
  auto(both);
  assert.strictEqual(E.readSolution(both), 4);
});

check("divide-first is accepted for 3(x + 2) = 18 and is not marked wrong", () => {
  const run = E.createRun(0, "example");
  openRun(run);
  const view = E.view(run);
  assert.ok(view.actions.some((action) => action.type === "expand"));
  assert.ok(view.actions.some((action) => action.label === "兩邊同除以 3"));
  assert.ok(view.look.indexOf("兩種都對") !== -1);
  const divided = E.applyScale(run, { type: "div", value: 3 });
  assert.strictEqual(divided.ok, true);
  assert.strictEqual(E.view(run).equation, "x + 2 = 6");
  assert.strictEqual(E.view(run).steps[1].lamp, "divide");
  assert.strictEqual(E.view(run).steps[1].note, "兩邊同除以 3");
  assert.strictEqual(E.view(run).score, 100);
  assert.strictEqual(E.isLevel(run), true);
  const blocked = E.finishGate(run);
  assert.strictEqual(blocked.ok, false);
  assert.ok(blocked.message.indexOf("x + 2 = 6") !== -1 || blocked.message.indexOf("達到目標") !== -1);
  auto(run);
  assert.strictEqual(E.readSolution(run), 4);
  assert.ok(E.view(run).steps.some((step) => step.lamp === "divide"));
  assert.ok(!E.view(run).steps.some((step) => step.lamp === "expand"));
});

check("both-side brackets, alternate routes, and the end condition", () => {
  PRACTICE.forEach((item, index) => {
    const run = E.createRun(index, "practice");
    const hit = reachCheck(run, item.answer);
    assert.strictEqual(hit.ok, true, hit.message + " / " + item.eq);
    assert.strictEqual(hit.bonus, 10);
    assert.strictEqual(E.view(run).score, 110);
  });
  CHALLENGE.forEach((item, index) => {
    const run = E.createRun(index, "challenge");
    assert.strictEqual(E.view(run).look, "");
    const hit = reachCheck(run, item.answer);
    assert.strictEqual(hit.ok, true, item.eq + " " + hit.message);
    assert.strictEqual(E.isLevel(run), true);
  });
  EXAMPLES.forEach((item, index) => {
    const run = E.createRun(index, "example");
    auto(run);
    assert.strictEqual(E.readSolution(run), item.answer, item.eq);
  });

  const early = E.createRun(0, "practice");
  openRun(early);
  E.applyExpand(early, E.view(early).tokens.L[0].id);
  E.applyMove(early, E.view(early).tokens.L[1].id);
  E.applyMerge(early, "R");
  assert.strictEqual(E.view(early).equation, "2x = 10");
  const gate = E.finishGate(early);
  assert.strictEqual(gate.ok, false);
  assert.ok(gate.message.indexOf("2x = 10") !== -1);
  assert.ok(gate.message.indexOf("係數還不是 1") !== -1);
  assert.strictEqual(gate.message.indexOf("請按"), -1);
  assert.strictEqual(leaks(gate.message, 5), false);

  const negative = { L: [{ id: "a", kind: "atom", type: "x", coeff: -1 }], R: [{ id: "b", kind: "atom", type: "n", coeff: 4 }] };
  const advice = E.formAdvice(negative);
  assert.strictEqual(advice.ok, false);
  assert.ok(advice.message.indexOf(MINUS + "x = 4") !== -1 || advice.message.indexOf("係數還不是 1") !== -1);
  assert.strictEqual(E.formAdvice({
    L: [{ id: "a", kind: "atom", type: "x", coeff: 1 }],
    R: [{ id: "b", kind: "atom", type: "n", coeff: 4 }],
  }).ok, true);

  const scale = E.createRun(0, "challenge");
  openRun(scale);
  assert.ok(E.view(scale).actions.some((action) => action.label === "兩邊同除以 2"));
  assert.ok(E.view(scale).actions.some((action) => action.label === "兩邊同除以 3"));
  assert.ok(E.view(scale).actions.some((action) => action.label === "兩邊同除以 6"));
  E.applyScale(scale, { type: "div", value: 2 });
  assert.strictEqual(E.view(scale).equation, "3(x + 2) = 21");
  assert.strictEqual(E.isLevel(scale), true);
  E.applyScale(scale, { type: "div", value: 3 });
  assert.strictEqual(E.view(scale).equation, "x + 2 = 7");
  auto(scale);
  assert.strictEqual(E.readSolution(scale), 5);
});

check("classification distinguishes one-side rewriting from both-side operations", () => {
  const run = E.createRun(0, "example");
  auto(run);
  const task = E.classifyTask(run);
  assert.ok(task.items.length >= 2);
  assert.strictEqual(JSON.stringify(task).indexOf('"lamp"'), -1);
  const messages = [];
  [0, 1, 2, 3].forEach((index) => {
    const trial = E.createRun(0, "example");
    auto(trial);
    const graded = E.gradeClassify(trial, 1, index);
    if (!graded.ok) {
      messages.push(graded.message);
      assert.strictEqual(trial.score, 100);
      assert.strictEqual(leaks(graded.message, 4), false);
    }
  });
  assert.ok(messages.length >= 3);
  assert.strictEqual(new Set(messages).size, messages.length);
  classifyAll(run);
  const hit = E.submitCheck(run, "4");
  assert.strictEqual(hit.ok, true, hit.message);
  assert.strictEqual(hit.leftText.indexOf("3(") !== -1, true);
  const tooSoon = E.createRun(1, "practice");
  auto(tooSoon);
  const blocked = E.submitCheck(tooSoon, "8");
  assert.strictEqual(blocked.ok, false);
  assert.ok(blocked.message.indexOf("選類型") !== -1);
  assert.strictEqual(E.view(tooSoon).checkTries, 0);
  assert.strictEqual(E.view(tooSoon).score, 100);
});

check("wrong substitution deducts 10, undo does not refund, blank spends nothing", () => {
  const run = E.createRun(0, "practice");
  reachCheck(run, 5);
  const again = E.createRun(0, "practice");
  auto(again);
  classifyAll(again);
  const wrong = E.submitCheck(again, "1");
  assert.strictEqual(wrong.ok, false);
  assert.strictEqual(E.view(again).score, 90);
  assert.strictEqual(leaks(wrong.message, 5), false);
  assert.notStrictEqual(wrong.leftText, wrong.rightText);
  E.undo(again);
  assert.strictEqual(E.view(again).score, 90);
  assert.notStrictEqual(E.view(again).equation, "x = 5");
  const blank = E.createRun(2, "practice");
  auto(blank);
  classifyAll(blank);
  const empty = E.submitCheck(blank, "  ");
  assert.strictEqual(empty.ok, false);
  assert.strictEqual(E.view(blank).checkTries, 0);
  assert.strictEqual(E.view(blank).score, 100);
  assert.strictEqual(E.parseStudent(""), null);
  assert.strictEqual(E.parseStudent(" " + MINUS + "5 "), -5);
  const goal = E.createRun(0, "challenge");
  const before = E.view(goal).score;
  assert.strictEqual(E.answerPurpose(goal, 0).ok, false);
  assert.strictEqual(E.view(goal).score, before);
  openRun(goal);
  const early = E.answerGoal(goal, true);
  assert.strictEqual(early.affirmed, false);
  assert.strictEqual(E.view(goal).score, 100);
});

check("moving a term places the opposite and unit coefficients stay bare", () => {
  const run = E.createRun(1, "example");
  openRun(run);
  E.applyExpand(run, E.view(run).tokens.L[0].id);
  const right = E.view(run).tokens.R.find((token) => token.label === "x");
  const before = run.nextId;
  const plan = E.planMove(run, right.id);
  assert.strictEqual(plan.ok, true);
  assert.strictEqual(run.nextId, before);
  assert.strictEqual(E.view(run).equation, "2x + 6 = x + 10");
  assert.ok(plan.detail.indexOf("−x") !== -1);
  assert.ok(plan.note.indexOf("兩邊同減 x") !== -1);
  assert.strictEqual(plan.detail.indexOf("1x"), -1);
  const moved = E.applyMove(run, right.id);
  assert.strictEqual(moved.ok, true);
  assert.ok(E.view(run).equation.indexOf("− x") !== -1 || E.view(run).equation.indexOf("−x") !== -1);
  E.applyMerge(run, "L");
  assert.strictEqual(E.view(run).steps.filter((step) => step.lamp === "merge")[0].note, "把同類項合併：2x − x = x");
  assert.strictEqual(JSON.stringify(E.view(run)).indexOf("1x"), -1);
  assert.strictEqual(E.isLevel(run), true);
});

check("student-facing sources keep the motto and omit unit coefficients", () => {
  const files = [
    "form1/unknown-scale-brackets/js/engine.js",
    "form1/unknown-scale-brackets/js/app.js",
    "form1/unknown-scale-brackets/index.html",
    "form1/unknown-scale-brackets/css/style.css",
    "form1/index.html",
  ];
  const blob = files.map((file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8")).join("\n");
  assert.strictEqual(blob.indexOf("過等號就變號"), -1);
  assert.strictEqual(blob.indexOf("1x"), -1);
  assert.strictEqual(blob.indexOf(MINUS + "1x"), -1);
  assert.strictEqual(blob.indexOf("弱模式"), -1);
  assert.strictEqual(blob.indexOf("強模式"), -1);
  assert.ok(blob.indexOf(E.motto) !== -1);
  assert.ok(blob.indexOf("unknown-scale-brackets/") !== -1);
  assert.ok(blob.indexOf("引導模式") !== -1);
  assert.ok(blob.indexOf("挑戰模式") !== -1);
});

console.log(passed + " passed");
