/* 未知之秤 · 第一章介面。操作只靠按鈕，兩邊同時改變。 */
(function () {
  var Engine = window.ScaleEngine;
  var screen = "intro";
  var mode = "practice";
  var run = null;
  var results = [];
  var feedback = null;
  var settle = false;
  var banner = "";
  var checkDraft = "";
  var checkView = null;
  var focusCheck = false;
  var lampPick = { move: false, divide: false };
  var animTimer = 0;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  function shell(body) {
    return (
      '<div class="back-bar"><div class="wrap"><a class="back-link" href="../">返回課題目錄</a></div></div>' +
      '<header class="top"><div class="wrap">' +
      '<p class="kicker">中一數學 · 一元一次方程</p>' +
      "<h1>未知之秤</h1>" +
      '<p class="sub">天平工房 · 第一章</p>' +
      "</div></header>" +
      '<main><div class="wrap stack">' + body + "</div></main>"
    );
  }

  function pills(step) {
    var items = ["天平", "複秤"];
    return '<div class="pills">' + items.map(function (label, index) {
      var cls = index < step ? "done" : index === step ? "now" : "";
      return '<span class="pill ' + cls + '">' + label + "</span>";
    }).join("") + "</div>";
  }

  function feedbackHtml() {
    if (!feedback) return "";
    var cls = feedback.kind === "ok" ? "notice ok" : feedback.kind === "bad" ? "notice" : "hint";
    return '<div class="' + cls + '" id="feedback">' + esc(feedback.text) + "</div>";
  }

  function mottoHtml() {
    return '<p class="motto">' + esc(Engine.motto) + "</p>";
  }

  function renderIntro() {
    return (
      '<section class="card" data-screen="intro">' +
      mottoHtml() +
      '<p class="master">天平兩邊必須一樣重。要改方程，就兩邊同時加，或兩邊同時減。</p>' +
      "<ul class=\"rules\">" +
      "<li>移項是「兩邊同加／同減」。加上相反數之後，按「兩邊一起化簡」，讓零一起消去。</li>" +
      "<li>乘除的係數不要當加減項來處理。除數是「兩邊同乘／同除」。練習題不用乘除。</li>" +
      "<li>完成後到複秤：先核對用過的口訣燈，再填 x，代回原式。</li>" +
      "<li>每題由 100 分起算。複秤填錯扣 10 分，最低 0 分。第一次就填對，另加 10 分。</li>" +
      "</ul>" +
      '<div class="lamps" aria-hidden="true">' +
      '<span class="lamp need">移項</span><span class="lamp skip">除數</span>' +
      "</div>" +
      '<p class="fine">移項＝兩邊同加／同減。除數＝兩邊同乘／同除。其餘口訣本章不用。</p>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="enter" data-mode="practice">開始練習（5 題）</button>' +
      '<button type="button" class="btn btn-ghost" data-act="enter" data-mode="challenge">開始挑戰（3 題）</button>' +
      "</div>" +
      '<p class="fine">練習會以黃虛線標出建議的下一步。挑戰是另一組題目，不提示。</p>' +
      "</section>"
    );
  }

  function lampButtons(v) {
    return '<div class="lamps">' + v.lamps.map(function (lamp) {
      return '<button type="button" class="lamp ' + lamp.state + '" data-act="lamp" data-lamp="' + lamp.id + '">' +
        "<b>" + esc(lamp.name) + "</b><small>" + esc(lamp.detail) + "</small></button>";
    }).join("") + "</div>";
  }

  function tokenSpan(t) {
    var cls = ["token"];
    if (t.type === "x") cls.push("token-x");
    else cls.push("token-w");
    if (t.neg) cls.push("neg");
    if (t.fresh) cls.push("arrive");
    var kicker = t.type === "x" ? "<small>箱</small>" : "";
    return '<span class="' + cls.join(" ") + '">' + kicker + "<b>" + esc(t.label) + "</b></span>";
  }

  function panHtml(side, tokens) {
    var name = side === "L" ? "左盤" : "右盤";
    var inner = tokens.length ? tokens.map(tokenSpan).join("") : '<span class="empty">空</span>';
    return (
      '<div class="pan pan-' + side.toLowerCase() + '">' +
      '<p class="pan-name">' + name + "</p>" +
      '<div class="tokens">' + inner + "</div>" +
      "</div>"
    );
  }

  function scaleHtml(v) {
    var cls = "scale";
    if (settle) cls += " is-sync";
    var mid = settle && banner
      ? '<div class="sync-label">' + esc(banner) + "</div>"
      : '<div class="sync-label equals" aria-hidden="true">＝</div>';
    var status = v.ready ? "x 已單獨在一邊。" : "天平平衡。";
    return (
      '<div class="' + cls + '" id="scale">' +
      '<div class="pans">' +
      panHtml("L", v.tokens.L) +
      '<div class="mid">' + mid + "</div>" +
      panHtml("R", v.tokens.R) +
      "</div>" +
      '<div class="beam"></div>' +
      '<div class="pivot" aria-hidden="true"></div>' +
      '<div class="stand" aria-hidden="true"></div>' +
      '<div class="foot" aria-hidden="true"></div>' +
      '<p class="scale-status">' + status + "</p>" +
      "</div>"
    );
  }

  function opButton(action, wide) {
    var cls = ["btn", "op-btn"];
    if (wide) cls.push("wide");
    if (action.guided) cls.push("is-guide");
    else cls.push("btn-ghost");
    var value = action.value == null ? "" : String(action.value);
    return '<button type="button" class="' + cls.join(" ") + '" data-act="op" data-type="' +
      esc(action.type) + '" data-value="' + esc(value) + '">' + esc(action.label) + "</button>";
  }

  function renderActions(v) {
    var tidy = [];
    var rest = [];
    var i;
    for (i = 0; i < v.actions.length; i += 1) {
      if (v.actions[i].group === "tidy") tidy.push(v.actions[i]);
      else rest.push(v.actions[i]);
    }
    var checkCls = v.ready ? "btn btn-primary" : "btn btn-ghost";
    if (v.mode === "practice" && v.suggest && v.suggest.type === "check") checkCls += " is-guide";
    return (
      '<div class="action-card">' +
      "<h3>兩邊一起</h3>" +
      (v.mode === "practice" ? '<p class="fine">黃虛線是建議的下一步。</p>' : '<p class="fine">挑戰不提示下一步。</p>') +
      tidy.map(function (action) { return opButton(action, true); }).join("") +
      '<div class="btn-grid">' + rest.map(function (action) { return opButton(action, false); }).join("") + "</div>" +
      '<div class="btn-row nav-row">' +
      '<button type="button" class="' + checkCls + '" data-act="to-check">到複秤</button>' +
      '<button type="button" class="btn btn-ghost" data-act="undo"' + (v.canUndo ? "" : " disabled") + ">返回上一步</button>" +
      "</div></div>"
    );
  }

  function renderSolve() {
    var v = Engine.view(run);
    return (
      '<section class="card" data-screen="solve">' +
      '<div class="q-head"><p class="q-no">' + esc(v.setLabel) + " " + v.number + "／" + v.total + "</p>" +
      '<p class="score">本單 <b id="score">' + v.score + "</b> 分</p></div>" +
      pills(0) +
      '<div class="split"><h2>' + esc(v.title) + '</h2><span class="tag">' + esc(v.setLabel) + "</span></div>" +
      '<p class="lead">' + esc(v.brief) + "</p>" +
      '<p class="motto slim">' + esc(v.motto) + "</p>" +
      lampButtons(v) +
      '<p class="expr" id="equation">' + esc(v.equation) + "</p>" +
      feedbackHtml() +
      scaleHtml(v) +
      renderActions(v) +
      '<button type="button" class="text-btn" data-act="intro">返回開場</button>' +
      "</section>"
    );
  }

  function stepList(v) {
    return '<ol class="steps">' + v.steps.map(function (step) {
      var tag;
      if (!step.lamp) tag = '<span class="step-tag">原式</span>';
      else {
        var lamp = step.lamp === "divide" ? Engine.lamps.divide : Engine.lamps.move;
        tag = '<span class="step-tag ' + step.lamp + '" title="' + esc(lamp.detail) + '">' + esc(lamp.name) + "</span>";
      }
      var note = step.lamp ? '<small>' + esc(step.note) + "</small>" : "";
      return "<li><span class=\"step-eq\">" + esc(step.equation) + note + "</span>" + tag + "</li>";
    }).join("") + "</ol>";
  }

  function lampChoices(v) {
    return v.lamps.map(function (lamp) {
      if (lamp.state === "skip") {
        return '<div class="lamp-choice is-skip"><span class="lamp skip">' + esc(lamp.name) +
          "</span><span>" + esc(lamp.detail) + "</span><small>這題不用</small></div>";
      }
      var checked = lampPick[lamp.id] ? " checked" : "";
      return '<label class="lamp-choice"><input type="checkbox" data-lamp-pick="' + lamp.id + '"' + checked + ">" +
        '<span class="lamp ' + lamp.state + '">' + esc(lamp.name) + "</span><span>" + esc(lamp.detail) + "</span></label>";
    }).join("");
  }

  function renderCheck() {
    var v = Engine.view(run);
    var compare = "";
    var answer = "";
    if (checkView) {
      compare =
        '<div class="compare"><div><h3>左式</h3><p>' + esc(checkView.leftText) + "</p></div>" +
        "<div><h3>右式</h3><p>" + esc(checkView.rightText) + "</p></div></div>";
    }
    if (v.lampsConfirmed) {
      answer =
        '<form data-check-form="1">' +
        '<label class="field inline">x = <input class="check-input" id="x-entry" name="x" type="text" value="' +
        esc(checkDraft) + '" autocomplete="off" inputmode="text" aria-label="x 的值" placeholder="整數"></label>' +
        '<div class="btn-row"><button type="submit" class="btn btn-primary">代入複秤</button></div>' +
        "</form>";
    }
    return (
      '<section class="card" data-screen="check">' +
      '<div class="q-head"><p class="q-no">' + esc(v.setLabel) + " " + v.number + "／" + v.total + "</p>" +
      '<p class="score">本單 <b>' + v.score + "</b> 分</p></div>" +
      pills(1) +
      "<h2>複秤</h2>" +
      '<p class="master">先看每一步的方程和口訣燈，勾選你用過的燈，再填 x。</p>' +
      stepList(v) +
      '<p class="fine">移項＝兩邊同加／同減。除數＝兩邊同乘／同除。</p>' +
      (v.lampsConfirmed
        ? '<p class="notice ok">已確認口訣燈。</p>'
        : '<div class="lamp-choices">' + lampChoices(v) + "</div>" +
          '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="confirm-lamps">確認口訣燈</button></div>') +
      answer +
      compare +
      feedbackHtml() +
      '<div class="btn-row"><button type="button" class="btn btn-ghost" data-act="back-solve">返回天平</button></div>' +
      "</section>"
    );
  }

  function renderClear() {
    var last = results[results.length - 1];
    var total = mode === "challenge" ? Engine.challengeCount : Engine.practiceCount;
    var cuts = last.deductions.length
      ? last.deductions.map(function (item) { return esc(item.label) + " −" + item.points; }).join("、")
      : "這一題沒有扣分。";
    var bonus = last.bonus ? "<p>複秤獎金 +" + last.bonus + "</p>" : "";
    var nextLabel = results.length >= total ? "查看本章成績" : "下一題";
    return (
      '<section class="card" data-screen="clear">' +
      pills(2) +
      "<h2>這一題完成</h2>" +
      '<p class="master">左右相等。天平收貨了。</p>' +
      '<p class="expr">x = ' + fmt(last.entry) + "</p>" +
      '<div class="compare"><div><h3>左式</h3><p>' + esc(last.leftText) + "</p></div>" +
      "<div><h3>右式</h3><p>" + esc(last.rightText) + "</p></div></div>" +
      "<p>本單得分 <b>" + last.score + "</b></p>" +
      bonus +
      "<p>扣分：" + cuts + "</p>" +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="next">' + nextLabel + "</button>" +
      '<button type="button" class="btn btn-ghost" data-act="intro">返回開場</button>' +
      "</div></section>"
    );
  }

  function renderFinale() {
    var total = 0;
    var label = mode === "challenge" ? "挑戰" : "練習";
    var rows = results.map(function (item) {
      total += item.score;
      return "<li>第 " + item.number + " 題 " + esc(item.title) + "：x = " + fmt(item.entry) +
        "，" + item.score + " 分</li>";
    }).join("");
    return (
      '<section class="card" data-screen="finale">' +
      "<h2>" + label + "完成</h2>" +
      '<p class="master">' + (mode === "challenge" ? "三題挑戰都已複秤。" : "五題練習都已複秤。") + "</p>" +
      "<ul class=\"rules\">" + rows + "</ul>" +
      "<p>合計 <b>" + total + "</b> 分</p>" +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="replay">再做一次</button>' +
      '<button type="button" class="btn btn-ghost" data-act="intro">返回開場</button>' +
      '<a class="btn btn-ghost" href="../">返回課題目錄</a>' +
      "</div></section>"
    );
  }

  function render() {
    var draft = document.getElementById("x-entry");
    if (draft) checkDraft = draft.value;
    var body = renderIntro();
    if (screen === "solve") body = renderSolve();
    if (screen === "check") body = renderCheck();
    if (screen === "clear") body = renderClear();
    if (screen === "finale") body = renderFinale();
    document.getElementById("app").innerHTML = shell(body);
    var live = document.getElementById("live");
    if (live && feedback) live.textContent = feedback.text;
    if (focusCheck) {
      var input = document.getElementById("x-entry");
      if (input) input.focus();
      focusCheck = false;
    }
  }

  function startMission(index) {
    run = Engine.createRun(index, mode);
    screen = "solve";
    checkDraft = "";
    checkView = null;
    lampPick = { move: false, divide: false };
    settle = false;
    banner = "";
    feedback = {
      kind: "info",
      text: mode === "practice"
        ? "按黃虛線的按鈕。每一次都是兩邊一起改變。"
        : "挑戰不提示下一步。每一次都是兩邊一起改變。",
    };
    render();
  }

  function clearMotionLater() {
    window.clearTimeout(animTimer);
    var wait = reduceMotion ? 0 : 700;
    animTimer = window.setTimeout(function () {
      settle = false;
      banner = "";
      if (run) run.freshIds = [];
      if (screen === "solve") render();
    }, wait);
  }

  function apply(result) {
    if (!result) return;
    var penalized = result.message && result.message.indexOf("扣") !== -1;
    feedback = { kind: result.ok ? "ok" : (penalized ? "bad" : "info"), text: result.message };
    if (result.ok && result.applied && result.banner) {
      settle = true;
      banner = result.banner;
      render();
      clearMotionLater();
      return;
    }
    settle = false;
    banner = "";
    render();
  }

  function goCheck() {
    var gate = Engine.gateCheck(run);
    if (!gate.ok) {
      feedback = { kind: "info", text: gate.message };
      render();
      return;
    }
    screen = "check";
    checkDraft = "";
    checkView = null;
    lampPick = { move: false, divide: false };
    feedback = { kind: "info", text: "先勾選用過的口訣燈，再填 x。" };
    render();
  }

  function doConfirm() {
    var ids = [];
    if (lampPick.move) ids.push("move");
    if (lampPick.divide) ids.push("divide");
    var result = Engine.confirmLamps(run, ids);
    feedback = { kind: result.ok ? "ok" : "info", text: result.message };
    if (result.ok) focusCheck = true;
    render();
  }

  function doCheck() {
    var input = document.getElementById("x-entry");
    checkDraft = input ? input.value : "";
    var result = Engine.submitCheck(run, checkDraft);
    if (!result.leftText) {
      feedback = { kind: "bad", text: result.message };
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
      feedback = null;
      checkView = null;
      screen = "clear";
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
    if (act === "enter") {
      mode = actEl.dataset.mode === "challenge" ? "challenge" : "practice";
      results = [];
      run = null;
      startMission(0);
      return;
    }
    if (act === "intro") {
      results = [];
      run = null;
      screen = "intro";
      feedback = null;
      render();
      return;
    }
    if (act === "replay") {
      results = [];
      startMission(0);
      return;
    }
    if (act === "lamp") {
      feedback = { kind: "info", text: Engine.lampHelp(run, actEl.dataset.lamp) };
      render();
      return;
    }
    if (act === "op") {
      var value = actEl.dataset.value === "" ? null : Number(actEl.dataset.value);
      apply(Engine.applyAction(run, { type: actEl.dataset.type, value: value }));
      return;
    }
    if (act === "undo") {
      apply(Engine.undo(run));
      return;
    }
    if (act === "to-check") {
      goCheck();
      return;
    }
    if (act === "confirm-lamps") {
      doConfirm();
      return;
    }
    if (act === "back-solve") {
      screen = "solve";
      run.lampsConfirmed = false;
      feedback = { kind: "info", text: "已返回天平。方程維持剛才的樣子。" };
      render();
      return;
    }
    if (act === "next") {
      var total = mode === "challenge" ? Engine.challengeCount : Engine.practiceCount;
      if (results.length >= total) {
        screen = "finale";
        render();
        return;
      }
      startMission(results.length);
    }
  }

  function onChange(event) {
    var box = event.target.closest("[data-lamp-pick]");
    if (!box) return;
    lampPick[box.dataset.lampPick] = box.checked;
  }

  function onSubmit(event) {
    if (!event.target.closest("[data-check-form]")) return;
    event.preventDefault();
    doCheck();
  }

  var app = document.getElementById("app");
  app.addEventListener("click", onClick);
  app.addEventListener("change", onChange);
  app.addEventListener("submit", onSubmit);
  render();
})();
