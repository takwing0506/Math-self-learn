/* 未知之秤 · 第三章介面。
   面積用按鈕分割。方程的每一步都是寫明的按鈕。
   移走加減項之前，先看見另一邊放下的相反項。 */
(function () {
  var Engine = window.BracketEngine;
  var STORE = "brackets-chapter-v1";
  var screen = "intro";
  var mode = "practice";
  var workshop = null;
  var run = null;
  var results = [];
  var feedback = null;
  var pickedRegion = "";
  var pending = null;
  var askingGoal = false;
  var checkDraft = "";
  var checkView = null;
  var focusCheck = false;
  var reflect = { expand: null, both: null };
  var drafts = { area: "", parts: "", three: "" };
  var wrongKey = "";
  var wrongChoices = [];
  var feedbackFlash = 0;

  function readStore() {
    try { return JSON.parse(sessionStorage.getItem(STORE) || "{}"); }
    catch (e) { return {}; }
  }
  function writeStore() {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ workshop: Engine.workshopState(workshop) }));
    } catch (e) {}
  }
  workshop = Engine.restoreWorkshop(readStore().workshop);

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
  function modeCount(name) {
    if (name === "challenge") return Engine.challengeCount;
    if (name === "example") return Engine.exampleCount;
    return Engine.practiceCount;
  }
  function modeName(name) {
    if (name === "challenge") return "挑戰模式";
    if (name === "example") return "例題";
    return "引導模式";
  }

  function shell(body) {
    return (
      '<div class="back-bar"><div class="bar-links">' +
      '<a class="back-link" href="../">課題目錄</a>' +
      '<a class="back-link" href="../unknown-scale-like-terms/">第二章</a>' +
      "</div></div>" +
      '<header class="top"><div class="wrap">' +
      '<p class="kicker">中一數學 · 一元一次方程</p>' +
      "<h1>未知之秤</h1>" +
      '<p class="sub">天平工房 · 第三章　括號</p>' +
      "</div></header>" +
      '<main><div class="wrap stack">' + body + "</div></main>"
    );
  }
  function mottoHtml() {
    return '<p class="motto">' + esc(Engine.motto) + "</p>";
  }
  function pills(labels, step) {
    return '<div class="pills">' + labels.map(function (label, index) {
      var cls = index < step ? "done" : index === step ? "now" : "";
      return '<span class="pill ' + cls + '">' + esc(label) + "</span>";
    }).join("") + "</div>";
  }
  function feedbackHtml() {
    if (!feedback) return "";
    var cls = feedback.kind === "ok" ? "notice ok" : feedback.kind === "bad" ? "notice" : "hint";
    if (feedback.flash) cls += " is-flash";
    return '<div class="' + cls + '" id="feedback"><p>' + esc(feedback.text) + "</p></div>";
  }
  function choiceButtons(choices, act, key, extra) {
    var marked = wrongKey === key ? wrongChoices : [];
    return '<div class="choice-list">' + choices.map(function (choice, index) {
      var cls = "btn btn-ghost" + (marked.indexOf(index) !== -1 ? " is-wrong" : "");
      return '<button type="button" class="' + cls + '" data-act="' + act + '" data-choice="' + index + '"' + (extra || "") + ">" +
        esc(choice) + "</button>";
    }).join("") + "</div>";
  }
  function markWrong(key, choice) {
    var index = Number(choice);
    if (wrongKey !== key) {
      wrongKey = key;
      wrongChoices = [];
    }
    if (wrongChoices.indexOf(index) === -1) wrongChoices.push(index);
    feedbackFlash += 1;
  }
  function rectHtml(strips, pickable) {
    var word = strips.length > 2 ? "每條都一樣" : strips.length === 2 ? "兩塊一樣" : "整塊";
    var inner = strips.map(function (strip) {
      var cls = "strip" + (strip.omitted ? " is-omitted" : "") + (pickable && pickedRegion === strip.id ? " is-picked" : "");
      var caption = strip.caption ? "<small>" + esc(strip.caption) + "</small>" : "";
      var flag = strip.omitted ? '<span class="omit-flag">未計入</span>' : "";
      var label = "長 " + strip.length + "，闊 " + strip.width + (strip.omitted ? "，未計入" : "");
      var body = "<b>長 " + esc(strip.length) + "</b><small>闊 " + esc(strip.width) + "</small>" + caption + flag;
      if (pickable) {
        return '<button type="button" class="' + cls + '" style="flex:' + Number(strip.flex) + '" data-act="pick-region" data-region="' +
          esc(strip.id) + '" aria-pressed="' + (pickedRegion === strip.id ? "true" : "false") + '" aria-label="' + esc(label) + '">' + body + "</button>";
      }
      return '<div class="' + cls + '" style="flex:' + Number(strip.flex) + '" role="img" aria-label="' + esc(label) + '">' + body + "</div>";
    }).join("");
    return '<div class="rect-wrap"><div class="width-flag">闊度 4，' + word + '</div><div class="strips">' + inner + "</div></div>";
  }
  function workshopPills(phase) {
    var index = { area: 0, stw: 1, parts: 2, match: 3, three: 4, done: 4 }[phase] || 0;
    return pills(["面積", "觀察", "兩塊", "字母", "三條"], index);
  }
  function saveWorkshop(result) {
    writeStore();
    if (!result) return;
    feedback = { kind: result.ok ? "ok" : (result.message && result.message.indexOf("扣") !== -1 ? "bad" : "info"), text: result.message || "" };
    if (!result.ok && result.message && result.message.indexOf("扣") !== -1) feedback.kind = "bad";
  }

  function renderIntro() {
    var ready = workshop.threeOk;
    var primary = ready
      ? '<button type="button" class="btn btn-primary" data-act="hub">進入方程</button>' +
        '<button type="button" class="btn btn-ghost" data-act="review-workshop">重做長方形</button>'
      : '<button type="button" class="btn btn-primary" data-act="workshop">從長方形開始</button>';
    return (
      '<section class="card" data-screen="intro">' +
      mottoHtml() +
      '<p class="master">這一章先看長方形的面積，再把括號放上天平。拆括號只改寫一邊；加減和乘除都要兩邊一起做。</p>' +
      "<ul class=\"rules\">" +
      "<li>先求整塊面積。13 可以直接乘。分成 10 和 3 是另一種算法。</li>" +
      "<li>每一塊都要乘闊度。漏掉的一塊會標出來，不會直接顯示答案。</li>" +
      "<li>方程裡，拆括號只改寫有括號的一邊。移項是兩邊同加或同減。除數是兩邊同乘或同除。</li>" +
      "<li>化成一邊只剩 x 之後，先分類步驟，再把 x 代入原式。</li>" +
      "</ul>" +
      '<p class="fine">面積和分配這一節由 100 分起算。每條方程另計 100 分。漏寫某一塊的積、符號寫錯、代入不相等，各扣 10 分，最低 0 分。第一次代入就對，另加 10 分。觀察、配對、分類和選錯目標，不扣分。</p>' +
      '<div class="btn-row">' + primary + "</div>" +
      '<button type="button" class="text-btn" data-act="reset">重設進度</button>' +
      '<p class="fine">上一章：<a href="../unknown-scale-like-terms/">天平工房 · 第二章　同類項</a></p>' +
      "</section>"
    );
  }

  function renderWorkshop() {
    var view = Engine.workshopView(workshop);
    var body = "";
    if (view.phase === "area") {
      body = rectHtml(view.strips, false) +
        (view.split ? '<p class="shared-note">已分成 10 和 3。兩塊的闊度仍是 4。</p>' : "") +
        (view.areaOk ? "" : (
          "<h2>這個長方形的面積是多少？</h2>" +
          '<p class="lead">長 13，闊 4。13 可以直接乘。請寫面積，不要只寫算式。</p>' +
          '<form data-check-form="area">' +
          '<label class="field inline">面積 <input id="area-entry" name="area" type="text" inputmode="numeric" autocomplete="off" value="' + esc(drafts.area) + '" aria-label="面積"></label>' +
          '<div class="btn-row"><button type="submit" class="btn btn-primary">提交面積</button></div></form>'
        )) +
        (view.split ? "" : '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="split">把長度分成 10 和 3</button></div>') +
        '<p class="fine">按鈕會把長度分成 10 和 3。這不是因為 13 難算。</p>';
    } else if (view.phase === "stw") {
      body = rectHtml(view.strips, false) +
        '<p class="shared-note">闊度 4 仍在兩塊上。</p>' +
        '<p class="q-no">' + esc(view.stw.label) + " " + view.stw.index + "／" + view.stw.total + "</p>" +
        '<p class="master">' + esc(view.stw.ask) + "</p>" +
        choiceButtons(view.stw.choices, "pick-stw", "stw-" + view.stwIndex);
    } else if (view.phase === "parts") {
      body = rectHtml(view.strips, false) +
        "<h2>寫出兩塊面積相加的式</h2>" +
        '<p class="lead">兩塊都要乘闊度。如果少了一塊，那一塊會標成未計入。</p>' +
        '<form data-check-form="parts">' +
        '<label class="field">兩塊面積相加<input id="parts-entry" name="parts" type="text" autocomplete="off" value="' + esc(drafts.parts) + '" aria-label="兩塊面積相加的式"></label>' +
        '<div class="btn-row"><button type="submit" class="btn btn-primary">檢查</button></div></form>';
    } else if (view.phase === "match") {
      body = (view.comparison ? '<p class="shared-note">' + esc(view.comparison) + "</p>" : "") +
        rectHtml(view.strips, true) +
        "<h2>長是 x + 3，闊仍是 4</h2>" +
        '<p class="lead">x 是一段正的長度。先點一塊，再點它的面積。</p>' +
        '<div class="product-list" aria-label="面積選擇">' + view.products.map(function (item) {
          return '<button type="button" class="btn btn-ghost" data-act="pick-product" data-product="' + esc(item.id) + '">' + esc(item.label) + "</button>";
        }).join("") + "</div>";
    } else {
      body = rectHtml(view.strips, false) +
        "<h2>4(x + 2 + 3)</h2>" +
        '<p class="lead">' + esc(view.threePrompt) + "</p>" +
        '<div class="btn-row">' +
        '<button type="button" class="btn ' + (view.threeMode === "practice" ? "btn-primary" : "btn-ghost") + '" data-act="three-mode" data-mode="practice">引導模式</button>' +
        '<button type="button" class="btn ' + (view.threeMode === "challenge" ? "btn-primary" : "btn-ghost") + '" data-act="three-mode" data-mode="challenge">挑戰模式</button>' +
        "</div>" +
        '<div class="btn-row">' +
        '<button type="button" class="btn btn-ghost" data-act="combine-three">括號內的常數先相加</button>' +
        '<button type="button" class="btn btn-ghost" data-act="distribute-three">每一段分別乘 4</button>' +
        "</div>" +
        (view.threeReveal ? '<p class="master">' + esc(view.threeReveal) + "</p>" : (
          '<form data-check-form="three">' +
          '<label class="field">寫出結果<input id="three-entry" name="three" type="text" autocomplete="off" value="' + esc(drafts.three) + '" aria-label="三條的結果"></label>' +
          '<div class="btn-row"><button type="submit" class="btn btn-primary">檢查</button></div></form>'
        )) +
        (view.threeReveal ? '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="hub">進入方程</button></div>' : "");
    }
    return (
      '<section class="card" data-screen="workshop" data-phase="' + esc(view.phase) + '">' +
      '<div class="q-head"><p class="q-no">長方形</p><p class="score">本節 <b>' + view.score + "</b> 分</p></div>" +
      workshopPills(view.phase) +
      body +
      feedbackHtml() +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-ghost" data-act="undo-workshop"' + (view.canUndo ? "" : " disabled") + ">返回上一步</button>" +
      "</div>" +
      '<button type="button" class="text-btn" data-act="intro">返回開場</button>' +
      "</section>"
    );
  }

  function renderHub() {
    return (
      '<section class="card" data-screen="hub">' +
      mottoHtml() +
      "<h2>方程</h2>" +
      '<p class="lead">例題用來熟悉兩種做法。練習和挑戰的解不會總是同一個數，不要沿用例題的結果。</p>' +
      '<p class="fine">面積和分配：' + workshop.score + " 分。</p>" +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-ghost" data-act="enter" data-mode="example">例題（3 題）</button>' +
      '<button type="button" class="btn btn-primary" data-act="enter" data-mode="practice">引導模式（3 題）</button>' +
      '<button type="button" class="btn btn-ghost" data-act="enter" data-mode="challenge">挑戰模式（3 題）</button>' +
      "</div>" +
      '<button type="button" class="text-btn" data-act="review-workshop">重做長方形</button>' +
      '<button type="button" class="text-btn" data-act="reset">重設進度</button>' +
      '<p class="fine">上一章：<a href="../unknown-scale-like-terms/">天平工房 · 第二章　同類項</a></p>' +
      "</section>"
    );
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
    return '<details class="steps-box"' + (open ? " open" : "") + "><summary>步驟</summary><ol class=\"steps\">" + items + "</ol></details>";
  }
  function lampButtons(v) {
    return '<div class="lamps">' + v.lamps.map(function (lamp) {
      return '<button type="button" class="lamp ' + lamp.state + '" data-act="lamp" data-lamp="' + lamp.id + '" title="' + esc(lamp.title || lamp.detail) + '">' +
        "<b>" + esc(lamp.name) + "</b><small>" + esc(lamp.detail) + "</small></button>";
    }).join("") + "</div>";
  }
  function tokenHtml(token) {
    var cls = "token " + (token.type === "x" ? "token-x" : token.type === "b" ? "token-b" : "token-w");
    if (token.neg) cls += " neg";
    if (token.fresh) cls += " arrive";
    return '<span class="' + cls + '" aria-hidden="true"><b>' + esc(token.label) + "</b></span>";
  }
  function panHtml(side, tokens) {
    var name = side === "L" ? "左盤" : "右盤";
    var inner = tokens.length ? tokens.map(tokenHtml).join("") : '<span class="empty">空</span>';
    return '<div class="pan pan-' + side.toLowerCase() + '"><p class="pan-name">' + name + '</p><div class="tokens">' + inner + "</div></div>";
  }
  function scaleHtml(v) {
    return '<div class="scale" id="scale"><div class="pans">' + panHtml("L", v.tokens.L) +
      '<div class="mid"><div class="sync-label equals" aria-hidden="true">＝</div></div>' +
      panHtml("R", v.tokens.R) + "</div>" +
      '<div class="beam"></div><div class="pivot" aria-hidden="true"></div><div class="stand" aria-hidden="true"></div><div class="foot" aria-hidden="true"></div>' +
      '<p class="scale-status">天平保持平衡。</p></div>';
  }
  function actionHtml(v) {
    var purpose;
    var plan;
    if (pending) {
      plan = pending.type === "expand" ? Engine.planExpand(run, pending.id) : Engine.planMove(run, pending.id);
      if (!plan.ok) return '<p class="notice"><p>' + esc(plan.message) + "</p></p>";
      return '<div class="action-card"><h3>先看這一步</h3>' +
        '<p class="expr preview"><span class="preview-tag">預覽，尚未寫入</span>' + esc(plan.equation) + "</p>" +
        '<p class="master">' + esc(plan.note) + "</p>" +
        '<p class="lead">' + esc(plan.detail) + "</p>" +
        '<div class="btn-row">' +
        '<button type="button" class="btn btn-primary" data-act="confirm-op">寫入這一步</button>' +
        '<button type="button" class="btn btn-ghost" data-act="cancel-op">取消</button>' +
        "</div></div>";
    }
    if (!v.goalSet) {
      purpose = Engine.purpose();
      return '<div class="action-card"><h3>先立目標</h3><p class="master">' + esc(purpose.ask) + "</p>" +
        choiceButtons(purpose.choices, "pick-purpose", "purpose") + "</div>";
    }
    if (askingGoal) {
      return '<div class="action-card"><h3>看一看</h3><p class="master">' + esc(Engine.goalAsk) + "</p>" +
        '<div class="choice-list">' +
        '<button type="button" class="btn btn-ghost" data-act="answer-goal" data-yes="1">有</button>' +
        '<button type="button" class="btn btn-ghost" data-act="answer-goal" data-yes="0">未有</button></div></div>';
    }
    var ops = v.actions.map(function (action) {
      if (action.type === "expand" || action.type === "move") {
        return '<button type="button" class="btn op-btn btn-ghost" data-act="preview-op" data-type="' + esc(action.type) + '" data-id="' + esc(action.id) + '">' + esc(action.label) + "</button>";
      }
      if (action.type === "merge") {
        return '<button type="button" class="btn op-btn btn-ghost" data-act="merge" data-side="' + esc(action.side) + '">' + esc(action.label) + "</button>";
      }
      return '<button type="button" class="btn op-btn btn-ghost" data-act="scale" data-type="' + esc(action.type) + '" data-value="' + esc(String(action.value)) + '">' + esc(action.label) + "</button>";
    }).join("");
    return '<div class="action-card"><h3>操作</h3><p class="goal-prompt">' + esc(v.deskPrompt) + "</p>" +
      '<div class="btn-row">' + ops + "</div>" +
      '<div class="btn-row nav-row">' +
      '<button type="button" class="btn btn-ghost" data-act="finish">完成</button>' +
      '<button type="button" class="btn btn-ghost" data-act="undo"' + (v.canUndo ? "" : " disabled") + ">返回上一步</button>" +
      "</div>" +
      '<p class="fine">移走加減項時，另一邊放下相反項。乘除用按鈕，兩邊一起做。</p></div>';
  }

  function renderSolve() {
    var v = Engine.view(run);
    return (
      '<section class="card" data-screen="solve">' +
      '<div class="q-head"><p class="q-no">' + esc(v.setLabel) + " " + v.number + "／" + v.total + "</p>" +
      '<p class="score">本單 <b id="score">' + v.score + "</b> 分</p></div>" +
      pills(["解題", "分類", "代入", "停一停"], 0) +
      '<div class="split"><h2>' + esc(v.title) + '</h2><span class="tag">' + esc(v.setLabel) + "</span></div>" +
      '<p class="lead">' + esc(v.brief) + "</p>" +
      '<p class="motto slim">' + esc(v.motto) + "</p>" +
      lampButtons(v) +
      '<p class="expr" id="equation">' + esc(v.equation) + "</p>" +
      scaleHtml(v) +
      feedbackHtml() +
      actionHtml(v) +
      stepList(v, false) +
      '<button type="button" class="text-btn" data-act="hub">返回目錄</button>' +
      "</section>"
    );
  }

  function renderClassify() {
    var v = Engine.view(run);
    var task = Engine.classifyTask(run);
    var lines = task.items.map(function (item) {
      var choices = item.done
        ? '<p class="hint">已分類：' + esc(item.chosen) + "</p>"
        : choiceButtons(task.choices, "pick-class", "class-" + item.index, ' data-step="' + item.index + '"');
      return '<div class="step-line"><p class="expr">' + esc(item.equation) + "</p><p>" + esc(item.note) + "</p><p class=\"fine\">" +
        esc(item.detail) + "</p><p class=\"master\">" + esc(item.ask) + "</p>" + choices + "</div>";
    }).join("");
    var next = task.done ? '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="to-check">去代入</button></div>' : "";
    return (
      '<section class="card" data-screen="classify">' +
      '<div class="q-head"><p class="q-no">' + esc(v.setLabel) + " " + v.number + "／" + v.total + "</p>" +
      '<p class="score">本單 <b>' + v.score + "</b> 分</p></div>" +
      pills(["解題", "分類", "代入", "停一停"], 1) +
      "<h2>這些步驟屬於哪一種？</h2>" +
      '<p class="lead">拆括號只改寫一邊。移項和除數作用在兩邊。</p>' +
      lines + feedbackHtml() + next +
      '<button type="button" class="text-btn" data-act="back-solve">返回天平</button>' +
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
      pills(["解題", "分類", "代入", "停一停"], 2) +
      "<h2>代入原式</h2>" +
      '<p class="lead">原式</p><p class="expr">' + esc(v.originalEquation) + "</p>" +
      '<p class="lead">天平現在是</p><p class="expr">' + esc(v.equation) + "</p>" +
      '<form data-check-form="check">' +
      '<label class="field inline">x = <input class="check-input" id="x-entry" name="x" type="text" value="' +
      esc(checkDraft) + '" autocomplete="off" inputmode="text" aria-label="x 的值"></label>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">代入原式</button></div></form>' +
      compare + feedbackHtml() + stepList(v, true) +
      '<button type="button" class="text-btn" data-act="back-solve">返回天平</button>' +
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
    var ready = reflect.expand && reflect.both;
    var summary = "";
    if (ready) {
      var cuts = last.deductions.length
        ? last.deductions.map(function (item) { return esc(item.label) + " −" + item.points; }).join("、")
        : "這一題沒有扣分。";
      var nextLabel = results.length >= modeCount(mode) ? "查看這組成績" : "下一題";
      summary = "<p>本單得分 <b>" + last.score + "</b></p>" +
        (last.bonus ? "<p>代入獎金 +" + last.bonus + "</p>" : "") +
        "<p>扣分：" + cuts + "</p>" +
        '<div class="btn-row"><button type="button" class="btn btn-primary" data-act="next">' + nextLabel + "</button></div>";
    }
    return (
      '<section class="card" data-screen="done">' +
      pills(["解題", "分類", "代入", "停一停"], 3) +
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
    return (
      '<section class="card" data-screen="finale">' +
      "<h2>" + esc(modeName(mode)) + "完成</h2>" +
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
    var draftNode = document.getElementById("area-entry") || document.getElementById("parts-entry") || document.getElementById("three-entry") || document.getElementById("x-entry");
    if (draftNode && draftNode.id === "area-entry") drafts.area = draftNode.value;
    if (draftNode && draftNode.id === "parts-entry") drafts.parts = draftNode.value;
    if (draftNode && draftNode.id === "three-entry") drafts.three = draftNode.value;
    if (draftNode && draftNode.id === "x-entry") checkDraft = draftNode.value;
    var body = renderIntro();
    if (screen === "workshop") body = renderWorkshop();
    if (screen === "hub") body = renderHub();
    if (screen === "solve") body = renderSolve();
    if (screen === "classify") body = renderClassify();
    if (screen === "check") body = renderCheck();
    if (screen === "done") body = renderDone();
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

  function present(result) {
    if (!result) return;
    var penalized = result.message && result.message.indexOf("扣") !== -1;
    feedback = { kind: penalized ? "bad" : result.ok ? "ok" : "info", text: result.message || "" };
    if (result.askGoal) askingGoal = true;
    render();
  }
  function startMission(index) {
    run = Engine.createRun(index, mode);
    screen = "solve";
    pending = null;
    askingGoal = false;
    checkDraft = "";
    checkView = null;
    reflect = { expand: null, both: null };
    feedback = { kind: "info", text: "先回答這題想把方程變成甚麼樣子。" };
    render();
  }
  function goHub() {
    pending = null;
    if (!workshop.threeOk) {
      screen = "workshop";
      feedback = { kind: "info", text: "先完成長方形這一節，再解方程。" };
      render();
      return;
    }
    screen = "hub";
    feedback = null;
    render();
  }

  function onClick(event) {
    var actEl = event.target.closest("[data-act]");
    if (!actEl || actEl.disabled) return;
    var act = actEl.dataset.act;
    if (act === "intro") { screen = "intro"; feedback = null; render(); return; }
    if (act === "workshop" || act === "review-workshop") {
      if (act === "review-workshop") {
        workshop = Engine.createWorkshop();
        writeStore();
      }
      screen = "workshop";
      pickedRegion = "";
      feedback = { kind: "info", text: "先寫整塊面積。也可以先把長度分成 10 和 3。" };
      render();
      return;
    }
    if (act === "hub") { goHub(); return; }
    if (act === "reset") {
      workshop = Engine.createWorkshop();
      try { sessionStorage.removeItem(STORE); } catch (e) {}
      run = null;
      results = [];
      screen = "intro";
      feedback = { kind: "info", text: "進度已重設。" };
      render();
      return;
    }
    if (act === "split") { saveWorkshop(Engine.splitLength(workshop)); render(); return; }
    if (act === "undo-workshop") { saveWorkshop(Engine.undoWorkshop(workshop)); render(); return; }
    if (act === "pick-stw") {
      var graded = Engine.gradeStw(workshop, actEl.dataset.choice);
      if (!graded.ok) markWrong("stw-" + Engine.workshopView(workshop).stwIndex, actEl.dataset.choice);
      else wrongChoices = [];
      saveWorkshop(graded);
      feedback.flash = graded.ok ? 0 : feedbackFlash;
      if (!graded.ok) feedback.kind = "bad";
      render();
      return;
    }
    if (act === "pick-region") {
      pickedRegion = actEl.dataset.region;
      feedback = { kind: "info", text: "再點這一塊的面積。" };
      render();
      return;
    }
    if (act === "pick-product") {
      if (!pickedRegion) {
        feedback = { kind: "info", text: "請先點選一塊。" };
        render();
        return;
      }
      var matched = Engine.matchRegion(workshop, pickedRegion, actEl.dataset.product);
      if (matched.ok) pickedRegion = "";
      saveWorkshop(matched);
      if (!matched.ok) feedback.kind = "bad";
      render();
      return;
    }
    if (act === "three-mode") { saveWorkshop(Engine.setThreeMode(workshop, actEl.dataset.mode)); render(); return; }
    if (act === "combine-three") { saveWorkshop(Engine.combineThree(workshop)); render(); return; }
    if (act === "distribute-three") { saveWorkshop(Engine.distributeThree(workshop)); render(); return; }
    if (act === "enter") {
      mode = actEl.dataset.mode === "challenge" || actEl.dataset.mode === "example" ? actEl.dataset.mode : "practice";
      results = [];
      startMission(0);
      return;
    }
    if (act === "lamp") {
      feedback = { kind: "info", text: Engine.lampHelp(actEl.dataset.lamp) };
      render();
      return;
    }
    if (act === "preview-op") {
      pending = { type: actEl.dataset.type, id: actEl.dataset.id };
      feedback = null;
      render();
      return;
    }
    if (act === "cancel-op") {
      pending = null;
      feedback = { kind: "info", text: "已取消。這一步還沒有寫入。" };
      render();
      return;
    }
    if (act === "confirm-op") {
      if (!pending) return;
      var confirmed = pending.type === "expand" ? Engine.applyExpand(run, pending.id) : Engine.applyMove(run, pending.id);
      pending = null;
      present(confirmed);
      return;
    }
    if (act === "merge") { present(Engine.applyMerge(run, actEl.dataset.side)); return; }
    if (act === "scale") { present(Engine.applyScale(run, { type: actEl.dataset.type, value: Number(actEl.dataset.value) })); return; }
    if (act === "undo") { pending = null; askingGoal = false; present(Engine.undo(run)); return; }
    if (act === "pick-purpose") {
      var purposeResult = Engine.answerPurpose(run, actEl.dataset.choice);
      if (!purposeResult.ok) {
        markWrong("purpose", actEl.dataset.choice);
        feedback = { kind: "bad", text: purposeResult.message, flash: feedbackFlash };
      } else {
        wrongChoices = [];
        feedback = { kind: "ok", text: purposeResult.message };
      }
      render();
      return;
    }
    if (act === "answer-goal") {
      var goalResult = Engine.answerGoal(run, actEl.dataset.yes === "1");
      feedback = { kind: goalResult.affirmed || (!goalResult.reached && actEl.dataset.yes !== "1") ? "ok" : "info", text: goalResult.message };
      if (!goalResult.reached && actEl.dataset.yes === "1") feedback.kind = "bad";
      if (goalResult.affirmed) {
        askingGoal = false;
        screen = "classify";
        feedback = { kind: "info", text: "先為每一步選類型，再代入原式。" };
      } else askingGoal = !!(goalResult.reached && !goalResult.affirmed);
      render();
      return;
    }
    if (act === "finish") {
      if (!run.goalSet) {
        feedback = { kind: "info", text: "請先回答：我們想把方程變成甚麼樣子？" };
        render();
        return;
      }
      if (Engine.view(run).ready && !run.goalAffirmed) {
        askingGoal = true;
        feedback = { kind: "info", text: "先回答：有達到目標嗎？" };
        render();
        return;
      }
      var gate = Engine.finishGate(run);
      if (!gate.ok) {
        feedback = { kind: "info", text: gate.message };
        render();
        return;
      }
      screen = "classify";
      feedback = null;
      render();
      return;
    }
    if (act === "pick-class") {
      var classed = Engine.gradeClassify(run, Number(actEl.dataset.step), actEl.dataset.choice);
      if (!classed.ok) {
        markWrong("class-" + actEl.dataset.step, actEl.dataset.choice);
        feedback = { kind: "bad", text: classed.message, flash: feedbackFlash };
      } else {
        wrongChoices = [];
        feedback = { kind: "ok", text: classed.message };
      }
      render();
      return;
    }
    if (act === "to-check" || act === "back-check") {
      screen = "check";
      checkDraft = "";
      checkView = null;
      focusCheck = true;
      feedback = { kind: "info", text: "把求得的 x 代入原式，看看左右是否相等。" };
      render();
      return;
    }
    if (act === "back-solve") {
      screen = "solve";
      askingGoal = false;
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
    var form = event.target.closest("[data-check-form]");
    if (!form) return;
    event.preventDefault();
    var kind = form.getAttribute("data-check-form");
    if (kind === "area") {
      drafts.area = document.getElementById("area-entry").value;
      saveWorkshop(Engine.submitArea(workshop, drafts.area));
      render();
      return;
    }
    if (kind === "parts") {
      drafts.parts = document.getElementById("parts-entry").value;
      var parts = Engine.submitSplit(workshop, drafts.parts);
      saveWorkshop(parts);
      if (!parts.ok) feedback.kind = parts.message.indexOf("扣") !== -1 ? "bad" : "info";
      render();
      return;
    }
    if (kind === "three") {
      drafts.three = document.getElementById("three-entry").value;
      var three = Engine.submitThree(workshop, drafts.three);
      saveWorkshop(three);
      if (!three.ok) feedback.kind = three.message.indexOf("扣") !== -1 ? "bad" : "info";
      render();
      return;
    }
    if (kind === "check") {
      checkDraft = document.getElementById("x-entry").value;
      var result = Engine.submitCheck(run, checkDraft);
      if (!result.leftText) {
        feedback = { kind: "info", text: result.message };
        render();
        return;
      }
      if (result.ok) {
        var view = Engine.view(run);
        var packed = Engine.resultOf(run);
        results.push({
          number: view.number,
          title: view.title,
          score: packed.score,
          bonus: packed.bonus,
          deductions: packed.deductions,
          entry: packed.entry,
          leftText: result.leftText,
          rightText: result.rightText,
        });
        reflect = { expand: null, both: null };
        feedback = null;
        screen = "done";
        render();
        return;
      }
      feedback = { kind: "bad", text: result.message };
      checkView = { leftText: result.leftText, rightText: result.rightText };
      render();
    }
  }

  var app = document.getElementById("app");
  app.addEventListener("click", onClick);
  app.addEventListener("submit", onSubmit);
  render();
})();
