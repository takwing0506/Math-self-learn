/* 數線棋規則引擎
   只實作兩條規則。口訣不進入計算，也不寫進提示。

   轉身次數：
   - 起點本身的正負號只決定位置，不算轉身。
   - 運算符號「−」算一次反轉。
   - 第二項括號裏的「−」再算一次反轉。
   - 「+」不反轉。
   然後沿最後面向前進，不設後退。
*/
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.NL = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const MIN = -10;
  const MAX = 10;

  const QUESTIONS = {
    examples: [
      { id: "ex1", no: "例一", expr: "3+5" },
      { id: "ex2", no: "例二", expr: "2−5" },
    ],
    warmup: [
      { id: "w1", no: "1", expr: "4+3" },
      { id: "w2", no: "2", expr: "6−2" },
      { id: "w3", no: "3", expr: "1−4" },
      { id: "w4", no: "4", expr: "0−6" },
      { id: "w5", no: "5", expr: "5−5" },
      { id: "w6", no: "6", expr: "2−9" },
    ],
    negstart: [
      { id: "n7", no: "7", expr: "−4+3" },
      { id: "n8", no: "8", expr: "−2−5" },
      { id: "n9", no: "9", expr: "−6+8" },
      { id: "n10", no: "10", expr: "−1−4" },
    ],
    challenge: [
      { id: "c11", no: "11", expr: "3+(−5)" },
      { id: "c12", no: "12", expr: "3−(−5)" },
      { id: "c13", no: "13", expr: "−2+(−4)" },
      { id: "c14", no: "14", expr: "−2−(−6)" },
    ],
    pattern: [
      { id: "pa", no: "(a)", left: "3−(−5)", right: "3+5" },
      { id: "pb", no: "(b)", left: "3+(−5)", right: "3−5" },
      { id: "pc", no: "(c)", left: "−2−(−6)", right: "−2+6" },
      { id: "pd", no: "(d)", left: "−2+(−4)", right: "−2−4" },
    ],
    verify: [
      { id: "v15", no: "15", expr: "5−(−3)" },
      { id: "v16", no: "16", expr: "−4+(−3)" },
      { id: "v17", no: "17", expr: "−1−(−7)" },
      { id: "v18", no: "18", expr: "2−(+6)" },
    ],
    exit: [
      { id: "xa", no: "(a)", expr: "6+(−9)" },
      { id: "xb", no: "(b)", expr: "−3−(−8)" },
      { id: "xc", no: "(c)", expr: "−5+(−2)" },
      { id: "xd", no: "(d)", expr: "4−(−6)" },
    ],
  };

  function parse(input) {
    const s = String(input)
      .replace(/\s+/g, "")
      .replace(/＋/g, "+")
      .replace(/[−–—－-]/g, "-")
      .replace(/^[（(]([+-]?\d+)[）)]/, "$1");
    const m = s.match(/^([+-]?\d+)([+-])(?:\(([+-]?\d+)\)|(\d+))$/);
    if (!m) return null;
    const start = Number(m[1]);
    const op = m[2];
    let inner = null;
    let magnitude;
    let secondValue;
    if (m[3] != null) {
      secondValue = Number(m[3]);
      magnitude = Math.abs(secondValue);
      if (String(m[3]).startsWith("-")) inner = "-";
      else inner = "+";
    } else {
      magnitude = Number(m[4]);
      secondValue = magnitude;
    }
    const events = [{ kind: "op", symbol: op, reverses: op === "-" }];
    if (inner) events.push({ kind: "inner", symbol: inner, reverses: inner === "-" });
    return { start, op, inner, magnitude, secondValue, events };
  }

  function solve(exprOrText) {
    const expr = typeof exprOrText === "string" ? parse(exprOrText) : exprOrText;
    if (!expr) throw new Error("無法讀取數式");
    let facing = 1;
    const facings = [1];
    let turns = 0;
    expr.events.forEach(function (event) {
      if (event.reverses) {
        facing = -facing;
        turns += 1;
      }
      facings.push(facing);
    });
    return {
      start: expr.start,
      facings: facings,
      turns: turns,
      steps: expr.magnitude,
      end: expr.start + facing * expr.magnitude,
      facing: facing,
    };
  }

  function startPlay(exprOrText) {
    const expr = typeof exprOrText === "string" ? parse(exprOrText) : exprOrText;
    if (!expr) throw new Error("無法讀取數式");
    return {
      expr: expr,
      pos: expr.start,
      facing: 1,
      facings: [1],
      turns: 0,
      steps: 0,
      usedBack: false,
      backSteps: 0,
      signIndex: 0,
      advanceBeforeDone: false,
      turnsDuringAdvance: 0,
      hops: [],
      locked: false,
    };
  }

  function clone(state) {
    return {
      expr: state.expr,
      pos: state.pos,
      facing: state.facing,
      facings: state.facings.slice(),
      turns: state.turns,
      steps: state.steps,
      usedBack: state.usedBack,
      backSteps: state.backSteps,
      signIndex: state.signIndex,
      advanceBeforeDone: state.advanceBeforeDone,
      turnsDuringAdvance: state.turnsDuringAdvance,
      hops: state.hops.map(function (hop) {
        return { from: hop.from, to: hop.to, back: hop.back };
      }),
      locked: state.locked,
      key: state.key,
      exprText: state.exprText,
    };
  }

  function inRange(n) {
    return n >= MIN && n <= MAX;
  }

  function apply(state, type) {
    const next = clone(state);
    if (next.locked) return { state: next, message: "" };
    if (type === "turn") {
      next.facing = -next.facing;
      if (next.signIndex >= next.expr.events.length) {
        next.turns += 1;
        next.turnsDuringAdvance += 1;
        next.facings.push(next.facing);
      }
      return { state: next, message: "" };
    }
    if (type === "commit") {
      if (next.signIndex >= next.expr.events.length) {
        return { state: state, message: "符號已經全部處理。請沿面向前進。" };
      }
      const prev = next.facings[next.facings.length - 1];
      if (next.facing !== prev) next.turns += 1;
      next.facings.push(next.facing);
      next.signIndex += 1;
      return { state: next, message: "" };
    }
    if (type === "advance" || type === "back") {
      const dir = type === "advance" ? next.facing : -next.facing;
      const dest = next.pos + dir;
      if (!inRange(dest)) {
        return {
          state: state,
          message: "棋盤只到 −10 和 10，這一步走不出去。請檢查面向和格數。",
        };
      }
      if (type === "back") {
        next.usedBack = true;
        next.backSteps += 1;
        next.hops.push({ from: next.pos, to: dest, back: true });
        next.pos = dest;
        return { state: next, message: "" };
      }
      if (next.signIndex < next.expr.events.length) next.advanceBeforeDone = true;
      next.steps += 1;
      next.hops.push({ from: next.pos, to: dest, back: false });
      next.pos = dest;
      return { state: next, message: "" };
    }
    return { state: state, message: "" };
  }

  function sameList(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
    return true;
  }

  function diagnose(state) {
    const exp = solve(state.expr);
    const signsDone = state.signIndex >= state.expr.events.length;
    const facingsMatch = sameList(state.facings, exp.facings);
    const ordered =
      signsDone && !state.advanceBeforeDone && state.turnsDuringAdvance === 0;
    const ok =
      ordered &&
      !state.usedBack &&
      state.pos === exp.end &&
      state.steps === exp.steps &&
      state.turns === exp.turns &&
      facingsMatch;
    if (ok) return { ok: true, code: "A" };
    if (state.usedBack) return { ok: false, code: "B" };
    if (!signsDone) return { ok: false, code: "INCOMPLETE" };

    if (
      state.expr.start < 0 &&
      state.steps === exp.steps &&
      state.turns === exp.turns + 1 &&
      state.pos === state.expr.start - exp.facing * exp.steps
    ) {
      return { ok: false, code: "START" };
    }

    if (
      state.expr.secondValue < 0 &&
      state.pos === state.expr.secondValue &&
      state.pos !== exp.end
    ) {
      return { ok: false, code: "D" };
    }

    if (
      exp.turns >= 2 &&
      state.turns === 0 &&
      state.steps === exp.steps &&
      state.pos === exp.end
    ) {
      return { ok: false, code: "F" };
    }

    if (
      exp.turns >= 2 &&
      state.turns === 1 &&
      state.steps === exp.steps &&
      state.pos === state.expr.start - state.expr.magnitude
    ) {
      return { ok: false, code: "E" };
    }

    if (
      state.expr.inner === "-" &&
      state.expr.op === "+" &&
      state.turns === 0 &&
      state.steps === exp.steps &&
      state.pos === state.expr.start + state.expr.magnitude
    ) {
      return { ok: false, code: "C" };
    }

    if (
      state.expr.op === "-" &&
      state.turns === 0 &&
      exp.turns >= 1 &&
      state.steps === exp.steps &&
      state.pos === state.expr.start + state.expr.magnitude
    ) {
      return { ok: false, code: "OP" };
    }

    if (
      facingsMatch &&
      state.turns === exp.turns &&
      state.steps === exp.steps - 1 &&
      state.pos === state.expr.start + exp.facing * (exp.steps - 1)
    ) {
      return { ok: false, code: "COUNT" };
    }

    if (
      facingsMatch &&
      state.turns === exp.turns &&
      state.steps === exp.steps + 1 &&
      state.pos === state.expr.start + exp.facing * (exp.steps + 1)
    ) {
      return { ok: false, code: "COUNT" };
    }

    if (state.turns > exp.turns && state.steps === exp.steps) {
      return { ok: false, code: "EXTRA" };
    }

    if (
      state.pos === exp.end &&
      state.steps === exp.steps &&
      state.turns === exp.turns &&
      facingsMatch &&
      !ordered
    ) {
      return { ok: false, code: "ORDER" };
    }

    return { ok: false, code: "GENERIC" };
  }

  function diagnoseAnswer(exprOrText, answer) {
    const expr = typeof exprOrText === "string" ? parse(exprOrText) : exprOrText;
    const exp = solve(expr);
    if (answer === null || answer === undefined || Number.isNaN(answer)) {
      return { ok: false, code: "NAN" };
    }
    if (answer === exp.end) return { ok: true, code: "A" };
    if (expr.secondValue < 0 && answer === expr.secondValue) return { ok: false, code: "D" };
    if (expr.inner === "-" && expr.op === "+" && answer === expr.start + expr.magnitude) {
      return { ok: false, code: "C" };
    }
    if (expr.inner === "-" && expr.op === "-" && answer === expr.start - expr.magnitude) {
      return { ok: false, code: "E" };
    }
    if (expr.op === "-" && expr.inner !== "-" && answer === expr.start + expr.magnitude) {
      return { ok: false, code: "OP" };
    }
    return { ok: false, code: "GENERIC" };
  }

  function parseAnswer(text) {
    if (text == null) return null;
    let s = String(text).trim();
    if (!s) return null;
    s = s.replace(/[−–—－]/g, "-").replace(/＋/g, "+");
    const part = s.includes("=") ? s.split("=").pop() : s;
    const compact = part.replace(/\s+/g, "");
    if (!/^[+-]?\d+$/.test(compact)) return null;
    return Number(compact);
  }

  function formatSigned(n) {
    if (n === 0) return "0";
    return (n > 0 ? "+" : "−") + Math.abs(n);
  }

  function arrow(facing) {
    return facing < 0 ? "←" : "→";
  }

  function arrows(list) {
    return list.map(arrow).join(" ");
  }

  function formatExpr(exprOrText) {
    const expr = typeof exprOrText === "string" ? parse(exprOrText) : exprOrText;
    const start = expr.start < 0 ? "−" + Math.abs(expr.start) : String(expr.start);
    const op = expr.op === "-" ? "−" : "+";
    const second = expr.inner
      ? "(" + (expr.inner === "-" ? "−" : "+") + expr.magnitude + ")"
      : String(expr.magnitude);
    return start + " " + op + " " + second;
  }

  function symbolLabel(event) {
    if (event.kind === "op" && event.symbol === "+") return "運算符號 +";
    if (event.kind === "op" && event.symbol === "-") return "運算符號 −";
    if (event.kind === "inner" && event.symbol === "-") return "括號裏的 −";
    if (event.kind === "inner" && event.symbol === "+") return "括號裏的 +";
    return "符號";
  }

  function scripted(exprOrText) {
    const expr = typeof exprOrText === "string" ? parse(exprOrText) : exprOrText;
    let state = startPlay(expr);
    expr.events.forEach(function (event) {
      if (event.reverses) state = apply(state, "turn").state;
      state = apply(state, "commit").state;
    });
    for (let i = 0; i < expr.magnitude; i += 1) state = apply(state, "advance").state;
    return state;
  }

  return {
    MIN: MIN,
    MAX: MAX,
    QUESTIONS: QUESTIONS,
    parse: parse,
    solve: solve,
    startPlay: startPlay,
    apply: apply,
    diagnose: diagnose,
    diagnoseAnswer: diagnoseAnswer,
    parseAnswer: parseAnswer,
    formatSigned: formatSigned,
    formatExpr: formatExpr,
    arrow: arrow,
    arrows: arrows,
    symbolLabel: symbolLabel,
    scripted: scripted,
  };
});
