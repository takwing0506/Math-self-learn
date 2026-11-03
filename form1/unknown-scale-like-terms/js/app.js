/* 未知之秤 · 第二章介面。
   同色拖在一起＝合併。加減項拖到另一盤＝兩邊同加或同減，放下相反項。
   乘除只用按鈕。 */
(function () {
  var Engine = window.LikeTermsEngine;
  var STORE = "like-terms-chapter-v1";
  var screen = "intro";
  var mode = "practice";
  var run = null;
  var results = [];
  var warm = null;
  var warmHold = false;
  var entryStep = 0;
  var entryPassed = false;
  var movePassed = false;
  var feedback = null;
  var banner = "";
  var settle = false;
  var fx = null;
  var selectedId = null;
  var shakeIds = [];
  var showOne = false;
  var checkDraft = "";
  var checkView = null;
  var focusCheck = false;
  var reflect = { merge: null, sign: null };
  var press = null;
  var fromPointer = false;
  var pointerAt = 0;
  var ghost = null;
  var timers = [];
  var coachTimer = 0;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ASK_ORDER = { see: "think", think: "wonder" };
  var ASK_LABEL = { see: "觀察", think: "思考", wonder: "追問" };
  var ASK_STEP = { see: "1／3", think: "2／3", wonder: "3／3" };
  var ENTRY_LABEL = ["觀察", "思考", "追問"];

  function readStore() {
    try { return JSON.parse(sessionStorage.getItem(STORE) || "{}"); }
    catch (e) { return {}; }
  }
  function writeStore(patch) {
    var cur = readStore();
    Object.keys(patch).forEach(function (key) { cur[key] = patch[key]; });
    try { sessionStorage.setItem(STORE, JSON.stringify(cur)); } catch (e) {}
  }
  var saved = readStore();
  entryPassed = !!saved.entryPassed;
  movePassed = !!saved.movePassed;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function fmt(n) {
    return n < 0 ? "−" + Math.abs(n) : String(n);
  }
  function later(fn, ms) {
    var id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  }
  function clearTimers() {
    timers.forEach(function (id) { window.clearTimeout(id); });
    timers = [];
  }
  function modeCount(name) {
    if (name === "challenge") return Engine.challengeCount;
    if (name === "trap") return Engine.trapCount;
    return Engine.practiceCount;
  }
  function modeName(name) {
    if (name === "challenge") return "挑戰";
    if (name === "trap") return "陷阱";
    return "練習";
  }

  function shell(body) {
    return (
      '<div class="back-bar"><div class="bar-links">' +
      '<a class="back-link" href="../">課題目錄</a>' +
      '<a class="back-link" href="../unknown-scale/">第一章</a>' +
      "</div></div>" +
      '<header class="top"><div class="wrap">' +
      '<p class="kicker">中一數學 · 一元一次方程</p>' +
      "<h1>未知之秤</h1>" +
      '<p class="sub">天平工房 · 第二章　同類項</p>' +
      "</div></header>" +
      '<main><div class="wrap stack">' + body + "</div></main>"
    );
  }
  function mottoHtml() {
    return '<p class="motto">' + esc(Engine.motto) + "</p>";
  }
  function pills(step) {
    var items = ["解題", "代入", "停一停"];
    return '<div class="pills">' + items.map(function (label, index) {
      var cls = index < step ? "done" : index === step ? "now" : "";
      return '<span class="pill ' + cls + '">' + label + "</span>";
    }).join("") + "</div>";
  }
  function feedbackHtml() {
    if (!feedback) return "";
    var cls = feedback.kind === "ok" ? "notice ok" : feedback.kind === "bad" ? "notice" : "hint";
    var lines = (feedback.lines || []).map(function (line) {
      return "<li>" + esc(line) + "</li>";
    }).join("");
    return '<div class="' + cls + '" id="feedback"><p>' + esc(feedback.text) + "</p>" +
      (lines ? '<ul class="check-lines">' + lines + "</ul>" : "") + "</div>";
  }
  function staticToken(t) {
    var cls = "token " + (t.type === "x" ? "token-x" : "token-w") + (t.neg ? " neg" : "");
    var kicker = t.type === "x" ? "<small>箱</small>" : "";
    return '<span class="' + cls + '" aria-hidden="true">' + kicker + "<b>" + esc(t.label) + "</b></span>";
  }
  function liveToken(t, displayOne) {
    var label = displayOne ? t.labelOne : t.label;
    var cls = ["token", t.type === "x" ? "token-x" : "token-w"];
    if (t.neg) cls.push("neg");
    if (t.fresh) cls.push("arrive");
    if (t.guided) cls.push("is-guide");
    if (t.leaving) cls.push("is-leaving");
    if (selectedId === t.id) cls.push("is-selected");
    if (shakeIds.indexOf(t.id) !== -1) cls.push("shake");
    var name = (t.type === "x" ? "未知箱 " : "砝碼 ") + label;
    var kicker = t.type === "x" ? "<small>箱</small>" : "";
    return '<button type="button" class="' + cls.join(" ") + '" data-term="' + esc(t.id) +
      '" data-side="' + t.side + '" data-kind="' + t.type + '" data-label="' + esc(label) +
      '" aria-pressed="' + (selectedId === t.id ? "true" : "false") + '" aria-label="' + esc(name) + '">' +
      kicker + "<b>" + esc(label) + "</b></button>";
  }
  function miniPan(side, tokens) {
    var name = side === "L" ? "左盤" : "右盤";
    var inner = tokens.length ? tokens.map(staticToken).join("") : '<span class="empty">空</span>';
    return '<div class="pan pan-' + side.toLowerCase() + '"><p class="pan-name">' + name +
      '</p><div class="tokens">' + inner + "</div></div>";
  }
  function boardHtml(board, caption) {
    return '<article class="board"><h3>' + esc(caption) + "</h3>" +
      '<p class="expr">' + esc(board.eq) + "</p>" +
      '<div class="pans">' + miniPan("L", board.L) +
      '<div class="mid"><div class="sync-label equals" aria-hidden="true">＝</div></div>' +
      miniPan("R", board.R) + "</div></article>";
  }
  function choiceButtons(choices, act) {
    return '<div class="choice-list">' + choices.map(function (choice, index) {
      return '<button type="button" class="btn btn-ghost" data-act="' + act + '" data-choice="' + index + '">' +
        esc(choice) + "</button>";
    }).join("") + "</div>";
  }
  function stepList(v, open) {
    var items = v.steps.map(function (step) {
      var tag = '<span class="step-tag">原式</span>';
      if (step.lamp) {
        var lamp = Engine.lamps[step.lamp] || { name: step.lamp };
        tag = '<span class="step-tag ' + step.lamp + '">' + esc(lamp.name) + "</span>";
      }
      var note = step.lamp ? "<small>" + esc(step.note) + "</small>" : "";
      return "<li><span class=\"step-eq\">" + esc(step.equation) + note + "</span>" + tag + "</li>";
    }).join("");
    return '<details class="steps-box"' + (open ? " open" : "") + "><summary>步驟</summary><ol class=\"steps\">" +
      items + "</ol></details>";
  }
  function lampButtons(v) {
    return '<div class="lamps">' + v.lamps.map(function (lamp) {
      var cls = "lamp " + lamp.state + (lamp.pulse ? " pulse" : "");
      return '<button type="button" class="' + cls + '" data-act="lamp" data-lamp="' + lamp.id + '" title="' + esc(lamp.title || lamp.detail) + '">' +
        "<b>" + esc(lamp.name) + "</b><small>" + esc(lamp.detail) + "</small></button>";
    }).join("") + "</div>";
  }

  function renderIntro() {
    var primary = entryPassed
      ? '<button type="button" class="btn btn-primary" data-act="hub">進入題目</button>' +
        '<button type="button" class="btn btn-ghost" data-act="review-entry">再看一次對比</button>'
      : '<button type="button" class="btn btn-primary" data-act="review-entry">先觀察兩條方程</button>';
    return (
      '<section class="card" data-screen="intro">' +
      mottoHtml() +
      '<p class="master">這一章的 x 可以出現在兩邊。先合併同色的項，再處理加減，最後才乘除。</p>' +
      "<ul class=\"rules\">" +
      "<li>未知箱和砝碼顏色不同。只有同色可以拖在一起合併。</li>" +
      "<li>加減項可以拖到另一盤：原盤拿走該項，另一盤放下相反項。這等於兩邊同加或同減。</li>" +
      "<li>乘除只用按鈕，兩邊一起乘或一起除。不要拖。</li>" +
      "<li>化成 x＝數 或 數＝x 才能按完成，然後代入原式。</li>" +
      "</ul>" +
      '<div class="lamps" aria-hidden="true"><span class="lamp idle">合併</span><span class="lamp idle">移項</span><span class="lamp idle">除數</span></div>' +
      '<p class="fine">每題由 100 分起算。代入錯扣 10 分，最低 0 分。第一次代入就對，另加 10 分。熱身辨認錯亦扣 10 分。</p>' +
      '<p class="fine">練習有黃虛線。陷阱和挑戰沒有。</p>' +
      '<div class="btn-row">' + primary + "</div>" +
      '<p class="fine">上一章：<a href="../unknown-scale/">天平工房 · 第一章</a></p>' +
      "</section>"
    );
  }
  function renderStw() {
    var entry = Engine.entry;
    var step = entry.steps[entryStep];
    return (
      '<section class="card" data-screen="stw">' +
      '<p class="q-no">' + ENTRY_LABEL[entryStep] + " " + (entryStep + 1) + "／3</p>" +
      "<h2>先看這兩條</h2>" +
      '<div class="contrast">' + boardHtml(entry.boards[0], entry.captions[0]) +
      boardHtml(entry.boards[1], entry.captions[1]) + "</div>" +
      '<p class="master">' + esc(step.ask) + "</p>" +
      choiceButtons(step.choices, "pick-entry") +
      feedbackHtml() +
      '<button type="button" class="text-btn" data-act="intro">返回開場</button>' +
      "</section>"
    );
  }
  function renderHub() {
    return (
      '<section class="card" data-screen="hub">' +
      mottoHtml() +
      "<h2>觀察完成</h2>" +
      '<p class="lead">可以先辨認同類項，也可以直接做題。練習有黃虛線，陷阱和挑戰沒有。</p>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="enter" data-mode="warmup">熱身：可／不可合併（4 題）</button>' +
      '<button type="button" class="btn btn-ghost" data-act="enter" data-mode="practice">練習（5 題）</button>' +
      '<button type="button" class="btn btn-ghost" data-act="enter" data-mode="trap">陷阱（3 題）</button>' +
      '<button type="button" class="btn btn-ghost" data-act="enter" data-mode="challenge">挑戰（3 題）</button>' +
      "</div>" +
      '<button type="button" class="text-btn" data-act="review-entry">再看一次對比</button>' +
      '<button type="button" class="text-btn" data-act="reset-move">下次拖未知箱時，再問三問</button>' +
      '<p class="fine">上一章：<a href="../unknown-scale/">天平工房 · 第一章</a></p>' +
      "</section>"
    );
  }
  function renderWarmup() {
    var v = Engine.warmupView(warm);
    var showReveal = !!v.reveal;
    var tokens = v.terms.map(function (t) {
      var label = showReveal ? t.labelOne : t.label;
      var cls = "token " + (t.type === "x" ? "token-x" : "token-w") + (t.neg ? " neg" : "");
      var kicker = t.type === "x" ? "<small>箱</small>" : "";
      return '<span class="' + cls + '">' + kicker + "<b>" + esc(label) + "</b></span>";
    }).join("");
    var actions = warmHold
      ? '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="warm-next">' +
        (v.number >= v.total ? "完成熱身" : "下一題") + "</button></div>"
      : '<div class="btn-row">' +
        '<button type="button" class="btn btn-primary" data-act="warm" data-can="1">可以合併</button>' +
        '<button type="button" class="btn btn-ghost" data-act="warm" data-can="0">不可以合併</button>' +
        "</div>";
    return (
      '<section class="card" data-screen="warmup">' +
      '<div class="q-head"><p class="q-no">熱身 ' + v.number + "／" + v.total + "</p>" +
      '<p class="score">本單 <b>' + v.score + "</b> 分</p></div>" +
      "<h2>這兩項可合併嗎？</h2>" +
      '<p class="expr">' + esc(v.expr) + "</p>" +
      (v.reveal ? '<p class="fine">' + esc(v.expr) + " 寫成 " + esc(v.reveal) + "，係數 1 先看得見。</p>" : "") +
      '<div class="tokens">' + tokens + "</div>" +
      feedbackHtml() +
      actions +
      '<button type="button" class="text-btn" data-act="hub">返回目錄</button>' +
      "</section>"
    );
  }
  function renderWarmDone() {
    return (
      '<section class="card" data-screen="warmup-done">' +
      "<h2>熱身完成</h2>" +
      '<p class="master">同色才是同類項。未知箱和砝碼不能合併。</p>' +
      "<p>辨認得分 <b>" + warm.score + "</b></p>" +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="enter" data-mode="practice">開始練習</button>' +
      '<button type="button" class="btn btn-ghost" data-act="hub">返回目錄</button>' +
      "</div></section>"
    );
  }

  function currentView() {
    if (!run) return null;
    if (fx && fx.phase === "leave") return Engine.view(run, { leavingId: fx.id });
    if (fx && (fx.phase === "place" || fx.phase === "ask")) return Engine.view(run, { preview: fx.plan });
    return Engine.view(run);
  }
  function scaleHtml(v, displayOne) {
    var shownBanner = "";
    if (fx && fx.phase === "leave") shownBanner = "拿走 " + fx.plan.removeLabel;
    else if (fx && (fx.phase === "place" || fx.phase === "ask")) shownBanner = fx.plan.banner;
    else if (settle) shownBanner = banner;
    var mid = shownBanner
      ? '<div class="sync-label">' + esc(shownBanner) + "</div>"
      : '<div class="sync-label equals" aria-hidden="true">＝</div>';
    var status = fx ? fx.plan.narration : v.ready ? "x 已經單獨在一邊。可以按完成。" : "天平保持平衡。";
    var cls = "scale" + (settle || fx ? " is-sync" : "") + (fx ? " is-locked" : "");
    function pan(side) {
      var guided = v.guide && v.guide.type === "move" && v.guide.to === side ? " is-guide" : "";
      var tokens = v.tokens[side];
      var inner = tokens.length ? tokens.map(function (t) { return liveToken(t, displayOne); }).join("") : '<span class="empty">空</span>';
      var name = side === "L" ? "左盤" : "右盤";
      return '<div class="pan pan-' + side.toLowerCase() + guided + '" data-pan="' + side + '" tabindex="0" aria-label="' + name + '">' +
        '<p class="pan-name">' + name + '</p><div class="tokens">' + inner + "</div></div>";
    }
    return '<div class="' + cls + '" id="scale">' +
      '<div class="pans">' + pan("L") + '<div class="mid">' + mid + "</div>" + pan("R") + "</div>" +
      '<div class="beam"></div><div class="pivot" aria-hidden="true"></div>' +
      '<div class="stand" aria-hidden="true"></div><div class="foot" aria-hidden="true"></div>' +
      '<p class="scale-status">' + esc(status) + "</p></div>";
  }
  function actionHtml(v) {
    if (fx && fx.phase === "ask") return inquiryHtml();
    if (fx) return '<p class="fine">看清楚兩盤：原盤拿走原項，另一盤放下相反項。</p>';
    var guideNote = "";
    if (v.mode === "practice") guideNote = v.coach ? '<p class="fine">' + esc(v.coach) + "</p>" : "";
    else if (v.mode === "trap") guideNote = '<p class="fine">陷阱題沒有黃虛線。只可合併同色的項。</p>';
    else guideNote = '<p class="fine">挑戰沒有黃虛線。</p>';
    var ops = v.actions.length
      ? '<div class="btn-row">' + v.actions.map(function (action) {
        var cls = action.guided ? "btn op-btn is-guide" : "btn op-btn btn-ghost";
        return '<button type="button" class="' + cls + '" data-act="op" data-type="' + esc(action.type) +
          '" data-value="' + esc(String(action.value)) + '">' + esc(action.label) + "</button>";
      }).join("") + "</div>"
      : (v.ready
        ? '<p class="fine">已經是 x＝數 或 數＝x。可以按完成，再代入原式。</p>'
        : '<p class="fine">乘除用按鈕。x 只留在一邊、而且係數還不是 1 的時候，按鈕才會出現。</p>');
    var finishCls = v.ready ? "btn btn-primary" : "btn btn-ghost";
    if (v.finishGuided) finishCls += " is-guide";
    return '<div class="action-card"><h3>乘除</h3>' + guideNote + ops +
      '<div class="btn-row nav-row">' +
      '<button type="button" class="' + finishCls + '" data-act="finish">完成</button>' +
      '<button type="button" class="btn btn-ghost" data-act="undo"' + (v.canUndo ? "" : " disabled") + ">返回上一步</button>" +
      "</div><p class=\"fine\">拖曳，或先點選再點目標。同色合併；拖到另一盤是兩邊同加或同減。</p></div>";
  }
  function inquiryHtml() {
    var inquiry = Engine.moveInquiry(fx.plan);
    var part = inquiry[fx.askStep];
    return '<div class="action-card" data-screen="move-stw">' +
      '<p class="q-no">' + ASK_LABEL[fx.askStep] + " " + ASK_STEP[fx.askStep] + "</p>" +
      '<p class="lead">' + esc(fx.plan.narration) + "這一步尚未寫入。</p>" +
      '<p class="master">' + esc(part.ask) + "</p>" +
      choiceButtons(part.choices, "pick-move") +
      '<button type="button" class="text-btn" data-act="cancel-move">取消，還原天平</button></div>';
  }
  function renderSolve() {
    var v = currentView();
    var displayOne = !!(v.unitCoach && (showOne || (fx && fx.phase !== "leave")));
    var eq = displayOne && v.equationOne !== v.equation ? v.equationOne : v.equation;
    var eqCls = "expr" + (v.previewing ? " preview" : "");
    var tag = v.previewing ? '<span class="preview-tag">預覽，尚未寫入</span>' : "";
    return (
      '<section class="card" data-screen="solve">' +
      '<div class="q-head"><p class="q-no">' + esc(v.setLabel) + " " + v.number + "／" + v.total + "</p>" +
      '<p class="score">本單 <b id="score">' + v.score + "</b> 分</p></div>" +
      pills(0) +
      '<div class="split"><h2>' + esc(v.title) + '</h2><span class="tag">' + esc(v.setLabel) + "</span></div>" +
      '<p class="lead">' + esc(v.brief) + "</p>" +
      '<p class="motto slim">' + esc(v.motto) + "</p>" +
      lampButtons(v) +
      '<p class="' + eqCls + '" id="equation">' + tag + esc(eq) + "</p>" +
      (displayOne && v.unitCoach ? '<p class="fine">' + esc(v.unitCoach) + "</p>" : "") +
      feedbackHtml() +
      scaleHtml(v, displayOne) +
      actionHtml(v) +
      stepList(v, false) +
      '<button type="button" class="text-btn" data-act="hub">返回目錄</button>' +
      "</section>"
    );
  }
  function renderCheck() {
    var v = Engine.view(run);
    var compare = "";
    if (checkView) {
      compare = '<div class="compare"><div><h3>左式</h3><p>' + esc(checkView.leftText) + "</p></div>" +
        "<div><h3>右式</h3><p>" + esc(checkView.rightText) + "</p></div></div>";
    }
    return (
      '<section class="card" data-screen="check">' +
      '<div class="q-head"><p class="q-no">' + esc(v.setLabel) + " " + v.number + "／" + v.total + "</p>" +
      '<p class="score">本單 <b>' + v.score + "</b> 分</p></div>" +
      pills(1) +
      "<h2>代入原式</h2>" +
      '<p class="lead">原式</p><p class="expr">' + esc(v.originalEquation) + "</p>" +
      '<p class="lead">天平現在是</p><p class="expr">' + esc(v.equation) + "</p>" +
      '<form data-check-form="1">' +
      '<label class="field inline">x = <input class="check-input" id="x-entry" name="x" type="text" value="' +
      esc(checkDraft) + '" autocomplete="off" inputmode="text" aria-label="x 的值" placeholder="整數"></label>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">代入原式</button></div></form>' +
      compare + feedbackHtml() + stepList(v, true) +
      '<div class="btn-row"><button type="button" class="btn btn-ghost" data-act="back-solve">返回天平</button></div>' +
      "</section>"
    );
  }
  function renderDone() {
    var last = results[results.length - 1];
    var parts = Engine.consolidate.parts.map(function (part) {
      var yesCls = reflect[part.id] === "yes" ? "btn is-picked" : "btn btn-ghost";
      var noCls = reflect[part.id] === "no" ? "btn is-picked" : "btn btn-ghost";
      var note = reflect[part.id] === "yes" ? part.yesNote : reflect[part.id] === "no" ? part.noNote : "";
      return "<h3>" + esc(part.ask) + "</h3>" +
        '<div class="choice-list">' +
        '<button type="button" class="' + yesCls + '" data-act="reflect" data-part="' + part.id + '" data-value="yes">' + esc(part.yes) + "</button>" +
        '<button type="button" class="' + noCls + '" data-act="reflect" data-part="' + part.id + '" data-value="no">' + esc(part.no) + "</button>" +
        "</div>" + (note ? '<p class="hint">' + esc(note) + "</p>" : "");
    }).join("");
    var ready = reflect.merge && reflect.sign;
    var summary = "";
    if (ready) {
      var cuts = last.deductions.length
        ? last.deductions.map(function (item) { return esc(item.label) + " −" + item.points; }).join("、")
        : "這一題沒有扣分。";
      var total = modeCount(mode);
      var nextLabel = results.length >= total ? "查看這組成績" : "下一題";
      summary = "<p>本單得分 <b>" + last.score + "</b></p>" +
        (last.bonus ? "<p>代入獎金 +" + last.bonus + "</p>" : "") +
        "<p>扣分：" + cuts + "</p>" +
        '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="next">' + nextLabel + "</button></div>";
    }
    return (
      '<section class="card" data-screen="done">' +
      pills(2) +
      "<h2>左右相等</h2>" +
      '<p class="expr">x = ' + fmt(last.entry) + "</p>" +
      '<div class="compare"><div><h3>左式</h3><p>' + esc(last.leftText) + "</p></div>" +
      "<div><h3>右式</h3><p>" + esc(last.rightText) + "</p></div></div>" +
      '<p class="master">' + esc(Engine.consolidate.ask) + "</p>" +
      parts + summary +
      '<button type="button" class="text-btn" data-act="hub">返回目錄</button>' +
      "</section>"
    );
  }
  function renderFinale() {
    var total = 0;
    var rows = results.map(function (item) {
      total += item.score;
      return "<li>第 " + item.number + " 題 " + esc(item.title) + "：x = " + fmt(item.entry) + "，" + item.score + " 分</li>";
    }).join("");
    var label = modeName(mode);
    return (
      '<section class="card" data-screen="finale">' +
      "<h2>" + label + "完成</h2>" +
      '<p class="master">' + results.length + " 題都已代入原式。</p>" +
      '<ul class="rules">' + rows + "</ul>" +
      "<p>合計 <b>" + total + "</b> 分</p>" +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="replay">再做一次</button>' +
      '<button type="button" class="btn btn-ghost" data-act="hub">返回目錄</button>' +
      '<a class="btn btn-ghost" href="../">返回課題目錄</a>' +
      "</div></section>"
    );
  }

  function render() {
    if (press) return;
    var draft = document.getElementById("x-entry");
    if (draft) checkDraft = draft.value;
    var body = renderIntro();
    if (screen === "stw") body = renderStw();
    if (screen === "hub") body = renderHub();
    if (screen === "warmup") body = renderWarmup();
    if (screen === "warmup-done") body = renderWarmDone();
    if (screen === "solve") body = renderSolve();
    if (screen === "check") body = renderCheck();
    if (screen === "done") body = renderDone();
    if (screen === "finale") body = renderFinale();
    document.getElementById("app").innerHTML = shell(body);
    var live = document.getElementById("live");
    if (live && feedback) {
      live.textContent = feedback.text + (feedback.lines && feedback.lines.length ? feedback.lines.join("") : "");
    }
    if (focusCheck) {
      var input = document.getElementById("x-entry");
      if (input) input.focus();
      focusCheck = false;
    }
    if (screen === "solve" && fx && fx.phase !== "leave") {
      var scale = document.getElementById("scale");
      if (scale && scale.scrollIntoView) scale.scrollIntoView({ block: "start" });
    }
  }

  function armCoach() {
    window.clearTimeout(coachTimer);
    if (!run || screen !== "solve") { showOne = false; return; }
    var v = Engine.view(run);
    if (!v.unitCoach) { showOne = false; return; }
    showOne = true;
    coachTimer = window.setTimeout(function () {
      showOne = false;
      if (!press && !fx && screen === "solve") render();
    }, reduceMotion ? 0 : 2200);
  }
  function startMission(index) {
    clearTimers();
    window.clearTimeout(coachTimer);
    run = Engine.createRun(index, mode);
    screen = "solve";
    fx = null;
    selectedId = null;
    shakeIds = [];
    checkDraft = "";
    checkView = null;
    settle = false;
    banner = "";
    reflect = { merge: null, sign: null };
    feedback = {
      kind: "info",
      text: mode === "practice"
        ? "黃虛線是建議的下一步。同色拖在一起，加減項拖到另一盤。"
        : "這一題沒有黃虛線。同色才可以合併。",
    };
    armCoach();
    render();
  }
  function goHub() {
    clearTimers();
    fx = null;
    selectedId = null;
    if (!entryPassed) {
      screen = "stw";
      entryStep = 0;
      feedback = null;
      render();
      return;
    }
    screen = "hub";
    feedback = null;
    render();
  }
  function present(result) {
    if (!result) return;
    var penalized = result.message && result.message.indexOf("扣") !== -1;
    feedback = {
      kind: result.alarm || penalized ? "bad" : result.ok ? "ok" : "info",
      text: result.message || "",
      lines: result.checkLines || [],
    };
    if (result.ok && result.banner) {
      banner = result.banner;
      settle = true;
      render();
      armCoach();
      later(function () {
        settle = false;
        banner = "";
        if (run) Engine.clearFlash(run);
        if (screen === "solve" && !fx && !press) render();
      }, reduceMotion ? 80 : 700);
      return;
    }
    banner = "";
    settle = false;
    render();
    if (result.ok) armCoach();
  }
  function startMove(id) {
    var plan = Engine.planMove(run, id);
    if (!plan.ok) {
      feedback = { kind: "info", text: plan.message };
      render();
      return;
    }
    clearTimers();
    fx = { phase: reduceMotion ? "place" : "leave", id: id, plan: plan, askStep: "see" };
    feedback = null;
    render();
    var placeWait = reduceMotion ? 80 : 380;
    later(function () {
      if (!fx) return;
      fx.phase = "place";
      render();
      later(function () {
        if (!fx) return;
        if (Engine.needsMoveInquiry(fx.plan, movePassed)) {
          fx.phase = "ask";
          fx.askStep = "see";
          feedback = null;
          render();
          return;
        }
        commitMove();
      }, reduceMotion ? 80 : 720);
    }, placeWait);
  }
  function commitMove() {
    if (!fx) return;
    var id = fx.id;
    var to = fx.plan.to;
    fx = null;
    selectedId = null;
    present(Engine.applyDrop(run, id, { kind: "pan", side: to }));
  }
  function doDrop(id, target) {
    selectedId = null;
    if (!run || fx) return;
    if (!target) {
      feedback = { kind: "info", text: "拖到同色的項上可合併，或拖到另一盤。乘除請用按鈕。" };
      render();
      return;
    }
    var decision = Engine.classifyDrop(run, id, target);
    if (decision.kind === "cancel") {
      feedback = { kind: "info", text: "放回原處。同色的項拖在一起可合併；拖到另一盤是兩邊同加或同減。" };
      render();
      return;
    }
    if (decision.kind === "move") {
      startMove(id);
      return;
    }
    var result = Engine.applyDrop(run, id, target);
    if (result.alarm) {
      shakeIds = result.shakeIds || [];
      feedback = { kind: "bad", text: result.message, lines: result.checkLines || [] };
      render();
      later(function () {
        shakeIds = [];
        if (screen === "solve" && !fx && !press) render();
      }, 450);
      return;
    }
    present(result);
  }

  function ensureGhost() {
    if (ghost) return;
    ghost = document.createElement("div");
    ghost.id = "ghost";
    ghost.hidden = true;
    document.body.appendChild(ghost);
  }
  function hideGhost() {
    if (!ghost) return;
    ghost.hidden = true;
    ghost.style.display = "none";
    document.documentElement.classList.remove("is-dragging");
  }
  function clearOver() {
    document.querySelectorAll(".is-over").forEach(function (node) { node.classList.remove("is-over"); });
  }
  function pointFor(x, y) {
    var coarse = window.matchMedia("(pointer: coarse)").matches;
    return { x: x, y: coarse ? y - 58 : y };
  }
  function targetAt(x, y, sourceId) {
    var list = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [document.elementFromPoint(x, y)];
    var i;
    var el;
    var term;
    var pan;
    var best;
    var bestD;
    var rect;
    var cx;
    var cy;
    var dist;
    for (i = 0; i < list.length; i += 1) {
      el = list[i];
      if (!el || !el.closest) continue;
      if (el.id === "ghost" || el.closest("#ghost")) continue;
      term = el.closest("[data-term]");
      if (term && term.dataset.term !== sourceId) return { kind: "term", id: term.dataset.term };
      pan = el.closest("[data-pan]");
      if (pan && !term) return { kind: "pan", side: pan.dataset.pan };
    }
    best = null;
    bestD = 36;
    document.querySelectorAll("[data-term]").forEach(function (node) {
      if (node.dataset.term === sourceId) return;
      rect = node.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
      dist = Math.hypot(cx - x, cy - y);
      if (dist < bestD) {
        bestD = dist;
        best = { kind: "term", id: node.dataset.term };
      }
    });
    if (best) return best;
    var pans = document.querySelectorAll("[data-pan]");
    for (i = 0; i < pans.length; i += 1) {
      rect = pans[i].getBoundingClientRect();
      if (x >= rect.left - 12 && x <= rect.right + 12 && y >= rect.top - 12 && y <= rect.bottom + 12) {
        return { kind: "pan", side: pans[i].dataset.pan };
      }
    }
    return null;
  }
  function markOver(x, y) {
    clearOver();
    if (!press) return;
    var target = targetAt(x, y, press.id);
    if (!target) return;
    var node = target.kind === "pan"
      ? document.querySelector('[data-pan="' + target.side + '"]')
      : document.querySelector('[data-term="' + target.id + '"]');
    if (node) node.classList.add("is-over");
  }
  function onTokenKey(id) {
    if (fx || screen !== "solve") return;
    if (selectedId && selectedId !== id) {
      doDrop(selectedId, { kind: "term", id: id });
      return;
    }
    selectedId = selectedId === id ? null : id;
    render();
  }
  function onDown(event) {
    if (fx || screen !== "solve") return;
    var token = event.target.closest("[data-term]");
    if (!token) {
      var pan = event.target.closest("[data-pan]");
      if (pan && selectedId) {
        fromPointer = true;
        doDrop(selectedId, { kind: "pan", side: pan.dataset.pan });
      }
      return;
    }
    if (event.button != null && event.button !== 0) return;
    if (event.cancelable) event.preventDefault();
    press = {
      id: token.dataset.term,
      kind: token.dataset.kind,
      label: token.dataset.label,
      neg: token.classList.contains("neg"),
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      dragging: false,
    };
    try { token.setPointerCapture(event.pointerId); } catch (err) {}
  }
  function onMove(event) {
    if (!press) return;
    if (event.pointerId != null && press.pointerId != null && event.pointerId !== press.pointerId) return;
    var dx = event.clientX - press.x;
    var dy = event.clientY - press.y;
    if (!press.dragging && dx * dx + dy * dy < 64) return;
    press.dragging = true;
    if (event.cancelable) event.preventDefault();
    document.documentElement.classList.add("is-dragging");
    ensureGhost();
    var point = pointFor(event.clientX, event.clientY);
    ghost.hidden = false;
    ghost.style.display = "inline-flex";
    ghost.style.left = point.x + "px";
    ghost.style.top = point.y + "px";
    ghost.className = "ghost token " + (press.kind === "x" ? "token-x" : "token-w") + (press.neg ? " neg" : "");
    ghost.textContent = press.label;
    markOver(point.x, point.y);
  }
  function onUp(event) {
    if (!press) return;
    if (event.pointerId != null && press.pointerId != null && event.pointerId !== press.pointerId) return;
    var current = press;
    var point = pointFor(event.clientX, event.clientY);
    press = null;
    hideGhost();
    clearOver();
    fromPointer = true;
    pointerAt = Date.now();
    window.setTimeout(function () { fromPointer = false; }, 0);
    if (current.dragging) {
      doDrop(current.id, targetAt(point.x, point.y, current.id));
      return;
    }
    onTokenKey(current.id);
  }
  function onCancel() {
    press = null;
    hideGhost();
    clearOver();
  }

  function answerEntry(choice) {
    var graded = Engine.gradeEntry(entryStep, choice);
    feedback = { kind: graded.ok ? "ok" : "info", text: graded.message };
    if (!graded.ok) { render(); return; }
    if (graded.done) {
      entryPassed = true;
      writeStore({ entryPassed: true });
      screen = "hub";
      feedback = { kind: "ok", text: graded.message };
      render();
      return;
    }
    entryStep += 1;
    render();
  }
  function answerMove(choice) {
    if (!fx || fx.phase !== "ask") return;
    var graded = Engine.gradeInquiry(fx.plan, fx.askStep, choice);
    feedback = { kind: graded.ok ? "ok" : "info", text: graded.message };
    if (!graded.ok) { render(); return; }
    if (ASK_ORDER[fx.askStep]) {
      fx.askStep = ASK_ORDER[fx.askStep];
      render();
      return;
    }
    movePassed = true;
    writeStore({ movePassed: true });
    commitMove();
  }
  function doCheck() {
    var input = document.getElementById("x-entry");
    checkDraft = input ? input.value : checkDraft;
    var result = Engine.submitCheck(run, checkDraft);
    if (!result.leftText) {
      feedback = { kind: "info", text: result.message };
      render();
      return;
    }
    if (result.ok) {
      var v = Engine.view(run);
      var packed = Engine.resultOf(run);
      results.push({
        number: v.number,
        title: v.title,
        score: packed.score,
        bonus: packed.bonus,
        deductions: packed.deductions,
        entry: packed.entry,
        leftText: result.leftText,
        rightText: result.rightText,
      });
      reflect = { merge: null, sign: null };
      feedback = null;
      screen = "done";
      render();
      return;
    }
    feedback = { kind: "bad", text: result.message };
    checkView = { leftText: result.leftText, rightText: result.rightText };
    render();
  }
  function onClick(event) {
    var actEl = event.target.closest("[data-act]");
    if (!actEl || actEl.disabled) return;
    var act = actEl.dataset.act;
    if (act === "intro") {
      clearTimers();
      fx = null;
      screen = "intro";
      feedback = null;
      render();
      return;
    }
    if (act === "hub") { goHub(); return; }
    if (act === "review-entry") {
      entryStep = 0;
      screen = "stw";
      feedback = null;
      render();
      return;
    }
    if (act === "reset-move") {
      movePassed = false;
      writeStore({ movePassed: false });
      feedback = { kind: "info", text: "下次把未知箱拖到另一盤時，會再問那三問。" };
      render();
      return;
    }
    if (act === "pick-entry") { answerEntry(actEl.dataset.choice); return; }
    if (act === "enter") {
      if (actEl.dataset.mode === "warmup") {
        warm = Engine.createWarmup();
        warmHold = false;
        screen = "warmup";
        feedback = { kind: "info", text: "同色才是同類項。辨認錯扣 10 分。" };
        render();
        return;
      }
      mode = actEl.dataset.mode === "challenge" || actEl.dataset.mode === "trap" ? actEl.dataset.mode : "practice";
      results = [];
      startMission(0);
      return;
    }
    if (act === "warm") {
      var result = Engine.answerWarmup(warm, actEl.dataset.can === "1");
      warmHold = !!result.hold;
      feedback = { kind: result.ok ? "ok" : "bad", text: result.message, lines: result.checkLines || [] };
      render();
      return;
    }
    if (act === "warm-next") {
      var adv = Engine.advanceWarmup(warm);
      warmHold = false;
      feedback = null;
      screen = adv.done ? "warmup-done" : "warmup";
      render();
      return;
    }
    if (act === "lamp") {
      feedback = { kind: "info", text: Engine.lampHelp(actEl.dataset.lamp) };
      render();
      return;
    }
    if (act === "op") {
      if (fx) return;
      present(Engine.applyScale(run, { type: actEl.dataset.type, value: Number(actEl.dataset.value) }));
      return;
    }
    if (act === "undo") {
      if (fx) return;
      present(Engine.undo(run));
      return;
    }
    if (act === "finish") {
      if (fx) return;
      var gate = Engine.finishGate(run);
      if (!gate.ok) {
        feedback = { kind: "info", text: gate.message };
        render();
        return;
      }
      screen = "check";
      checkDraft = "";
      checkView = null;
      feedback = { kind: "info", text: "把求得的 x 代入原式，看看左右是否相等。" };
      focusCheck = true;
      render();
      return;
    }
    if (act === "pick-move") { answerMove(actEl.dataset.choice); return; }
    if (act === "cancel-move") {
      clearTimers();
      fx = null;
      feedback = { kind: "info", text: "已取消。天平還沒有寫入這一步。" };
      render();
      return;
    }
    if (act === "back-solve") {
      screen = "solve";
      feedback = { kind: "info", text: "已返回天平。方程維持剛才的樣子。" };
      render();
      return;
    }
    if (act === "reflect") {
      reflect[actEl.dataset.part] = actEl.dataset.value;
      render();
      return;
    }
    if (act === "next") {
      if (results.length >= modeCount(mode)) {
        screen = "finale";
        render();
        return;
      }
      startMission(results.length);
      return;
    }
    if (act === "replay") {
      results = [];
      startMission(0);
    }
  }
  function onSubmit(event) {
    if (!event.target.closest("[data-check-form]")) return;
    event.preventDefault();
    doCheck();
  }
  function onAppClick(event) {
    var token = event.target.closest("[data-term]");
    if (token) {
      if (fromPointer || Date.now() - pointerAt < 500) return;
      onTokenKey(token.dataset.term);
      return;
    }
    onClick(event);
  }
  function onKey(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    var pan = event.target.closest("[data-pan]");
    if (!pan || !selectedId || fx) return;
    event.preventDefault();
    doDrop(selectedId, { kind: "pan", side: pan.dataset.pan });
  }

  var app = document.getElementById("app");
  app.addEventListener("click", onAppClick);
  app.addEventListener("submit", onSubmit);
  app.addEventListener("pointerdown", onDown);
  document.addEventListener("pointermove", onMove, { passive: false });
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onCancel);
  app.addEventListener("keydown", onKey);
  app.addEventListener("contextmenu", function (event) {
    if (event.target.closest("[data-term]")) event.preventDefault();
  });
  render();
})();
