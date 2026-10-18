/* 數線棋（簡化流程）
   兩條規則不變：起點符號不算轉身；「−」＝反轉；不設後退。
   TODO(stage2): 計時、英文、教師板、乘除。
*/
(function () {
  const STORAGE = "nlchess.v10";
  const STEPS = [
    { id: "intro", label: "開始" },
    { id: "warmup", label: "熱身" },
    { id: "negstart", label: "負起點" },
    { id: "challenge", label: "挑戰" },
    { id: "match", label: "配對" },
    { id: "exit", label: "出門" },
  ];

  const PATH = {
    warmup: [
      { id: "w1", expr: "4+3" },
      { id: "w2", expr: "6−2" },
      { id: "w3", expr: "1−4" },
    ],
    negstart: [
      { id: "n7", expr: "−4+3" },
      { id: "n8", expr: "−2−5" },
    ],
    challenge: [
      { id: "c11", expr: "3+(−5)", ask: "t", turns: 1 },
      { id: "c12", expr: "4−(−2)", ask: "t", turns: 2 },
      { id: "c13", expr: "(−3)+(−5)", ask: "odd", turns: 1 },
      { id: "c14", expr: "(−3)−(−5)", ask: "w" },
    ],
    exit: [
      { id: "e1", expr: "5+(−3)" },
      { id: "e2", expr: "5−(−3)" },
      { id: "e3", expr: "(−4)+2", label: "(−4)＋(+2)" },
      { id: "e4", expr: "(−4)−2", label: "(−4)−(+2)" },
      { id: "e5", expr: "(−6)+(−1)" },
      { id: "e6", expr: "(−6)−(−1)" },
    ],
  };

  const ROUNDS = [
    {
      pairs: [
        ["3＋(−5)", "3−5"],
        ["3−(−5)", "3＋5"],
      ],
      distractors: ["5−3", "(−5)−3"],
    },
    {
      pairs: [
        ["(−3)＋(−5)", "(−3)−5"],
        ["(−3)−(−5)", "(−3)＋5"],
      ],
      distractors: ["(−3)＋3", "5−3"],
    },
  ];

  let focusHint = false;
  let focusSummary = false;
  let scrollTop = false;
  let state = loadState();

  function blankState() {
    return {
      version: 10,
      see: "",
      seeDone: false,
      turnsDraft: {},
      turnsOk: {},
      facePick: {},
      faceOk: {},
      oddLike: "",
      oddOk: false,
      wonder: "",
      wonderDone: false,
      section: "intro",
      qIndex: 0,
      play: null,
      drafts: {},
      solved: {},
      hints: {},
      notice: "",
      matchRound: 0,
      matchSel: "",
      matched: {},
      decks: {},
      matchMsg: "",
      exitDraft: {},
      exitTries: {},
      exitHint: {},
      exitReveal: {},
      summaryDraft: { n1: "", like1: "", n2: "", like2: "", rewrite: "" },
      summaryDone: false,
      summaryTries: 0,
    };
  }

  function loadState() {
    const base = blankState();
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return base;
      const data = JSON.parse(raw);
      if (!data || data.version !== 10) return base;
      ["section", "notice", "matchSel", "matchMsg", "see", "wonder"].forEach(function (key) {
        if (data[key]) base[key] = data[key];
      });
      base.seeDone = !!data.seeDone;
      base.wonderDone = !!data.wonderDone;
      base.turnsDraft = data.turnsDraft || {};
      base.turnsOk = data.turnsOk || {};
      base.facePick = data.facePick || {};
      base.faceOk = data.faceOk || {};
      base.oddLike = data.oddLike || "";
      base.oddOk = !!data.oddOk;
      base.summaryDraft = Object.assign(
        { n1: "", like1: "", n2: "", like2: "", rewrite: "" },
        data.summaryDraft || {}
      );
      base.summaryDone = !!data.summaryDone;
      base.summaryTries = data.summaryTries || 0;
      base.qIndex = Number.isInteger(data.qIndex) ? data.qIndex : 0;
      base.matchRound = Number.isInteger(data.matchRound) ? data.matchRound : 0;
      base.play = data.play && data.play.expr ? data.play : null;
      base.drafts = data.drafts || {};
      base.solved = data.solved || {};
      base.hints = data.hints || {};
      base.matched = data.matched || {};
      base.decks = data.decks || {};
      base.exitDraft = data.exitDraft || {};
      base.exitTries = data.exitTries || {};
      base.exitHint = data.exitHint || {};
      base.exitReveal = data.exitReveal || {};
      if (!STEPS.some(function (step) { return step.id === base.section; })) base.section = "intro";
      return base;
    } catch (err) {
      return base;
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch (err) { /* ignore */ }
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function listOf(section) {
    return PATH[section] || [];
  }

  function doneList(section) {
    return listOf(section).every(function (q) { return !!state.solved[q.id]; });
  }

  function challengeReady() {
    return state.seeDone &&
      doneList("challenge") &&
      !!state.turnsOk.c11 &&
      !!state.turnsOk.c12 &&
      !!state.faceOk.c11 &&
      !!state.faceOk.c12 &&
      state.oddOk &&
      state.wonderDone;
  }

  function matchDone() {
    return ROUNDS.every(function (round, ri) {
      return round.pairs.every(function (_, pi) { return !!state.matched[ri + "-" + pi]; });
    });
  }

  function exitAnswersDone() {
    return PATH.exit.every(function (q) {
      return NL.parseAnswer(state.exitDraft[q.id]) === NL.solve(q.expr).end;
    });
  }

  function exitDone() {
    return exitAnswersDone() && !!state.summaryDone;
  }

  function normBlank(value) {
    return String(value || "").replace(/\s+/g, "").replace(/[。．.！!，,]/g, "");
  }

  function acceptTimes(value, n) {
    const s = normBlank(value).replace(/次$/, "");
    if (n === 1) return s === "1" || s === "１" || s === "一";
    return s === "2" || s === "２" || s === "二" || s === "兩" || s === "两";
  }

  function acceptLike(value, word) {
    const s = normBlank(value).replace(/^(比較像|像|比較)/, "").replace(/法$/, "");
    return s === word;
  }

  function acceptRewrite(value) {
    const s = normBlank(value);
    if (!s || /負/.test(s) || /負負|得正/.test(s)) return false;
    const add = /加/.test(s) || /[+＋]/.test(s);
    return add && /正/.test(s);
  }

  function summaryCorrect() {
    const d = state.summaryDraft || {};
    return acceptTimes(d.n1, 1) && acceptLike(d.like1, "減") &&
      acceptTimes(d.n2, 2) && acceptLike(d.like2, "加") &&
      acceptRewrite(d.rewrite);
  }

  function summaryHint() {
    const d = state.summaryDraft || {};
    if (!acceptTimes(d.n1, 1) || !acceptTimes(d.n2, 2)) return "再數『−』：一個轉一次，兩個轉兩次。";
    if (!acceptLike(d.like1, "減") || !acceptLike(d.like2, "加")) return "再想那面向像加，還是像減。";
    if ((state.summaryTries || 0) >= 2) return "減一個負數，可以改寫成加一個正數。";
    return "減一個負數，可以改寫成加一個什麼？";
  }

  function isComplete(id) {
    if (id === "intro") return state.section !== "intro" || doneList("warmup");
    if (id === "warmup") return doneList("warmup");
    if (id === "negstart") return doneList("negstart");
    if (id === "challenge") return challengeReady();
    if (id === "match") return matchDone();
    if (id === "exit") return exitDone();
    return false;
  }

  function isUnlocked(id) {
    if (id === "intro" || id === "warmup") return true;
    if (id === "negstart") return doneList("warmup");
    if (id === "challenge") return doneList("negstart");
    if (id === "match") return challengeReady();
    if (id === "exit") return matchDone();
    return false;
  }

  function snapshot(play) {
    return {
      pos: play.pos,
      facing: play.facing,
      facings: play.facings.slice(),
      turns: play.turns,
      steps: play.steps,
      hops: (play.hops || []).map(function (hop) { return { from: hop.from, to: hop.to, back: !!hop.back }; }),
    };
  }

  function openQuestion(key, exprText) {
    const draft = state.drafts[key];
    if (draft && draft.expr && !draft.locked) {
      draft.expr = NL.parse(exprText);
      draft.exprText = exprText;
      draft.key = key;
      state.play = draft;
      return;
    }
    const play = NL.startPlay(exprText);
    play.key = key;
    play.exprText = exprText;
    if (state.solved[key]) {
      const snap = state.solved[key];
      play.pos = snap.pos;
      play.facing = snap.facing;
      play.facings = snap.facings.slice();
      play.turns = snap.turns;
      play.steps = snap.steps;
      play.hops = (snap.hops || []).map(function (hop) { return { from: hop.from, to: hop.to, back: !!hop.back }; });
      play.signIndex = play.expr.events.length;
      play.locked = true;
    }
    state.play = play;
    state.drafts[key] = play;
  }

  function enterSection(id) {
    if (!isUnlocked(id)) return;
    state.section = id;
    state.notice = "";
    if (id === "warmup" || id === "negstart" || id === "challenge") {
      const list = listOf(id);
      let index = list.findIndex(function (q) {
        if (!state.solved[q.id]) return true;
        if (id === "challenge" && q.ask === "t" && (!state.turnsOk[q.id] || !state.faceOk[q.id])) return true;
        if (id === "challenge" && q.ask === "odd" && !state.oddOk) return true;
        if (id === "challenge" && q.ask === "w" && !state.wonderDone) return true;
        return false;
      });
      if (index < 0) index = 0;
      state.qIndex = index;
      openQuestion(list[index].id, list[index].expr);
    }
    if (id === "match") ensureDeck(state.matchRound);
  }

  function sync() {
    const id = state.section;
    if (id === "warmup" || id === "negstart" || id === "challenge") {
      const list = listOf(id);
      state.qIndex = Math.max(0, Math.min(list.length - 1, state.qIndex | 0));
      const q = list[state.qIndex];
      if (!state.play || state.play.key !== q.id) openQuestion(q.id, q.expr);
    }
    if (id === "match") ensureDeck(state.matchRound);
  }

  function rulesHTML() {
    return (
      '<ul class="rules">' +
      "<li><strong>規則一</strong>　起點＝第一個數，開始面向右<p class=\"note\">起點的正負號不算轉身</p></li>" +
      "<li><strong>規則二</strong>　「+」不轉　「−」轉一次<p class=\"note\">數字＝前進格數，不設後退</p></li>" +
      "</ul>"
    );
  }

  function currentChallenge() {
    if (state.section !== "challenge") return null;
    return listOf("challenge")[state.qIndex] || null;
  }

  function challengeLabel(expr) {
    const parsed = NL.parse(expr);
    const start = parsed.start < 0 ? "(−" + Math.abs(parsed.start) + ")" : String(parsed.start);
    const op = parsed.op === "-" ? "−" : "＋";
    const second = parsed.inner
      ? "(" + (parsed.inner === "-" ? "−" : "＋") + parsed.magnitude + ")"
      : String(parsed.magnitude);
    return start + op + second;
  }

  function boardItems() {
    return PATH.warmup.concat(PATH.negstart, PATH.challenge);
  }

  function recordHTML() {
    const rows = boardItems().filter(function (q) { return state.solved[q.id]; }).map(function (q) {
      const snap = state.solved[q.id];
      return "<tr><td>" + esc(challengeLabel(q.expr)) + "</td><td>" + snap.turns +
        "</td><td class=\"arrows\">" + esc(NL.arrows(snap.facings)) + "</td><td>" +
        esc(NL.formatSigned(snap.pos)) + "</td></tr>";
    }).join("");
    return (
      '<aside class="record">' +
      "<h2>本關紀錄</h2>" +
      '<div class="table-scroll"><table><thead><tr><th>算式</th><th>轉身</th><th>面向</th><th>終點</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="4">完成一題後會記在這裡。</td></tr>') +
      "</tbody></table></div></aside>"
    );
  }
  function renderSee() {
    const exprs = listOf("challenge").map(function (q) {
      return '<span class="see-expr">' + esc(challengeLabel(q.expr)) + "</span>";
    }).join("");
    return (
      '<div class="workspace">' +
      '<section class="card">' +
      '<div class="see-list">' + exprs + "</div>" +
      "<h2 class=\"stw-title\">見</h2>" +
      "<p class=\"stw-q\">這四題和剛才『熱身／負起點』有什麼不同？</p>" +
      '<input type="text" data-save="see" value="' + esc(state.see) + '">' +
      noticeHTML() +
      '<button type="button" class="btn btn-primary" data-act="see-done">開始行</button>' +
      "</section>" +
      recordHTML() +
      "</div>"
    );
  }

  function pendingThink(q) {
    return !!(q && q.ask === "t" && (!state.turnsOk[q.id] || !state.faceOk[q.id]));
  }

  function pendingWonder(q) {
    return !!(q && q.ask === "w" && !state.wonderDone);
  }

  function pendingOdd(q) {
    return !!(q && q.ask === "odd" && !state.oddOk);
  }

  function facePrompt(turns) {
    return (turns === 2 ? "轉兩次後" : "轉一次後") + "，面向哪一邊？比較像『加』還是『減』？";
  }

  function choiceBtn(q, kind, val) {
    const pick = (state.facePick && state.facePick[q.id]) || {};
    const on = pick[kind] === val ? " sel" : "";
    return '<button type="button" class="chip' + on + '" data-act="face-pick" data-kind="' + kind + '" data-val="' + val + '">' + val + "</button>";
  }

  function promptNote() {
    if (!state.notice || state.notice.indexOf("符合") >= 0) return "";
    return '<p class="note">' + esc(state.notice) + "</p>";
  }

  function promptHTML(play) {
    const q = currentChallenge();
    if (!q || !play || !play.locked) return "";
    if (q.ask === "t" && !state.turnsOk[q.id]) {
      return (
        '<section class="stw">' +
        "<h2 class=\"stw-title\">想</h2>" +
        "<p>轉了幾次？</p>" +
        '<div class="stw-row">' +
        '<input type="text" inputmode="numeric" data-save="turnsDraft.' + q.id + '" data-enter="turns" value="' + esc(state.turnsDraft[q.id] || "") + '">' +
        '<button type="button" class="btn btn-primary" data-act="turns-check">確定</button>' +
        "</div>" +
        promptNote() +
        "</section>"
      );
    }
    if (q.ask === "t" && !state.faceOk[q.id]) {
      return (
        '<section class="stw stw-face">' +
        "<h2 class=\"stw-title\">想</h2>" +
        "<p>" + facePrompt(q.turns) + "</p>" +
        '<div class="choice-row"><span>面向</span>' +
        choiceBtn(q, "side", "左") + choiceBtn(q, "side", "右") +
        '<span>像</span>' +
        choiceBtn(q, "like", "加") + choiceBtn(q, "like", "減") +
        "</div>" +
        promptNote() +
        "</section>"
      );
    }
    if (q.ask === "odd" && !state.oddOk) {
      const like = state.oddLike;
      return (
        '<section class="stw">' +
        "<h2 class=\"stw-title\">奇</h2>" +
        "<p>這一題轉了幾次？轉一次身（＋− 或 −＋）時，結果比較像『加』還是『減』？</p>" +
        '<div class="odd-row">' +
        '<input type="text" inputmode="numeric" data-save="turnsDraft.' + q.id + '" data-enter="odd" value="' + esc(state.turnsDraft[q.id] || "") + '">' +
        '<button type="button" class="chip' + (like === "加" ? " sel" : "") + '" data-act="odd-like" data-val="加">加</button>' +
        '<button type="button" class="chip' + (like === "減" ? " sel" : "") + '" data-act="odd-like" data-val="減">減</button>' +
        '<button type="button" class="btn btn-primary" data-act="odd-check">確定</button>' +
        "</div>" +
        promptNote() +
        "</section>"
      );
    }
    if (q.ask === "w" && !state.wonderDone) {
      return (
        '<section class="stw">' +
        "<h2 class=\"stw-title\">奇</h2>" +
        "<p>為什麼轉兩次後，和『加法』一樣？轉一次身（＋− 或 −＋）又會怎樣？</p>" +
        '<div class="stw-row">' +
        '<input type="text" data-save="wonder" data-enter="wonder" value="' + esc(state.wonder || "") + '">' +
        '<button type="button" class="btn btn-next" data-act="wonder-next">去配對</button>' +
        "</div>" +
        promptNote() +
        "</section>"
      );
    }
    return "";
  }

  function boardSVG(play) {
    const width = 920;
    const height = 210;
    const padL = 42;
    const padR = 36;
    const lineY = 132;
    function xOf(value) {
      return padL + ((value + 10) / 20) * (width - padL - padR);
    }
    let ticks = "";
    for (let value = -10; value <= 10; value += 1) {
      const x = xOf(value);
      const major = value % 5 === 0;
      ticks += '<line x1="' + x + '" y1="' + (lineY - (major ? 14 : 8)) + '" x2="' + x + '" y2="' + (lineY + 6) + '" stroke="#211e1a" stroke-width="' + (major ? 2.2 : 1.2) + '"/>';
      ticks += '<text x="' + x + '" y="' + (lineY + 26) + '" text-anchor="middle" font-size="' + (major ? 15 : 12) + '" font-family="WenQuanYi Micro Hei, sans-serif" font-weight="' + (major ? 700 : 500) + '" fill="#1c1916">' + (value < 0 ? "−" + Math.abs(value) : String(value)) + "</text>";
    }
    const lane = {};
    let hops = "";
    let stepNo = 0;
    (play.hops || []).forEach(function (hop) {
      const x1 = xOf(hop.from);
      const x2 = xOf(hop.to);
      const key = Math.min(hop.from, hop.to) + ":" + Math.max(hop.from, hop.to);
      const laneIndex = lane[key] || 0;
      lane[key] = laneIndex + 1;
      const peak = lineY - 34 - laneIndex * 14;
      const mid = (x1 + x2) / 2;
      const color = hop.back ? "#b6402c" : "#1c1916";
      hops += '<path d="M ' + x1 + " " + (lineY - 8) + " Q " + mid + " " + peak + " " + x2 + " " + (lineY - 8) + '" fill="none" stroke="' + color + '" stroke-width="1.7"' + (hop.back ? ' stroke-dasharray="4 3"' : "") + "/>";
      hops += '<text x="' + mid + '" y="' + (peak - 2) + '" text-anchor="middle" font-size="13" font-family="WenQuanYi Micro Hei, sans-serif" fill="' + color + '">' + (hop.back ? "退" : String(++stepNo)) + "</text>";
    });
    const face = play.facing < 0 ? -1 : 1;
    const px = xOf(play.pos);
    const label = "棋子在 " + NL.formatSigned(play.pos) + "，面向" + (face < 0 ? "左" : "右");
    return (
      '<div class="board-scroll"><svg viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="' + esc(label) + '">' +
      '<line x1="36" y1="' + lineY + '" x2="900" y2="' + lineY + '" stroke="#211e1a" stroke-width="3"/>' +
      '<polygon points="900,' + (lineY - 6) + " 912," + lineY + " 900," + (lineY + 6) + '" fill="#211e1a"/>' +
      ticks +
      '<circle cx="' + xOf(play.expr.start) + '" cy="' + lineY + '" r="5.5" fill="#1c1916"/>' +
      hops +
      '<g class="piece" data-x="' + px + '" transform="translate(' + px + "," + (lineY - 34) + ')">' +
      '<ellipse cx="0" cy="20" rx="14" ry="4" fill="rgba(0,0,0,.16)"/>' +
      '<circle r="17" fill="#c24532" stroke="#8c2f1f" stroke-width="1.4"/>' +
      '<path d="M-6 -8 L12 0 L-6 8 Z" fill="#fff" transform="scale(' + face + ',1)"/>' +
      "</g></svg></div>"
    );
  }

  function exprHTML(expr, signIndex) {
    const wrapped = /^[（(]/.test(String((state.play && state.play.exprText) || "").replace(/\s+/g, ""));
    const start = expr.start < 0
      ? (wrapped ? "(−" + Math.abs(expr.start) + ")" : "−" + Math.abs(expr.start))
      : String(expr.start);
    const op = expr.op === "-" ? "−" : "+";
    const opCls = signIndex === 0 ? "now" : "done";
    let second;
    if (expr.inner) {
      const inn = expr.inner === "-" ? "−" : "+";
      const cls = signIndex === 1 ? "now" : signIndex > 1 ? "done" : "";
      second = '<span class="tk ' + cls + '">(' + inn + expr.magnitude + ")</span>";
    } else {
      second = '<span class="tk ' + (signIndex >= 1 ? "count" : "") + '">' + expr.magnitude + "</span>";
    }
    return '<span class="tk done">' + start + '</span> <span class="tk ' + opCls + '">' + op + "</span> " + second;
  }

  function logLine(play) {
    return "起點 " + NL.formatSigned(play.expr.start) + "　" + NL.arrows(play.facings) + "　轉 " + play.turns + "　進 " + play.steps + "　現在 " + NL.formatSigned(play.pos);
  }

  function hintHTML(key) {
    const hint = state.hints[key];
    if (!hint) return "";
    const section = state.section === "challenge" ? "challenge" : "warmup";
    const line = NLHints.text(hint.code, hint.layer, section);
    const more = hint.layer < NLHints.maxLayer(hint.code, section)
      ? '<button type="button" class="btn btn-ghost" data-act="more-hint">再提示</button>'
      : "";
    return '<section class="hint"><p>' + esc(line) + "</p>" + more + "</section>";
  }

  function noticeHTML() {
    if (!state.notice) return "";
    const q = currentChallenge();
    const asking = q && state.play && state.play.locked && (pendingThink(q) || pendingOdd(q) || pendingWonder(q));
    if (asking) return "";
    const ok = state.notice.indexOf("符合") >= 0 || state.notice.indexOf("對了") >= 0;
    return '<p class="notice ' + (ok ? "ok" : "") + '">' + esc(state.notice) + "</p>";
  }

  function controlsHTML(play) {
    const locked = !!play.locked;
    const dis = locked ? " disabled" : "";
    const signs = play.signIndex < play.expr.events.length;
    const face = play.facing < 0 ? "← 左" : "右 →";
    const faceCls = play.facing < 0 ? "face-left" : "face-right";
    const main = signs
      ? '<button type="button" class="btn btn-ghost" data-act="keep"' + dis + ">不轉</button>" +
        '<button type="button" class="btn btn-turn" data-act="flip"' + dis + ">轉身</button>"
      : '<button type="button" class="btn btn-go" data-act="advance"' + dis + ">前進</button>";
    const q = currentChallenge();
    const hold = !!(q && (pendingThink(q) || pendingOdd(q) || pendingWonder(q)));
    const nextText = q && state.qIndex === listOf("challenge").length - 1 ? "去配對" : "下一題";
    const finish = locked && !hold
      ? '<button type="button" class="btn btn-next" data-act="next">' + nextText + "</button>"
      : locked
        ? ""
        : '<button type="button" class="btn btn-primary" data-act="submit"' + dis + ">完成</button>";
    return (
      '<div class="controls">' +
      '<div class="facing-flag ' + faceCls + '"><span>面向</span><strong>' + face + "</strong><span>" + NL.formatSigned(play.pos) + "</span></div>" +
      '<div class="btn-row">' + main + finish + "</div>" +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-back" data-act="back"' + dis + ">後退</button>" +
      '<button type="button" class="btn btn-ghost" data-act="reset">重置</button>' +
      "</div></div>"
    );
  }

  function renderIntro() {
    const demo = NL.scripted("2−5");
    demo.expr = NL.parse("2−5");
    return (
      '<section class="card">' +
      "<h2>兩條規則</h2>" + rulesHTML() +
      "<p class=\"fine\">例　2 − 5：面向右，減號轉身，前進 5，到 −3。</p>" +
      boardSVG(demo) +
      '<button type="button" class="btn btn-primary" data-act="start">開始</button>' +
      "</section>"
    );
  }

  function renderPlay() {
    const list = listOf(state.section);
    const q = list[state.qIndex];
    const play = state.play;
    const signs = play.signIndex < play.expr.events.length;
    const status = play.locked ? "行完了。" : signs ? "這個符號要轉嗎？" : "沿箭咀前進。已進 " + play.steps + " 格。";
    return (
      '<div class="workspace">' +
      '<div class="stage">' +
      '<p class="expr">' + exprHTML(play.expr, play.signIndex) + "</p>" +
      '<p class="status">' + esc(status) + "</p>" +
      promptHTML(play) +
      boardSVG(play) +
      controlsHTML(play) +
      "</div>" +
      recordHTML() +
      '<div class="below">' +
      noticeHTML() + hintHTML(play.key) +
      '<p class="fine logline">' + esc(logLine(play)) + "</p>" +
      "</div>" +
      "</div>"
    );
  }

  function ensureDeck(round) {
    if (state.decks[round]) return;
    const spec = ROUNDS[round];
    const cards = [];
    spec.pairs.forEach(function (pair, pi) {
      cards.push({ id: round + "-" + pi + "a", text: pair[0], pair: round + "-" + pi });
      cards.push({ id: round + "-" + pi + "b", text: pair[1], pair: round + "-" + pi });
    });
    spec.distractors.forEach(function (text, di) {
      cards.push({ id: round + "-d" + di, text: text, pair: "" });
    });
    for (let i = cards.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = cards[i];
      cards[i] = cards[j];
      cards[j] = tmp;
    }
    state.decks[round] = cards;
  }

  function renderMatch() {
    ensureDeck(state.matchRound);
    const cards = state.decks[state.matchRound];
    const roundClear = ROUNDS[state.matchRound].pairs.every(function (_, pi) {
      return !!state.matched[state.matchRound + "-" + pi];
    });
    const tiles = cards.map(function (card) {
      const on = state.matched[card.pair];
      const sel = state.matchSel === card.id;
      const cls = "tile" + (on ? " ok" : "") + (sel ? " sel" : "");
      return '<button type="button" class="' + cls + '" data-act="card" data-id="' + esc(card.id) + '"' + (on ? " disabled" : "") + ">" + esc(card.text) + "</button>";
    }).join("");
    const next = roundClear
      ? '<button type="button" class="btn btn-next" data-act="match-next">' + (state.matchRound < ROUNDS.length - 1 ? "下一組" : "去出門") + "</button>"
      : "";
    return (
      '<div class="workspace">' +
      '<section class="card">' +
      "<h2>把等價的兩張牌配在一起</h2>" +
      '<div class="tiles">' + tiles + "</div>" +
      (state.matchMsg ? '<p class="notice ' + (state.matchMsg === "對了" ? "ok" : "") + '">' + esc(state.matchMsg) + "</p>" : "") +
      next +
      "</section>" +
      recordHTML() +
      "</div>"
    );
  }

  function summaryHTML(done) {
    const d = state.summaryDraft || {};
    const field = function (key, wide) {
      return '<input type="text" class="sum' + (wide ? " wide" : "") + '" data-save="summaryDraft.' + key + '" data-enter="summary" value="' + esc(d[key] || "") + '"' + (done ? " readonly" : "") + ">";
    };
    return (
      '<section class="card summary">' +
      "<h2>三句</h2>" +
      '<p class="sum-line">1. 一個「−」→ 轉身 ' + field("n1") + " 次 → 結果像 " + field("like1") + "（加／減）</p>" +
      '<p class="sum-line">2. 兩個「−」→ 轉身 ' + field("n2") + " 次 → 結果像 " + field("like2") + "（加／減）</p>" +
      '<p class="sum-line">3. 所以：減一個負數，可以改寫成 ' + field("rewrite", true) + "。</p>" +
      (done ? "" : noticeHTML() + '<button type="button" class="btn btn-primary" data-act="summary-check">確定</button>') +
      "</section>"
    );
  }

  function renderExit() {
    const answersDone = exitAnswersDone();
    const done = answersDone && !!state.summaryDone;
    const blocks = PATH.exit.map(function (q) {
      const answer = NL.parseAnswer(state.exitDraft[q.id]);
      const correct = answer === NL.solve(q.expr).end;
      const hint = state.exitHint[q.id];
      let extra = "";
      if (hint && !correct) extra = '<div class="hint"><p>' + esc(NLHints.text(hint.code, hint.layer, "exit")) + "</p></div>";
      if (!correct && (state.exitTries[q.id] || 0) >= 3 && state.exitReveal[q.id]) {
        extra += '<p class="fine">終點 ' + NL.formatSigned(NL.solve(q.expr).end) + "</p>";
      } else if (!correct && (state.exitTries[q.id] || 0) >= 3) {
        extra += '<button type="button" class="btn btn-ghost" data-act="exit-reveal" data-id="' + q.id + '">看終點</button>';
      }
      const mark = correct && state.exitTries[q.id] != null ? '<span class="match-ok"> ✓</span>' : "";
      return (
        '<div class="exit-q"><label>' + esc(q.label || challengeLabel(q.expr)) + " ＝ " +
        '<input type="text" data-save="exitDraft.' + q.id + '" data-enter="exit" value="' + esc(state.exitDraft[q.id] || "") + '"' + (answersDone ? " readonly" : "") + "></label>" +
        mark + extra + "</div>"
      );
    }).join("");
    return (
      '<div class="workspace">' +
      '<section class="card">' +
      (done ? '<div class="done-banner"><h2>完成</h2><p>兩條規則沒有增加。</p></div>' : "<h2>不用棋盤，寫終點</h2>") +
      '<div class="board-off">棋盤收起</div>' +
      blocks +
      (answersDone ? "" : noticeHTML()) +
      (answersDone ? "" : '<button type="button" class="btn btn-primary" data-act="exit-submit">遞交</button>') +
      "</section>" +
      (answersDone ? summaryHTML(done) : "") +
      recordHTML() +
      "</div>"
    );
  }

  function shell(body) {
    const nav = STEPS.map(function (step) {
      const current = step.id === state.section;
      const unlocked = isUnlocked(step.id);
      const complete = isComplete(step.id);
      return '<button type="button" data-act="goto" data-section="' + step.id + '"' +
        (current ? ' aria-current="step"' : "") +
        (complete ? ' class="is-done"' : "") +
        (unlocked ? "" : " disabled") + ">" + esc(step.label) + (complete ? " ✓" : "") + "</button>";
    }).join("");
    return (
      '<header class="top"><div class="wrap"><p class="kicker">中一數學</p><h1>數線棋</h1></div></header>' +
      '<nav class="stepper" aria-label="進度">' + nav + "</nav>" +
      '<main class="wrap">' + body +
      '<footer class="footer"><button type="button" class="btn btn-ghost" data-act="clear">清除進度</button></footer></main>'
    );
  }

  function render() {
    const root = document.getElementById("app");
    try {
      sync();
      const y = scrollTop ? 0 : window.scrollY;
      let body = "";
      if (state.section === "intro") body = renderIntro();
      else if (state.section === "challenge" && !state.seeDone) body = renderSee();
      else if (state.section === "match") body = renderMatch();
      else if (state.section === "exit") body = renderExit();
      else body = renderPlay();
      root.innerHTML = shell(body);
      if (scrollTop) window.scrollTo(0, 0);
      else window.scrollTo(0, y);
      scrollTop = false;
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(function () {
          centerBoard();
          const prompt = document.querySelector(".stage .stw");
          if (prompt && prompt.scrollIntoView) {
            const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            prompt.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
          }
        });
      }
      if (focusHint) {
        const hint = document.querySelector(".hint");
        if (hint && hint.scrollIntoView) hint.scrollIntoView({ block: "nearest" });
        focusHint = false;
      }
      if (focusSummary) {
        const card = document.querySelector(".summary");
        if (card && card.scrollIntoView) card.scrollIntoView({ block: "nearest" });
        focusSummary = false;
      }
    } catch (err) {
      console.error(err);
      if (root) root.innerHTML = '<main class="wrap"><p>頁面顯示不到。</p><button type="button" class="btn btn-primary" data-act="clear">清除進度</button></main>';
    }
  }

  function centerBoard() {
    const scroller = document.querySelector(".stage .board-scroll") || document.querySelector(".board-scroll");
    const piece = scroller && scroller.querySelector(".piece");
    if (!scroller || !piece) return;
    const rect = piece.getBoundingClientRect();
    const host = scroller.getBoundingClientRect();
    scroller.scrollLeft += rect.left + rect.width / 2 - (host.left + host.width / 2);
  }

  function rememberHint(key, code) {
    const prev = state.hints[key];
    state.hints[key] = { code: code, layer: prev && prev.code === code ? prev.layer : 0 };
    focusHint = true;
  }

  function submitPlay() {
    const play = state.play;
    if (!play || play.locked) return;
    const verdict = NL.diagnose(play);
    if (verdict.ok) {
      state.solved[play.key] = snapshot(play);
      play.locked = true;
      state.drafts[play.key] = play;
      state.hints[play.key] = null;
      state.notice = "符合規則。";
    } else {
      rememberHint(play.key, verdict.code);
      state.notice = "";
    }
    save();
    render();
  }

  function onNext() {
    if (state.section === "challenge") {
      const list = listOf("challenge");
      const q = list[state.qIndex];
      if (pendingThink(q) || pendingOdd(q) || pendingWonder(q)) return;
      if (state.qIndex < list.length - 1) {
        state.qIndex += 1;
        openQuestion(list[state.qIndex].id, list[state.qIndex].expr);
        state.notice = "";
      } else if (state.wonderDone) {
        enterSection("match");
        scrollTop = true;
      }
      save();
      render();
      return;
    }
    const list = listOf(state.section);
    if (state.qIndex < list.length - 1) {
      state.qIndex += 1;
      openQuestion(list[state.qIndex].id, list[state.qIndex].expr);
      state.notice = "";
    } else {
      enterSection(state.section === "warmup" ? "negstart" : "challenge");
      scrollTop = true;
    }
    save();
    render();
  }

  function submitExit() {
    let missing = false;
    PATH.exit.forEach(function (q) {
      const answer = NL.parseAnswer(state.exitDraft[q.id]);
      if (answer === null) {
        missing = true;
        if (String(state.exitDraft[q.id] || "").trim()) {
          state.exitHint[q.id] = { code: "NAN", layer: 0 };
          state.exitTries[q.id] = (state.exitTries[q.id] || 0) + 1;
        }
        return;
      }
      const verdict = NL.diagnoseAnswer(q.expr, answer);
      if (verdict.ok) {
        state.exitHint[q.id] = null;
        if (state.exitTries[q.id] == null) state.exitTries[q.id] = 0;
        return;
      }
      const prev = state.exitHint[q.id];
      state.exitTries[q.id] = (state.exitTries[q.id] || 0) + 1;
      state.exitHint[q.id] = { code: verdict.code, layer: prev && prev.code === verdict.code ? Math.min(prev.layer + 1, 2) : 0 };
    });
    if (missing) state.notice = "還有空格。";
    else if (exitAnswersDone()) {
      state.notice = state.summaryDone ? "對了。" : "";
      if (!state.summaryDone) focusSummary = true;
    } else state.notice = "再試一次。";
    save();
    render();
  }

  function submitSummary() {
    const d = state.summaryDraft || {};
    const fields = [d.n1, d.like1, d.n2, d.like2, d.rewrite];
    if (fields.some(function (value) { return !String(value || "").trim(); })) {
      state.notice = "還有空格。";
    } else if (summaryCorrect()) {
      state.summaryDone = true;
      state.notice = "對了。";
    } else {
      state.summaryTries = (state.summaryTries || 0) + 1;
      state.notice = summaryHint();
    }
    focusSummary = true;
    save();
    render();
  }

  function onClick(event) {
    const btn = event.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    if (act === "goto") {
      if (!isUnlocked(btn.dataset.section)) return;
      enterSection(btn.dataset.section);
      scrollTop = true;
      save();
      render();
      return;
    }
    if (act === "start") {
      enterSection("warmup");
      scrollTop = true;
      save();
      render();
      return;
    }
    if (act === "clear") {
      if (!window.confirm("清除這部裝置上的進度？")) return;
      try { localStorage.removeItem(STORAGE); } catch (err) { /* ignore */ }
      state = blankState();
      scrollTop = true;
      render();
      return;
    }
    if (act === "keep" || act === "flip" || act === "advance" || act === "back") {
      if (!state.play || state.play.locked) return;
      let next = state.play;
      if (act === "flip") {
        next = NL.apply(next, "turn").state;
        next = NL.apply(next, "commit").state;
      } else if (act === "keep") {
        next = NL.apply(next, "commit").state;
      } else {
        const result = NL.apply(next, act);
        next = result.state;
        state.notice = result.message || "";
        if (act === "back") rememberHint(next.key, "B");
      }
      state.play = next;
      state.drafts[next.key] = next;
      save();
      render();
      return;
    }
    if (act === "reset") {
      const key = state.play.key;
      const exprText = state.play.exprText || NL.formatExpr(state.play.expr);
      state.play = NL.startPlay(exprText);
      state.play.key = key;
      state.play.exprText = exprText;
      state.drafts[key] = state.play;
      state.notice = "回到起點，面向右。";
      save();
      render();
      return;
    }
    if (act === "submit") { submitPlay(); return; }
    if (act === "see-done") {
      if (!String(state.see || "").trim()) state.notice = "寫一句再行。";
      else {
        state.seeDone = true;
        state.notice = "";
        enterSection("challenge");
        scrollTop = true;
      }
      save();
      render();
      return;
    }
    if (act === "turns-check") {
      const q = currentChallenge();
      if (!q || q.ask !== "t") return;
      const n = NL.parseAnswer(state.turnsDraft[q.id]);
      if (n === q.turns) {
        state.turnsOk[q.id] = true;
        state.notice = "";
      } else {
        state.notice = "再數負號，起點的不算。";
      }
      save();
      render();
      return;
    }
    if (act === "odd-like") {
      const q = currentChallenge();
      if (!q || q.ask !== "odd" || state.oddOk) return;
      state.oddLike = btn.dataset.val === "減" ? "減" : "加";
      state.notice = "";
      save();
      render();
      return;
    }
    if (act === "odd-check") {
      const q = currentChallenge();
      if (!q || q.ask !== "odd" || state.oddOk) return;
      const n = NL.parseAnswer(state.turnsDraft[q.id]);
      if (!state.oddLike || n === null) state.notice = "寫次數，再選加或減。";
      else if (n !== 1) state.notice = "再數負號，起點的不算。";
      else if (state.oddLike !== "減") state.notice = "再想這一次轉，比較像加，還是像減。";
      else {
        state.oddOk = true;
        state.notice = "對了。";
      }
      save();
      render();
      return;
    }
    if (act === "face-pick") {
      const q = currentChallenge();
      if (!q || q.ask !== "t" || !state.turnsOk[q.id] || state.faceOk[q.id]) return;
      const kind = btn.dataset.kind === "like" ? "like" : "side";
      if (!state.facePick[q.id]) state.facePick[q.id] = { side: "", like: "" };
      state.facePick[q.id][kind] = btn.dataset.val;
      const pick = state.facePick[q.id];
      if (pick.side && pick.like) {
        const expect = q.turns === 2 ? { side: "右", like: "加" } : { side: "左", like: "減" };
        if (pick.side === expect.side && pick.like === expect.like) {
          state.faceOk[q.id] = true;
          state.notice = "對了。";
        } else if (pick.side !== expect.side) {
          state.notice = "再看棋子現在面向哪一邊。";
        } else {
          state.notice = "再想這面向比較像加，還是像減。";
        }
      } else {
        state.notice = "";
      }
      save();
      render();
      return;
    }
    if (act === "wonder-next") {
      if (!String(state.wonder || "").trim()) {
        state.notice = "寫一句。";
        save();
        render();
        return;
      }
      state.wonderDone = true;
      state.notice = "";
      onNext();
      return;
    }
    if (act === "more-hint") {
      const hint = state.hints[state.play.key];
      if (!hint) return;
      const section = state.section === "challenge" ? "challenge" : "warmup";
      hint.layer = Math.min(hint.layer + 1, NLHints.maxLayer(hint.code, section));
      focusHint = true;
      save();
      render();
      return;
    }
    if (act === "next") { onNext(); return; }
    if (act === "card") {
      const id = btn.dataset.id;
      const cards = state.decks[state.matchRound] || [];
      const card = cards.filter(function (item) { return item.id === id; })[0];
      if (!card || (card.pair && state.matched[card.pair])) return;
      if (!state.matchSel) {
        state.matchSel = id;
        state.matchMsg = "";
        save();
        render();
        return;
      }
      if (state.matchSel === id) {
        state.matchSel = "";
        save();
        render();
        return;
      }
      const first = cards.filter(function (item) { return item.id === state.matchSel; })[0];
      if (first && first.pair && first.pair === card.pair) {
        state.matched[first.pair] = true;
        state.matchMsg = "對了";
      } else {
        state.matchMsg = "這兩張不是一對";
      }
      state.matchSel = "";
      save();
      render();
      return;
    }
    if (act === "match-next") {
      if (state.matchRound < ROUNDS.length - 1) {
        state.matchRound += 1;
        state.matchSel = "";
        state.matchMsg = "";
        ensureDeck(state.matchRound);
      } else {
        enterSection("exit");
        scrollTop = true;
      }
      save();
      render();
      return;
    }
    if (act === "exit-submit") { submitExit(); return; }
    if (act === "summary-check") { submitSummary(); return; }
    if (act === "exit-reveal") {
      state.exitReveal[btn.dataset.id] = true;
      save();
      render();
    }
  }

  document.body.addEventListener("click", onClick);
  document.body.addEventListener("input", function (event) {
    const node = event.target;
    if (!node.dataset || !node.dataset.save) return;
    const parts = node.dataset.save.split(".");
    let cur = state;
    for (let i = 0; i < parts.length - 1; i += 1) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = node.value;
    save();
  });
  document.body.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && event.target.dataset && event.target.dataset.enter === "exit") {
      event.preventDefault();
      submitExit();
    }
    if (event.key === "Enter" && event.target.dataset && event.target.dataset.enter === "odd") {
      event.preventDefault();
      const btn = document.querySelector('[data-act="odd-check"]');
      if (btn) btn.click();
    }
    if (event.key === "Enter" && event.target.dataset && event.target.dataset.enter === "turns") {
      event.preventDefault();
      const btn = document.querySelector('[data-act="turns-check"]');
      if (btn) btn.click();
    }
    if (event.key === "Enter" && event.target.dataset && event.target.dataset.enter === "summary") {
      event.preventDefault();
      submitSummary();
    }
    if (event.key === "Enter" && event.target.dataset && event.target.dataset.enter === "wonder") {
      event.preventDefault();
      const btn = document.querySelector('[data-act="wonder-next"]');
      if (btn) btn.click();
    }
  });

  render();
})();
