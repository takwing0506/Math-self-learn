/* 未知之秤 · 第一章規則
   學生畫面只應使用 view() 的字串。solveLinear 只用於天平傾斜方向，不可拼進提示。 */
(function (root) {
  "use strict";

  var MISSIONS = [
    {
      title: "入門訂單",
      brief: "左盤有神秘箱和砝碼。請維持平衡，並讓 x 單獨留在一邊。",
      L: [["x", 1], ["n", 7]],
      R: [["n", 12]],
      divide: false,
    },
    {
      title: "減號訂單",
      brief: "左盤的砝碼是負的。把它移到對面時，符號會反過來。",
      L: [["x", 1], ["n", -9]],
      R: [["n", 4]],
      divide: false,
    },
    {
      title: "輕盤訂單",
      brief: "右盤較輕。秤出的重量可以是負數。",
      L: [["x", 1], ["n", 15]],
      R: [["n", 8]],
      divide: false,
    },
    {
      title: "負號之箱",
      brief: "箱上記著負號。讓 x 單獨留下之後，還要把係數變成 1。",
      L: [["x", -1], ["n", 6]],
      R: [["n", 10]],
      divide: true,
    },
    {
      title: "右盤之箱",
      brief: "這次神秘箱在右盤。移項的規則仍然相同。",
      L: [["n", 18]],
      R: [["x", 1], ["n", -5]],
      divide: false,
    },
  ];

  function fmtInt(n) {
    return n < 0 ? "−" + Math.abs(n) : String(n);
  }

  function cloneSides(sides) {
    return {
      L: sides.L.map(copyTerm),
      R: sides.R.map(copyTerm),
    };
  }

  function copyTerm(t) {
    return { id: t.id, type: t.type, coeff: t.coeff };
  }

  function mint(run, type, coeff) {
    return { id: "t" + run.nextId++, type: type, coeff: coeff };
  }

  function locate(sides, id) {
    var s, i;
    for (s = 0; s < 2; s += 1) {
      var side = s === 0 ? "L" : "R";
      for (i = 0; i < sides[side].length; i += 1) {
        if (sides[side][i].id === id) {
          return { side: side, index: i, term: sides[side][i] };
        }
      }
    }
    return null;
  }

  function otherSide(side) {
    return side === "L" ? "R" : "L";
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
    for (i = 0; i < sides.L.length; i += 1) {
      if (sides.L[i].type === "x") a += sides.L[i].coeff;
      else b += sides.L[i].coeff;
    }
    for (i = 0; i < sides.R.length; i += 1) {
      if (sides.R[i].type === "x") c += sides.R[i].coeff;
      else d += sides.R[i].coeff;
    }
    var A = a - c;
    var B = d - b;
    if (A === 0 || B % A !== 0) return null;
    return B / A;
  }

  function tiltFromWeights(lw, rw) {
    if (lw === rw) return null;
    return lw > rw ? "L" : "R";
  }

  function tiltDir(run, sides) {
    var x = solveLinear(run.original);
    if (x === null) return "L";
    return tiltFromWeights(weight(sides.L, x), weight(sides.R, x));
  }

  function formatTerm(t, index) {
    if (t.type === "x") {
      var body;
      if (t.coeff === 1) body = "x";
      else if (t.coeff === -1) body = "−x";
      else body = fmtInt(t.coeff) + "x";
      if (index === 0) return body;
      if (t.coeff < 0) return " − " + (t.coeff === -1 ? "x" : Math.abs(t.coeff) + "x");
      return " + " + (t.coeff === 1 ? "x" : t.coeff + "x");
    }
    if (index === 0) return fmtInt(t.coeff);
    return t.coeff < 0 ? " − " + Math.abs(t.coeff) : " + " + t.coeff;
  }

  function formatSide(terms) {
    if (!terms.length) return "0";
    var out = "";
    var i;
    for (i = 0; i < terms.length; i += 1) out += formatTerm(terms[i], i);
    return out;
  }

  function pureUnitX(side) {
    return side.length === 1 && side[0].type === "x" && side[0].coeff === 1;
  }

  function noX(side) {
    var i;
    for (i = 0; i < side.length; i += 1) if (side[i].type === "x") return false;
    return true;
  }

  function revealsAnswer(sides) {
    return sideReveals(sides.L, sides.R) || sideReveals(sides.R, sides.L);
  }

  function sideReveals(xSide, other) {
    var i;
    for (i = 0; i < other.length; i += 1) if (other[i].type === "x") return false;
    if (!pureUnitX(xSide)) return false;
    if (!other.length) return true;
    return other.length === 1 && other[0].type === "n";
  }

  function formatEq(sides, sealed) {
    if (sealed) {
      if (pureUnitX(sides.R) && noX(sides.L)) return "？ = x";
      return "x = ？";
    }
    return formatSide(sides.L) + " = " + formatSide(sides.R);
  }

  function isReady(sides) {
    return (pureUnitX(sides.L) && noX(sides.R) && hasNumber(sides.R))
      || (pureUnitX(sides.R) && noX(sides.L) && hasNumber(sides.L));
  }

  function hasNumber(side) {
    var i;
    for (i = 0; i < side.length; i += 1) if (side[i].type === "n") return true;
    return false;
  }

  function canCheck(run) {
    return !!run.sealed || isReady(run.sides);
  }

  function xSeparated(sides) {
    return !mixed(sides.L) && !mixed(sides.R);
  }

  function mixed(side) {
    var hasVar = false;
    var hasNum = false;
    var i;
    for (i = 0; i < side.length; i += 1) {
      if (side[i].type === "x") hasVar = true;
      else hasNum = true;
    }
    return hasVar && hasNum;
  }

  function divideGoalMet(sides) {
    var xs = sides.L.concat(sides.R).filter(function (t) { return t.type === "x"; });
    return xs.length === 1 && xs[0].coeff === 1;
  }

  function countKind(side, type) {
    var n = 0;
    var i;
    for (i = 0; i < side.length; i += 1) if (side[i].type === type) n += 1;
    return n;
  }

  function hasPureNonUnit(sides) {
    return nonUnit(sides.L, sides.R) || nonUnit(sides.R, sides.L);
  }

  function nonUnit(xSide, other) {
    var i;
    for (i = 0; i < other.length; i += 1) if (other[i].type === "x") return false;
    return xSide.length === 1 && xSide[0].type === "x" && xSide[0].coeff !== 1;
  }

  function singleXCoeff(sides) {
    var xs = sides.L.concat(sides.R).filter(function (t) { return t.type === "x"; });
    if (xs.length !== 1) return null;
    return xs[0].coeff;
  }

  function suggest(run) {
    if (run.mode !== "guide") return null;
    if (canCheck(run)) return "check";
    if (
      countKind(run.sides.L, "n") >= 2 || countKind(run.sides.R, "n") >= 2 ||
      countKind(run.sides.L, "x") >= 2 || countKind(run.sides.R, "x") >= 2
    ) return "collect";
    if (hasPureNonUnit(run.sides)) return "divide";
    if (!xSeparated(run.sides)) return "move";
    if (!divideGoalMet(run.sides)) return "divide";
    return "move";
  }

  function tokenLabel(t, sealed) {
    if (sealed && t.type === "n") return "？";
    if (t.type === "x") {
      if (t.coeff === 1) return "x";
      if (t.coeff === -1) return "−x";
      return fmtInt(t.coeff) + "x";
    }
    return fmtInt(t.coeff);
  }

  function phrase(term) {
    if (term.type === "x") {
      if (term.coeff === 1) return "x";
      if (term.coeff === -1) return "−x";
      return fmtInt(term.coeff) + "x";
    }
    return term.coeff < 0 ? "−" + Math.abs(term.coeff) : "＋" + term.coeff;
  }

  function syncEq(run) {
    var eq = formatEq(run.sides, run.sealed);
    if (run.steps[run.steps.length - 1] !== eq) run.steps.push(eq);
    return eq;
  }

  function pushHistory(run) {
    run.history.push({
      sides: cloneSides(run.sides),
      sealed: run.sealed,
      beforeSeal: run.beforeSeal,
      steps: run.steps.slice(),
    });
    if (run.history.length > 40) run.history.shift();
  }

  function readyTail(run) {
    if (canCheck(run) && !run.sealed) return "可以到複秤交貨。";
    return "";
  }

  function commit(run, nextSides, messageFn) {
    var before = formatEq(run.sides, false);
    pushHistory(run);
    run.sides = nextSides;
    if (revealsAnswer(run.sides)) {
      run.sealed = true;
      run.beforeSeal = before;
    }
    var eq = syncEq(run);
    return {
      ok: true,
      applied: true,
      sealed: !!run.sealed,
      tilt: null,
      equation: eq,
      message: messageFn(eq, !!run.sealed),
    };
  }

  function sealedBlock() {
    return {
      ok: false,
      applied: false,
      message: "x 已分開。請到複秤填寫；若要改步驟，請返回上一步。",
    };
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

  function bad(message, tilt) {
    return { ok: false, applied: false, tilt: tilt || null, message: message };
  }

  function createRun(index, mode) {
    var mission = MISSIONS[index];
    if (!mission) throw new Error("沒有這張訂單");
    var nextId = 1;
    function take(pair) {
      return { id: "t" + nextId++, type: pair[0], coeff: pair[1] };
    }
    var sides = {
      L: mission.L.map(take),
      R: mission.R.map(take),
    };
    return {
      index: index,
      mode: mode === "challenge" ? "challenge" : "guide",
      sides: sides,
      original: cloneSides(sides),
      nextId: nextId,
      score: 100,
      misses: [],
      history: [],
      sealed: false,
      beforeSeal: "",
      steps: [formatEq(sides, false)],
      checkTries: 0,
      bonus: 0,
      solved: false,
      entry: null,
    };
  }

  function missionInfo(index) {
    var mission = MISSIONS[index];
    return {
      index: index,
      number: index + 1,
      total: MISSIONS.length,
      title: mission.title,
      brief: mission.brief,
      divide: mission.divide,
    };
  }

  function chipsOf(run) {
    if (run.sealed) return [];
    var set = {};
    ["L", "R"].forEach(function (side) {
      run.sides[side].forEach(function (t) {
        if (t.type === "n" && t.coeff !== 0) set[Math.abs(t.coeff)] = true;
      });
    });
    return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
  }

  function lampsOf(run, sug) {
    var moveMet = xSeparated(run.sides) || run.sealed;
    var divMet = divideGoalMet(run.sides) || run.sealed;
    var needDivide = MISSIONS[run.index].divide;
    function pack(id, state) {
      return { id: id, state: state, hint: !!sug && sug === id && state !== "done" };
    }
    return [
      pack("denom", "skip"),
      pack("expand", "skip"),
      pack("move", moveMet ? "done" : "need"),
      pack("collect", "skip"),
      pack("divide", !needDivide ? "skip" : (divMet ? "done" : "need")),
    ];
  }

  function view(run) {
    var info = missionInfo(run.index);
    var sug = suggest(run);
    function tokens(side) {
      return run.sides[side].map(function (t) {
        var hidden = run.sealed && t.type === "n";
        return {
          id: t.id,
          type: t.type,
          side: side,
          label: tokenLabel(t, run.sealed),
          neg: !hidden && t.coeff < 0,
          secret: hidden,
        };
      });
    }
    return {
      number: info.number,
      total: info.total,
      title: info.title,
      brief: info.brief,
      mode: run.mode,
      score: run.score,
      equation: formatEq(run.sides, run.sealed),
      originalEquation: formatEq(run.original, false),
      beforeSeal: run.sealed ? run.beforeSeal : "",
      steps: run.steps.slice(),
      sealed: !!run.sealed,
      ready: canCheck(run),
      suggest: sug,
      tokens: { L: tokens("L"), R: tokens("R") },
      lamps: lampsOf(run, sug),
      chips: chipsOf(run),
      xCoeff: run.sealed ? null : singleXCoeff(run.sides),
      canUndo: run.history.length > 0,
      checkTries: run.checkTries,
      bonus: run.bonus,
      solved: !!run.solved,
    };
  }

  function resultOf(run) {
    if (!run.solved) return null;
    var counts = {};
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

  function moveTerm(run, id, flip) {
    if (run.sealed) return sealedBlock();
    var loc = locate(run.sides, id);
    if (!loc) return bad("找不到這個砝碼。");
    var src = loc.side;
    var dst = otherSide(src);
    var next = cloneSides(run.sides);
    var index = next[src].findIndex(function (t) { return t.id === id; });
    var removed = next[src].splice(index, 1)[0];
    var landed = {
      id: removed.id,
      type: removed.type,
      coeff: flip ? -removed.coeff : removed.coeff,
    };
    next[dst].push(landed);
    if (!flip) {
      var tilt = tiltDir(run, next);
      var pen = penalize(run, "移項未變號");
      var expect = { type: removed.type, coeff: -removed.coeff };
      return bad(
        "移項要變號。" + phrase(removed) + " 到另一邊應變成 " + phrase(expect) + "。天平傾斜。" + pen,
        tilt
      );
    }
    return commit(run, next, function (eq, sealed) {
      var head = "移項完成，" + phrase(removed) + " 變成 " + phrase(landed) + "。";
      if (sealed) return head + "x 已分開，請到複秤填寫，此處不顯示數字。";
      return head + "現在是 " + eq + "。" + readyTail(run);
    });
  }

  function addToPans(run, side, value) {
    if (run.sealed) return sealedBlock();
    if (!Number.isInteger(value) || value === 0 || Math.abs(value) > 99) {
      return bad("請選擇 −99 到 99 之間、不是 0 的整數。");
    }
    if (side === "both") {
      var next = cloneSides(run.sides);
      next.L.push(mint(run, "n", value));
      next.R.push(mint(run, "n", value));
      var verb = value > 0 ? "加上 " : "減去 ";
      var mag = Math.abs(value);
      return commit(run, next, function (eq, sealed) {
        var head = "兩邊同時" + verb + mag + "，天平保持平衡。";
        if (sealed) return head + "x 已分開，請到複秤填寫，此處不顯示數字。";
        return head + "現在是 " + eq + "。" + readyTail(run);
      });
    }
    if (side !== "L" && side !== "R") return bad("請選擇左盤、右盤或兩邊。");
    var trial = cloneSides(run.sides);
    trial[side].push({ id: "tmp", type: "n", coeff: value });
    var tilt = tiltDir(run, trial);
    var pen = penalize(run, "只改動一邊");
    var which = side === "L" ? "左盤" : "右盤";
    return bad("只把砝碼放在" + which + "，天平傾斜。兩邊要加上或減去同一個數。" + pen, tilt);
  }

  function combineTerms(run, terms) {
    var xc = 0;
    var nc = 0;
    var hasX = false;
    var hasN = false;
    terms.forEach(function (t) {
      if (t.type === "x") {
        xc += t.coeff;
        hasX = true;
      } else {
        nc += t.coeff;
        hasN = true;
      }
    });
    var out = [];
    if (hasX && xc !== 0) out.push(mint(run, "x", xc));
    if (hasN && nc !== 0) out.push(mint(run, "n", nc));
    return out;
  }

  function mergeSide(run, side) {
    if (run.sealed) return sealedBlock();
    if (side !== "L" && side !== "R") return bad("請選擇一盤。");
    var terms = run.sides[side];
    if (countKind(terms, "x") < 2 && countKind(terms, "n") < 2) {
      return bad("這一盤沒有可合併的同類項。");
    }
    var next = cloneSides(run.sides);
    next[side] = combineTerms(run, terms);
    if (revealsAnswer(next)) {
      return bad("合併後會直接寫出 x 的值。請保留現在的算式，到複秤自行計算。");
    }
    return commit(run, next, function (eq, sealed) {
      if (sealed) return "已合併同類項。x 已分開，請到複秤填寫，此處不顯示數字。";
      return "已合併同類項。現在是 " + eq + "。" + readyTail(run);
    });
  }

  function mergeTwo(run, idA, idB) {
    if (run.sealed) return sealedBlock();
    if (!idA || !idB || idA === idB) return bad("請疊到另一個同類項上。");
    var a = locate(run.sides, idA);
    var b = locate(run.sides, idB);
    if (!a || !b) return bad("找不到這個砝碼。");
    if (a.side !== b.side) return bad("兩個項要在同一盤才能合併。跨盤請用移項。");
    if (a.term.type !== b.term.type) return bad("只有同類項可以合併。");
    var coeff = a.term.coeff + b.term.coeff;
    var next = cloneSides(run.sides);
    next[a.side] = next[a.side].filter(function (t) { return t.id !== idA && t.id !== idB; });
    if (coeff !== 0) next[a.side].push(mint(run, a.term.type, coeff));
    if (revealsAnswer(next)) {
      return bad("合併後會直接寫出 x 的值。請保留現在的算式，到複秤自行計算。");
    }
    return commit(run, next, function (eq, sealed) {
      if (sealed) return "已合併同類項。x 已分開，請到複秤填寫，此處不顯示數字。";
      return "已合併同類項。現在是 " + eq + "。" + readyTail(run);
    });
  }

  function divisible(sides, divisor) {
    var ok = true;
    ["L", "R"].forEach(function (side) {
      sides[side].forEach(function (t) {
        if (t.coeff % divisor !== 0) ok = false;
      });
    });
    return ok;
  }

  function divide(run, side, divisor) {
    if (run.sealed) return sealedBlock();
    if (!Number.isInteger(divisor)) return bad("請輸入整數除數。");
    if (divisor === 0) return bad("除數不能是 0。");
    if (divisor === 1) return bad("除以 1 不會改變方程。");
    if (side === "both") {
      if (!divisible(run.sides, divisor)) {
        return bad("各項不能被這個數整除。請換一個除數，使每一項都得到整數。");
      }
      var next = cloneSides(run.sides);
      ["L", "R"].forEach(function (name) {
        next[name].forEach(function (t) { t.coeff /= divisor; });
        next[name] = next[name].filter(function (t) { return t.coeff !== 0; });
      });
      return commit(run, next, function (eq, sealed) {
        var head = "兩邊已同除以 " + fmtInt(divisor) + "。";
        if (sealed) return head + "x 已分開，請到複秤填寫，此處不顯示數字。";
        return head + "現在是 " + eq + "。" + readyTail(run);
      });
    }
    if (side !== "L" && side !== "R") return bad("請選擇兩邊或其中一盤。");
    var x = solveLinear(run.original);
    var lw = weight(run.sides.L, x);
    var rw = weight(run.sides.R, x);
    if (side === "L") lw /= divisor;
    else rw /= divisor;
    var tilt = x === null ? "L" : tiltFromWeights(lw, rw);
    var pen = penalize(run, "只除一邊");
    var which = side === "L" ? "左盤" : "右盤";
    return bad("只除" + which + "，等式不再成立，天平傾斜。" + pen, tilt);
  }

  function undo(run) {
    if (!run.history.length) return bad("沒有可以返回的步驟。");
    var prev = run.history.pop();
    run.sides = prev.sides;
    run.sealed = prev.sealed;
    run.beforeSeal = prev.beforeSeal;
    run.steps = prev.steps.slice();
    return { ok: true, applied: true, message: "已返回上一步。" };
  }

  function notReadyMessage(run) {
    if (run.mode !== "guide") return "x 還沒有以係數 1 單獨留在一邊。";
    var step = suggest(run);
    if (step === "divide") return "x 的係數還不是 1。請先把兩邊同除以這個係數。";
    if (step === "collect") return "x 還沒有單獨留在一邊。同一盤的同類項可以先合併。";
    return "x 還沒有以係數 1 單獨留在一邊。";
  }

  function gateCheck(run) {
    if (canCheck(run)) return { ok: true, message: "" };
    return { ok: false, message: notReadyMessage(run) };
  }

  function parseStudent(raw) {
    var text = String(raw == null ? "" : raw).trim();
    text = text.replace(/−/g, "-").replace(/–/g, "-").replace(/＋/g, "+").replace(/\s+/g, "");
    if (!/^[+-]?\d+$/.test(text)) return null;
    var n = Number(text);
    if (!Number.isSafeInteger(n)) return null;
    return n;
  }

  function substTerm(t, x, index) {
    if (t.type === "n") {
      if (index === 0) return fmtInt(t.coeff);
      return t.coeff < 0 ? " − " + Math.abs(t.coeff) : " + " + t.coeff;
    }
    var core;
    if (t.coeff === 1) core = x < 0 ? "(" + fmtInt(x) + ")" : String(x);
    else if (t.coeff === -1) core = "−(" + fmtInt(x) + ")";
    else core = fmtInt(t.coeff) + "×(" + fmtInt(x) + ")";
    if (index === 0) return core;
    if (t.coeff < 0) {
      var rest = t.coeff === -1 ? "(" + fmtInt(x) + ")" : Math.abs(t.coeff) + "×(" + fmtInt(x) + ")";
      return " − " + rest;
    }
    return " + " + core;
  }

  function substSide(terms, x) {
    if (terms.length === 1 && terms[0].type === "n") return fmtInt(terms[0].coeff);
    var expr = "";
    var i;
    for (i = 0; i < terms.length; i += 1) expr += substTerm(terms[i], x, i);
    return expr + " = " + fmtInt(weight(terms, x));
  }

  function submitCheck(run, raw) {
    var gate = gateCheck(run);
    if (!gate.ok) return { ok: false, applied: false, message: gate.message };
    var x = parseStudent(raw);
    if (x === null) return { ok: false, applied: false, message: "請輸入整數。負數請寫負號。" };
    if (Math.abs(x) > 9999) return { ok: false, applied: false, message: "這個數太大了。請再看一次方程。" };
    run.checkTries += 1;
    var leftText = substSide(run.original.L, x);
    var rightText = substSide(run.original.R, x);
    var balanced = weight(run.original.L, x) === weight(run.original.R, x);
    if (balanced) {
      var extra;
      if (run.checkTries === 1) {
        run.bonus = 10;
        run.score += 10;
        extra = "複秤一次成功，獎金 10 分。";
      } else {
        extra = "這次左右相等。";
      }
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
    var pen = penalize(run, "複秤不相等");
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

  function lampHelp(run, id) {
    if (id === "denom") return "這張訂單沒有分母，這一步可以跳過。";
    if (id === "expand") return "這張訂單沒有括號，這一步可以跳過。";
    var requiredDivide = MISSIONS[run.index].divide;
    if (run.mode === "challenge") {
      if (id === "collect" || (id === "divide" && !requiredDivide)) return "這張訂單可以跳過這一步。";
      return "挑戰模式不提示下一步。";
    }
    if (id === "move") return "把常數砝碼拖到另一盤，放下時符號會改變。也可以在兩邊同時加上或減去同一個數。";
    if (id === "collect") return "把同一盤的同類項合併。若合併會直接寫出 x 的值，天平會拒絕。";
    if (id === "divide") {
      if (!requiredDivide && divideGoalMet(run.sides)) return "這張訂單可以跳過這一步。";
      var coeff = singleXCoeff(run.sides);
      if (coeff === null) return "先把 x 合成一項，再把兩邊同除以它的係數。";
      if (coeff === 1) return "x 的係數已經是 1，這一步可以跳過。";
      return "請把兩邊同除以 " + fmtInt(coeff) + "，使 x 的係數變成 1。只除一邊會令天平傾斜。";
    }
    return "";
  }

  function isLevel(run) {
    var x = solveLinear(run.original);
    if (x === null) return false;
    return weight(run.sides.L, x) === weight(run.sides.R, x);
  }

  var api = {
    missionCount: MISSIONS.length,
    missionInfo: missionInfo,
    createRun: createRun,
    view: view,
    resultOf: resultOf,
    moveTerm: moveTerm,
    addToPans: addToPans,
    mergeSide: mergeSide,
    mergeTwo: mergeTwo,
    divide: divide,
    undo: undo,
    gateCheck: gateCheck,
    submitCheck: submitCheck,
    lampHelp: lampHelp,
    isLevel: isLevel,
    parseStudent: parseStudent,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ScaleEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
