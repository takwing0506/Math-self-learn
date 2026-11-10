/* 未知之秤 · 第二章
   同類項，以及兩邊都有 x。
   合併：同色的項拖在一起。
   移項：拖走加減項，另一盤放下相反項，等於兩邊同加或同減。
   除數：兩邊同乘或同除，只用按鈕。
   solveLinear 只供天平是否仍平衡的內部檢查，不可送進學生畫面。 */
(function (root) {
  "use strict";

  var MOTTO = "只有加減項先移項變號；乘除唔好移。";

  var LAMPS = {
    merge: { id: "merge", name: "合併", detail: "同色合成一項" },
    move: { id: "move", name: "移項", detail: "兩邊同加／同減" },
    divide: { id: "divide", name: "除數", detail: "兩邊同乘／同除" },
  };

  var PRACTICE = [
    {
      title: "同邊的未知數",
      brief: "左盤有兩個未知數，右盤是砝碼。",
      L: [["x", 3], ["x", -1]],
      R: [["n", 8]],
    },
    {
      title: "兩個正的未知數",
      brief: "左盤的未知數都是正的。",
      L: [["x", 5], ["x", 2]],
      R: [["n", 21]],
    },
    {
      title: "右盤也有 x",
      brief: "右盤不只有砝碼。",
      L: [["x", 6]],
      R: [["n", 10], ["x", 1]],
    },
    {
      title: "左右都有未知數和砝碼",
      brief: "兩盤都有未知數，也都有砝碼。",
      L: [["x", 7], ["n", -3]],
      R: [["x", 2], ["n", 12]],
    },
    {
      title: "常數留在左盤",
      brief: "左盤有未知數和砝碼，右盤是未知數。",
      L: [["x", 2], ["n", 9]],
      R: [["x", 5]],
    },
  ];

  var TRAP = [
    {
      title: "未知數和砝碼",
      brief: "左盤有未知數，也有砝碼。",
      L: [["x", 3], ["n", 5]],
      R: [["n", 20]],
    },
    {
      title: "右盤的未知數",
      brief: "左盤有未知數和砝碼，右盤是未知數。",
      L: [["x", 2], ["n", 4]],
      R: [["x", 4]],
    },
    {
      title: "左盤有三項",
      brief: "先看哪兩項是同色。",
      L: [["x", 5], ["n", -3], ["x", 1]],
      R: [["n", 15]],
    },
  ];

  var CHALLENGE = [
    {
      title: "負的係數",
      brief: "這條方程在開場出現過。若係數變成負數，用除數按鈕，兩邊同除以那個負數。",
      L: [["x", 5]],
      R: [["n", 4], ["x", 9]],
    },
    {
      title: "左盤的負未知數",
      brief: "左盤有負的未知數。",
      L: [["n", 4], ["x", -2]],
      R: [["x", 1], ["n", -8]],
    },
    {
      title: "一邊有三項",
      brief: "左盤有三項，右盤有未知數和砝碼。",
      L: [["x", 1], ["x", 4], ["n", -7]],
      R: [["x", 2], ["n", -16]],
    },
  ];

  var WARMUP = [
    {
      expr: "3x + 2",
      can: false,
      reveal: "",
      merged: "",
      terms: [["x", 3], ["n", 2]],
    },
    {
      expr: "3x − x",
      can: true,
      reveal: "",
      merged: "2x",
      terms: [["x", 3], ["x", -1]],
    },
    {
      expr: "5 + 4x",
      can: false,
      reveal: "",
      merged: "",
      terms: [["n", 5], ["x", 4]],
    },
    {
      expr: "2x + 3x",
      can: true,
      reveal: "",
      merged: "5x",
      terms: [["x", 2], ["x", 3]],
    },
  ];

  var ENTRY_STEPS = [
    {
      ask: "兩條方程有咩唔同？",
      choices: [
        "兩條都只有一邊有 x。",
        "第一條的 x 只在一邊；第二條左右兩邊都有 x。",
        "第二條已經沒有 x。",
        "兩條都已經寫成 x＝數。",
      ],
      answer: 1,
      right: "對。第二條兩邊都有 x。",
      wrongs: [
        "再數一次第二條：左右是不是都寫著 x？",
        "",
        "第二條的左右都寫著 x，不是沒有未知數。",
        "兩條都還有別的項，尚未寫成 x＝一個數。",
      ],
    },
    {
      ask: "而家兩邊都有 x，同之前只有一邊有 x，解法會有咩分別？",
      choices: [
        "沒有分別，看到係數就可以立刻兩邊同除。",
        "要把所有 x 刪掉。",
        "有分別。兩邊都有 x 時，要先用兩邊同加或同減，把 x 項集中到同一邊，再處理係數。",
        "有分別。只要移動數字，x 留在兩邊也可以完成。",
      ],
      answer: 2,
      right: "對。先把 x 集中到同一邊，再處理係數。",
      wrongs: [
        "兩邊仍有 x。就算兩邊同除，也不能令一邊只剩 x。",
        "把 x 刪掉會改變方程，不是解法。",
        "",
        "x 留在兩邊時，還沒有變成一邊只剩 x。",
      ],
    },
    {
      ask: "可唔可以直接兩邊同除？定係要先處理啲咩？",
      choices: [
        "可以直接兩邊同除以 5，因為左邊是 5x。",
        "先把兩條方程加起來。",
        "不用計算，估計一個數代入就當解完。",
        "不要先除。右邊是 4＋9x，不是單一項；要先處理兩邊的 x 項，讓 x 只留在一邊。",
      ],
      answer: 3,
      right: "對。先處理兩邊的 x 項，再考慮乘除。",
      wrongs: [
        "兩邊仍有 x。就算兩邊同除，也不能令一邊只剩 x。",
        "這兩條是用來對比，不是把它們加在一起。",
        "估計一個數不能代替解方程。",
        "",
      ],
    },
  ];

  var CONSOLIDATE = {
    ask: "我有冇先合併同類項？移項有冇變成相反項？",
    parts: [
      {
        id: "merge",
        ask: "我有冇先合併同類項？",
        yes: "有，我有先合併同色的同類項。",
        no: "這次沒有先合併。",
        yesNote: "這個習慣是對的。同色先合成一項，再移項或乘除。",
        noNote: "下次先把同色的項合成一項，例如 3x − x 合成 2x，再做下一步。",
      },
      {
        id: "sign",
        ask: "移項有冇變成相反項？",
        yes: "有，另一邊留下的是相反項。",
        no: "我直接搬過去，沒有變成相反項。",
        yesNote: "相反項是兩邊同加或同減之後留下的結果。",
        noNote: "加減項離開原盤時，另一盤要放下相反項。這一步等於兩邊同加或同減。",
      },
    ],
  };

  function normalizeMode(mode) {
    if (mode === "challenge" || mode === "trap") return mode;
    return "practice";
  }

  function missionList(mode) {
    var name = normalizeMode(mode);
    if (name === "challenge") return CHALLENGE;
    if (name === "trap") return TRAP;
    return PRACTICE;
  }

  function setLabel(mode) {
    if (mode === "challenge") return "挑戰模式";
    if (mode === "trap") return "陷阱";
    return "引導模式";
  }

  function fmtInt(n) {
    return n < 0 ? "−" + Math.abs(n) : String(n);
  }

  function copyTerm(t) {
    return { id: t.id, type: t.type, coeff: t.coeff };
  }

  function cloneSides(sides) {
    return { L: sides.L.map(copyTerm), R: sides.R.map(copyTerm) };
  }

  function mint(run, type, coeff) {
    return { id: "t" + run.nextId++, type: type, coeff: coeff };
  }

  function idsOf(sides) {
    var out = [];
    var i;
    for (i = 0; i < sides.L.length; i += 1) out.push(sides.L[i].id);
    for (i = 0; i < sides.R.length; i += 1) out.push(sides.R[i].id);
    return out;
  }

  function formatTerm(t, index) {
    var c = t.coeff;
    var body;
    if (t.type === "x") {
      if (c === 1) body = "x";
      else if (c === -1) body = "−x";
      else body = fmtInt(c) + "x";
      if (index === 0) return body;
      if (c < 0) return " − " + (c === -1 ? "x" : Math.abs(c) + "x");
      return " + " + (c === 1 ? "x" : c + "x");
    }
    if (index === 0) return fmtInt(c);
    return c < 0 ? " − " + Math.abs(c) : " + " + c;
  }

  function formatSide(terms) {
    if (!terms.length) return "0";
    var out = "";
    var i;
    for (i = 0; i < terms.length; i += 1) out += formatTerm(terms[i], i);
    return out;
  }

  function formatEq(sides) {
    return formatSide(sides.L) + " = " + formatSide(sides.R);
  }

  function formatValue(type, coeff) {
    if (coeff === 0) return "0";
    return formatTerm({ type: type, coeff: coeff }, 0);
  }

  function formatPair(first, second) {
    return formatTerm(first, 0) + formatTerm(second, 1);
  }

  function tokenLabel(t) {
    if (t.type === "x") {
      if (t.coeff === 1) return "x";
      if (t.coeff === -1) return "−x";
      return fmtInt(t.coeff) + "x";
    }
    return fmtInt(t.coeff);
  }

  function magLabel(t) {
    var n;
    if (t.type === "x") {
      n = Math.abs(t.coeff);
      return n === 1 ? "x" : n + "x";
    }
    return String(Math.abs(t.coeff));
  }

  function signedLabel(t) {
    return (t.coeff < 0 ? "−" : "+") + magLabel(t);
  }

  function bothSidesNote(t) {
    var mag = magLabel(t);
    return t.coeff > 0 ? "兩邊同減 " + mag : "兩邊同加 " + mag;
  }

  function xTerms(list) {
    var out = [];
    var i;
    for (i = 0; i < list.length; i += 1) if (list[i].type === "x") out.push(list[i]);
    return out;
  }

  function nTerms(list) {
    var out = [];
    var i;
    for (i = 0; i < list.length; i += 1) if (list[i].type === "n") out.push(list[i]);
    return out;
  }

  function xSum(list) {
    var sum = 0;
    var i;
    var xs = xTerms(list);
    for (i = 0; i < xs.length; i += 1) sum += xs[i].coeff;
    return sum;
  }

  function hasPair(list) {
    return xTerms(list).length >= 2 || nTerms(list).length >= 2;
  }

  function firstPair(list) {
    var i;
    var j;
    for (i = 0; i < list.length; i += 1) {
      for (j = i + 1; j < list.length; j += 1) {
        if (list[i].type === list[j].type) return [list[i], list[j]];
      }
    }
    return null;
  }

  function findTerm(sides, id) {
    var names = ["L", "R"];
    var n;
    var i;
    for (n = 0; n < names.length; n += 1) {
      for (i = 0; i < sides[names[n]].length; i += 1) {
        if (sides[names[n]][i].id === id) {
          return { side: names[n], index: i, term: sides[names[n]][i] };
        }
      }
    }
    return null;
  }

  function weight(terms, x) {
    var sum = 0;
    var i;
    for (i = 0; i < terms.length; i += 1) {
      sum += terms[i].type === "x" ? terms[i].coeff * x : terms[i].coeff;
    }
    return sum;
  }

  function solveLinear(sides) {
    var a = 0;
    var b = 0;
    var c = 0;
    var d = 0;
    var i;
    var A;
    var B;
    for (i = 0; i < sides.L.length; i += 1) {
      if (sides.L[i].type === "x") a += sides.L[i].coeff;
      else b += sides.L[i].coeff;
    }
    for (i = 0; i < sides.R.length; i += 1) {
      if (sides.R[i].type === "x") c += sides.R[i].coeff;
      else d += sides.R[i].coeff;
    }
    A = a - c;
    B = d - b;
    if (A === 0 || B % A !== 0) return null;
    return B / A;
  }

  function isUnitX(side) {
    return side.length === 1 && side[0].type === "x" && side[0].coeff === 1;
  }

  function isNumberSide(side) {
    return side.length === 1 && side[0].type === "n";
  }

  function isSolvedForm(sides) {
    return (isUnitX(sides.L) && isNumberSide(sides.R)) || (isNumberSide(sides.L) && isUnitX(sides.R));
  }

  function constantBesideX(sides) {
    var leftX = xTerms(sides.L).length > 0;
    var rightX = xTerms(sides.R).length > 0;
    var side;
    if (leftX === rightX) return false;
    side = leftX ? sides.L : sides.R;
    return nTerms(side).length > 0;
  }

  function loneCoeff(sides) {
    var xs = xTerms(sides.L).concat(xTerms(sides.R));
    var xSide;
    var other;
    if (xs.length !== 1) return null;
    xSide = xTerms(sides.L).length ? sides.L : sides.R;
    other = xSide === sides.L ? sides.R : sides.L;
    if (xSide.length !== 1) return null;
    if (other.length !== 1 || other[0].type !== "n") return null;
    return xs[0].coeff;
  }

  function formAdvice(sides) {
    var eq;
    if (isSolvedForm(sides)) return { ok: true, message: "" };
    eq = formatEq(sides);
    if (hasPair(sides.L) || hasPair(sides.R)) {
      return { ok: false, message: "還沒有達到目標。現在是 " + eq + "。一邊要只剩未知數 x，另一邊只剩一個數。" };
    }
    if (xTerms(sides.L).length && xTerms(sides.R).length) {
      return { ok: false, message: "還沒有達到目標。現在是 " + eq + "。未知數還在兩邊，尚未變成一邊只剩 x。" };
    }
    if (constantBesideX(sides)) {
      return { ok: false, message: "還沒有達到目標。現在是 " + eq + "。有未知數的那邊仍有砝碼。" };
    }
    if (loneCoeff(sides) !== null && loneCoeff(sides) !== 1) {
      return {
        ok: false,
        message: "還沒有達到目標。現在是 " + eq + "。未知數的係數還不是 1。像 2x＝10、10＝2x、−x＝4 都不可以完成。乘除請用按鈕，自己決定。",
      };
    }
    return { ok: false, message: "還沒有達到目標。一邊要只剩未知數 x，另一邊只剩一個數。" };
  }

  var PURPOSE = {
    ask: "我們想把方程變成甚麼樣子？",
    choices: [
      "兩邊的數字一樣大就好。",
      "先把未知數乘開。",
      "一邊只剩未知數（x），另一邊只剩一個數。",
      "把所有項都刪掉。",
    ],
    answer: 2,
    right: "對。目標是一邊只剩 x，另一邊只剩一個數。寫成 x＝一個數，或一個數＝x，都算達到。",
    wrongs: [
      "兩邊數字一樣大，未知數仍可能留在兩邊，方程還未解完。",
      "先把未知數乘開，並不能令它單獨留在一邊。",
      "",
      "把項刪掉會改變方程，天平兩邊不再相等。",
    ],
  };
  var GOAL_ASK = "有達到目標嗎？";

  function termValue(t, x) {
    return t.type === "x" ? t.coeff * x : t.coeff;
  }

  function unlikeLines(a, b) {
    var v1 = termValue(a, 1) + termValue(b, 1);
    var v2 = termValue(a, 2) + termValue(b, 2);
    return [
      "代入 x = 1，這兩項合起來是 " + fmtInt(v1) + "。",
      "代入 x = 2，合起來是 " + fmtInt(v2) + "。",
      "兩次結果不同，所以不是同類項。",
    ];
  }

  function hint(run) {
    var pair = firstPair(run.sides.L);
    var lx;
    var rx;
    var moveRight;
    var moveLeft;
    var best;
    var side;
    var other;
    var consts;
    var k;
    if (pair) return { type: "merge", side: "L", ids: [pair[0].id, pair[1].id] };
    pair = firstPair(run.sides.R);
    if (pair) return { type: "merge", side: "R", ids: [pair[0].id, pair[1].id] };
    lx = xTerms(run.sides.L);
    rx = xTerms(run.sides.R);
    if (lx.length && rx.length) {
      moveRight = { id: rx[0].id, to: "L", dest: xSum(run.sides.L) - rx[0].coeff, kind: rx[0].type };
      moveLeft = { id: lx[0].id, to: "R", dest: xSum(run.sides.R) - lx[0].coeff, kind: lx[0].type };
      best = moveRight.dest >= moveLeft.dest ? moveRight : moveLeft;
      return { type: "move", id: best.id, to: best.to, kind: best.kind };
    }
    if (constantBesideX(run.sides)) {
      side = xTerms(run.sides.L).length ? "L" : "R";
      other = side === "L" ? "R" : "L";
      consts = nTerms(run.sides[side]);
      return { type: "move", id: consts[0].id, to: other, kind: "n" };
    }
    if (isSolvedForm(run.sides)) return { type: "finish" };
    k = loneCoeff(run.sides);
    if (k !== null && k !== 1) return { type: "div", value: k };
    return null;
  }

  function lookQuestion(run) {
    var step;
    if (run.mode !== "practice" || !run.goalSet) return "";
    step = hint(run);
    if (!step || step.type === "finish") return "現在是不是一邊只剩未知數，另一邊只剩一個數？";
    if (step.type === "merge") return "這一盤有沒有兩個同色的項？";
    if (step.type === "move" && step.kind === "x") return "是不是兩邊都還有未知數？";
    if (step.type === "move") return "有未知數的那邊，是否還有砝碼？";
    if (step.type === "div" || step.type === "mul") return "未知數的係數是不是 1？";
    return "";
  }

  function scaleActions(run) {
    var k;
    var actions;
    if (hasPair(run.sides.L) || hasPair(run.sides.R)) return [];
    if (xTerms(run.sides.L).length && xTerms(run.sides.R).length) return [];
    if (constantBesideX(run.sides)) return [];
    k = loneCoeff(run.sides);
    if (k === null || k === 1) return [];
    if (!divisible(run.sides, k)) return [];
    actions = [{ type: "div", value: k, group: "scale", label: "兩邊同除以 " + fmtInt(k) }];
    if (k < 0) actions.push({ type: "mul", value: -1, group: "scale", label: "兩邊同乘 −1" });
    return actions;
  }

  function divisible(sides, d) {
    var all;
    var i;
    if (!d) return false;
    all = sides.L.concat(sides.R);
    for (i = 0; i < all.length; i += 1) if (all[i].coeff % d !== 0) return false;
    return true;
  }

  function snapshot(run) {
    return {
      sides: cloneSides(run.sides),
      steps: run.steps.map(function (step) {
        return { equation: step.equation, lamp: step.lamp, note: step.note };
      }),
      alarm: run.alarm,
    };
  }

  function pushHistory(run) {
    run.history.push(snapshot(run));
    if (run.history.length > 40) run.history.shift();
  }

  function commit(run, nextSides, lamp, note, banner, extra) {
    var prev = {};
    var fresh = [];
    var oldIds;
    var now;
    var i;
    var eq;
    var message;
    oldIds = idsOf(run.sides);
    for (i = 0; i < oldIds.length; i += 1) prev[oldIds[i]] = true;
    run.alarm = "";
    pushHistory(run);
    run.sides = nextSides;
    eq = formatEq(run.sides);
    run.steps.push({ equation: eq, lamp: lamp, note: note });
    now = idsOf(run.sides);
    for (i = 0; i < now.length; i += 1) if (!prev[now[i]]) fresh.push(now[i]);
    run.freshIds = fresh;
    run.freshLamp = lamp;
    run.goalAffirmed = false;
    message = note + "。" + (extra || "") + "現在是 " + eq + "。";
    return {
      ok: true,
      applied: true,
      equation: eq,
      banner: banner,
      message: message,
      lamp: lamp,
      checkLines: [],
      shakeIds: [],
      askGoal: !!(run.goalSet && (note.indexOf("合併") !== -1 || isSolvedForm(run.sides))),
      reached: isSolvedForm(run.sides),
    };
  }

  function bad(message) {
    return { ok: false, applied: false, banner: "", message: message, checkLines: [], shakeIds: [] };
  }

  function planMove(run, termId) {
    var found = findTerm(run.sides, termId);
    var term;
    var from;
    var to;
    var next;
    var placed;
    var note;
    var fromName;
    var toName;
    if (!found) return { ok: false, message: "找不到這一項。" };
    term = found.term;
    from = found.side;
    to = from === "L" ? "R" : "L";
    next = cloneSides(run.sides);
    next[from] = next[from].filter(function (item) { return item.id !== termId; });
    placed = { id: "pv", type: term.type, coeff: -term.coeff };
    next[to] = next[to].concat([placed]);
    note = bothSidesNote(term);
    fromName = from === "L" ? "左盤" : "右盤";
    toName = to === "L" ? "左盤" : "右盤";
    return {
      ok: true,
      from: from,
      to: to,
      termId: termId,
      term: { type: term.type, coeff: term.coeff },
      removeLabel: signedLabel(term),
      placeLabel: signedLabel(placed),
      note: note,
      banner: note,
      equation: formatEq(next),
      sides: next,
      narration: fromName + "拿走 " + signedLabel(term) + "，" + toName + "放下 " + signedLabel(placed) + "。",
    };
  }

  function classifyDrop(run, sourceId, target) {
    var src = findTerm(run.sides, sourceId);
    var dst;
    if (!src || !target) return { kind: "cancel" };
    if (target.kind === "term") {
      if (target.id === sourceId) return { kind: "cancel" };
      dst = findTerm(run.sides, target.id);
      if (!dst) return { kind: "cancel" };
      if (dst.side !== src.side) return { kind: "move", to: dst.side };
      if (dst.term.type !== src.term.type) return { kind: "refuse" };
      return { kind: "merge" };
    }
    if (target.kind === "pan") {
      if (target.side !== "L" && target.side !== "R") return { kind: "cancel" };
      if (target.side === src.side) return { kind: "cancel" };
      return { kind: "move", to: target.side };
    }
    return { kind: "cancel" };
  }

  function refuseUnlike(run, a, b) {
    run.alarm = "merge";
    run.freshLamp = "";
    return {
      ok: false,
      applied: false,
      alarm: true,
      banner: "",
      message: "未知數同砝碼唔係同類項，唔可以合併。",
      checkLines: unlikeLines(a, b),
      shakeIds: [a.id, b.id],
    };
  }

  function mergeTerms(run, idA, idB) {
    var a = findTerm(run.sides, idA);
    var b = findTerm(run.sides, idB);
    var sideName;
    var list;
    var i;
    var j;
    var first;
    var second;
    var sum;
    var note;
    var next;
    if (!a || !b) return bad("找不到這兩項。");
    if (a.side !== b.side) return bad("請在同一邊合併。跨過另一盤是移項，等於兩邊同加或同減。");
    if (a.term.type !== b.term.type) return refuseUnlike(run, a.term, b.term);
    sideName = a.side;
    list = run.sides[sideName].map(copyTerm);
    i = Math.min(a.index, b.index);
    j = Math.max(a.index, b.index);
    first = list[i];
    second = list[j];
    sum = first.coeff + second.coeff;
    var brief = formatPair(first, second) + " = " + formatValue(first.type, sum);
    note = "把同類項合併：" + brief;
    list.splice(j, 1);
    list.splice(i, 1);
    if (sum !== 0) list.splice(i, 0, mint(run, first.type, sum));
    next = cloneSides(run.sides);
    next[sideName] = list;
    return commit(run, next, "merge", note, brief, "");
  }

  function moveAcross(run, termId) {
    var plan = planMove(run, termId);
    var next;
    var placed;
    if (!plan.ok) return bad(plan.message);
    next = cloneSides(run.sides);
    next[plan.from] = next[plan.from].filter(function (item) { return item.id !== termId; });
    placed = mint(run, plan.term.type, -plan.term.coeff);
    next[plan.to] = next[plan.to].concat([placed]);
    return commit(run, next, "move", plan.note, plan.banner, plan.narration);
  }

  function needGoal(run) {
    if (!run.goalSet) return bad("請先回答：我們想把方程變成甚麼樣子？");
    return null;
  }

  function applyDrop(run, sourceId, target) {
    var blocked = needGoal(run);
    var kind;
    if (blocked) return blocked;
    kind = classifyDrop(run, sourceId, target);
    if (kind.kind === "merge") return mergeTerms(run, sourceId, target.id);
    if (kind.kind === "move") return moveAcross(run, sourceId);
    if (kind.kind === "refuse") {
      var src = findTerm(run.sides, sourceId);
      var dst = findTerm(run.sides, target.id);
      return refuseUnlike(run, src.term, dst.term);
    }
    return bad("放回原處。同色的項拖在一起可合併；拖到另一盤是兩邊同加或同減。");
  }

  function applyScale(run, action) {
    var blocked = needGoal(run);
    var allowed;
    var match;
    var i;
    var factor;
    var next;
    var note;
    if (blocked) return blocked;
    if (!action || (action.type !== "mul" && action.type !== "div")) return bad("請按乘除按鈕。");
    allowed = scaleActions(run);
    match = null;
    for (i = 0; i < allowed.length; i += 1) {
      if (allowed[i].type === action.type && allowed[i].value === action.value) match = allowed[i];
    }
    if (!match) return bad("現在還不能做這個乘除。目標仍是一邊只剩未知數，另一邊只剩一個數。乘除不要用拖曳。");
    factor = action.value;
    next = { L: [], R: [] };
    ["L", "R"].forEach(function (name) {
      var j;
      for (j = 0; j < run.sides[name].length; j += 1) {
        var t = run.sides[name][j];
        var coeff = action.type === "mul" ? t.coeff * factor : t.coeff / factor;
        if (coeff !== 0) next[name].push(mint(run, t.type, coeff));
      }
    });
    note = action.type === "div" ? "兩邊同除以 " + fmtInt(factor) : "兩邊同乘 " + fmtInt(factor);
    return commit(run, next, "divide", note, note, "");
  }

  function undo(run) {
    var prev;
    if (!run.history.length) return bad("沒有可以返回的步驟。");
    prev = run.history.pop();
    run.sides = prev.sides;
    run.steps = prev.steps.map(function (step) {
      return { equation: step.equation, lamp: step.lamp, note: step.note };
    });
    run.alarm = "";
    run.freshIds = [];
    run.freshLamp = "";
    run.solved = false;
    if (!isSolvedForm(run.sides)) run.goalAffirmed = false;
    return { ok: true, applied: true, banner: "", message: "已返回上一步。", checkLines: [], shakeIds: [], askGoal: false };
  }

  function answerPurpose(run, choice) {
    var index = Number(choice);
    if (index !== PURPOSE.answer) {
      return { ok: false, message: PURPOSE.wrongs[index] || "還不是。請再看這一項在說甚麼。" };
    }
    run.goalSet = true;
    return { ok: true, message: PURPOSE.right };
  }

  function answerGoal(run, saidYes) {
    var yes = !!saidYes;
    var reached = isSolvedForm(run.sides);
    if (!run.goalSet) return { ok: false, message: "請先回答：我們想把方程變成甚麼樣子？" };
    if (!reached && yes) {
      return { ok: true, reached: false, affirmed: false, message: "還沒有。一邊仍然不是只剩未知數，或另一邊不是只剩一個數。請再看方程，自己選下一步。" };
    }
    if (!reached && !yes) {
      return { ok: true, reached: false, affirmed: false, message: "好。目標尚未達到，請繼續自己選下一步。" };
    }
    if (yes) {
      run.goalAffirmed = true;
      return { ok: true, reached: true, affirmed: true, message: "對。一邊只剩 x，另一邊只剩一個數。可以按完成，再代入原式。" };
    }
    return { ok: true, reached: true, affirmed: false, message: "請再觀察現在的方程。若一邊只剩未知數、另一邊只剩一個數，就是達到目標。再確認一次。" };
  }

  function finishGate(run) {
    var advice;
    if (!run.goalSet) return { ok: false, message: "請先回答：我們想把方程變成甚麼樣子？" };
    advice = formAdvice(run.sides);
    if (!advice.ok) return advice;
    if (!run.goalAffirmed) return { ok: false, message: "請先回答：有達到目標嗎？" };
    return { ok: true, message: "" };
  }

  function lampsUsed(run) {
    var seen = [];
    var i;
    for (i = 0; i < run.steps.length; i += 1) {
      var lamp = run.steps[i].lamp;
      if (lamp && seen.indexOf(lamp) === -1) seen.push(lamp);
    }
    return seen;
  }

  function latestNote(run, id) {
    var i;
    var note = "";
    for (i = 0; i < run.steps.length; i += 1) if (run.steps[i].lamp === id) note = run.steps[i].note;
    return note;
  }

  function lampState(run, id) {
    var i;
    if (run.alarm === id) return "bad";
    for (i = 0; i < run.steps.length; i += 1) if (run.steps[i].lamp === id) return "done";
    return "idle";
  }

  function parseStudent(raw) {
    var text = String(raw == null ? "" : raw).trim();
    var n;
    text = text.replace(/−/g, "-").replace(/–/g, "-").replace(/＋/g, "+").replace(/\s+/g, "");
    if (!/^[+-]?\d+$/.test(text)) return null;
    n = Number(text);
    if (!Number.isSafeInteger(n)) return null;
    return n;
  }

  function substTerm(t, x, index) {
    var core;
    var rest;
    if (t.type === "n") {
      if (index === 0) return fmtInt(t.coeff);
      return t.coeff < 0 ? " − " + Math.abs(t.coeff) : " + " + t.coeff;
    }
    if (t.coeff === 1) core = x < 0 ? "(" + fmtInt(x) + ")" : String(x);
    else if (t.coeff === -1) core = "−(" + fmtInt(x) + ")";
    else core = fmtInt(t.coeff) + "×(" + fmtInt(x) + ")";
    if (index === 0) return core;
    if (t.coeff < 0) {
      rest = t.coeff === -1 ? "(" + fmtInt(x) + ")" : Math.abs(t.coeff) + "×(" + fmtInt(x) + ")";
      return " − " + rest;
    }
    return " + " + core;
  }

  function substSide(terms, x) {
    var expr;
    var i;
    if (terms.length === 1 && terms[0].type === "n") return fmtInt(terms[0].coeff);
    expr = "";
    for (i = 0; i < terms.length; i += 1) expr += substTerm(terms[i], x, i);
    return expr + " = " + fmtInt(weight(terms, x));
  }

  function penalize(run, label) {
    run.misses.push(label);
    if (run.score <= 0) {
      run.score = 0;
      return "得分維持 0。";
    }
    run.score = Math.max(0, run.score - 10);
    return "扣 10 分，現為 " + run.score + " 分。";
  }

  function submitCheck(run, raw) {
    var gate;
    var x;
    var leftText;
    var rightText;
    var balanced;
    var extra;
    var pen;
    if (run.solved) return { ok: false, applied: false, message: "這一題已經代入完成。" };
    gate = finishGate(run);
    if (!gate.ok) return { ok: false, applied: false, message: gate.message };
    x = parseStudent(raw);
    if (x === null) return { ok: false, applied: false, message: "請輸入整數。負數請寫負號。" };
    if (Math.abs(x) > 9999) return { ok: false, applied: false, message: "這個數太大了。" };
    run.checkTries += 1;
    leftText = substSide(run.original.L, x);
    rightText = substSide(run.original.R, x);
    balanced = weight(run.original.L, x) === weight(run.original.R, x);
    if (balanced) {
      if (run.checkTries === 1) {
        run.bonus = 10;
        run.score += 10;
        extra = "複秤一次成功，獎金 10 分。";
      } else extra = "這次左右相等。";
      run.solved = true;
      run.entry = x;
      return {
        ok: true,
        applied: true,
        leftText: leftText,
        rightText: rightText,
        message: "左右相等，天平平衡。" + extra,
        score: run.score,
        bonus: run.bonus,
      };
    }
    pen = penalize(run, "代入不相等");
    return {
      ok: false,
      applied: true,
      leftText: leftText,
      rightText: rightText,
      message: "左右不相等。" + pen,
      score: run.score,
      bonus: run.bonus,
    };
  }

  function readSolution(run) {
    if (!isSolvedForm(run.sides)) return null;
    if (run.sides.L[0].type === "x") return run.sides.R[0].coeff;
    return run.sides.L[0].coeff;
  }

  function isLevel(run) {
    var x = solveLinear(run.original);
    if (x === null) return false;
    return weight(run.sides.L, x) === weight(run.sides.R, x);
  }

  function resultOf(run) {
    var counts = {};
    if (!run.solved) return null;
    run.misses.forEach(function (label) {
      counts[label] = (counts[label] || 0) + 1;
    });
    return {
      entry: run.entry,
      score: run.score,
      bonus: run.bonus,
      deductions: Object.keys(counts).map(function (label) {
        return { label: label, times: counts[label], points: counts[label] * 10 };
      }),
    };
  }

  function lampHelp(id) {
    if (id === "merge") return "同色的項可以合成一項。例如：把同類項合併：3x − x = 2x。同一題可以合併多次。未知數和砝碼顏色不同，不能合併。";
    if (id === "move") return "移項是兩邊同加或同減，包括未知數。拖走一項之後，另一盤放下相反項。例如：兩邊同減 4x。";
    if (id === "divide") return "除數是兩邊同乘或同除，請按按鈕，不要拖。係數是負數時，除數也用負數，例如兩邊同除以這個負係數。";
    return "";
  }

  function clearFlash(run) {
    run.freshIds = [];
    run.freshLamp = "";
  }

  function view(run, opts) {
    var options = opts || {};
    var preview = options.preview && options.preview.ok ? options.preview : null;
    var sides = preview ? preview.sides : run.sides;
    var fresh = {};
    var i;
    var info;
    var actions;
    for (i = 0; i < run.freshIds.length; i += 1) fresh[run.freshIds[i]] = true;
    function tokens(side) {
      return sides[side].map(function (t) {
        return {
          id: t.id,
          type: t.type,
          side: side,
          label: tokenLabel(t),
          neg: t.coeff < 0,
          fresh: !!fresh[t.id] || t.id === "pv",
          leaving: options.leavingId === t.id,
        };
      });
    }
    info = missionInfo(run.index, run.mode);
    actions = scaleActions(run).map(function (action) {
      return {
        type: action.type,
        value: action.value,
        group: action.group,
        label: action.label,
      };
    });
    return {
      number: info.number,
      total: info.total,
      title: info.title,
      brief: info.brief,
      mode: run.mode,
      setLabel: setLabel(run.mode),
      score: run.score,
      motto: MOTTO,
      equation: formatEq(sides),
      officialEquation: formatEq(run.sides),
      originalEquation: formatEq(run.original),
      previewing: !!preview,
      steps: run.steps.map(function (step) {
        return { equation: step.equation, lamp: step.lamp, note: step.note };
      }),
      lampsUsed: lampsUsed(run),
      ready: isSolvedForm(run.sides),
      goalSet: !!run.goalSet,
      goalAffirmed: !!run.goalAffirmed,
      look: preview ? "" : lookQuestion(run),
      tokens: { L: tokens("L"), R: tokens("R") },
      lamps: [LAMPS.merge, LAMPS.move, LAMPS.divide].map(function (lamp) {
        var state = lampState(run, lamp.id);
        var note = latestNote(run, lamp.id);
        return {
          id: lamp.id,
          name: lamp.name,
          detail: lamp.detail,
          title: note || lamp.detail,
          state: state,
        };
      }),
      actions: actions,
      canUndo: run.history.length > 0,
      checkTries: run.checkTries,
      bonus: run.bonus,
      solved: !!run.solved,
      alarm: run.alarm,
    };
  }

  function missionInfo(index, mode) {
    var list = missionList(mode);
    var mission = list[index];
    if (!mission) throw new Error("沒有這一題");
    return {
      index: index,
      number: index + 1,
      total: list.length,
      title: mission.title,
      brief: mission.brief,
      mode: normalizeMode(mode),
    };
  }

  function createRun(index, mode) {
    var list = missionList(mode);
    var mission = list[index];
    var nextId = 1;
    var sides;
    if (!mission) throw new Error("沒有這一題");
    function take(pair) {
      return { id: "t" + nextId++, type: pair[0], coeff: pair[1] };
    }
    sides = { L: mission.L.map(take), R: mission.R.map(take) };
    return {
      index: index,
      mode: normalizeMode(mode),
      mission: mission,
      sides: sides,
      original: cloneSides(sides),
      nextId: nextId,
      score: 100,
      misses: [],
      history: [],
      steps: [{ equation: formatEq(sides), lamp: null, note: "原式" }],
      freshIds: [],
      freshLamp: "",
      alarm: "",
      goalSet: false,
      goalAffirmed: false,
      checkTries: 0,
      bonus: 0,
      solved: false,
      entry: null,
    };
  }

  function pairsToSides(L, R) {
    var n = 1;
    function take(pair) {
      return { id: "c" + n++, type: pair[0], coeff: pair[1] };
    }
    return { L: L.map(take), R: R.map(take) };
  }

  function boardFrom(L, R) {
    var sides = pairsToSides(L, R);
    function paint(list) {
      return list.map(function (t) {
        return { type: t.type, label: tokenLabel(t), neg: t.coeff < 0 };
      });
    }
    return { eq: formatEq(sides), L: paint(sides.L), R: paint(sides.R) };
  }

  function publicEntry() {
    return {
      captions: ["之前會解的式子", "這一章要解的式子"],
      contrast: [
        boardFrom([["x", 1], ["n", -9]], [["n", 4]]).eq,
        boardFrom([["x", 5]], [["n", 4], ["x", 9]]).eq,
      ],
      boards: [
        boardFrom([["x", 1], ["n", -9]], [["n", 4]]),
        boardFrom([["x", 5]], [["n", 4], ["x", 9]]),
      ],
      steps: ENTRY_STEPS.map(function (step) {
        return { ask: step.ask, choices: step.choices.slice() };
      }),
    };
  }

  function gradeEntry(stepIndex, choice) {
    var step = ENTRY_STEPS[stepIndex];
    var index = Number(choice);
    if (!step) return { ok: false, message: "沒有這一問。" };
    if (index !== step.answer) {
      return { ok: false, message: (step.wrongs && step.wrongs[index]) || "還不是。請再看這個選項在說甚麼。" };
    }
    return { ok: true, message: step.right, done: stepIndex === ENTRY_STEPS.length - 1 };
  }

  function warmupTerm(pair) {
    var t = { type: pair[0], coeff: pair[1] };
    return {
      type: t.type,
      label: tokenLabel(t),
      neg: t.coeff < 0,
    };
  }

  function createWarmup() {
    return { index: 0, score: 100, misses: [], over: false, locked: false, lockMessage: "" };
  }

  function warmupView(session) {
    var item = WARMUP[session.index];
    if (!item || session.over) {
      return { done: true, score: session.score, total: WARMUP.length, number: WARMUP.length };
    }
    return {
      done: false,
      number: session.index + 1,
      total: WARMUP.length,
      score: session.score,
      expr: item.expr,
      reveal: item.reveal,
      terms: item.terms.map(warmupTerm),
    };
  }

function answerWarmup(session, saidCan) {
  var item;
  var said;
  var pen;
  var message;
  var lines;
  if (session.over) return { ok: false, message: "熱身已完成。", checkLines: [], score: session.score };
  if (session.locked) {
    return { ok: true, hold: true, message: session.lockMessage, checkLines: [], score: session.score, done: session.index >= WARMUP.length - 1 };
  }
  item = WARMUP[session.index];
  said = !!saidCan;
  if (said !== item.can) {
    pen = penalize(session, "熱身辨認");
    if (item.can) {
      message = "這兩項都是未知數，可以合併。";
      message += "合併得 " + item.merged + "。";
      return { ok: false, message: message + pen, checkLines: [], alarm: false, score: session.score };
    }
    lines = unlikeLines(
      { type: item.terms[0][0], coeff: item.terms[0][1] },
      { type: item.terms[1][0], coeff: item.terms[1][1] }
    );
    return {
      ok: false,
      alarm: true,
      message: "未知數同砝碼唔係同類項，唔可以合併。" + pen,
      checkLines: lines,
      score: session.score,
    };
  }
  message = item.can
    ? "可以合併，得到 " + item.merged + "。"
    : "不可以合併。未知數和砝碼不是同類項。";
  session.locked = true;
  session.lockMessage = message;
  return {
    ok: true,
    hold: true,
    message: message,
    done: session.index >= WARMUP.length - 1,
    checkLines: [],
    score: session.score,
  };
}

function advanceWarmup(session) {
  if (!session.locked || session.over) return { done: !!session.over };
  session.locked = false;
  session.lockMessage = "";
  session.index += 1;
  if (session.index >= WARMUP.length) session.over = true;
  return { done: session.over };
}

  function buildInquiry(plan) {
    var bare = String(Math.abs(plan.term.coeff));
    var decoy = "÷ " + magLabel(plan.term);
    return {
      see: {
        ask: plan.removeLabel + " 過咗去之後變成咩？",
        choices: [plan.removeLabel, plan.placeLabel, bare, decoy],
        answer: 1,
        right: "對，放下的是相反項。",
        wrongs: [
          "這仍是原來的項。請看另一盤新放下的符號。",
          "",
          "這只是一個數，不是這一項過到另一盤之後的樣子。",
          "這一步不是乘除。請先看另一盤新放下的是甚麼。",
        ],
      },
      think: {
        ask: "呢一步其實等價於對兩邊做咗咩？",
        choices: [
          "只把 " + plan.removeLabel + " 原封不動放到另一邊",
          plan.note,
          "兩邊同除以 " + magLabel(plan.term),
          "把這一項刪掉，不用在另一邊放下任何東西",
        ],
        answer: 1,
        right: "對，這一步就是" + plan.note + "。",
        wrongs: [
          "直接搬過去之後，天平還平衡嗎？試試兩邊同時減去這一項。",
          "",
          "兩邊仍有 x。就算兩邊同除，也不能令一邊只剩 x。",
          "只刪掉一邊的項，另一邊沒有同時改變，天平不再平衡。",
        ],
      },
      wonder: {
        ask: "點解唔可以直接「搬過去」而唔變號？",
        choices: [
          "可以。搬過去只是換位置。",
          "不可以。不變號等於一邊拿走、另一邊加上，天平不再平衡。相反項是兩邊同加或同減之後留下的結果。",
          "因為未知數一定是負數。",
          "因為這一題只能用乘除。",
        ],
        answer: 1,
        right: "對。相反項記錄的是兩邊同加或同減，不是單獨把一項搬過去。",
        wrongs: [
          "直接搬過去之後，天平還平衡嗎？試試兩邊同時減去這一項。",
          "",
          "未知數不一定是負數。先看這一項離開原盤之後，另一盤放下甚麼。",
          "這一問還未到乘除。先弄清楚兩邊有沒有同時加減。",
        ],
      },
    };
  }

  function moveInquiry(plan) {
    var full = buildInquiry(plan);
    function pub(part) {
      return { ask: part.ask, choices: part.choices.slice() };
    }
    return { see: pub(full.see), think: pub(full.think), wonder: pub(full.wonder) };
  }

  function gradeInquiry(plan, step, choice) {
    var full = buildInquiry(plan);
    var part = full[step];
    var index = Number(choice);
    if (!part) return { ok: false, message: "沒有這一問。" };
    if (index !== part.answer) {
      return { ok: false, message: (part.wrongs && part.wrongs[index]) || "還不是。請再看這個選項。" };
    }
    return { ok: true, message: part.right, done: step === "wonder" };
  }

  function needsMoveInquiry(plan, passed) {
    return !!(plan && plan.ok && plan.term && plan.term.type === "x" && !passed);
  }

  var api = {
    motto: MOTTO,
    lamps: LAMPS,
    consolidate: CONSOLIDATE,
    practiceCount: PRACTICE.length,
    trapCount: TRAP.length,
    challengeCount: CHALLENGE.length,
    warmupCount: WARMUP.length,
    get entry() { return publicEntry(); },
    missionInfo: missionInfo,
    createRun: createRun,
    view: view,
    hint: hint,
    purpose: function () {
      return { ask: PURPOSE.ask, choices: PURPOSE.choices.slice() };
    },
    goalAsk: GOAL_ASK,
    answerPurpose: answerPurpose,
    answerGoal: answerGoal,
    planMove: planMove,
    needsMoveInquiry: needsMoveInquiry,
    moveInquiry: moveInquiry,
    gradeInquiry: gradeInquiry,
    classifyDrop: classifyDrop,
    applyDrop: applyDrop,
    applyScale: applyScale,
    undo: undo,
    finishGate: finishGate,
    formAdvice: formAdvice,
    submitCheck: submitCheck,
    readSolution: readSolution,
    resultOf: resultOf,
    lampHelp: lampHelp,
    isLevel: isLevel,
    parseStudent: parseStudent,
    clearFlash: clearFlash,
    gradeEntry: gradeEntry,
    createWarmup: createWarmup,
    warmupView: warmupView,
    answerWarmup: answerWarmup,
    advanceWarmup: advanceWarmup,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.LikeTermsEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
