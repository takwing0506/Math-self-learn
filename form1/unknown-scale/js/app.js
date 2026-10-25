/* 未知之秤 · 第一章介面。畫面文字只來自 ScaleEngine.view。 */
(function () {
  var Engine = window.ScaleEngine;
  var LAMP_NAME = {
    denom: "乘分母",
    expand: "拆括號",
    move: "移項",
    collect: "抽主項",
    divide: "除數",
  };
  var CHAPTERS = [
    { n: "一", name: "入門訂單", desc: "x ± a = b", open: true },
    { n: "二", name: "同重之箱", desc: "ax = b", open: false },
    { n: "三", name: "箱與砝碼", desc: "ax ± b = c", open: false },
    { n: "四", name: "兩岸有箱", desc: "兩邊都有 x", open: false },
    { n: "五", name: "拆箱工時", desc: "括號", open: false },
    { n: "六", name: "統一份額", desc: "分母與綜合", open: false },
  ];

  var screen = "intro";
  var mode = "guide";
  var run = null;
  var results = [];
  var feedback = null;
  var tilt = null;
  var settle = false;
  var lock = false;
  var selected = null;
  var traySign = -1;
  var trayChip = null;
  var divChip = null;
  var checkDraft = "";
  var checkView = null;
  var focusCheck = false;
  var animId = 0;
  var drag = null;
  var suppressClick = false;
  var divideOpen = null;
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
      '<p class="sub">天平工房 · 第一章　入門訂單</p>' +
      "</div></header>" +
      '<main><div class="wrap stack">' + body + "</div></main>" +
      '<div id="ghost" class="token token-w ghost" hidden></div>'
    );
  }

  function pills(step) {
    var items = ["接單", "操作天平", "複秤"];
    var now = { work: 1, check: 2, done: 3 }[step];
    return '<div class="pills">' + items.map(function (label, index) {
      var cls = index < now ? "done" : index === now ? "now" : "";
      return '<span class="pill ' + cls + '">' + label + "</span>";
    }).join("") + "</div>";
  }

  function feedbackHtml() {
    if (!feedback) return "";
    var cls = feedback.kind === "ok" ? "notice ok" : feedback.kind === "bad" ? "notice" : "hint";
    return '<div class="' + cls + '" id="feedback">' + esc(feedback.text) + "</div>";
  }

  function renderIntro() {
    return (
      '<section class="card">' +
      '<p class="master">新訂單到了。神秘箱標著 x，天平兩邊必須一樣重，才能交貨。</p>' +
      "<ul class=\"rules\">" +
      "<li>箱子代表未知數 x。砝碼是已知的數。</li>" +
      "<li>把砝碼拖到另一盤，經過支點就要變號。這就是移項。</li>" +
      "<li>也可以在兩邊同時加上或減去同一個數。只改一邊，天平會傾斜。</li>" +
      "<li>思考次序：乘分母 → 拆括號 → 移項 → 抽主項 → 除數。灰色的燈表示這張訂單可以跳過。</li>" +
      "<li>最後一定要複秤：把你求得的 x 代回原式。解題畫面上不會先寫出 x 的值。</li>" +
      "<li>每張訂單由 100 分起算，每失誤扣 10 分，最低 0 分。複秤一次成功，另加 10 分。</li>" +
      "</ul>" +
      '<div class="lamps" aria-hidden="true">' +
      "<span class=\"lamp skip\">乘分母</span><span class=\"lamp skip\">拆括號</span>" +
      "<span class=\"lamp need\">移項</span><span class=\"lamp skip\">抽主項</span><span class=\"lamp need\">除數</span>" +
      "</div>" +
      '<p class="fine">橙燈是這張訂單用得著的步驟，灰燈可以跳過。引導模式會用黃虛線標出建議的下一步。</p>' +
      '<div class="btn-row" style="margin-top:14px">' +
      '<button type="button" class="btn btn-primary" data-act="enter" data-mode="guide">引導模式進入</button>' +
      '<button type="button" class="btn btn-ghost" data-act="enter" data-mode="challenge">挑戰模式進入</button>' +
      "</div>" +
      '<p class="fine">引導：口訣燈會標出建議的下一步。挑戰：不標建議。扣分規則相同。</p>' +
      "</section>"
    );
  }

  function renderMap() {
    var done = results.length;
    var playing = run && !run.solved;
    var label = playing
      ? "繼續第 " + (run.index + 1) + "／5 張"
      : done >= 5
        ? "查看本章成績"
        : done === 0
          ? "開始第一章"
          : "繼續第 " + (done + 1) + "／5 張";
    var cards = CHAPTERS.map(function (chapter) {
      return (
        '<div class="chapter' + (chapter.open ? "" : " lock") + '">' +
        '<div class="num">' + chapter.n + "</div>" +
        "<strong>" + chapter.name + "</strong>" +
        "<small>" + chapter.desc + "</small>" +
        "<small>" + (chapter.open ? "可開始" : "尚未開放") + "</small>" +
        "</div>"
      );
    }).join("");
    var progress = results.map(function (item) {
      return "<li>第 " + item.number + " 張 " + esc(item.title) + "：" + item.score + " 分</li>";
    }).join("");
    return (
      '<section class="card">' +
      "<h2>工房訂單牆</h2>" +
      '<p class="lead">第一章處理 x ± a = b。其餘章節尚未開放。</p>' +
      '<p>模式：<span class="tag">' + (mode === "guide" ? "引導" : "挑戰") + "</span></p>" +
      '<div class="btn-row" style="margin-top:8px">' +
      '<button type="button" class="btn btn-ghost' + (mode === "guide" ? " is-on" : "") + '" data-act="mode" data-mode="guide">引導</button>' +
      '<button type="button" class="btn btn-ghost' + (mode === "challenge" ? " is-on" : "") + '" data-act="mode" data-mode="challenge">挑戰</button>' +
      "</div>" +
      (progress ? '<ul class="rules">' + progress + "</ul>" : "") +
      '<div class="chapters">' + cards + "</div>" +
      '<div class="btn-row" style="margin-top:14px">' +
      '<button type="button" class="btn btn-primary" data-act="continue">' + label + "</button>" +
      '<button type="button" class="btn btn-ghost" data-act="restart">重頭開始本章</button>' +
      "</div>" +
      "</section>"
    );
  }

  function tokenButton(t) {
    var cls = ["token"];
    if (t.type === "x") cls.push("token-x");
    else if (t.secret) cls.push("token-secret");
    else cls.push("token-w");
    if (t.neg) cls.push("neg");
    if (selected === t.id) cls.push("is-selected");
    var kicker = t.type === "x" ? "<small>箱</small>" : "";
    return (
      '<button type="button" class="' + cls.join(" ") + '" data-token="' + esc(t.id) +
      '" data-drop="merge" data-id="' + esc(t.id) + '" data-side="' + t.side + '" data-type="' + t.type + '">' +
      kicker + "<b>" + esc(t.label) + "</b></button>"
    );
  }

  function panHtml(side, tokens) {
    var name = side === "L" ? "左盤" : "右盤";
    var inner = tokens.length
      ? tokens.map(tokenButton).join("")
      : '<span class="empty">空</span>';
    return (
      '<div class="pan pan-' + side.toLowerCase() + '" data-side="' + side + '">' +
      '<p class="pan-name">' + name + "</p>" +
      '<div class="tokens">' + inner + "</div>" +
      '<div class="zone zone-flip" data-drop="flip" data-side="' + side + '"></div>' +
      '<div class="zone zone-same" data-drop="same" data-side="' + side + '">保持原號</div>' +
      '<div class="zone zone-one" data-drop="one" data-side="' + side + '">只放這一盤</div>' +
      "</div>"
    );
  }

  function statusText(v) {
    if (tilt) return "天平傾斜。";
    if (v.ready) return "x 已單獨在一邊。請到複秤填寫重量。";
    return "天平平衡。";
  }

  function scaleHtml(v) {
    var cls = ["scale"];
    if (tilt === "L") cls.push("tilt-l");
    if (tilt === "R") cls.push("tilt-r");
    if (settle) cls.push("settle");
    if (lock || v.sealed) cls.push("is-locked");
    if (v.mode === "guide") cls.push("guide");
    return (
      '<div class="' + cls.join(" ") + '" id="scale">' +
      '<div class="hanger">' +
      '<div class="pans">' + panHtml("L", v.tokens.L) + panHtml("R", v.tokens.R) + "</div>" +
      '<div class="beam"></div>' +
      '<div class="zone zone-both" data-drop="both">兩邊同時</div>' +
      "</div>" +
      '<div class="pivot" aria-hidden="true"></div>' +
      '<div class="stand" aria-hidden="true"></div>' +
      '<div class="foot" aria-hidden="true"></div>' +
      '<p class="scale-status" id="drag-hint">' + esc(statusText(v)) + "</p>" +
      "</div>"
    );
  }

  function lampsHtml(v) {
    return '<div class="lamps">' + v.lamps.map(function (lamp) {
      var cls = ["lamp", lamp.state];
      if (lamp.hint) cls.push("hint");
      return '<button type="button" class="' + cls.join(" ") + '" data-act="lamp" data-lamp="' + lamp.id + '">' +
        LAMP_NAME[lamp.id] + "</button>";
    }).join("") + "</div>";
  }

  function selectedHtml(v) {
    if (!selected || v.sealed) return "";
    var all = v.tokens.L.concat(v.tokens.R);
    var found = null;
    var i;
    for (i = 0; i < all.length; i += 1) if (all[i].id === selected) found = all[i];
    if (!found) return "";
    return (
      '<div class="card inset"><p>已選 <b>' + esc(found.label) + "</b>。拖到另一盤也一樣。</p>" +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="move" data-flip="1">移到另一邊（變號）</button>' +
      '<button type="button" class="btn btn-ghost" data-act="move" data-flip="0">移到另一邊（不變號）</button>' +
      '<button type="button" class="btn btn-ghost" data-act="clear-select">取消</button>' +
      "</div></div>"
    );
  }

  function trayHtml(v) {
    if (v.sealed) {
      return '<p class="fine">最後的砝碼已封好，這裡不顯示數字。請複秤，或返回上一步。</p>';
    }
    var chips = v.chips.map(function (n) {
      return '<button type="button" class="chip' + (trayChip === n ? " is-on" : "") +
        '" data-act="chip" data-val="' + n + '">' + n + "</button>";
    }).join("");
    var preview = trayChip == null ? "拖" : (traySign < 0 ? "−" : "＋") + trayChip;
    return (
      '<div class="card inset"><h3>兩邊同時加減</h3>' +
      '<p class="fine">先選加上或減去，再選數值。拖到中間是兩邊同時；只放一盤會傾斜。</p>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-ghost' + (traySign === 1 ? " is-on" : "") + '" data-act="sign" data-sign="1">加上</button>' +
      '<button type="button" class="btn btn-ghost' + (traySign === -1 ? " is-on" : "") + '" data-act="sign" data-sign="-1">減去</button>' +
      "</div>" +
      '<div class="chips">' + chips + "</div>" +
      '<label class="field">或輸入正整數<input id="tray-n" type="text" inputmode="numeric" autocomplete="off"></label>' +
      '<button type="button" class="token token-w tray-token" data-tray="1"><b>' + preview + "</b></button>" +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="add" data-side="both">放到兩邊</button>' +
      '<button type="button" class="btn btn-ghost" data-act="add" data-side="L">只放左盤</button>' +
      '<button type="button" class="btn btn-ghost" data-act="add" data-side="R">只放右盤</button>' +
      "</div></div>"
    );
  }

  function divideHtml(v) {
    if (v.sealed) return "";
    var divideLamp = null;
    var i;
    for (i = 0; i < v.lamps.length; i += 1) if (v.lamps[i].id === "divide") divideLamp = v.lamps[i];
    var autoOpen = divideLamp.state === "need" || (v.xCoeff != null && v.xCoeff !== 1);
    var open = divideOpen === null ? autoOpen : divideOpen;
    var values = [-1, 1, 2];
    if (v.xCoeff != null && values.indexOf(v.xCoeff) === -1) values.unshift(v.xCoeff);
    var chips = values.map(function (n) {
      return '<button type="button" class="chip' + (divChip === n ? " is-on" : "") +
        '" data-act="divchip" data-val="' + n + '">' + fmt(n) + "</button>";
    }).join("");
    var note = v.xCoeff == null ? "" : '<p class="fine">現在 x 的係數是 ' + fmt(v.xCoeff) + "。</p>";
    return (
      '<details class="card inset"' + (open ? " open" : "") + ">" +
      "<summary>除數" + (open ? "" : "（這張訂單通常可跳過）") + "</summary>" +
      note +
      '<div class="chips">' + chips + "</div>" +
      '<label class="field">或輸入整數除數<input id="div-n" type="text" autocomplete="off"></label>' +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="divide" data-side="both">兩邊同除</button>' +
      '<button type="button" class="btn btn-ghost" data-act="divide" data-side="L">只除左盤</button>' +
      '<button type="button" class="btn btn-ghost" data-act="divide" data-side="R">只除右盤</button>' +
      "</div></details>"
    );
  }

  function renderSolve() {
    var v = Engine.view(run);
    var steps = v.steps.slice(-4).join(" → ");
    return (
      '<section class="card" data-screen="solve">' +
      '<div class="q-head"><p class="q-no">第 ' + v.number + "／" + v.total + ' 關</p>' +
      '<p class="score">本單 <b id="score">' + v.score + '</b> 分</p></div>' +
      pills("work") +
      '<div class="split"><h2>' + esc(v.title) + '</h2><span class="tag">' +
      (v.mode === "guide" ? "引導" : "挑戰") + "</span></div>" +
      '<p class="lead">' + esc(v.brief) + "</p>" +
      lampsHtml(v) +
      '<p class="fine">' + (v.mode === "guide"
        ? "橙燈是這張訂單用得著的步驟，黃虛線是建議的下一步，灰燈可以跳過。"
        : "橙燈是這張訂單用得著的步驟，灰燈可以跳過。挑戰模式不提示下一步。") + "</p>" +
      '<p class="fine">原訂單：' + esc(v.originalEquation) + "</p>" +
      '<p class="expr" id="equation">' + esc(v.equation) + "</p>" +
      (v.beforeSeal ? '<p class="fine">上一步：' + esc(v.beforeSeal) + "</p>" : "") +
      '<p class="fine">過程：' + esc(steps) + "</p>" +
      feedbackHtml() +
      scaleHtml(v) +
      selectedHtml(v) +
      (v.sealed ? "" :
        '<div class="btn-row">' +
        '<button type="button" class="btn btn-ghost" data-act="merge" data-side="L">合併左盤同類項</button>' +
        '<button type="button" class="btn btn-ghost" data-act="merge" data-side="R">合併右盤同類項</button>' +
        "</div>") +
      trayHtml(v) +
      divideHtml(v) +
      '<div class="btn-row" style="margin-top:12px">' +
      '<button type="button" class="btn btn-primary' + (v.ready ? " pulse" : "") + '" data-act="to-check">到複秤交貨</button>' +
      '<button type="button" class="btn btn-ghost" data-act="undo"' + (v.canUndo ? "" : " disabled") + ">返回上一步</button>" +
      '<button type="button" class="btn btn-ghost" data-act="map">返回訂單牆</button>' +
      "</div></section>"
    );
  }

  function renderCheck() {
    var v = Engine.view(run);
    var compare = "";
    if (checkView) {
      compare =
        '<div class="compare"><div><h3>左式</h3><p>' + esc(checkView.leftText) + "</p></div>" +
        "<div><h3>右式</h3><p>" + esc(checkView.rightText) + "</p></div></div>";
    }
    return (
      '<section class="card" data-screen="check">' +
      '<div class="q-head"><p class="q-no">第 ' + v.number + "／" + v.total + ' 關</p>' +
      '<p class="score">本單 <b>' + v.score + "</b> 分</p></div>" +
      pills("check") +
      "<h2>複秤 · 代入原式</h2>" +
      '<p class="master">把你求得的 x 代回原訂單。左右相等，才算交貨。</p>' +
      '<p class="expr">原訂單：' + esc(v.originalEquation) + "</p>" +
      '<p class="fine">剛才的方程：' + esc(v.equation) +
      (v.beforeSeal ? "（上一步：" + esc(v.beforeSeal) + "）" : "") + "</p>" +
      '<form data-check-form="1">' +
      '<label class="field inline">x = <input class="check-input" id="x-entry" name="x" type="text" value="' +
      esc(checkDraft) + '" autocomplete="off" inputmode="text" aria-label="x 的值" placeholder="？"></label>' +
      '<div class="btn-row"><button type="submit" class="btn btn-primary">代入複秤</button></div>' +
      "</form>" +
      compare +
      feedbackHtml() +
      '<div class="btn-row"><button type="button" class="btn btn-ghost" data-act="back-solve">返回天平</button></div>' +
      "</section>"
    );
  }

  function renderClear() {
    var last = results[results.length - 1];
    var cuts = last.deductions.length
      ? last.deductions.map(function (item) {
        return esc(item.label) + " −" + item.points;
      }).join("、")
      : "這張訂單沒有扣分。";
    var bonus = last.bonus ? "<p>複秤獎金 +" + last.bonus + "</p>" : "";
    var nextLabel = results.length >= 5 ? "查看本章成績" : "下一張訂單";
    return (
      '<section class="card" data-screen="clear">' +
      pills("done") +
      "<h2>訂單完成</h2>" +
      '<p class="master">重量確認。工房收下這隻箱子了。</p>' +
      '<p class="expr">你交貨的重量：x = ' + fmt(last.entry) + "</p>" +
      '<div class="compare"><div><h3>左式</h3><p>' + esc(last.leftText) + "</p></div>" +
      "<div><h3>右式</h3><p>" + esc(last.rightText) + "</p></div></div>" +
      '<p class="notice ok">左右相等。</p>' +
      "<p>本單得分 <b>" + last.score + "</b></p>" +
      bonus +
      "<p>扣分：" + cuts + "</p>" +
      feedbackHtml() +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="next">' + nextLabel + "</button>" +
      '<button type="button" class="btn btn-ghost" data-act="map">返回訂單牆</button>' +
      "</div></section>"
    );
  }

  function renderFinale() {
    var total = 0;
    var rows = results.map(function (item) {
      total += item.score;
      return "<li>第 " + item.number + " 張 " + esc(item.title) + "：x = " + fmt(item.entry) +
        "，" + item.score + " 分</li>";
    }).join("");
    return (
      '<section class="card" data-screen="finale">' +
      "<h2>第一章完成</h2>" +
      '<p class="master">五張訂單都已複秤交貨。</p>' +
      "<ul class=\"rules\">" + rows + "</ul>" +
      "<p>合計 <b>" + total + "</b> 分</p>" +
      '<div class="btn-row">' +
      '<button type="button" class="btn btn-primary" data-act="restart">再玩一次</button>' +
      '<a class="btn btn-ghost" href="../">返回課題目錄</a>' +
      "</div></section>"
    );
  }

  function render() {
    var draft = document.getElementById("x-entry");
    if (draft) checkDraft = draft.value;
    var body = renderIntro();
    if (screen === "map") body = renderMap();
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
    selected = null;
    divideOpen = null;
    trayChip = null;
    traySign = -1;
    divChip = null;
    checkDraft = "";
    checkView = null;
    tilt = null;
    settle = false;
    lock = false;
    feedback = {
      kind: "info",
      text: mode === "guide"
        ? "拖動砝碼到另一盤就會變號。灰色口訣燈表示這一步可以跳過。"
        : "挑戰模式不標出下一步。請維持天平兩邊相等。",
    };
    render();
  }

  function playTilt(side) {
    var id = ++animId;
    tilt = side;
    lock = true;
    settle = false;
    render();
    window.setTimeout(function () {
      if (id !== animId) return;
      tilt = null;
      lock = false;
      render();
    }, reduceMotion ? 280 : 900);
  }

  function markSettle() {
    settle = true;
    render();
    window.setTimeout(function () { settle = false; }, reduceMotion ? 0 : 800);
  }

  function apply(result) {
    if (!result) return;
    var penalized = result.message && result.message.indexOf("扣") !== -1;
    var kind = result.ok ? "ok" : (penalized || result.tilt ? "bad" : "info");
    feedback = { kind: kind, text: result.message };
    selected = null;
    if (result.tilt) {
      playTilt(result.tilt);
      return;
    }
    if (result.ok && result.applied) {
      markSettle();
      return;
    }
    render();
  }

  function readTray() {
    var input = document.getElementById("tray-n");
    var mag = null;
    if (input && input.value.trim() !== "") {
      var typed = Engine.parseStudent(input.value);
      if (typed === null || typed <= 0) return { error: "數值請填正整數。減號請按「減去」。" };
      mag = typed;
    } else if (trayChip != null) mag = trayChip;
    else return { error: "請先選擇砝碼的數值。" };
    return { value: traySign * mag };
  }

  function readDiv() {
    var input = document.getElementById("div-n");
    if (input && input.value.trim() !== "") {
      var typed = Engine.parseStudent(input.value);
      if (typed === null) return { error: "除數請填整數。" };
      return { value: typed };
    }
    if (divChip == null) return { error: "請選擇除數。" };
    return { value: divChip };
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
    focusCheck = true;
    feedback = { kind: "info", text: "把 x 代回原訂單。這裡要你自己填，畫面上不會先公布答案。" };
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
      feedback = { kind: "ok", text: result.message };
      checkView = null;
      screen = "clear";
      render();
      return;
    }
    feedback = { kind: "bad", text: result.message };
    checkView = { leftText: result.leftText, rightText: result.rightText };
    render();
  }

  function continueChapter() {
    if (results.length >= 5 && !(run && !run.solved)) {
      screen = "finale";
      render();
      return;
    }
    if (run && !run.solved) {
      screen = "solve";
      render();
      return;
    }
    startMission(results.length);
  }

  function onClick(event) {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (lock && !event.target.closest("a")) return;
    var token = event.target.closest("[data-token]");
    var actEl = event.target.closest("[data-act]");
    if (token && !actEl) {
      if (run && Engine.view(run).sealed) return;
      selected = selected === token.dataset.token ? null : token.dataset.token;
      render();
      return;
    }
    if (!actEl || actEl.disabled) return;
    var act = actEl.dataset.act;
    if (act === "enter") {
      mode = actEl.dataset.mode === "challenge" ? "challenge" : "guide";
      screen = "map";
      render();
      return;
    }
    if (act === "mode") {
      mode = actEl.dataset.mode === "challenge" ? "challenge" : "guide";
      if (run && !run.solved) run.mode = mode;
      render();
      return;
    }
    if (act === "continue") {
      continueChapter();
      return;
    }
    if (act === "restart") {
      results = [];
      run = null;
      screen = "intro";
      feedback = null;
      render();
      return;
    }
    if (act === "map") {
      screen = "map";
      tilt = null;
      lock = false;
      render();
      return;
    }
    if (act === "lamp") {
      feedback = { kind: "info", text: Engine.lampHelp(run, actEl.dataset.lamp) };
      render();
      return;
    }
    if (act === "clear-select") {
      selected = null;
      render();
      return;
    }
    if (act === "move") {
      if (!selected) return;
      apply(Engine.moveTerm(run, selected, actEl.dataset.flip === "1"));
      return;
    }
    if (act === "chip") {
      trayChip = Number(actEl.dataset.val);
      render();
      return;
    }
    if (act === "sign") {
      traySign = Number(actEl.dataset.sign);
      render();
      return;
    }
    if (act === "divchip") {
      divChip = Number(actEl.dataset.val);
      render();
      return;
    }
    if (act === "add") {
      var tray = readTray();
      if (tray.error) {
        feedback = { kind: "bad", text: tray.error };
        render();
        return;
      }
      apply(Engine.addToPans(run, actEl.dataset.side, tray.value));
      return;
    }
    if (act === "merge") {
      apply(Engine.mergeSide(run, actEl.dataset.side));
      return;
    }
    if (act === "divide") {
      var div = readDiv();
      if (div.error) {
        feedback = { kind: "bad", text: div.error };
        render();
        return;
      }
      apply(Engine.divide(run, actEl.dataset.side, div.value));
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
    if (act === "back-solve") {
      screen = "solve";
      feedback = { kind: "info", text: "已返回天平。方程維持剛才的樣子。" };
      render();
      return;
    }
    if (act === "next") {
      if (results.length >= 5) {
        screen = "finale";
        render();
        return;
      }
      startMission(results.length);
    }
  }

  function onSubmit(event) {
    if (!event.target.closest("[data-check-form]")) return;
    event.preventDefault();
    doCheck();
  }

  function findDrop(x, y, current) {
    var stack = document.elementsFromPoint(x, y);
    var drops = [];
    var i;
    for (i = 0; i < stack.length; i += 1) {
      if (stack[i].dataset && stack[i].dataset.drop) drops.push(stack[i]);
    }
    function first(kind, pred) {
      var j;
      for (j = 0; j < drops.length; j += 1) {
        if (drops[j].dataset.drop === kind && (!pred || pred(drops[j]))) return drops[j];
      }
      return null;
    }
    if (current.mode === "term") {
      var merge = first("merge", function (el) {
        return el.dataset.id !== current.id && el.dataset.side === current.side && el.dataset.type === current.type;
      });
      if (merge) return merge;
      var same = first("same", function (el) { return el.dataset.side !== current.side; });
      if (same) return same;
      return first("flip", function (el) { return el.dataset.side !== current.side; });
    }
    return first("both") || first("one");
  }

  function clearDragClasses() {
    var ghost = document.getElementById("ghost");
    if (ghost) ghost.hidden = true;
    var scale = document.getElementById("scale");
    if (!scale) return;
    scale.classList.remove("drag-term", "drag-tray");
    var marked = scale.querySelectorAll(".target, .is-over");
    var i;
    for (i = 0; i < marked.length; i += 1) marked[i].classList.remove("target", "is-over");
  }

  function onPointerDown(event) {
    suppressClick = false;
    if (lock || event.button > 0) return;
    var tray = event.target.closest("[data-tray]");
    var token = event.target.closest("[data-token]");
    if (!tray && !token) return;
    if (token && run && Engine.view(run).sealed) return;
    drag = {
      pointerId: event.pointerId,
      mode: tray ? "tray" : "term",
      id: token ? token.dataset.token : "",
      side: token ? token.dataset.side : "",
      type: token ? token.dataset.type : "",
      label: token ? token.querySelector("b").textContent : "",
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      value: null,
    };
  }

  function onPointerMove(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.moved) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
      if (drag.mode === "tray") {
        var got = readTray();
        if (got.error) {
          drag = null;
          feedback = { kind: "bad", text: got.error };
          render();
          return;
        }
        drag.value = got.value;
        drag.label = fmt(got.value);
      }
      drag.moved = true;
      var scale = document.getElementById("scale");
      if (scale) {
        scale.classList.add(drag.mode === "tray" ? "drag-tray" : "drag-term");
        if (drag.mode === "term") {
          var pan = scale.querySelector(drag.side === "L" ? ".pan-r" : ".pan-l");
          if (pan) pan.classList.add("target");
        }
      }
      var hint = document.getElementById("drag-hint");
      if (hint) {
        hint.textContent = drag.mode === "tray"
          ? "放到中間是兩邊同時。只放一盤會傾斜。"
          : "拖到另一盤即變號。盤底「保持原號」會傾斜。";
      }
    }
    var ghost = document.getElementById("ghost");
    if (ghost) {
      ghost.hidden = false;
      ghost.textContent = drag.label;
      ghost.style.left = event.clientX + "px";
      ghost.style.top = event.clientY + "px";
    }
    var old = document.querySelectorAll(".is-over");
    var i;
    for (i = 0; i < old.length; i += 1) old[i].classList.remove("is-over");
    var drop = findDrop(event.clientX, event.clientY, drag);
    if (drop) drop.classList.add("is-over");
  }

  function onPointerUp(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    var current = drag;
    drag = null;
    if (!current.moved) return;
    suppressClick = true;
    var drop = findDrop(event.clientX, event.clientY, current);
    clearDragClasses();
    if (!drop) return;
    if (current.mode === "term" && drop.dataset.drop === "merge") {
      apply(Engine.mergeTwo(run, current.id, drop.dataset.id));
      return;
    }
    if (current.mode === "term" && drop.dataset.drop === "same") {
      apply(Engine.moveTerm(run, current.id, false));
      return;
    }
    if (current.mode === "term" && drop.dataset.drop === "flip") {
      apply(Engine.moveTerm(run, current.id, true));
      return;
    }
    if (current.mode === "tray" && drop.dataset.drop === "both") {
      apply(Engine.addToPans(run, "both", current.value));
      return;
    }
    if (current.mode === "tray" && drop.dataset.drop === "one") {
      apply(Engine.addToPans(run, drop.dataset.side, current.value));
    }
  }

  function onKey(event) {
    if (event.key === "Escape" && drag) {
      drag = null;
      clearDragClasses();
    }
  }

  var app = document.getElementById("app");
  app.addEventListener("click", onClick);
  app.addEventListener("submit", onSubmit);
  app.addEventListener("toggle", function (event) {
    if (event.target.tagName === "DETAILS") divideOpen = event.target.open;
  }, true);
  app.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", onKey);
  render();
})();
