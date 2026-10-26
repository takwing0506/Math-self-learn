/* 未知之秤 · 第一章
   天平兩邊必須同時改變。移項＝兩邊同加／同減，再一起化簡。
   除數＝兩邊同乘／同除。不要把一項搬過等號。
   solveLinear 只供天平是否仍平衡的內部檢查，不可送進學生畫面。 */
(function (root) {
  "use strict";

  var MOTTO = "只有加減項先移項變號；乘除唔好移。";

  var LAMPS = {
    move: { id: "move", name: "移項", detail: "兩邊同加／同減" },
    divide: { id: "divide", name: "除數", detail: "兩邊同乘／同除" },
  };

  var PRACTICE = [
    {
      title: "加上正數",
      brief: "左盤有 x，也有正數砝碼。",
      L: [["x", 1], ["n", 7]],
      R: [["n", 12]],
    },
    {
      title: "抵消負數",
      brief: "左盤的砝碼是負的。",
      L: [["x", 1], ["n", -9]],
      R: [["n", 4]],
    },
    {
      title: "秤出負數",
      brief: "右盤比左盤的砝碼輕，x 可以是負數。",
      L: [["x", 1], ["n", 15]],
      R: [["n", 8]],
    },
    {
      title: "右盤有 x",
      brief: "這次 x 在右盤。",
      L: [["n", 18]],
      R: [["x", 1], ["n", -5]],
    },
    {
      title: "右盤是負數",
      brief: "右盤的數是負的。",
      L: [["x", 1], ["n", -3]],
      R: [["n", -2]],
    },
  ];

  var CHALLENGE = [
    {
      title: "常數在前",
      brief: "常數寫在 x 前面。",
      L: [["n", 4], ["x", 1]],
      R: [["n", 1]],
    },
    {
      title: "係數是 −1",
      brief: "x 的係數是 −1。請用除數燈：兩邊同乘 −1，或兩邊同除以 −1。",
      L: [["x", -1], ["n", 6]],
      R: [["n", 10]],
      divide: true,
    },
    {
      title: "中間的 −x",
      brief: "−x 寫在中間。請兩邊都加 x，再一起化簡。",
      L: [["n", 9], ["x", -1]],
      R: [["n", 4]],
      addX: true,
    },
  ];

  function normalizeMode(mode) {
    return mode === "challenge" ? "challenge" : "practice";
  }

  function missionList(mode) {
    return normalizeMode(mode) === "challenge" ? CHALLENGE : PRACTICE;
  }

  function fmtInt(n) {
    return n < 0 ? "−" + Math.abs(n) : String(n);
  }

  function copyTerm(t) {
    return { id: t.id, type: t.type, coeff: t.coeff };
  }

  function cloneSides(sides) {
    return {
      L: sides.L.map(copyTerm),
      R: sides.R.map(copyTerm),
    };
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
    var body;
    if (t.type === "x") {
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

  function formatEq(sides) {
    return formatSide(sides.L) + " = " + formatSide(sides.R);
  }

  function tokenLabel(t) {
    if (t.type === "x") {
      if (t.coeff === 1) return "x";
      if (t.coeff === -1) return "−x";
      return fmtInt(t.coeff) + "x";
    }
    return fmtInt(t.coeff);
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

  function countKind(terms, type) {
    var n = 0;
    var i;
    for (i = 0; i < terms.length; i += 1) if (terms[i].type === type) n += 1;
    return n;
  }

  function sideMessy(terms) {
    return countKind(terms, "n") >= 2 || countKind(terms, "x") >= 2;
  }

  function canSimplify(sides) {
    return sideMessy(sides.L) || sideMessy(sides.R);
  }

  function hasX(terms) {
    return countKind(terms, "x") > 0;
  }

  function hasNegX(sides) {
    var all = sides.L.concat(sides.R);
    var i;
    for (i = 0; i < all.length; i += 1) {
      if (all[i].type === "x" && all[i].coeff < 0) return true;
    }
    return false;
  }

  function unitX(side) {
    return side.length === 1 && side[0].type === "x" && side[0].coeff === 1;
  }

  function plainNumber(side) {
    if (!side.length) return true;
    return side.length === 1 && side[0].type === "n";
  }

  function isReady(sides) {
    return (unitX(sides.L) && plainNumber(sides.R)) || (unitX(sides.R) && plainNumber(sides.L));
  }

  function negAlone(xSide, other) {
    var i;
    if (xSide.length !== 1 || xSide[0].type !== "x" || xSide[0].coeff !== -1) return false;
    for (i = 0; i < other.length; i += 1) if (other[i].type === "x") return false;
    return true;
  }

  function pureNegUnit(sides) {
    return negAlone(sides.L, sides.R) || negAlone(sides.R, sides.L);
  }

  function blockerCoeff(sides) {
    if (hasX(sides.L) && hasX(sides.R)) return null;
    var side = hasX(sides.L) ? sides.L : hasX(sides.R) ? sides.R : null;
    if (!side) return null;
    var nums = [];
    var i;
    for (i = 0; i < side.length; i += 1) if (side[i].type === "n") nums.push(side[i]);
    if (nums.length !== 1) return null;
    return nums[0].coeff;
  }

  function suggest(run) {
    var blocker;
    if (run.mode !== "practice") return null;
    if (isReady(run.sides)) return { type: "check", value: null };
    if (canSimplify(run.sides)) return { type: "simplify", value: null };
    if (pureNegUnit(run.sides)) return { type: "div", value: -1 };
    if (run.mission.addX && hasNegX(run.sides)) return { type: "addx", value: 1 };
    blocker = blockerCoeff(run.sides);
    if (blocker !== null) return { type: "add", value: -blocker };
    return null;
  }

  function magnitudes(sides) {
    var set = {};
    var i;
    ["L", "R"].forEach(function (name) {
      for (i = 0; i < sides[name].length; i += 1) {
        var t = sides[name][i];
        if (t.type === "n" && t.coeff !== 0) set[Math.abs(t.coeff)] = true;
      }
    });
    return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
  }

  function sameAction(action, sug) {
    if (!sug || sug.type === "check") return false;
    if (action.type !== sug.type) return false;
    if (action.type === "simplify") return true;
    return action.value === sug.value;
  }

  function listActions(run) {
    var sug = suggest(run);
    var actions = [];
    var mags;
    var i;
    if (canSimplify(run.sides)) {
      actions.push({ type: "simplify", value: null, group: "tidy", label: "兩邊一起化簡" });
    }
    mags = magnitudes(run.sides);
    for (i = 0; i < mags.length; i += 1) {
      actions.push({ type: "add", value: mags[i], group: "sum", label: "兩邊都加 " + mags[i] });
      actions.push({ type: "add", value: -mags[i], group: "sum", label: "兩邊都減 " + mags[i] });
    }
    if (run.mission.addX) {
      actions.push({ type: "addx", value: 1, group: "x", label: "兩邊都加 x" });
      actions.push({ type: "addx", value: -1, group: "x", label: "兩邊都減 x" });
    }
    if (run.mission.divide) {
      actions.push({ type: "mul", value: -1, group: "scale", label: "兩邊同乘 −1" });
      actions.push({ type: "div", value: -1, group: "scale", label: "兩邊同除以 −1" });
    }
    for (i = 0; i < actions.length; i += 1) actions[i].guided = sameAction(actions[i], sug);
    return actions;
  }

  function combineSide(run, terms) {
    var xIndex = -1;
    var nIndex = -1;
    var xc = 0;
    var nc = 0;
    var i;
    for (i = 0; i < terms.length; i += 1) {
      if (terms[i].type === "x") {
        if (xIndex < 0) xIndex = i;
        xc += terms[i].coeff;
      } else {
        if (nIndex < 0) nIndex = i;
        nc += terms[i].coeff;
      }
    }
    var xTerm = xIndex >= 0 && xc !== 0 ? mint(run, "x", xc) : null;
    var nTerm = nIndex >= 0 && nc !== 0 ? mint(run, "n", nc) : null;
    if (xTerm && nTerm) return nIndex < xIndex ? [nTerm, xTerm] : [xTerm, nTerm];
    if (xTerm) return [xTerm];
    if (nTerm) return [nTerm];
    return [];
  }

  function snapshot(run) {
    return {
      sides: cloneSides(run.sides),
      steps: run.steps.map(function (step) {
        return { equation: step.equation, lamp: step.lamp, note: step.note };
      }),
    };
  }

  function pushHistory(run) {
    run.history.push(snapshot(run));
    if (run.history.length > 40) run.history.shift();
  }

  function commit(run, nextSides, lamp, note, banner, message) {
    var prev = {};
    var fresh = [];
    var i;
    var oldIds = idsOf(run.sides);
    for (i = 0; i < oldIds.length; i += 1) prev[oldIds[i]] = true;
    pushHistory(run);
    run.sides = nextSides;
    run.lampsConfirmed = false;
    var eq = formatEq(run.sides);
    run.steps.push({ equation: eq, lamp: lamp, note: note });
    var now = idsOf(run.sides);
    for (i = 0; i < now.length; i += 1) if (!prev[now[i]]) fresh.push(now[i]);
    if (!fresh.length) fresh = now.slice();
    run.freshIds = fresh;
    if (isReady(run.sides)) message += "可以到複秤。";
    return {
      ok: true,
      applied: true,
      equation: eq,
      banner: banner,
      message: message,
    };
  }

  function bad(message) {
    return { ok: false, applied: false, banner: "", message: message };
  }

  function addBoth(run, value) {
    if (!Number.isInteger(value) || value === 0 || Math.abs(value) > 99) {
      return bad("請選擇 −99 到 99 之間、不是 0 的整數。");
    }
    var next = cloneSides(run.sides);
    next.L.push(mint(run, "n", value));
    next.R.push(mint(run, "n", value));
    var mag = Math.abs(value);
    var note = value > 0 ? "兩邊都加 " + mag : "兩邊都減 " + mag;
    var said = value > 0 ? "兩邊都加了 " + mag : "兩邊都減了 " + mag;
    var banner = value > 0 ? "兩邊 +" + mag : "兩邊 −" + mag;
    return commit(run, next, "move", note, banner, said + "。現在是 " + formatEq(next) + "。");
  }

  function simplifyBoth(run) {
    if (!canSimplify(run.sides)) return bad("兩邊都沒有可以合併的同類項。");
    var next = {
      L: combineSide(run, run.sides.L),
      R: combineSide(run, run.sides.R),
    };
    return commit(
      run,
      next,
      "move",
      "兩邊一起化簡",
      "兩邊化簡",
      "兩邊一起化簡。現在是 " + formatEq(next) + "。"
    );
  }

  function addXBoth(run, value) {
    if (!run.mission.addX) return bad("這一題不用加 x。");
    if (value !== 1 && value !== -1) return bad("請兩邊同加 x，或兩邊同減 x。");
    var next = cloneSides(run.sides);
    next.L.push(mint(run, "x", value));
    next.R.push(mint(run, "x", value));
    var note = value > 0 ? "兩邊都加 x" : "兩邊都減 x";
    var said = value > 0 ? "兩邊都加了 x" : "兩邊都減了 x";
    var banner = value > 0 ? "兩邊 +x" : "兩邊 −x";
    return commit(run, next, "move", note, banner, said + "。現在是 " + formatEq(next) + "。");
  }

  function scaleBoth(run, factor, kind) {
    if (!run.mission.divide) return bad("這一題不用乘除。");
    if (factor !== -1) return bad("本章只把兩邊同乘 −1，或同除以 −1。");
    var next = cloneSides(run.sides);
    ["L", "R"].forEach(function (name) {
      var i;
      for (i = 0; i < next[name].length; i += 1) next[name][i].coeff *= -1;
      next[name] = next[name].filter(function (t) { return t.coeff !== 0; });
    });
    var note = kind === "div" ? "兩邊同除以 −1" : "兩邊同乘 −1";
    var said = kind === "div" ? "兩邊同除以 −1" : "兩邊同乘了 −1";
    var banner = kind === "div" ? "兩邊 ÷ −1" : "兩邊 × −1";
    return commit(run, next, "divide", note, banner, said + "。現在是 " + formatEq(next) + "。");
  }

  function applyAction(run, action) {
    if (!action || !action.type) return bad("請按一個操作。");
    if (action.type === "add") return addBoth(run, action.value);
    if (action.type === "simplify") return simplifyBoth(run);
    if (action.type === "addx") return addXBoth(run, action.value);
    if (action.type === "mul") return scaleBoth(run, action.value, "mul");
    if (action.type === "div") return scaleBoth(run, action.value, "div");
    return bad("沒有這個操作。");
  }

  function undo(run) {
    if (!run.history.length) return bad("沒有可以返回的步驟。");
    var prev = run.history.pop();
    run.sides = prev.sides;
    run.steps = prev.steps.map(function (step) {
      return { equation: step.equation, lamp: step.lamp, note: step.note };
    });
    run.lampsConfirmed = false;
    run.freshIds = [];
    return { ok: true, applied: true, banner: "", message: "已返回上一步。" };
  }

  function notReadyMessage(run) {
    var sug;
    if (run.mode !== "practice") return "x 還未單獨留在一邊。";
    sug = suggest(run);
    if (!sug || sug.type === "check") return "x 還未單獨留在一邊。";
    if (sug.type === "simplify") return "請先按「兩邊一起化簡」。";
    if (sug.type === "add" && sug.value > 0) return "請先按「兩邊都加 " + sug.value + "」。";
    if (sug.type === "add") return "請先按「兩邊都減 " + Math.abs(sug.value) + "」。";
    if (sug.type === "div") return "請先按「兩邊同除以 −1」。";
    if (sug.type === "mul") return "請先按「兩邊同乘 −1」。";
    if (sug.type === "addx") return "請先按「兩邊都加 x」。";
    return "x 還未單獨留在一邊。";
  }

  function gateCheck(run) {
    if (isReady(run.sides)) return { ok: true, message: "" };
    return { ok: false, message: notReadyMessage(run) };
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

  function sameSet(a, b) {
    var i;
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i += 1) if (b.indexOf(a[i]) === -1) return false;
    return true;
  }

  function confirmLamps(run, ids) {
    var chosen = Array.isArray(ids) ? ids.slice() : [];
    var i;
    for (i = 0; i < chosen.length; i += 1) {
      if (chosen[i] !== "move" && chosen[i] !== "divide") {
        return { ok: false, applied: false, message: "請只勾選移項或除數。" };
      }
    }
    if (!sameSet(chosen, lampsUsed(run))) {
      return { ok: false, applied: false, message: "和步驟右邊的燈不一樣。請再看每一行的標籤。" };
    }
    run.lampsConfirmed = true;
    return { ok: true, applied: true, message: "口訣燈核對正確。請填 x，代回原式。" };
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
    var gate = gateCheck(run);
    var x;
    var leftText;
    var rightText;
    var balanced;
    var extra;
    var pen;
    if (!gate.ok) return { ok: false, applied: false, message: gate.message };
    if (!run.lampsConfirmed) {
      return { ok: false, applied: false, message: "請先確認你用過的口訣燈。" };
    }
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
    pen = penalize(run, "複秤不相等");
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
    if (id === "move") return "移項是兩邊同加或同減同一個數。加上相反數之後，按「兩邊一起化簡」，零會同時消去。";
    if (id === "divide") {
      if (!run.mission.divide) return "這一題不用乘除。";
      return "除數是兩邊同乘或同除。係數是 −1 時，兩邊同乘 −1，或同除以 −1。";
    }
    return "";
  }

  function isLevel(run) {
    var x = solveLinear(run.original);
    if (x === null) return false;
    return weight(run.sides.L, x) === weight(run.sides.R, x);
  }

  function createRun(index, mode) {
    var list = missionList(mode);
    var mission = list[index];
    var nextId = 1;
    if (!mission) throw new Error("沒有這一題");
    function take(pair) {
      return { id: "t" + nextId++, type: pair[0], coeff: pair[1] };
    }
    var sides = {
      L: mission.L.map(take),
      R: mission.R.map(take),
    };
    var useMode = normalizeMode(mode);
    return {
      index: index,
      mode: useMode,
      mission: mission,
      sides: sides,
      original: cloneSides(sides),
      nextId: nextId,
      score: 100,
      misses: [],
      history: [],
      steps: [{ equation: formatEq(sides), lamp: null, note: "原式" }],
      freshIds: [],
      lampsConfirmed: false,
      checkTries: 0,
      bonus: 0,
      solved: false,
      entry: null,
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
      divide: !!mission.divide,
      addX: !!mission.addX,
      mode: normalizeMode(mode),
    };
  }

  function lampState(run, id) {
    var i;
    var used = false;
    for (i = 0; i < run.steps.length; i += 1) if (run.steps[i].lamp === id) used = true;
    if (id === "divide" && !run.mission.divide) return "skip";
    if (isReady(run.sides) && (id === "move" || used || id === "divide")) return "done";
    return "need";
  }

  function view(run) {
    var info = missionInfo(run.index, run.mode);
    var sug = suggest(run);
    var fresh = {};
    var i;
    for (i = 0; i < run.freshIds.length; i += 1) fresh[run.freshIds[i]] = true;
    function tokens(side) {
      return run.sides[side].map(function (t) {
        return {
          id: t.id,
          type: t.type,
          side: side,
          label: tokenLabel(t),
          neg: t.coeff < 0,
          fresh: !!fresh[t.id],
        };
      });
    }
    return {
      number: info.number,
      total: info.total,
      title: info.title,
      brief: info.brief,
      mode: run.mode,
      setLabel: run.mode === "challenge" ? "挑戰" : "練習",
      score: run.score,
      motto: MOTTO,
      equation: formatEq(run.sides),
      originalEquation: formatEq(run.original),
      steps: run.steps.map(function (step) {
        return { equation: step.equation, lamp: step.lamp, note: step.note };
      }),
      lampsUsed: lampsUsed(run),
      lampsConfirmed: !!run.lampsConfirmed,
      ready: isReady(run.sides),
      suggest: sug ? { type: sug.type, value: sug.value } : null,
      tokens: { L: tokens("L"), R: tokens("R") },
      lamps: [LAMPS.move, LAMPS.divide].map(function (lamp) {
        return {
          id: lamp.id,
          name: lamp.name,
          detail: lamp.detail,
          state: lampState(run, lamp.id),
        };
      }),
      actions: listActions(run),
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

  var api = {
    motto: MOTTO,
    lamps: LAMPS,
    practiceCount: PRACTICE.length,
    challengeCount: CHALLENGE.length,
    missionInfo: missionInfo,
    createRun: createRun,
    view: view,
    resultOf: resultOf,
    applyAction: applyAction,
    undo: undo,
    gateCheck: gateCheck,
    lampsUsed: lampsUsed,
    confirmLamps: confirmLamps,
    submitCheck: submitCheck,
    lampHelp: lampHelp,
    isLevel: isLevel,
    parseStudent: parseStudent,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ScaleEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
