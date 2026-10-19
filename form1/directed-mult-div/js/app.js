(function () {
  const KEY = "m2divmul.v4";
  const WARM = [
    { id: "w1", src: "(−4)×(+3)" },
    { id: "w2", src: "(+12)÷(−3)" },
    { id: "w3", src: "(−3)−5" },
    { id: "w4", src: "(−3)(−5)" },
  ];
  const CHAL = [
    { id: "c1", src: "(−3)(5)", ask: "omit" },
    { id: "c2", src: "frac{−18}{3}", ask: "bar" },
    { id: "c3", src: "(−2)(−3)(+4)", ask: "two" },
  ];
  const EXIT = [
    { id: "e1", src: "(−5)(+2)" },
    { id: "e2", src: "frac{−20}{+4}" },
    { id: "e3", src: "(−5)−(+2)" },
    { id: "e4", src: "(−5)(−2)" },
    { id: "e5", src: "(+3)+(−2)" },
    { id: "e6", src: "(+3)(−2)(−1)" },
    { id: "e7", src: "5−(−3)" },
    { id: "e8", src: "frac{(−24)}{(−3)}" },
  ];
  const MATCH = [
    { id: "m1", src: "(−4)×(+3)" },
    { id: "m2", src: "(+12)÷(−3)" },
    { id: "m3", src: "(−3)−5" },
    { id: "m4", src: "(−3)(−5)" },
    { id: "m5", src: "frac{−20}{+4}" },
    { id: "m6", src: "(+3)+(−2)" },
    { id: "m7", src: "5−(−3)" },
    { id: "m8", src: "(−5)(+2)" },
  ];
  const OPS = [
    { id: "add", label: "加法" },
    { id: "sub", label: "減法" },
    { id: "mul", label: "乘法" },
    { id: "div", label: "除法" },
  ];
  const PROMPTS = {
    omit: {
      title: "想",
      text: "兩個括號靠在一起，是哪種運算？",
      options: OPS,
      answer: "mul",
      hints: ["再看括號中間有沒有運算符號。", "括號靠在一起是乘法。"],
    },
    bar: {
      title: "奇",
      text: "分數線表示哪種運算？",
      options: OPS,
      answer: "div",
      hints: ["再看中間那條橫線。", "分數線是除法。"],
    },
    two: {
      title: "想",
      text: "兩個 − 之後，結果是正還是負？",
      options: [
        { id: "pos", label: "正" },
        { id: "neg", label: "負" },
      ],
      answer: "pos",
      hints: ["再數有幾個 −。", "兩個 − 是偶數次，結果是正。"],
    },
  };
  const STEPS = [
    { id: "intro", label: "開始" },
    { id: "rules", label: "規則" },
    { id: "warm", label: "熱身" },
    { id: "challenge", label: "挑戰" },
    { id: "exit", label: "出門" },
    { id: "match", label: "配對" },
  ];

  let focusStw = false;
  let state = fresh();

  function fresh() {
    return {
      version: 4,
      section: "intro",
      started: false,
      idx: { warm: 0, challenge: 0 },
      opOk: {},
      turns: {},
      solved: {},
      tries: {},
      revealed: {},
      draft: "",
      promptOk: {},
      promptTries: {},
      see: "",
      seeDone: false,
      rulesDone: false,
      exitDraft: {},
      exitOp: {},
      exitTries: 0,
      exitHint: false,
      exitReveal: {},
      exitMiss: [],
      exitOk: false,
      matched: {},
      matchSel: "",
      matchOrder: null,
      notice: "",
    };
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (saved && saved.version === 4) state = Object.assign(fresh(), saved);
    } catch (err) {
      state = fresh();
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      /* keep going if storage is blocked */
    }
  }

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function factorText(factor) {
    const sign = factor.n < 0 ? "−" : factor.explicitSign ? "+" : "";
    const body = sign + Math.abs(factor.n);
    return factor.paren ? "(" + body + ")" : body;
  }

  function spoken(n) {
    return (n < 0 ? "負" : "") + Math.abs(n);
  }

  function renderExpr(expr) {
    if (!expr) return "";
    if (expr.display === "fraction") {
      const label = spoken(expr.factors[0].n) + "除以" + spoken(expr.factors[1].n);
      return (
        '<span class="frac" role="img" aria-label="' + esc(label) + '">' +
        '<span class="frac-num">' + factorText(expr.factors[0]) + "</span>" +
        '<span class="frac-bar"></span>' +
        '<span class="frac-den">' + factorText(expr.factors[1]) + "</span></span>"
      );
    }
    const parts = expr.factors.map(function (factor, index) {
      const op = index > 0 && expr.between[index - 1]
        ? '<span class="op">' + expr.between[index - 1] + "</span>"
        : "";
      return op + '<span class="factor">' + factorText(factor) + "</span>";
    });
    const cls = expr.juxtaposed ? "expr-body juxt" : "expr-body";
    return '<span class="' + cls + '">' + parts.join("") + "</span>";
  }

  function exprOf(src) {
    return renderExpr(M2.parse(src));
  }

  function listDone(list) {
    return list.every(function (item) { return state.solved[item.id]; });
  }

  function challengeDone() {
    return state.seeDone && CHAL.every(function (item) {
      return state.solved[item.id] && state.promptOk[item.id];
    });
  }

  function matchDone() {
    return MATCH.every(function (item) { return state.matched[item.src]; });
  }

  function unlocked(section) {
    if (section === "intro") return true;
    if (section === "rules") return state.started;
    if (section === "warm") return state.rulesDone;
    if (section === "challenge") return listDone(WARM);
    if (section === "exit") return challengeDone();
    if (section === "match") return !!state.exitOk;
    return false;
  }

  function stepDone(section) {
    if (section === "intro") return state.started;
    if (section === "rules") return state.rulesDone;
    if (section === "warm") return listDone(WARM);
    if (section === "challenge") return challengeDone();
    if (section === "exit") return !!state.exitOk;
    if (section === "match") return matchDone();
    return false;
  }

  function currentQ() {
    if (state.section === "warm") return WARM[state.idx.warm];
    if (state.section === "challenge" && state.seeDone) return CHAL[state.idx.challenge];
    return null;
  }

  function noticeHTML() {
    if (!state.notice) return "";
    const ok = state.notice === "對了。" || state.notice === "八題都對了。" || state.notice === "配完了。";
    return '<p class="notice' + (ok ? " ok" : "") + '" role="alert">' + esc(state.notice) + "</p>";
  }

  function opButtons(act, picked, id) {
    return '<div class="op-row">' + OPS.map(function (op) {
      const on = picked === op.id ? " is-on" : "";
      const extra = id ? ' data-id="' + id + '"' : "";
      return '<button type="button" class="btn' + on + '" data-act="' + act + '" data-op="' + op.id + '"' + extra + ">" + op.label + "</button>";
    }).join("") + "</div>";
  }

  function opHint(picked, expr, item) {
    if (item && item.ask === "omit" && picked === "sub") return "沒有中間的減號。括號靠在一起仍是乘法。";
    if (expr.juxtaposed && picked === "sub") return "沒有中間的減號。括號靠在一起是乘法。";
    if (expr.kind === "sub" && picked === "mul") return "中間是減號，這是減法。";
    if (expr.kind === "sub" && picked === "add") return "中間是減號，不是加號。";
    if (expr.kind === "add" && picked !== "add") return "中間是加號，這是加法。";
    if (picked === "div" && expr.kind !== "div") return "這裡沒有除號，也沒有分數線。";
    if (picked === "mul" && expr.kind === "div") return "這題有除號或分數線。";
    return "再看運算符號。";
  }

  function answerHint(expr, tries) {
    if (expr.kind === "add" || expr.kind === "sub") return "這題用加減計算。";
    if (tries < 2) return "再數 − 是奇數還是偶數，再算絕對值。";
    return (M2.signName(expr) === "負" ? "奇數，結果是負。" : "偶數，結果是正。") + "再算絕對值。";
  }

  function countLine(expr, raw) {
    const text = String(raw == null ? "" : raw).trim().replace(/[０-９]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
    });
    if (!text) return "寫下有幾個 −。可以先不算，直接寫結果。";
    if (!/^\d+$/.test(text)) return "寫一個整數。";
    const n = Number(text);
    if (n !== expr.minusCount) return "再數括號裡的 −。";
    if (n === 0) return "沒有 −，結果是正。";
    return n % 2 === 1 ? "奇數，結果是負。" : "偶數，結果是正。";
  }

  function turnBox(item, expr) {
    const raw = state.turns[item.id] == null ? "" : String(state.turns[item.id]);
    return '<div class="turn-box"><label>有幾個「−」？ <input data-save="turns" data-id="' + item.id + '" inputmode="numeric" placeholder="轉幾次" value="' + esc(raw) + '"></label>' +
      '<p class="sign-line">' + esc(countLine(expr, raw)) + "</p></div>";
  }

  function stageHTML(item, list, index, label) {
    const expr = M2.parse(item.src);
    const ready = !!state.opOk[item.id];
    const solved = !!state.solved[item.id];
    const prompt = item.ask && solved && !state.promptOk[item.id] ? PROMPTS[item.ask] : null;
    const showNext = solved && (!item.ask || state.promptOk[item.id]);
    const last = index === list.length - 1;
    const nextLabel = state.section === "warm" ? (last ? "去挑戰" : "下一題") : (last ? "去出門" : "下一題");
    const shown = '<div class="expr">' + renderExpr(expr) + "</div>";
    let stw = "";
    if (!ready && !solved) {
      stw = '<section class="stw"><h2>先認</h2><p>這一題是哪種運算？</p>' + opButtons("op", "") + noticeHTML() + "</section>";
    } else if (prompt) {
      const choices = prompt.options.map(function (option) {
        return '<button type="button" class="btn" data-act="prompt" data-val="' + option.id + '">' + option.label + "</button>";
      }).join("");
      stw = '<section class="stw" data-ask="' + item.ask + '"><h2>' + prompt.title + "</h2><p>" + esc(prompt.text) + '</p><div class="choice-row">' + choices + "</div>" + noticeHTML() + "</section>";
    }
    let work = "";
    if (ready && !solved) {
      const coach = expr.kind === "mul" || expr.kind === "div"
        ? turnBox(item, expr)
        : '<p class="coach">這是加減，直接寫結果。</p>';
      const reveal = state.revealed[item.id]
        ? '<p class="fine">可寫 ' + M2.formatSigned(expr.end) + "</p>"
        : "";
      work = '<div class="work"><p class="status">這題是' + M2.kindName(expr.kind) + "。</p>" + coach +
        '<label>結果 <input data-save="draft" inputmode="text" value="' + esc(state.draft) + '"></label>' +
        reveal + noticeHTML() +
        '<button type="button" class="btn btn-primary" data-act="check">核對</button></div>';
    }
    const loose = ready || prompt ? "" : "";
    const next = showNext
      ? '<div class="next-row">' + noticeHTML() + '<button type="button" class="btn btn-primary" data-act="next">' + nextLabel + "</button></div>"
      : loose;
    return '<section class="stage card" data-src="' + esc(item.src) + '"><div class="qhead"><p class="progress">' + label + " " + (index + 1) + "／" + list.length + "</p>" + shown + "</div>" + stw + work + next + "</section>";
  }

  function seeHTML() {
    const items = CHAL.map(function (item) {
      return '<li class="see-item">' + exprOf(item.src) + "</li>";
    }).join("");
    return '<section class="card stw see"><h2>見</h2><p>這三題裡，哪一題用分數線表示除法？寫一句。</p><ol class="see-list">' + items + "</ol>" +
      '<textarea data-save="see" rows="2" placeholder="寫一句">' + esc(state.see) + "</textarea>" +
      noticeHTML() +
      '<button type="button" class="btn btn-primary" data-act="see-done">看完了</button></section>';
  }

  function introHTML() {
    return '<section class="card"><h2>先認運算，再寫結果</h2><p class="lead">乘除數括號裡的 −。奇數是負，偶數是正。然後直接算絕對值。</p><button type="button" class="btn btn-primary" data-act="start">開始</button></section>';
  }

  function rulesHTML() {
    return '<section class="card"><h2>兩條規則</h2><ol class="rules"><li>只數括號裡的「−」。有幾個就轉幾次。奇數是負，偶數是正。正號不算。兩數中間的減號是減法，不當成因數。</li><li>定了正負之後，直接計算絕對值的乘或除。</li></ol><button type="button" class="btn btn-primary" data-act="rules-next">去熱身</button></section>';
  }

  function exitHTML() {
    const items = EXIT.map(function (item, index) {
      const expr = M2.parse(item.src);
      const reveal = state.exitReveal[item.id]
        ? '<p class="fine">可寫 ' + M2.formatSigned(expr.end) + "，運算是" + M2.kindName(expr.kind) + "</p>"
        : (state.exitHint ? '<button type="button" class="btn btn-ghost" data-act="reveal" data-id="' + item.id + '">看結果</button>' : "");
      const missed = state.exitMiss.indexOf(item.id) >= 0;
      return '<li class="' + (missed ? "is-bad" : "") + '"><span class="qno">' + (index + 1) + "</span><div class=\"expr\">" + renderExpr(expr) + "</div>" +
        "<p>先選運算</p>" + opButtons("exit-op", state.exitOp[item.id] || "", item.id) +
        '<label>結果 <input data-save="exit" data-id="' + item.id + '" inputmode="text" value="' + esc(state.exitDraft[item.id] || "") + '"></label>' +
        reveal + "</li>";
    }).join("");
    const next = state.exitOk
      ? '<button type="button" class="btn btn-primary" data-act="goto" data-section="match">去配對</button>'
      : "";
    return '<section class="card"><h2>出門八題</h2><p class="lead">每題先選運算，再寫結果。</p><ol class="exit-list">' + items + "</ol>" + noticeHTML() +
      '<div class="controls inline"><button type="button" class="btn btn-primary" data-act="exit-submit">核對</button>' + next + "</div></section>";
  }

  function matchHTML() {
    if (!state.matchOrder || state.matchOrder.length !== MATCH.length) {
      const ids = MATCH.map(function (item) { return item.id; });
      for (let i = ids.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = ids[i];
        ids[i] = ids[j];
        ids[j] = tmp;
      }
      state.matchOrder = ids;
      save();
    }
    const byId = {};
    MATCH.forEach(function (item) { byId[item.id] = item; });
    const tiles = state.matchOrder.map(function (id) {
      const item = byId[id];
      const done = !!state.matched[item.src];
      const on = state.matchSel === item.src ? " is-on" : "";
      const tag = done ? '<span class="tag">' + M2.kindName(state.matched[item.src]) + "</span>" : "";
      return '<button type="button" class="tile' + on + (done ? " is-ok" : "") + '" data-act="match" data-src="' + esc(item.src) + '"' + (done ? " disabled" : "") + ">" + exprOf(item.src) + tag + "</button>";
    }).join("");
    const banner = matchDone() ? '<p class="banner">完成。奇數是負，偶數是正，然後直接算絕對值。</p>' : "";
    return '<section class="card"><h2>配對</h2><p class="lead">把算式配到運算。不用計算。</p>' + banner +
      '<div class="tiles">' + tiles + "</div>" +
      '<div class="op-row match-ops">' + OPS.map(function (op) {
        return '<button type="button" class="btn" data-act="match-op" data-op="' + op.id + '">' + op.label + "</button>";
      }).join("") + "</div>" + noticeHTML() + "</section>";
  }

  function recordHTML() {
    const rows = [];
    WARM.concat(CHAL).forEach(function (item) {
      if (!state.solved[item.id]) return;
      const expr = M2.parse(item.src);
      const marks = expr.minusCount == null ? "—" : String(expr.minusCount);
      rows.push("<tr><td>" + exprOf(item.src) + "</td><td>" + M2.kindName(expr.kind) + "</td><td>" + marks + "</td><td>" + M2.formatSigned(expr.end) + "</td></tr>");
    });
    if (!rows.length) return "";
    return '<aside class="record card"><h2>本關紀錄</h2><div class="table-wrap"><table><thead><tr><th>算式</th><th>運算</th><th>負號</th><th>結果</th></tr></thead><tbody>' + rows.join("") + "</tbody></table></div></aside>";
  }

  function stepperHTML() {
    return '<nav class="stepper" aria-label="進度">' + STEPS.map(function (step) {
      const current = step.id === state.section ? ' aria-current="step"' : "";
      const done = stepDone(step.id) ? " is-done" : "";
      const disabled = unlocked(step.id) ? "" : " disabled";
      return '<button type="button" data-act="goto" data-section="' + step.id + '"' + current + disabled + ' class="' + done.trim() + '">' + step.label + "</button>";
    }).join("") + "</nav>";
  }

  function render() {
    const root = document.getElementById("app");
    if (!root) return;
    let body = "";
    if (state.section === "intro") body = introHTML();
    else if (state.section === "rules") body = rulesHTML();
    else if (state.section === "challenge" && !state.seeDone) body = seeHTML();
    else if (state.section === "warm") body = stageHTML(WARM[state.idx.warm], WARM, state.idx.warm, "熱身");
    else if (state.section === "challenge") body = stageHTML(CHAL[state.idx.challenge], CHAL, state.idx.challenge, "挑戰");
    else if (state.section === "exit") body = exitHTML();
    else body = matchHTML();
    const record = state.section === "match" ? "" : recordHTML();
    root.innerHTML =
      '<div class="back-bar"><div class="wrap"><a class="back-link" href="../">返回課題目錄</a></div></div>' +
      '<header class="top"><div class="wrap"><p class="kicker">中一數學</p><h1>有向數乘除</h1><p class="sub">數括號裡的 −，再算絕對值</p></div></header>' +
      stepperHTML() +
      '<main><div class="wrap"><div class="workspace">' + body + record + "</div>" +
      '<footer class="footer"><p>加減單元稍後另開。</p><button type="button" class="btn btn-ghost" data-act="clear">清除進度</button></footer></div></main>';
    const shouldFocus = focusStw;
    focusStw = false;
    const later = window.requestAnimationFrame || function (fn) { fn(); };
    later(function () {
      try {
        if (!shouldFocus) return;
        const node = document.querySelector(".stage .stw, .see");
        if (node && node.scrollIntoView) {
          const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          node.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
        }
      } catch (err) {
        /* layout helpers are optional in tests */
      }
    });
  }

  function go(section) {
    if (!unlocked(section)) return;
    state.section = section;
    state.draft = "";
    state.notice = "";
    if ((section === "warm" || section === "challenge") && !state.opOk[(currentQ() || {}).id]) focusStw = true;
    if (section === "challenge" && !state.seeDone) focusStw = true;
    save();
    render();
  }

  function onOp(op) {
    const item = currentQ();
    if (!item || state.solved[item.id]) return;
    const expr = M2.parse(item.src);
    if (op === expr.kind) {
      state.opOk[item.id] = true;
      state.notice = "";
    } else {
      state.notice = opHint(op, expr, item);
      focusStw = true;
    }
    save();
    render();
  }

  function onCheck() {
    const item = currentQ();
    if (!item || state.solved[item.id]) return;
    if (!state.opOk[item.id]) {
      state.notice = "先選運算。";
      focusStw = true;
      save();
      render();
      return;
    }
    const expr = M2.parse(item.src);
    if (M2.parseAnswer(state.draft) !== expr.end) {
      state.tries[item.id] = (state.tries[item.id] || 0) + 1;
      state.notice = answerHint(expr, state.tries[item.id]);
      if (state.tries[item.id] >= 3) state.revealed[item.id] = true;
      save();
      render();
      return;
    }
    state.solved[item.id] = true;
    state.draft = "";
    if (item.ask && !state.promptOk[item.id]) {
      state.notice = "";
      focusStw = true;
    } else state.notice = "對了。";
    save();
    render();
  }

  function onNext() {
    const item = currentQ();
    if (!item || !state.solved[item.id]) return;
    if (item.ask && !state.promptOk[item.id]) return;
    state.notice = "";
    state.draft = "";
    if (state.section === "warm") {
      if (state.idx.warm < WARM.length - 1) state.idx.warm += 1;
      else {
        state.section = "challenge";
        focusStw = true;
      }
    } else if (state.idx.challenge < CHAL.length - 1) state.idx.challenge += 1;
    else state.section = "exit";
    const nextItem = currentQ();
    if (nextItem && !state.opOk[nextItem.id]) focusStw = true;
    save();
    render();
  }

  function promptReply(item, val, n) {
    const prompt = PROMPTS[item.ask];
    if (item.ask === "omit") {
      if (val === "sub") return "沒有中間的減號。括號靠在一起是乘法。";
      if (val === "add") return "中間不是加號。括號靠在一起是乘法。";
      if (val === "div") return "這裡沒有除號，也沒有分數線。括號靠在一起是乘法。";
    }
    if (item.ask === "bar") return "分數線是除法。";
    return prompt.hints[Math.min(n, prompt.hints.length - 1)];
  }

  function onPrompt(val) {
    const item = currentQ();
    if (!item || !item.ask) return;
    const prompt = PROMPTS[item.ask];
    if (val === prompt.answer) {
      state.promptOk[item.id] = true;
      state.notice = "對了。";
    } else {
      const n = state.promptTries[item.id] || 0;
      state.promptTries[item.id] = n + 1;
      state.notice = promptReply(item, val, n);
      focusStw = true;
    }
    save();
    render();
  }

  function mentionsQ(text, n) {
    const cn = ["一", "二", "三"][n - 1];
    if (new RegExp("(^|[^0-9])" + n + "(?![0-9])").test(text)) return true;
    if (text.indexOf("第" + cn) >= 0 || text.indexOf("第" + n) >= 0) return true;
    return new RegExp("(^|[，、,。；;和與及\\s])" + cn + "(?=$|[題，、,。；;和與及\\s])").test(text);
  }

  function seePointsAtBar(raw) {
    const text = String(raw || "").replace(/[０-９]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
    });
    if (/18/.test(text) || /分數/.test(text)) return true;
    return mentionsQ(text, 2);
  }

  function onSee() {
    const text = String(state.see || "").trim();
    if (!text) {
      state.notice = "寫一句再行。";
      focusStw = true;
      save();
      render();
      return;
    }
    if (!seePointsAtBar(text)) {
      state.notice = "再看有分數線的那一題。";
      focusStw = true;
      save();
      render();
      return;
    }
    state.seeDone = true;
    state.idx.challenge = 0;
    state.notice = "";
    focusStw = true;
    save();
    render();
  }

  function readExitDom() {
    document.querySelectorAll('[data-save="exit"]').forEach(function (input) {
      state.exitDraft[input.getAttribute("data-id")] = input.value;
    });
    document.querySelectorAll('[data-act="exit-op"].is-on').forEach(function (btn) {
      state.exitOp[btn.getAttribute("data-id")] = btn.getAttribute("data-op");
    });
  }

  function onExitSubmit() {
    readExitDom();
    const missed = [];
    EXIT.forEach(function (item) {
      const expr = M2.parse(item.src);
      const opOk = state.exitOp[item.id] === expr.kind;
      const ansOk = M2.parseAnswer(state.exitDraft[item.id]) === expr.end;
      if (!opOk || !ansOk) missed.push(item.id);
    });
    state.exitMiss = missed;
    if (!missed.length) {
      state.exitOk = true;
      state.notice = "八題都對了。";
    } else {
      state.exitOk = false;
      state.exitTries += 1;
      state.notice = missed.map(function (id) {
        return "第 " + (EXIT.findIndex(function (item) { return item.id === id; }) + 1) + " 題";
      }).join("、") + "再看一次。";
      if (state.exitTries >= 3) state.exitHint = true;
    }
    save();
    render();
  }

  function onMatch(src) {
    if (state.matched[src]) return;
    state.matchSel = src;
    state.notice = "";
    save();
    render();
  }

  function onMatchOp(op) {
    if (!state.matchSel) {
      state.notice = "先選算式。";
      save();
      render();
      return;
    }
    const expr = M2.parse(state.matchSel);
    if (expr.kind === op) {
      state.matched[state.matchSel] = op;
      state.matchSel = "";
      state.notice = matchDone() ? "配完了。" : "";
    } else state.notice = "這張不是這種運算。";
    save();
    render();
  }

  document.body.addEventListener("click", function (event) {
    const node = event.target.closest("[data-act]");
    if (!node || node.disabled) return;
    const act = node.getAttribute("data-act");
    if (act === "start") {
      state.started = true;
      state.section = "rules";
      state.notice = "";
      save();
      render();
    } else if (act === "goto") go(node.getAttribute("data-section"));
    else if (act === "op") onOp(node.getAttribute("data-op"));
    else if (act === "check") onCheck();
    else if (act === "next") onNext();
    else if (act === "prompt") onPrompt(node.getAttribute("data-val"));
    else if (act === "rules-next") {
      state.rulesDone = true;
      state.section = "warm";
      state.idx.warm = 0;
      state.draft = "";
      state.notice = "";
      focusStw = true;
      save();
      render();
    } else if (act === "see-done") onSee();
    else if (act === "exit-submit") onExitSubmit();
    else if (act === "exit-op") {
      const id = node.getAttribute("data-id");
      readExitDom();
      state.exitOp[id] = node.getAttribute("data-op");
      state.notice = "";
      state.exitMiss = state.exitMiss.filter(function (itemId) { return itemId !== id; });
      save();
      render();
    } else if (act === "reveal") {
      state.exitReveal[node.getAttribute("data-id")] = true;
      save();
      render();
    } else if (act === "match") onMatch(node.getAttribute("data-src"));
    else if (act === "match-op") onMatchOp(node.getAttribute("data-op"));
    else if (act === "clear") {
      state = fresh();
      save();
      render();
    }
  });

  document.body.addEventListener("input", function (event) {
    const node = event.target;
    if (!node.getAttribute) return;
    const saveAs = node.getAttribute("data-save");
    if (saveAs === "see") state.see = node.value;
    if (saveAs === "draft") state.draft = node.value;
    if (saveAs === "turns") {
      const id = node.getAttribute("data-id");
      const caret = node.selectionStart;
      state.turns[id] = node.value;
      state.notice = "";
      save();
      render();
      const again = document.querySelector('[data-save="turns"][data-id="' + id + '"]');
      if (again) {
        again.focus();
        if (again.setSelectionRange && caret != null) again.setSelectionRange(caret, caret);
      }
      return;
    }
    if (saveAs === "exit") {
      const id = node.getAttribute("data-id");
      state.exitDraft[id] = node.value;
      state.exitMiss = (state.exitMiss || []).filter(function (itemId) { return itemId !== id; });
      if (state.notice) {
        const caret = node.selectionStart;
        state.notice = "";
        save();
        render();
        const again = document.querySelector('[data-save="exit"][data-id="' + id + '"]');
        if (again) {
          again.focus();
          if (again.setSelectionRange && caret != null) again.setSelectionRange(caret, caret);
        }
        return;
      }
    }
    save();
  });

  document.body.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    const node = event.target;
    if (node.getAttribute && node.getAttribute("data-save") === "draft") {
      event.preventDefault();
      onCheck();
    }
  });

  load();
  render();
})();
