/* 未知之秤 · 第三章
   括號。長方形的闊度是共用的，所以每一段都要乘。
   拆括號只改寫一邊。移項是兩邊同加或同減。除數是兩邊同乘或同除。
   solveLinear 只供天平是否仍平衡的內部檢查，不可送進學生畫面。 */
(function (root) {
  "use strict";

  var MOTTO = "只有加減項先移項變號；乘除唔好移。";
  var GOAL_ASK = "有達到目標嗎？";

  var LAMPS = {
    expand: { id: "expand", name: "拆括號", detail: "只改寫一邊" },
    merge: { id: "merge", name: "合併", detail: "同類項合成" },
    move: { id: "move", name: "移項", detail: "兩邊同加／同減" },
    divide: { id: "divide", name: "除數", detail: "兩邊同乘／同除" },
  };

  var CLASS_CHOICES = [
    { id: "expand", label: "拆括號（只改寫一邊）" },
    { id: "merge", label: "合併同類項" },
    { id: "move", label: "移項（兩邊同加減）" },
    { id: "divide", label: "除數（兩邊同除／同乘）" },
  ];

  var PURPOSE = {
    ask: "我們想把方程變成甚麼樣子？",
    choices: [
      "兩邊的數字一樣大就好。",
      "把括號刪掉，不用保持平衡。",
      "一邊只剩未知數（x），另一邊只剩一個數。",
      "把所有項都放到同一邊就完成。",
    ],
    answer: 2,
    right: "對。目標是一邊只剩 x，另一邊只剩一個數。寫成 x＝一個數，或一個數＝x，都算達到。",
    wrongs: [
      "兩邊數字一樣大，未知數仍可能留在兩邊，方程還未解完。",
      "刪掉括號而不按分配改寫，兩邊就不再相等。",
      "",
      "未知數和數字堆在同一邊，還沒有變成一邊只剩 x。",
    ],
  };

  var EXAMPLES = [
    {
      title: "單邊括號",
      brief: "括號在左邊。可以先拆開，也可以先兩邊同除。",
      L: [["b", 3, [["x", 1], ["n", 2]]]],
      R: [["n", 18]],
    },
    {
      title: "右邊也有 x",
      brief: "左邊有括號，右邊有未知數和數字。",
      L: [["b", 2, [["x", 1], ["n", 3]]]],
      R: [["x", 1], ["n", 10]],
    },
    {
      title: "兩邊都有括號",
      brief: "左右都有括號，兩邊都可以拆。",
      L: [["b", 3, [["x", 1], ["n", 2]]]],
      R: [["b", 2, [["x", 1], ["n", 5]]]],
    },
  ];

  var PRACTICE = [
    {
      title: "可以先除",
      brief: "括號在左邊。可以先拆開，也可以先兩邊同除。",
      L: [["b", 2, [["x", 1], ["n", 3]]]],
      R: [["n", 16]],
    },
    {
      title: "右邊的未知數",
      brief: "左邊有括號，右邊也有 x。",
      L: [["b", 2, [["x", 1], ["n", 6]]]],
      R: [["x", 1], ["n", 20]],
    },
    {
      title: "兩邊的括號",
      brief: "左右都有括號。",
      L: [["b", 4, [["x", 1], ["n", 2]]]],
      R: [["b", 3, [["x", 1], ["n", 6]]]],
    },
  ];

  var CHALLENGE = [
    {
      title: "自己選做法",
      brief: "括號在左邊。做法自己選。",
      L: [["b", 6, [["x", 1], ["n", 2]]]],
      R: [["n", 42]],
    },
    {
      title: "右邊不只有數字",
      brief: "右邊有未知數。這條不是面積。",
      L: [["b", 4, [["x", 1], ["n", 2]]]],
      R: [["x", 1], ["n", 17]],
    },
    {
      title: "解可以是負數",
      brief: "這條不是面積。解可以是負數，x 不必是正的長度。",
      L: [["b", 2, [["x", 1], ["n", 3]]]],
      R: [["x", 1], ["n", 1]],
    },
  ];

  var EASY = { length: 7, width: 4, area: 28 };
  var HARD = { length: 17, width: 6, tens: 10, units: 7, area: 102 };
  var OWN = { length: 16, width: 5, area: 80 };

  var HARD_THINK = {
    ask: "17 乘 6 不容易一次心算。可以怎樣算得容易些？",
    choices: [
      "把 17 分成十位和個位，畫成兩塊長方形，再把兩塊面積加起來。",
      "把闊度改成 1，就不用乘。",
      "只算十位那一塊，個位照抄長度。",
      "把長和闊相加。",
    ],
    answer: 0,
    right: "對。先分成十位和個位兩塊，兩塊都乘同一個闊度，再相加。",
    wrongs: [
      "",
      "改闊度會變成另一個長方形。",
      "個位那一塊若只照抄長度，面積就漏了。",
      "面積不是長加闊。",
    ],
  };

  var STW = [
    {
      ask: "兩塊有甚麼是共用的？",
      choices: [
        "兩塊的長度都是 17。",
        "兩塊共用闊度 6。",
        "分割之後就不必再乘。",
        "共用的是已經算出的面積。",
      ],
      answer: 1,
      right: "對。分割之後，闊度 6 仍在兩塊上。",
      wrongs: [
        "再看兩塊的長度：一塊是十位，一塊是個位。",
        "",
        "分割只是把長度分開，闊度還在。",
        "面積還未寫成兩塊相加。先看兩塊相同的是甚麼。",
      ],
    },
    {
      ask: "每一小塊面積怎樣計？",
      choices: [
        "把十位和個位相加就是面積。",
        "只計算十位那一塊。",
        "每一塊都用自己的長度乘共用的闊度。",
        "因為 17 是兩位數，所以不用再乘。",
      ],
      answer: 2,
      right: "對。每塊面積都是長度乘闊度。",
      wrongs: [
        "十位加個位是長度，不是面積。",
        "兩塊都要計算。",
        "",
        "兩位數只是比較長。拆開之後，每一塊仍要乘闊度。",
      ],
    },
    {
      ask: "為甚麼每一項都要乘 6？",
      choices: [
        "因為 17 很難直接計算。",
        "因為只要十位乘 6，個位照抄長度。",
        "因為兩塊都用同一個闊度 6，所以每一段長度都要乘 6。",
        "因為 6 會是後面方程的解。",
      ],
      answer: 2,
      right: "對。闊度是共用的，所以每一段都要乘 6。",
      wrongs: [
        "這裡乘 6，是因為闊度是 6。",
        "個位若只照抄長度，那一塊的面積就漏了。",
        "",
        "6 是這個長方形的闊度，不是某一題方程的解。",
      ],
    },
  ];

  var PRODUCTS = [
    { id: "4x", label: "4x" },
    { id: "add", label: "x + 4" },
    { id: "barex", label: "x" },
    { id: "times", label: "4×3" },
    { id: "bare3", label: "3" },
    { id: "twelve", label: "12" },
  ];

  var CONSOLIDATE = {
    ask: "拆括號有沒有只改寫一邊？移項和除數有沒有兩邊一起做？",
    parts: [
      {
        id: "expand",
        ask: "拆括號是不是只改寫一邊，兩邊仍然相等？",
        yes: "是，我只改寫有括號的一邊。",
        no: "我把它當成兩邊一起運算。",
        yesNote: "拆括號是等價改寫。有括號的一邊改寫之後，另一邊暫時不變。",
        noNote: "拆括號不是移項。它只把一邊的括號乘開，天平仍然平衡。",
      },
      {
        id: "both",
        ask: "移項或除數是不是兩邊一起做？",
        yes: "是，加減和乘除都作用在兩邊。",
        no: "我只改了一邊。",
        yesNote: "移項是兩邊同加或同減，除數是兩邊同乘或同除。",
        noNote: "只改一邊的加減或乘除，天平會不平衡。相反項是兩邊一起加減之後留下的。",
      },
    ],
  };

  function fmtInt(n) {
    return n < 0 ? "−" + Math.abs(n) : String(n);
  }

  function normalizeMode(mode) {
    if (mode === "challenge" || mode === "example") return mode;
    return "practice";
  }

  function missionList(mode) {
    var name = normalizeMode(mode);
    if (name === "challenge") return CHALLENGE;
    if (name === "example") return EXAMPLES;
    return PRACTICE;
  }

  function setLabel(mode) {
    if (mode === "challenge") return "挑戰模式";
    if (mode === "example") return "例題";
    return "引導模式";
  }

  function normalizeExpr(raw) {
    return String(raw == null ? "" : raw)
      .replace(/＋/g, "+")
      .replace(/＝/g, "=")
      .replace(/[−–—]/g, "-")
      .replace(/[×·✕⋅]/g, "*")
      .replace(/（/g, "(")
      .replace(/）/g, ")")
      .replace(/X/g, "x")
      .replace(/\s+/g, "");
  }

  function parseExpr(raw) {
    var s = normalizeExpr(raw);
    var i = 0;
    var guard;
    if (!s || s.indexOf("=") !== -1) return null;
    function peek() { return s.charAt(i); }
    function parseExpression() {
      var node = parseTerm();
      if (!node) return null;
      while (peek() === "+" || peek() === "-") {
        var op = s.charAt(i);
        i += 1;
        var right = parseTerm();
        if (!right) return null;
        node = { op: op === "+" ? "add" : "sub", left: node, right: right };
      }
      return node;
    }
    function parseTerm() {
      var node = parseFactor();
      guard = 0;
      if (!node) return null;
      while (guard < 24 && (peek() === "*" || peek() === "x" || peek() === "(" || (peek() >= "0" && peek() <= "9"))) {
        guard += 1;
        if (peek() === "*") i += 1;
        var right = parseFactor();
        if (!right) return null;
        node = { op: "mul", left: node, right: right };
      }
      return node;
    }
    function parseFactor() {
      var start;
      var inner;
      if (peek() === "+") { i += 1; return parseFactor(); }
      if (peek() === "-") {
        i += 1;
        inner = parseFactor();
        if (!inner) return null;
        return { op: "neg", value: inner };
      }
      if (peek() >= "0" && peek() <= "9") {
        start = i;
        while (peek() >= "0" && peek() <= "9") i += 1;
        return { op: "num", n: Number(s.slice(start, i)) };
      }
      if (peek() === "x") { i += 1; return { op: "x" }; }
      if (peek() === "(") {
        i += 1;
        inner = parseExpression();
        if (!inner || peek() !== ")") return null;
        i += 1;
        return { op: "group", value: inner };
      }
      return null;
    }
    var ast = parseExpression();
    if (!ast || i !== s.length) return null;
    return ast;
  }

  function expandAst(node) {
    var L;
    var R;
    var out;
    var i;
    var j;
    var p;
    var q;
    if (!node) return null;
    if (node.op === "group") return expandAst(node.value);
    if (node.op === "num") return [{ a: 0, b: node.n }];
    if (node.op === "x") return [{ a: 1, b: 0 }];
    if (node.op === "neg") {
      L = expandAst(node.value);
      if (!L) return null;
      return L.map(function (t) { return { a: -t.a, b: -t.b }; });
    }
    if (node.op === "add" || node.op === "sub") {
      L = expandAst(node.left);
      R = expandAst(node.right);
      if (!L || !R) return null;
      if (node.op === "sub") R = R.map(function (t) { return { a: -t.a, b: -t.b }; });
      return L.concat(R);
    }
    if (node.op === "mul") {
      L = expandAst(node.left);
      R = expandAst(node.right);
      if (!L || !R) return null;
      out = [];
      for (i = 0; i < L.length; i += 1) {
        for (j = 0; j < R.length; j += 1) {
          p = L[i];
          q = R[j];
          if (p.a && q.a) return null;
          out.push({ a: p.a * q.b + q.a * p.b, b: p.b * q.b });
        }
      }
      return out;
    }
    return null;
  }

  function sumPoly(terms) {
    var a = 0;
    var b = 0;
    var i;
    for (i = 0; i < terms.length; i += 1) {
      a += terms[i].a;
      b += terms[i].b;
    }
    return { a: a, b: b };
  }

  function piecesOf(raw) {
    var text = String(raw == null ? "" : raw).replace(/＝/g, "=");
    return text.split("=").map(function (part) { return part.trim(); }).filter(Boolean);
  }

  function analyzeTerms(raw) {
    var ast = parseExpr(raw);
    var terms;
    if (!ast) return null;
    terms = expandAst(ast);
    if (!terms) return null;
    return { terms: terms, poly: sumPoly(terms) };
  }

  var ORIGINAL_THREE = {
    "4(x+2+3)": true,
    "4(x+3+2)": true,
    "4*(x+2+3)": true,
    "4*(x+3+2)": true,
    "(x+2+3)*4": true,
    "(x+3+2)*4": true,
    "(x+2+3)4": true,
    "(x+3+2)4": true,
    "(4)(x+2+3)": true,
    "(4)(x+3+2)": true,
  };

  function joinNames(ids, labels) {
    var names = ids.map(function (id) {
      if (labels && labels[id]) return labels[id];
      if (id === "x") return "長度 x";
      if (id === "10") return "長度 10";
      if (id === "3") return "長度 3";
      if (id === "2") return "長度 2";
      return "長度 " + id;
    });
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + " 和 " + names[1];
    return names.slice(0, -1).join("、") + " 和 " + names[names.length - 1];
  }

  function gradeAreas(raw) {
    return gradePartition(raw, {
      width: HARD.width,
      total: HARD.length,
      area: HARD.area,
      parts: [
        { id: String(HARD.tens), length: HARD.tens },
        { id: String(HARD.units), length: HARD.units },
      ],
    });
  }

  function gradePartition(raw, spec) {
    var pieces = piecesOf(raw);
    var results = [];
    var i;
    var best;
    if (!String(raw == null ? "" : raw).trim()) {
      return { ok: false, penalize: false, highlight: [], message: "請寫出兩塊面積相加。" };
    }
    for (i = 0; i < pieces.length; i += 1) results.push(gradePartitionPiece(pieces[i], spec));
    for (i = 0; i < results.length; i += 1) if (results[i].ok) return results[i];
    best = results[0];
    for (i = 0; i < results.length; i += 1) if (results[i].penalize) best = results[i];
    return best || { ok: false, penalize: false, highlight: [], message: "這個式還看不懂。兩塊用加號連起來。" };
  }

  function gradePartitionPiece(raw, spec) {
    var found = analyzeTerms(raw);
    var labels = {};
    var need = {};
    var products = [];
    var wrong = [];
    var missing = [];
    var i;
    var j;
    var t;
    var taken;
    if (!found) return { ok: false, penalize: false, highlight: [], message: "這個式還看不懂。請用乘號和加號把兩塊連起來。" };
    if (found.poly.a !== 0) return { ok: false, penalize: false, highlight: [], message: "這裡的長度是數字，還沒有 x。" };
    for (i = 0; i < spec.parts.length; i += 1) {
      labels[spec.parts[i].id] = "長度 " + spec.parts[i].length;
      need[spec.parts[i].id] = spec.width * spec.parts[i].length;
      products.push(spec.parts[i].id);
    }
    for (i = 0; i < found.terms.length; i += 1) {
      t = found.terms[i].b;
      if (found.terms[i].a) continue;
      taken = "";
      for (j = 0; j < products.length; j += 1) {
        if (need[products[j]] !== null && t === need[products[j]]) {
          taken = products[j];
          need[products[j]] = null;
          break;
        }
      }
      if (taken) continue;
      for (j = 0; j < products.length; j += 1) {
        if (t === -spec.width * spec.parts[j].length) wrong.push(products[j]);
      }
    }
    if (found.poly.b === spec.area && !wrong.length) {
      var open = false;
      for (i = 0; i < products.length; i += 1) if (need[products[i]] !== null) open = true;
      if (!open) {
        return {
          ok: true,
          penalize: false,
          highlight: [],
          message: partitionSuccess(spec),
        };
      }
    }
    wrong = unique(wrong).filter(function (id) { return need[id] !== null; });
    if (wrong.length) {
      return {
        ok: false,
        penalize: true,
        highlight: wrong,
        message: joinNames(wrong, labels) + " 的那一塊不應寫成減。兩塊面積都要加。",
      };
    }
    for (i = 0; i < products.length; i += 1) if (need[products[i]] !== null) missing.push(products[i]);
    if (found.poly.b === spec.area && missing.length === products.length) {
      return {
        ok: false,
        penalize: false,
        highlight: missing.slice(),
        message: "這是整塊面積。請把兩段長度分開乘闊度，再相加。",
      };
    }
    if (missing.length) {
      return {
        ok: false,
        penalize: true,
        highlight: missing,
        message: joinNames(missing, labels) + " 的那一塊還沒有乘闊度 " + spec.width + "。",
      };
    }
    return { ok: false, penalize: true, highlight: [], message: "兩塊的總和還不對。請再看每一塊有沒有乘闊度。" };
  }

  function partitionSuccess(spec) {
    var bits = spec.parts.map(function (part) { return spec.width + "×" + part.length; }).join(" + ");
    return "兩塊都乘了闊度。" + spec.width + "×" + spec.total + " = " + spec.area + "，" + bits + " = " + spec.area + "。";
  }

  function gradeThree(raw) {
    var parts = piecesOf(raw);
    var results = [];
    var i;
    var best;
    if (!String(raw == null ? "" : raw).trim()) {
      return { ok: false, penalize: false, highlight: [], message: "請寫出結果。" };
    }
    for (i = 0; i < parts.length; i += 1) results.push(gradeThreePiece(parts[i]));
    for (i = 0; i < results.length; i += 1) if (results[i].ok) return results[i];
    best = results[0];
    for (i = 0; i < results.length; i += 1) if (results[i].penalize) best = results[i];
    return best;
  }

  function gradeThreePiece(raw) {
    var key = normalizeExpr(raw);
    var found;
    var terms;
    var poly;
    var cover = { x: false, "2": false, "3": false };
    var wrong = [];
    var missing = [];
    var sawFive = false;
    var i;
    var t;
    if (ORIGINAL_THREE[key]) {
      return {
        ok: false,
        penalize: false,
        highlight: [],
        message: "這仍是原來的括號。可以每一段都乘 4，也可以先把 2 和 3 相加。",
      };
    }
    found = analyzeTerms(raw);
    if (!found) {
      return { ok: false, penalize: false, highlight: [], message: "這個式還看不懂。x 只是長度，不會出現 x 乘 x。" };
    }
    terms = found.terms;
    poly = found.poly;
    if (poly.a === 4 && poly.b === 20) {
      return {
        ok: true,
        penalize: false,
        highlight: [],
        message: "三條都乘了闊度。4(x + 2 + 3) = 4x + 8 + 12。先把 2 和 3 合成 5，就是 4(x + 5) = 4x + 20。兩種都對。",
      };
    }
    for (i = 0; i < terms.length; i += 1) {
      t = terms[i];
      if (t.a === 4 && t.b === 0) cover.x = true;
      if (t.a < 0) wrong.push("x");
      if (t.a === 0 && t.b === 8) cover["2"] = true;
      else if (t.a === 0 && t.b === 12) cover["3"] = true;
      else if (t.a === 0 && t.b === 20) { cover["2"] = true; cover["3"] = true; }
      else if (t.a === 0 && t.b === -8) wrong.push("2");
      else if (t.a === 0 && t.b === -12) wrong.push("3");
      else if (t.a === 0 && t.b === -20) { wrong.push("2"); wrong.push("3"); }
      else if (t.a === 0 && t.b === 5) sawFive = true;
    }
    if (poly.a === 4) cover.x = true;
    wrong = unique(wrong).filter(function (id) { return !cover[id]; });
    if (wrong.length) {
      return {
        ok: false,
        penalize: true,
        highlight: wrong,
        message: joinNames(wrong) + " 的那一塊不應寫成減。面積要加進總和。",
      };
    }
    if (!cover.x) missing.push("x");
    if (!cover["2"]) missing.push("2");
    if (!cover["3"]) missing.push("3");
    if (sawFive && !cover["2"] && !cover["3"]) {
      return {
        ok: false,
        penalize: true,
        highlight: ["2", "3"],
        message: "常數相加之後，仍要乘闊度 4。這一塊面積還沒有乘。",
      };
    }
    if (missing.length) {
      return {
        ok: false,
        penalize: true,
        highlight: missing,
        message: joinNames(missing) + " 的那一塊還沒有乘闊度 4。",
      };
    }
    return { ok: false, penalize: true, highlight: [], message: "總和還不對。請再檢查每一塊。" };
  }

  function unique(list) {
    var out = [];
    var i;
    for (i = 0; i < list.length; i += 1) if (out.indexOf(list[i]) === -1) out.push(list[i]);
    return out;
  }

  function penalize(obj, label) {
    obj.misses.push(label);
    if (obj.score <= 0) {
      obj.score = 0;
      return "得分維持 0。";
    }
    obj.score = Math.max(0, obj.score - 10);
    return "扣 10 分，現為 " + obj.score + " 分。";
  }

  function snapWorkshop(w) {
    return {
      easyStep: w.easyStep,
      easyOk: w.easyOk,
      thinkOk: w.thinkOk,
      split: w.split,
      stw: w.stw,
      hardOk: w.hardOk,
      ownA: w.ownA,
      ownB: w.ownB,
      ownSplit: w.ownSplit,
      ownOk: w.ownOk,
      highlight: w.highlight.slice(),
      matched: { x: w.matched.x, c: w.matched.c },
      threeMode: w.threeMode,
      combined: w.combined,
      distributed: w.distributed,
      threeOk: w.threeOk,
    };
  }

  function remember(w) {
    w.history.push(snapWorkshop(w));
    if (w.history.length > 40) w.history.shift();
  }

  function createWorkshop() {
    return {
      score: 100,
      misses: [],
      easyStep: 0,
      easyOk: false,
      thinkOk: false,
      split: false,
      stw: 0,
      hardOk: false,
      ownA: 0,
      ownB: 0,
      ownSplit: false,
      ownOk: false,
      highlight: [],
      matched: { x: "", c: "" },
      threeMode: "practice",
      combined: false,
      distributed: false,
      threeOk: false,
      history: [],
    };
  }

  function workshopPhase(w) {
    if (!w.easyOk) return "easy";
    if (!w.hardOk) return "hard";
    if (!w.ownOk) return "own";
    if (!w.matched.x || !w.matched.c) return "match";
    if (!w.threeOk) return "three";
    return "done";
  }

  function numeralStrips(w) {
    var hi = w.highlight;
    var phase = workshopPhase(w);
    if (phase === "easy") {
      return [{ id: "7", flex: EASY.length, length: String(EASY.length), width: String(EASY.width), omitted: false, caption: "" }];
    }
    if (phase === "hard") {
      if (!w.split) {
        return [{ id: "17", flex: HARD.length, length: String(HARD.length), width: String(HARD.width), omitted: false, caption: "" }];
      }
      return [
        { id: "10", flex: HARD.tens, length: String(HARD.tens), width: String(HARD.width), omitted: hi.indexOf("10") !== -1, caption: "" },
        { id: "7", flex: HARD.units, length: String(HARD.units), width: String(HARD.width), omitted: hi.indexOf("7") !== -1, caption: "" },
      ];
    }
    if (!w.ownSplit) {
      return [{ id: "16", flex: OWN.length, length: String(OWN.length), width: String(OWN.width), omitted: false, caption: "" }];
    }
    return [
      { id: "p1", flex: w.ownA, length: String(w.ownA), width: String(OWN.width), omitted: hi.indexOf("p1") !== -1, caption: "" },
      { id: "p2", flex: w.ownB, length: String(w.ownB), width: String(OWN.width), omitted: hi.indexOf("p2") !== -1, caption: "" },
    ];
  }

  function threeStrips(w) {
    var hi = w.highlight;
    /* 圖上的 x 只畫成一段正長度，用來看出闊度 4。不是某個特定數值。 */
    if (w.combined) {
      return [
        { id: "x", flex: 8, length: "x", width: "4", omitted: hi.indexOf("x") !== -1, caption: w.distributed ? "4×x" : "" },
        { id: "5", flex: 5, length: "5", width: "4", omitted: hi.indexOf("2") !== -1 || hi.indexOf("3") !== -1, caption: w.distributed ? "4×5" : "" },
      ];
    }
    return [
      { id: "x", flex: 8, length: "x", width: "4", omitted: hi.indexOf("x") !== -1, caption: w.distributed ? "4×x" : "" },
      { id: "2", flex: 2, length: "2", width: "4", omitted: hi.indexOf("2") !== -1, caption: w.distributed ? "4×2" : "" },
      { id: "3", flex: 3, length: "3", width: "4", omitted: hi.indexOf("3") !== -1, caption: w.distributed ? "4×3" : "" },
    ];
  }

  function threePrompt(mode) {
    if (mode === "challenge") return "三條都要計入。可以先乘開，也可以先合併括號內的常數。用哪一種，自己決定。";
    return "三條都要乘闊度 4。可以先把每一段乘開，也可以先把 2 和 3 相加。兩種都接受。";
  }

  function matchStrips(w) {
    var hi = w.highlight;
    return [
      { id: "x", flex: 8, length: "x", width: "4", omitted: hi.indexOf("x") !== -1, caption: w.matched.x ? "已配" : "" },
      { id: "c", flex: 3, length: "3", width: "4", omitted: hi.indexOf("c") !== -1, caption: w.matched.c ? "已配" : "" },
    ];
  }

  function workshopView(w) {
    var phase = workshopPhase(w);
    var step = STW[w.stw] || STW[2];
    var both = !!(w.matched.x && w.matched.c);
    var strips = numeralStrips(w);
    var hardStage = "think";
    if (phase === "match") strips = matchStrips(w);
    if (phase === "three" || phase === "done") strips = threeStrips(w);
    if (w.thinkOk && !w.split) hardStage = "offer";
    if (w.split && w.stw < 3) hardStage = "stw";
    if (w.split && w.stw >= 3 && !w.hardOk) hardStage = "expr";
    if (w.hardOk) hardStage = "done";
    return {
      phase: phase,
      score: w.score,
      easyStep: w.easyStep,
      easy: { length: EASY.length, width: EASY.width },
      hard: {
        length: HARD.length,
        width: HARD.width,
        tens: w.thinkOk ? HARD.tens : null,
        units: w.thinkOk ? HARD.units : null,
      },
      own: { length: OWN.length, width: OWN.width, a: w.ownA, b: w.ownB, split: w.ownSplit },
      hardStage: hardStage,
      think: phase === "hard" && !w.thinkOk ? { ask: HARD_THINK.ask, choices: HARD_THINK.choices.slice() } : null,
      canSplit: !!(w.thinkOk && !w.split),
      split: w.split,
      stwIndex: w.stw,
      stw: phase === "hard" && w.split && w.stw < 3 ? {
        label: ["觀察", "思考", "追問"][w.stw],
        index: w.stw + 1,
        total: 3,
        ask: step.ask,
        choices: step.choices.slice(),
      } : null,
      strips: strips,
      highlight: w.highlight.slice(),
      comparison: "",
      products: phase === "match" ? PRODUCTS.map(function (item) { return { id: item.id, label: item.label }; }) : [],
      matched: { x: w.matched.x, c: w.matched.c },
      bridge: both ? "所以 4(x + 3) = 4x + 12。兩塊都乘了闊度。" : "",
      threeMode: w.threeMode,
      threePrompt: phase === "three" || phase === "done" ? threePrompt(w.threeMode) : "",
      combined: w.combined,
      distributed: w.distributed,
      threeReveal: w.threeOk ? "4(x + 2 + 3) = 4x + 8 + 12，也可以先寫成 4(x + 5) = 4x + 20。" : "",
      canUndo: w.history.length > 0,
      formulaReady: !!w.hardOk,
    };
  }

  function formulaText(raw) {
    return String(raw == null ? "" : raw)
      .replace(/\s+/g, "")
      .replace(/＝/g, "=")
      .replace(/[×＊·]/g, "*")
      .replace(/乘/g, "*")
      .replace(/等於/g, "=")
      .replace(/長方形/g, "")
      .replace(/的/g, "")
      .replace(/是/g, "=")
      .replace(/^面積=/, "")
      .replace(/^面積/, "");
  }

  function isAreaFormula(raw) {
    var s = formulaText(raw);
    return s === "長*闊" || s === "闊*長";
  }

  function isSevenByFour(raw) {
    var found = analyzeTerms(raw);
    var text = normalizeExpr(raw);
    if (!found || found.poly.a !== 0 || found.poly.b !== EASY.area) return false;
    return text.indexOf("7") !== -1 && text.indexOf("4") !== -1 && text !== "28";
  }

  function submitFormula(w, raw) {
    var text = String(raw == null ? "" : raw).trim();
    if (w.easyStep > 0 || w.easyOk) return { ok: true, message: "公式已經寫好。", score: w.score };
    if (!text) return { ok: false, message: "請寫出面積公式。用長和闊。", score: w.score };
    if (isAreaFormula(text)) {
      remember(w);
      w.easyStep = 1;
      return { ok: true, message: "對。長方形的面積 = 長 × 闊。下一步把 7 和 4 代進去。", score: w.score };
    }
    if (isSevenByFour(text) || parseStudent(text) === EASY.area) {
      return { ok: false, message: "這是代入或算出的結果。請先寫公式，用長和闊。", score: w.score };
    }
    if (formulaText(text).indexOf("+") !== -1 || formulaText(text).indexOf("長闊") !== -1 && formulaText(text).indexOf("*") === -1) {
      return { ok: false, message: "面積不是把長和闊相加。請改用乘法。" + penalize(w, "公式"), score: w.score };
    }
    return { ok: false, message: "請用乘法把長和闊連起來。", score: w.score };
  }

  function submitNumbers(w, raw) {
    var text = String(raw == null ? "" : raw).trim();
    if (w.easyStep < 1) return { ok: false, message: "請先寫面積公式。", score: w.score };
    if (w.easyStep > 1 || w.easyOk) return { ok: true, message: "數字已經代進去。", score: w.score };
    if (isSevenByFour(text)) {
      remember(w);
      w.easyStep = 2;
      return { ok: true, message: "對，7 × 4。最後寫出面積的數。", score: w.score };
    }
    if (parseStudent(text) === EASY.area) {
      return { ok: false, message: "這是面積的數。這一格要寫長和闊相乘，還不是最後的數。", score: w.score };
    }
    if (normalizeExpr(text) === "7+4" || normalizeExpr(text) === "4+7") {
      return { ok: false, message: "這裡仍然是乘法，不是相加。" + penalize(w, "公式"), score: w.score };
    }
    return { ok: false, message: "把長 7 和闊 4 乘起來。", score: w.score };
  }

  function submitEasyArea(w, raw) {
    var text = String(raw == null ? "" : raw).trim();
    var n = parseStudent(text);
    var found;
    if (w.easyStep < 2) return { ok: false, message: "請先寫公式，再代入 7 和 4。", score: w.score };
    if (w.easyOk) return { ok: true, message: "這一題已經完成。", score: w.score };
    if (n === EASY.area) {
      remember(w);
      w.easyOk = true;
      return { ok: true, message: "整塊面積是 28。長和闊都是一位數，可以直接乘。", score: w.score };
    }
    if (isSevenByFour(text)) {
      return { ok: false, message: "7 × 4 是算式。請寫面積的數。", score: w.score };
    }
    found = analyzeTerms(text);
    if (n === null && !found) return { ok: false, message: "請輸入面積，用整數。", score: w.score };
    return { ok: false, message: "再看長和闊，面積是兩者相乘。" + penalize(w, "面積"), score: w.score };
  }

  function answerHardThink(w, choice) {
    var index = Number(choice);
    if (!w.easyOk) return { ok: false, message: "請先完成一位數的長方形。" };
    if (w.thinkOk) return { ok: true, message: "已經想好。可以把長度分成十位和個位。", score: w.score };
    if (index !== HARD_THINK.answer) {
      return { ok: false, message: (HARD_THINK.wrongs && HARD_THINK.wrongs[index]) || "還不是。請再看這個選項在說甚麼。" };
    }
    remember(w);
    w.thinkOk = true;
    return { ok: true, message: HARD_THINK.right, score: w.score };
  }

  function splitLength(w) {
    if (!w.thinkOk) return { ok: false, message: "先想一想：怎樣可以算得容易些？圖還不要拆開。", score: w.score };
    if (w.split) return { ok: true, message: "已經分成 10 和 7。兩塊的闊度仍是 6。", score: w.score };
    remember(w);
    w.split = true;
    return { ok: true, message: "長度分成十位 10 和個位 7。兩塊仍共用闊度 6。", score: w.score };
  }

  function gradeStw(w, choice) {
    var step = STW[w.stw];
    var index = Number(choice);
    if (!w.split) return { ok: false, message: "請先把長度分成十位和個位。" };
    if (!step) return { ok: true, message: "三問已完成。", done: true };
    if (index !== step.answer) {
      return { ok: false, message: (step.wrongs && step.wrongs[index]) || "還不是。請再看這個選項在說甚麼。" };
    }
    remember(w);
    w.stw += 1;
    return { ok: true, message: step.right, done: w.stw >= 3, score: w.score };
  }

  function applyPartition(w, raw, graded, doneFlag) {
    var pen;
    remember(w);
    if (graded.ok) {
      w[doneFlag] = true;
      w.highlight = [];
      return { ok: true, message: graded.message, highlight: [], score: w.score };
    }
    w.highlight = graded.highlight || [];
    if (graded.penalize) {
      pen = penalize(w, "漏乘或符號");
      return { ok: false, message: graded.message + pen, highlight: w.highlight.slice(), score: w.score };
    }
    return { ok: false, message: graded.message, highlight: w.highlight.slice(), score: w.score };
  }

  function submitSplit(w, raw) {
    if (!w.split || w.stw < 3) {
      return { ok: false, message: "請先完成分割和上面三問。", highlight: [], score: w.score };
    }
    return applyPartition(w, raw, gradeAreas(raw), "hardOk");
  }

  function submitOwnSplit(w, aRaw, bRaw) {
    var a = parseStudent(aRaw);
    var b = parseStudent(bRaw);
    if (!w.hardOk) return { ok: false, message: "請先完成上一個長方形。", score: w.score };
    if (w.ownSplit) return { ok: true, message: "已經分成 " + w.ownA + " 和 " + w.ownB + "。", score: w.score };
    if (a === null || b === null) return { ok: false, message: "請填兩個正整數。", score: w.score };
    if (a <= 0 || b <= 0) return { ok: false, message: "每一段都要是正整數。", score: w.score };
    if (a + b !== OWN.length) {
      return { ok: false, message: fmtInt(a) + " 加 " + fmtInt(b) + " 不是 " + OWN.length + "。兩段要加回原來的長度。", score: w.score };
    }
    remember(w);
    w.ownA = a;
    w.ownB = b;
    w.ownSplit = true;
    w.highlight = [];
    return { ok: true, message: "已分成 " + a + " 和 " + b + "。闊度 " + OWN.width + " 仍在兩塊上。兩塊都要乘這個闊度。", score: w.score };
  }

  function submitOwnAreas(w, raw) {
    if (!w.ownSplit) return { ok: false, message: "請先決定兩段長度。", highlight: [], score: w.score };
    return applyPartition(w, raw, gradePartition(raw, {
      width: OWN.width,
      total: OWN.length,
      area: OWN.area,
      parts: [
        { id: "p1", length: w.ownA },
        { id: "p2", length: w.ownB },
      ],
    }), "ownOk");
  }

  function matchRegion(w, region, productId) {
    var graded;
    var bridge;
    if (!w.ownOk) return { ok: false, message: "請先完成前面的面積題。", score: w.score };
    if (region !== "x" && region !== "c") return { ok: false, message: "請先點選一塊。", score: w.score };
    if (w.matched[region]) return { ok: true, message: "這一塊已經配好。", score: w.score, done: !!(w.matched.x && w.matched.c) };
    graded = gradeMatch(region, productId);
    if (!graded.ok) {
      w.highlight = [region === "x" ? "x" : "c"];
      return { ok: false, message: graded.message, highlight: w.highlight.slice(), score: w.score };
    }
    w.highlight = [];
    remember(w);
    w.matched[region] = productId;
    bridge = w.matched.x && w.matched.c ? "所以 4(x + 3) = 4x + 12。兩塊都乘了闊度。" : graded.message;
    return { ok: true, message: bridge, score: w.score, done: !!(w.matched.x && w.matched.c) };
  }

  function gradeMatch(region, productId) {
    if (region === "x" && productId === "4x") return { ok: true, message: "這一塊是闊度乘長度。" };
    if (region === "c" && (productId === "times" || productId === "twelve")) return { ok: true, message: "這一塊也乘了同一個闊度。" };
    if (region === "x" && productId === "add") return { ok: false, message: "這一塊的闊是 4、長是 x。面積是相乘，不是相加。" };
    if (region === "x" && productId === "barex") return { ok: false, message: "這一塊還沒有乘闊度。" };
    if (region === "c" && productId === "bare3") return { ok: false, message: "長度 3 的那一塊還沒有乘闊度。" };
    if (region === "c") return { ok: false, message: "這不是長度 3 這一塊。" };
    return { ok: false, message: "這不是長度 x 這一塊。" };
  }

  function setThreeMode(w, mode) {
    var next = mode === "challenge" ? "challenge" : "practice";
    if (w.threeMode === next) return { ok: true, message: next === "challenge" ? "而家是挑戰模式。" : "而家是引導模式。", score: w.score };
    remember(w);
    w.threeMode = next;
    return { ok: true, message: next === "challenge" ? "已改為挑戰模式。兩種寫法都接受，畫面不會指定哪一種。" : "已改為引導模式。", score: w.score };
  }

  function combineThree(w) {
    if (!w.matched.x || !w.matched.c) return { ok: false, message: "請先完成兩塊的配對。", score: w.score };
    remember(w);
    w.combined = true;
    w.distributed = false;
    w.highlight = [];
    return { ok: true, message: "括號內的 2 和 3 合成 5。闊度 4 仍在。結果還要自己寫。", score: w.score };
  }

  function distributeThree(w) {
    if (!w.matched.x || !w.matched.c) return { ok: false, message: "請先完成兩塊的配對。", score: w.score };
    remember(w);
    w.distributed = true;
    w.highlight = [];
    return { ok: true, message: w.combined ? "兩段都要乘闊度 4。結果還要自己寫。" : "三段都要乘闊度 4。結果還要自己寫。", score: w.score };
  }

  function submitThree(w, raw) {
    var graded;
    var pen;
    if (!w.matched.x || !w.matched.c) return { ok: false, message: "請先完成兩塊的配對。", score: w.score };
    graded = gradeThree(raw);
    remember(w);
    if (graded.ok) {
      w.threeOk = true;
      w.highlight = [];
      return { ok: true, message: graded.message, highlight: [], score: w.score };
    }
    w.highlight = graded.highlight || [];
    if (graded.penalize) {
      pen = penalize(w, "漏乘或符號");
      return { ok: false, message: graded.message + pen, highlight: w.highlight.slice(), score: w.score };
    }
    return { ok: false, message: graded.message, highlight: w.highlight.slice(), score: w.score };
  }

  function undoWorkshop(w) {
    var prev;
    var score;
    var misses;
    if (!w.history.length) return { ok: false, message: "沒有可以返回的步驟。", score: w.score };
    prev = w.history.pop();
    score = w.score;
    misses = w.misses;
    w.easyStep = prev.easyStep;
    w.easyOk = prev.easyOk;
    w.thinkOk = prev.thinkOk;
    w.split = prev.split;
    w.stw = prev.stw;
    w.hardOk = prev.hardOk;
    w.ownA = prev.ownA;
    w.ownB = prev.ownB;
    w.ownSplit = prev.ownSplit;
    w.ownOk = prev.ownOk;
    w.highlight = prev.highlight.slice();
    w.matched = { x: prev.matched.x, c: prev.matched.c };
    w.threeMode = prev.threeMode;
    w.combined = prev.combined;
    w.distributed = prev.distributed;
    w.threeOk = prev.threeOk;
    w.score = score;
    w.misses = misses;
    return { ok: true, message: "已返回上一步。", score: w.score };
  }

  function workshopState(w) {
    var state = snapWorkshop(w);
    state.score = w.score;
    state.misses = w.misses.slice();
    return state;
  }

  function restoreWorkshop(data) {
    var w = createWorkshop();
    if (!data || data.easyStep == null && !data.easyOk && !data.hardOk && !data.ownOk) return w;
    w.score = typeof data.score === "number" ? data.score : 100;
    w.misses = Array.isArray(data.misses) ? data.misses.slice() : [];
    w.easyStep = data.easyStep || 0;
    w.easyOk = !!data.easyOk;
    w.thinkOk = !!data.thinkOk;
    w.split = !!data.split;
    w.stw = data.stw || 0;
    w.hardOk = !!data.hardOk;
    w.ownA = data.ownA || 0;
    w.ownB = data.ownB || 0;
    w.ownSplit = !!data.ownSplit;
    w.ownOk = !!data.ownOk;
    w.matched = { x: data.matched && data.matched.x || "", c: data.matched && data.matched.c || "" };
    w.threeMode = data.threeMode === "challenge" ? "challenge" : "practice";
    w.combined = !!data.combined;
    w.distributed = !!data.distributed;
    w.threeOk = !!data.threeOk;
    return w;
  }

  function formatAtoms(parts) {
    var out = "";
    var i;
    var p;
    var body;
    if (!parts.length) return "0";
    for (i = 0; i < parts.length; i += 1) {
      p = parts[i];
      if (p.type === "x") {
        if (p.coeff === 1) body = "x";
        else if (p.coeff === -1) body = "−x";
        else body = fmtInt(p.coeff) + "x";
        if (i === 0) out += body;
        else if (p.coeff < 0) out += " − " + (p.coeff === -1 ? "x" : Math.abs(p.coeff) + "x");
        else out += " + " + (p.coeff === 1 ? "x" : p.coeff + "x");
      } else if (i === 0) out += fmtInt(p.coeff);
      else out += p.coeff < 0 ? " − " + Math.abs(p.coeff) : " + " + p.coeff;
    }
    return out;
  }

  function pieceBody(term) {
    var inner;
    if (term.kind === "bracket") {
      inner = formatAtoms(term.parts);
      if (term.factor === 1) return "(" + inner + ")";
      if (term.factor === -1) return "−(" + inner + ")";
      return fmtInt(term.factor) + "(" + inner + ")";
    }
    if (term.type === "x") {
      if (term.coeff === 1) return "x";
      if (term.coeff === -1) return "−x";
      return fmtInt(term.coeff) + "x";
    }
    return fmtInt(term.coeff);
  }

  function pieceNeg(term) {
    if (term.kind === "bracket") return term.factor < 0;
    return term.coeff < 0;
  }

  function formatSide(terms) {
    var out = "";
    var i;
    var body;
    if (!terms.length) return "0";
    for (i = 0; i < terms.length; i += 1) {
      body = pieceBody(terms[i]);
      if (i === 0) out += body;
      else if (pieceNeg(terms[i])) out += " − " + body.slice(1);
      else out += " + " + body;
    }
    return out;
  }

  function formatEq(sides) {
    return formatSide(sides.L) + " = " + formatSide(sides.R);
  }

  function magOf(term) {
    var n;
    if (term.type === "x") {
      n = Math.abs(term.coeff);
      return n === 1 ? "x" : n + "x";
    }
    return String(Math.abs(term.coeff));
  }

  function bothSidesNote(term) {
    var mag = magOf(term);
    return term.coeff > 0 ? "兩邊同減 " + mag : "兩邊同加 " + mag;
  }

  function signedLabel(term) {
    return (term.coeff < 0 ? "−" : "+") + magOf(term);
  }

  function copyTerm(t) {
    if (t.kind === "bracket") {
      return {
        id: t.id,
        kind: "bracket",
        factor: t.factor,
        parts: t.parts.map(function (p) { return { type: p.type, coeff: p.coeff }; }),
      };
    }
    return { id: t.id, kind: "atom", type: t.type, coeff: t.coeff };
  }

  function cloneSides(sides) {
    return { L: sides.L.map(copyTerm), R: sides.R.map(copyTerm) };
  }

  function mint(run, spec) {
    var term = { id: "t" + run.nextId };
    run.nextId += 1;
    if (spec[0] === "b") {
      term.kind = "bracket";
      term.factor = spec[1];
      term.parts = spec[2].map(function (p) { return { type: p[0], coeff: p[1] }; });
      return term;
    }
    if (spec.kind === "atom") {
      term.kind = "atom";
      term.type = spec.type;
      term.coeff = spec.coeff;
      return term;
    }
    if (spec.kind === "bracket") {
      term.kind = "bracket";
      term.factor = spec.factor;
      term.parts = spec.parts.map(function (p) { return { type: p.type, coeff: p.coeff }; });
      return term;
    }
    term.kind = "atom";
    term.type = spec[0];
    term.coeff = spec[1];
    return term;
  }

  function findTerm(sides, id) {
    var names = ["L", "R"];
    var n;
    var i;
    for (n = 0; n < names.length; n += 1) {
      for (i = 0; i < sides[names[n]].length; i += 1) {
        if (sides[names[n]][i].id === id) return { side: names[n], index: i, term: sides[names[n]][i] };
      }
    }
    return null;
  }

  function idsOf(sides) {
    var out = [];
    var i;
    for (i = 0; i < sides.L.length; i += 1) out.push(sides.L[i].id);
    for (i = 0; i < sides.R.length; i += 1) out.push(sides.R[i].id);
    return out;
  }

  function flatten(terms) {
    var out = [];
    var i;
    var j;
    var t;
    var p;
    for (i = 0; i < terms.length; i += 1) {
      t = terms[i];
      if (t.kind === "bracket") {
        for (j = 0; j < t.parts.length; j += 1) {
          p = t.parts[j];
          out.push({ type: p.type, coeff: p.coeff * t.factor });
        }
      } else out.push({ type: t.type, coeff: t.coeff });
    }
    return out;
  }

  function weight(terms, x) {
    var sum = 0;
    var flat = flatten(terms);
    var i;
    for (i = 0; i < flat.length; i += 1) sum += flat[i].type === "x" ? flat[i].coeff * x : flat[i].coeff;
    return sum;
  }

  function solveLinear(sides) {
    var L = flatten(sides.L);
    var R = flatten(sides.R);
    var a = 0;
    var b = 0;
    var c = 0;
    var d = 0;
    var i;
    var A;
    var B;
    for (i = 0; i < L.length; i += 1) {
      if (L[i].type === "x") a += L[i].coeff;
      else b += L[i].coeff;
    }
    for (i = 0; i < R.length; i += 1) {
      if (R[i].type === "x") c += R[i].coeff;
      else d += R[i].coeff;
    }
    A = a - c;
    B = d - b;
    if (A === 0 || B % A !== 0) return null;
    return B / A;
  }

  function isUnitX(side) {
    return side.length === 1 && side[0].kind === "atom" && side[0].type === "x" && side[0].coeff === 1;
  }

  function isNumberSide(side) {
    if (!side.length) return true;
    return side.length === 1 && side[0].kind === "atom" && side[0].type === "n";
  }

  function isSolvedForm(sides) {
    return (isUnitX(sides.L) && isNumberSide(sides.R)) || (isNumberSide(sides.L) && isUnitX(sides.R));
  }

  function atomXs(list) {
    var out = [];
    var i;
    for (i = 0; i < list.length; i += 1) if (list[i].kind === "atom" && list[i].type === "x") out.push(list[i]);
    return out;
  }

  function atomNs(list) {
    var out = [];
    var i;
    for (i = 0; i < list.length; i += 1) if (list[i].kind === "atom" && list[i].type === "n") out.push(list[i]);
    return out;
  }

  function hasBracket(list) {
    var i;
    for (i = 0; i < list.length; i += 1) if (list[i].kind === "bracket") return true;
    return false;
  }

  function firstBracket(sides) {
    var names = ["L", "R"];
    var n;
    var i;
    for (n = 0; n < names.length; n += 1) {
      for (i = 0; i < sides[names[n]].length; i += 1) {
        if (sides[names[n]][i].kind === "bracket") return sides[names[n]][i];
      }
    }
    return null;
  }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    if (!a) return b;
    if (!b) return a;
    while (b) {
      var t = a % b;
      a = b;
      b = t;
    }
    return a;
  }

  function outerNums(sides) {
    var nums = [];
    ["L", "R"].forEach(function (name) {
      var i;
      var t;
      for (i = 0; i < sides[name].length; i += 1) {
        t = sides[name][i];
        if (t.kind === "bracket") nums.push(t.factor);
        else if (t.coeff !== 0) nums.push(t.coeff);
      }
    });
    return nums;
  }

  function positiveDivisors(g) {
    var out = [];
    var i;
    g = Math.abs(g);
    for (i = 2; i <= g; i += 1) if (g % i === 0) out.push(i);
    return out;
  }

  function lonePack(sides) {
    function isX(side) {
      return side.length === 1 && side[0].kind === "atom" && side[0].type === "x";
    }
    if (isX(sides.L) && isNumberSide(sides.R)) return sides.L[0].coeff;
    if (isX(sides.R) && isNumberSide(sides.L)) return sides.R[0].coeff;
    return null;
  }

  function scaleActions(sides) {
    var actions = [];
    var seen = {};
    var nums = outerNums(sides);
    var g = 0;
    var i;
    var lone;
    function add(type, value, label) {
      var key = type + ":" + value;
      if (seen[key] || value === 0 || value === 1) return;
      seen[key] = true;
      actions.push({ type: type, value: value, label: label });
    }
    for (i = 0; i < nums.length; i += 1) g = gcd(g, nums[i]);
    positiveDivisors(g).forEach(function (d) { add("div", d, "兩邊同除以 " + fmtInt(d)); });
    lone = lonePack(sides);
    if (lone !== null && lone !== 1) {
      add("div", lone, "兩邊同除以 " + fmtInt(lone));
      if (lone < 0) add("mul", -1, "兩邊同乘 −1");
    }
    return actions;
  }

  function constantBeside(sides) {
    var left = atomXs(sides.L).length > 0;
    var right = atomXs(sides.R).length > 0;
    var side;
    if (left === right) return false;
    side = left ? sides.L : sides.R;
    return atomNs(side).length > 0;
  }

  function formAdvice(sides) {
    var eq = formatEq(sides);
    var lone;
    if (isSolvedForm(sides)) return { ok: true, message: "" };
    if (hasBracket(sides.L) || hasBracket(sides.R)) {
      return { ok: false, message: "還沒有達到目標。現在是 " + eq + "。一邊要只剩未知數 x，另一邊只剩一個數。" };
    }
    if (atomXs(sides.L).length && atomXs(sides.R).length) {
      return { ok: false, message: "還沒有達到目標。現在是 " + eq + "。未知數還在兩邊。" };
    }
    if (constantBeside(sides)) {
      return { ok: false, message: "還沒有達到目標。現在是 " + eq + "。有未知數的那邊仍有數字。" };
    }
    lone = lonePack(sides);
    if (lone !== null && lone !== 1) {
      return { ok: false, message: "還沒有達到目標。現在是 " + eq + "。未知數的係數還不是 1。像 2x＝10、10＝2x、−x＝4 都不可以完成。乘除請用按鈕，自己決定。" };
    }
    return { ok: false, message: "還沒有達到目標。一邊要只剩未知數 x，另一邊只剩一個數。" };
  }

  function lookQuestion(run) {
    var divs;
    if (!run.goalSet || run.mode === "challenge") return "";
    if (isSolvedForm(run.sides)) return "現在是不是一邊只剩未知數，另一邊只剩一個數？";
    divs = scaleActions(run.sides).filter(function (action) { return action.type === "div" && action.value > 1; });
    if (firstBracket(run.sides) && divs.length) return "括號可以拆開，只改寫有括號的一邊。括號外的數若能整除兩邊，也可以先除。兩種都對。";
    if (hasBracket(run.sides.L) && hasBracket(run.sides.R)) return "左右兩邊的括號都可以拆開。";
    if (firstBracket(run.sides)) return "有括號的一邊可以拆開。拆開只改寫那一邊。";
    if (atomXs(run.sides.L).length && atomXs(run.sides.R).length) return "未知數是否還在兩邊？";
    if (constantBeside(run.sides)) return "有未知數的那邊，是否還有數字？";
    if (lonePack(run.sides) !== null && lonePack(run.sides) !== 1) return "未知數的係數是不是 1？乘除要兩邊一起做。";
    return "";
  }

  function pairInfo(list, type) {
    var items = [];
    var sum = 0;
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].kind === "atom" && list[i].type === type) {
        items.push(list[i]);
        sum += list[i].coeff;
      }
    }
    if (items.length < 2) return null;
    return { items: items, sum: sum, type: type };
  }

  function mergeNote(list) {
    var notes = [];
    ["x", "n"].forEach(function (type) {
      var info = pairInfo(list, type);
      var expr;
      if (!info) return;
      expr = formatAtoms(info.items.map(function (t) { return { type: t.type, coeff: t.coeff }; }));
      notes.push(expr + " = " + (info.sum === 0 ? "0" : formatAtoms([{ type: type, coeff: info.sum }])));
    });
    if (!notes.length) return "";
    return "把同類項合併：" + notes.join("，");
  }

  function hint(run) {
    var bracket = firstBracket(run.sides);
    var side = "";
    var lone;
    var rightX;
    var leftX;
    var rightN;
    var leftN;
    var actions;
    if (bracket) return { type: "expand", id: bracket.id };
    if (pairInfo(run.sides.L, "x") || pairInfo(run.sides.L, "n")) side = "L";
    else if (pairInfo(run.sides.R, "x") || pairInfo(run.sides.R, "n")) side = "R";
    if (side) return { type: "merge", side: side };
    if (isSolvedForm(run.sides)) return { type: "finish" };
    lone = lonePack(run.sides);
    if (lone !== null && lone !== 1) return { type: "div", value: lone };
    rightX = atomXs(run.sides.R);
    leftX = atomXs(run.sides.L);
    rightN = atomNs(run.sides.R);
    leftN = atomNs(run.sides.L);
    if (rightX.length && leftX.length) return { type: "move", id: rightX[0].id };
    if (!leftX.length && rightX.length) {
      if (rightN.length) return { type: "move", id: rightN[0].id };
      return { type: "move", id: rightX[0].id };
    }
    if (leftX.length && leftN.length) return { type: "move", id: leftN[0].id };
    actions = scaleActions(run.sides);
    if (actions.length) return { type: actions[0].type, value: actions[0].value };
    return null;
  }

  function snapshot(run) {
    return {
      sides: cloneSides(run.sides),
      steps: run.steps.map(function (step) {
        return { equation: step.equation, lamp: step.lamp, note: step.note, detail: step.detail };
      }),
      classified: JSON.parse(JSON.stringify(run.classified)),
    };
  }

  function pushHistory(run) {
    run.history.push(snapshot(run));
    if (run.history.length > 40) run.history.shift();
  }

  function commit(run, nextSides, lamp, note, detail) {
    var prev = {};
    var fresh = [];
    var oldIds = idsOf(run.sides);
    var now;
    var i;
    var eq;
    var solved;
    for (i = 0; i < oldIds.length; i += 1) prev[oldIds[i]] = true;
    pushHistory(run);
    run.sides = nextSides;
    eq = formatEq(run.sides);
    run.steps.push({ equation: eq, lamp: lamp, note: note, detail: detail || note });
    now = idsOf(run.sides);
    for (i = 0; i < now.length; i += 1) if (!prev[now[i]]) fresh.push(now[i]);
    run.freshIds = fresh;
    run.freshLamp = lamp;
    run.alarm = "";
    solved = isSolvedForm(run.sides);
    run.goalAffirmed = false;
    return {
      ok: true,
      applied: true,
      equation: eq,
      banner: note,
      message: note + "。" + (detail && detail !== note ? detail : "") + "現在是 " + eq + "。",
      lamp: lamp,
      askGoal: solved,
      reached: solved,
      checkLines: [],
    };
  }

  function bad(message) {
    return { ok: false, applied: false, message: message, checkLines: [], highlight: [] };
  }

  function needGoal(run) {
    if (!run.goalSet) return bad("請先回答：我們想把方程變成甚麼樣子？");
    return null;
  }

  function planMove(run, id) {
    var found = findTerm(run.sides, id);
    var next;
    var placed;
    var to;
    var note;
    var fromName;
    var toName;
    if (!found) return bad("找不到這一項。");
    if (found.term.kind !== "atom") return bad("括號要先拆開，或對兩邊做同一個乘除。不要把括號單獨搬過去。");
    to = found.side === "L" ? "R" : "L";
    next = cloneSides(run.sides);
    next[found.side] = next[found.side].filter(function (item) { return item.id !== id; });
    placed = { id: "pv", kind: "atom", type: found.term.type, coeff: -found.term.coeff };
    next[to] = next[to].concat([placed]);
    note = bothSidesNote(found.term);
    fromName = found.side === "L" ? "左盤" : "右盤";
    toName = to === "L" ? "左盤" : "右盤";
    return {
      ok: true,
      id: id,
      note: note,
      detail: fromName + "拿走 " + signedLabel(found.term) + "，" + toName + "放下 " + signedLabel(placed) + "。",
      equation: formatEq(next),
      banner: note,
    };
  }

  function planExpand(run, id) {
    var found = findTerm(run.sides, id);
    var produced = [];
    var next;
    var list;
    var made;
    var i;
    var p;
    var coeff;
    var before;
    var after;
    var sideName;
    if (!found) return bad("找不到這一項。");
    if (found.term.kind !== "bracket") return bad("這一項沒有括號。");
    if (!(found.term.factor > 0)) return bad("這一版先處理正的倍數。");
    for (i = 0; i < found.term.parts.length; i += 1) {
      p = found.term.parts[i];
      coeff = p.coeff * found.term.factor;
      if (coeff !== 0) produced.push({ type: p.type, coeff: coeff });
    }
    next = cloneSides(run.sides);
    list = next[found.side].slice();
    made = [];
    for (i = 0; i < produced.length; i += 1) {
      made.push({ id: "pv" + i, kind: "atom", type: produced[i].type, coeff: produced[i].coeff });
    }
    list.splice(found.index, 1);
    for (i = 0; i < made.length; i += 1) list.splice(found.index + i, 0, made[i]);
    next[found.side] = list;
    before = pieceBody(found.term);
    after = formatAtoms(produced);
    sideName = found.side === "L" ? "左邊" : "右邊";
    return {
      ok: true,
      id: id,
      note: "拆括號：" + before + " = " + after,
      detail: "只改寫" + sideName + "，另一邊不變。",
      equation: formatEq(next),
      banner: "拆括號：" + before + " = " + after,
    };
  }

  function applyMove(run, id) {
    var blocked = needGoal(run);
    var plan;
    var found;
    var next;
    var to;
    if (blocked) return blocked;
    plan = planMove(run, id);
    if (!plan.ok) return plan;
    found = findTerm(run.sides, id);
    next = cloneSides(run.sides);
    to = found.side === "L" ? "R" : "L";
    next[found.side] = next[found.side].filter(function (item) { return item.id !== id; });
    next[to] = next[to].concat([mint(run, { kind: "atom", type: found.term.type, coeff: -found.term.coeff })]);
    return commit(run, next, "move", plan.note, plan.detail);
  }

  function applyExpand(run, id) {
    var blocked = needGoal(run);
    var plan;
    var found;
    var next;
    var list;
    var i;
    var p;
    var coeff;
    var made;
    if (blocked) return blocked;
    plan = planExpand(run, id);
    if (!plan.ok) return plan;
    found = findTerm(run.sides, id);
    next = cloneSides(run.sides);
    list = next[found.side].map(copyTerm);
    list.splice(found.index, 1);
    made = [];
    for (i = 0; i < found.term.parts.length; i += 1) {
      p = found.term.parts[i];
      coeff = p.coeff * found.term.factor;
      if (coeff !== 0) made.push(mint(run, { kind: "atom", type: p.type, coeff: coeff }));
    }
    for (i = 0; i < made.length; i += 1) list.splice(found.index + i, 0, made[i]);
    next[found.side] = list;
    return commit(run, next, "expand", plan.note, plan.detail);
  }

  function applyMerge(run, side) {
    var blocked = needGoal(run);
    var list;
    var note;
    var next;
    var rebuilt;
    var xSum = 0;
    var nSum = 0;
    var xCount = 0;
    var nCount = 0;
    var i;
    var t;
    if (blocked) return blocked;
    if (side !== "L" && side !== "R") return bad("請選擇一邊。");
    list = run.sides[side];
    note = mergeNote(list);
    if (!note) return bad("這一邊沒有可合併的同類項。");
    for (i = 0; i < list.length; i += 1) {
      t = list[i];
      if (t.kind === "atom" && t.type === "x") { xSum += t.coeff; xCount += 1; }
      else if (t.kind === "atom" && t.type === "n") { nSum += t.coeff; nCount += 1; }
    }
    rebuilt = [];
    if (xCount >= 2) {
      if (xSum !== 0) rebuilt.push(mint(run, { kind: "atom", type: "x", coeff: xSum }));
    } else {
      for (i = 0; i < list.length; i += 1) if (list[i].kind === "atom" && list[i].type === "x") rebuilt.push(copyTerm(list[i]));
    }
    if (nCount >= 2) {
      if (nSum !== 0) rebuilt.push(mint(run, { kind: "atom", type: "n", coeff: nSum }));
    } else {
      for (i = 0; i < list.length; i += 1) if (list[i].kind === "atom" && list[i].type === "n") rebuilt.push(copyTerm(list[i]));
    }
    for (i = 0; i < list.length; i += 1) if (list[i].kind === "bracket") rebuilt.push(copyTerm(list[i]));
    next = cloneSides(run.sides);
    next[side] = rebuilt;
    return commit(run, next, "merge", note, "同一邊的同類項合成了一項。");
  }

  function applyScale(run, action) {
    var blocked = needGoal(run);
    var allowed;
    var match = null;
    var i;
    var next;
    var note;
    if (blocked) return blocked;
    if (!action || (action.type !== "mul" && action.type !== "div")) return bad("請按乘除按鈕。");
    allowed = scaleActions(run.sides);
    for (i = 0; i < allowed.length; i += 1) {
      if (allowed[i].type === action.type && allowed[i].value === action.value) match = allowed[i];
    }
    if (!match) return bad("現在兩邊不能這樣乘除。可以先拆括號，或先做兩邊同加同減。");
    next = { L: [], R: [] };
    ["L", "R"].forEach(function (name) {
      var j;
      var t;
      var factor;
      var coeff;
      for (j = 0; j < run.sides[name].length; j += 1) {
        t = run.sides[name][j];
        if (t.kind === "bracket") {
          factor = action.type === "mul" ? t.factor * action.value : t.factor / action.value;
          if (factor === 1) {
            t.parts.forEach(function (p) {
              if (p.coeff !== 0) next[name].push(mint(run, { kind: "atom", type: p.type, coeff: p.coeff }));
            });
          } else if (factor !== 0) {
            next[name].push(mint(run, { kind: "bracket", factor: factor, parts: t.parts }));
          }
        } else {
          coeff = action.type === "mul" ? t.coeff * action.value : t.coeff / action.value;
          if (coeff !== 0) next[name].push(mint(run, { kind: "atom", type: t.type, coeff: coeff }));
        }
      }
    });
    note = action.type === "div" ? "兩邊同除以 " + fmtInt(action.value) : "兩邊同乘 " + fmtInt(action.value);
    return commit(run, next, "divide", note, "左右兩邊用了同一個" + (action.type === "div" ? "除數。" : "乘數。"));
  }

  function undo(run) {
    var prev;
    if (!run.history.length) return bad("沒有可以返回的步驟。");
    prev = run.history.pop();
    run.sides = prev.sides;
    run.steps = prev.steps.map(function (step) {
      return { equation: step.equation, lamp: step.lamp, note: step.note, detail: step.detail };
    });
    run.classified = prev.classified;
    run.freshIds = [];
    run.freshLamp = "";
    run.alarm = "";
    run.solved = false;
    if (!isSolvedForm(run.sides)) run.goalAffirmed = false;
    return { ok: true, applied: true, message: "已返回上一步。", askGoal: false, checkLines: [] };
  }

  function answerPurpose(run, choice) {
    var index = Number(choice);
    if (index !== PURPOSE.answer) return { ok: false, message: PURPOSE.wrongs[index] || "還不是。請再看這一項在說甚麼。" };
    run.goalSet = true;
    return { ok: true, message: PURPOSE.right };
  }

  function answerGoal(run, saidYes) {
    var yes = !!saidYes;
    var reached = isSolvedForm(run.sides);
    if (!run.goalSet) return { ok: false, message: "請先回答：我們想把方程變成甚麼樣子？" };
    if (!reached && yes) return { ok: true, reached: false, affirmed: false, message: "還沒有。一邊仍然不是只剩未知數，或另一邊不是只剩一個數。" };
    if (!reached && !yes) return { ok: true, reached: false, affirmed: false, message: "好。目標尚未達到，請繼續自己選下一步。" };
    if (yes) {
      run.goalAffirmed = true;
      return { ok: true, reached: true, affirmed: true, message: "對。一邊只剩 x，另一邊只剩一個數。請先為每一步選類型，再代入原式。" };
    }
    return { ok: true, reached: true, affirmed: false, message: "請再看現在的方程。若一邊只剩未知數、另一邊只剩一個數，就是達到目標。" };
  }

  function finishGate(run) {
    var advice;
    if (!run.goalSet) return { ok: false, message: "請先回答：我們想把方程變成甚麼樣子？" };
    advice = formAdvice(run.sides);
    if (!advice.ok) return advice;
    if (!run.goalAffirmed) return { ok: false, message: "請先回答：有達到目標嗎？" };
    return { ok: true, message: "" };
  }

  function pendingClass(run) {
    var i;
    for (i = 1; i < run.steps.length; i += 1) if (!run.classified[i]) return i;
    return 0;
  }

  function gradeClassify(run, stepIndex, choice) {
    var step = run.steps[stepIndex];
    var picked = CLASS_CHOICES[Number(choice)];
    if (!step || !stepIndex) return { ok: false, message: "這一行是原式。" };
    if (!picked) return { ok: false, message: "請選一種類型。" };
    if (picked.id !== step.lamp) {
      return { ok: false, message: classWrong(step.lamp, picked.id) };
    }
    run.classified[stepIndex] = true;
    return { ok: true, message: classRight(step.lamp), done: pendingClass(run) === 0 };
  }

  function classRight(lamp) {
    if (lamp === "expand") return "對。拆括號只改寫一邊，是等價改寫。";
    if (lamp === "merge") return "對。這是把同類項合成一項。";
    if (lamp === "move") return "對。這是兩邊同加或同減，另一邊留下相反項。";
    return "對。這是兩邊同乘或同除。";
  }

  function classWrong(lamp, picked) {
    var you = {
      expand: "你選了拆括號。",
      merge: "你選了合併同類項。",
      move: "你選了移項。",
      divide: "你選了除數。",
    };
    var truth = {
      expand: "這一步只改寫有括號的一邊。",
      merge: "這一步是把同一邊的同類項合成一項。",
      move: "這一步是兩邊同加或同減，另一邊放下相反項。",
      divide: "這一步是兩邊同乘或同除。",
    };
    return (you[picked] || "") + (truth[lamp] || "請再看這一步改了甚麼。");
  }

  function classChoices() {
    return CLASS_CHOICES.map(function (item) { return item.label; });
  }

  function classifyTask(run) {
    var items = [];
    var i;
    for (i = 1; i < run.steps.length; i += 1) {
      items.push({
        index: i,
        equation: run.steps[i].equation,
        note: run.steps[i].note,
        detail: run.steps[i].detail,
        done: !!run.classified[i],
        chosen: run.classified[i] ? CLASS_CHOICES.filter(function (choice) { return choice.id === run.steps[i].lamp; })[0].label : "",
        ask: "這一步屬於哪一種？",
      });
    }
    return { items: items, choices: classChoices(), done: pendingClass(run) === 0 };
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

  function substAtom(term, x, index) {
    var core;
    var rest;
    if (term.type === "n") {
      if (index === 0) return fmtInt(term.coeff);
      return term.coeff < 0 ? " − " + Math.abs(term.coeff) : " + " + term.coeff;
    }
    if (term.coeff === 1) core = x < 0 ? "(" + fmtInt(x) + ")" : String(x);
    else if (term.coeff === -1) core = "−(" + fmtInt(x) + ")";
    else core = fmtInt(term.coeff) + "×(" + fmtInt(x) + ")";
    if (index === 0) return core;
    if (term.coeff < 0) {
      rest = term.coeff === -1 ? "(" + fmtInt(x) + ")" : Math.abs(term.coeff) + "×(" + fmtInt(x) + ")";
      return " − " + rest;
    }
    return " + " + core;
  }

  function substPiece(term, x, index) {
    var inner = "";
    var i;
    var body;
    if (term.kind !== "bracket") return substAtom(term, x, index);
    for (i = 0; i < term.parts.length; i += 1) {
      inner += substAtom({ type: term.parts[i].type, coeff: term.parts[i].coeff }, x, i);
    }
    if (term.factor === 1) body = "(" + inner + ")";
    else if (term.factor === -1) body = "−(" + inner + ")";
    else body = fmtInt(term.factor) + "(" + inner + ")";
    if (index === 0) return body;
    return term.factor < 0 ? " − " + body.slice(1) : " + " + body;
  }

  function substSide(terms, x) {
    var expr = "";
    var i;
    if (terms.length === 1 && terms[0].kind === "atom" && terms[0].type === "n") return fmtInt(terms[0].coeff);
    if (!terms.length) return "0";
    for (i = 0; i < terms.length; i += 1) expr += substPiece(terms[i], x, i);
    return expr + " = " + fmtInt(weight(terms, x));
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
    if (pendingClass(run)) return { ok: false, applied: false, message: "請先為每一步選類型。" };
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
      return { ok: true, applied: true, leftText: leftText, rightText: rightText, message: "左右相等，天平平衡。" + extra, score: run.score, bonus: run.bonus };
    }
    pen = penalize(run, "代入不相等");
    return { ok: false, applied: true, leftText: leftText, rightText: rightText, message: "左右不相等。" + pen, score: run.score, bonus: run.bonus };
  }

  function readSolution(run) {
    if (!isSolvedForm(run.sides)) return null;
    if (isUnitX(run.sides.L)) return run.sides.R.length ? run.sides.R[0].coeff : 0;
    return run.sides.L.length ? run.sides.L[0].coeff : 0;
  }

  function isLevel(run) {
    var x = solveLinear(run.original);
    if (x === null) return false;
    return weight(run.sides.L, x) === weight(run.sides.R, x);
  }

  function resultOf(run) {
    var counts = {};
    if (!run.solved) return null;
    run.misses.forEach(function (label) { counts[label] = (counts[label] || 0) + 1; });
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
    if (id === "expand") return "拆括號只改寫有括號的一邊，是等價改寫。例如 3(x + 2) 寫成 3x + 6，另一邊不變。";
    if (id === "merge") return "同類項可以合成一項。例如 3x − x = 2x。同一題可以合併多次。";
    if (id === "move") return "移項是兩邊同加或同減。拿走一項之後，另一邊放下相反項。乘除不要用移項。";
    if (id === "divide") return "除數是兩邊同乘或同除，請按按鈕。係數是負數時，可以兩邊同除以那個負數，或兩邊同乘 −1。";
    return "";
  }

  function lampsUsed(run) {
    var seen = [];
    var i;
    for (i = 0; i < run.steps.length; i += 1) {
      if (run.steps[i].lamp && seen.indexOf(run.steps[i].lamp) === -1) seen.push(run.steps[i].lamp);
    }
    return seen;
  }

  function latestNote(run, id) {
    var i;
    var note = "";
    for (i = 0; i < run.steps.length; i += 1) if (run.steps[i].lamp === id) note = run.steps[i].note;
    return note;
  }

  function view(run, opts) {
    var options = opts || {};
    var preview = options.preview && options.preview.ok ? options.preview : null;
    var sides = run.sides;
    var shownEq = preview ? preview.equation : formatEq(run.sides);
    var fresh = {};
    var i;
    var look;
    var actions = [];
    function pushTermActions(sideName) {
      var list = run.sides[sideName];
      var k;
      var where = sideName === "L" ? "左邊" : "右邊";
      for (k = 0; k < list.length; k += 1) {
        if (list[k].kind === "bracket") {
          actions.push({ type: "expand", id: list[k].id, side: sideName, label: "拆開" + where + "的 " + pieceBody(list[k]) });
        } else {
          actions.push({ type: "move", id: list[k].id, side: sideName, label: "移走 " + pieceBody(list[k]) + "（" + bothSidesNote(list[k]) + "）" });
        }
      }
      if (mergeNote(list)) actions.push({ type: "merge", side: sideName, label: "合併" + where + "的同類項" });
    }
    for (i = 0; i < run.freshIds.length; i += 1) fresh[run.freshIds[i]] = true;
    pushTermActions("L");
    pushTermActions("R");
    scaleActions(run.sides).forEach(function (action) {
      actions.push({ type: action.type, value: action.value, label: action.label });
    });
    look = preview ? "" : lookQuestion(run);
    return {
      number: run.index + 1,
      total: missionList(run.mode).length,
      title: run.mission.title,
      brief: run.mission.brief,
      mode: run.mode,
      setLabel: setLabel(run.mode),
      score: run.score,
      motto: MOTTO,
      equation: shownEq,
      officialEquation: formatEq(run.sides),
      originalEquation: formatEq(run.original),
      previewing: !!preview,
      steps: run.steps.map(function (step, index) {
        return { equation: step.equation, lamp: step.lamp, note: step.note, detail: step.detail, classified: !!run.classified[index] };
      }),
      lampsUsed: lampsUsed(run),
      ready: isSolvedForm(sides),
      goalSet: !!run.goalSet,
      goalAffirmed: !!run.goalAffirmed,
      look: look,
      deskPrompt: run.mode === "challenge" ? "目標是一邊只剩 x，應做甚麼呢？" : (look || "目標是一邊只剩 x，應做甚麼呢？"),
      tokens: {
        L: sides.L.map(function (t) { return tokenView(t, "L", fresh); }),
        R: sides.R.map(function (t) { return tokenView(t, "R", fresh); }),
      },
      lamps: [LAMPS.expand, LAMPS.merge, LAMPS.move, LAMPS.divide].map(function (lamp) {
        return { id: lamp.id, name: lamp.name, detail: lamp.detail, title: latestNote(run, lamp.id) || lamp.detail, state: run.steps.some(function (step) { return step.lamp === lamp.id; }) ? "done" : "idle" };
      }),
      actions: actions,
      canUndo: run.history.length > 0,
      checkTries: run.checkTries,
      bonus: run.bonus,
      solved: !!run.solved,
    };
  }

  function tokenView(term, side, fresh) {
    return {
      id: term.id,
      side: side,
      kind: term.kind,
      type: term.kind === "bracket" ? "b" : term.type,
      label: pieceBody(term),
      neg: pieceNeg(term),
      fresh: !!fresh[term.id],
    };
  }

  function createRun(index, mode) {
    var name = normalizeMode(mode);
    var list = missionList(name);
    var mission = list[index];
    var run;
    var sides;
    if (!mission) throw new Error("沒有這一題");
    run = {
      index: index,
      mode: name,
      mission: mission,
      nextId: 1,
      score: 100,
      misses: [],
      history: [],
      freshIds: [],
      freshLamp: "",
      alarm: "",
      goalSet: false,
      goalAffirmed: false,
      classified: {},
      checkTries: 0,
      bonus: 0,
      solved: false,
      entry: null,
    };
    sides = {
      L: mission.L.map(function (spec) { return mint(run, spec); }),
      R: mission.R.map(function (spec) { return mint(run, spec); }),
    };
    run.sides = sides;
    run.original = cloneSides(sides);
    run.steps = [{ equation: formatEq(sides), lamp: null, note: "原式", detail: "原式" }];
    return run;
  }

  var api = {
    motto: MOTTO,
    lamps: LAMPS,
    consolidate: CONSOLIDATE,
    goalAsk: GOAL_ASK,
    exampleCount: EXAMPLES.length,
    practiceCount: PRACTICE.length,
    challengeCount: CHALLENGE.length,
    purpose: function () { return { ask: PURPOSE.ask, choices: PURPOSE.choices.slice() }; },
    classChoices: classChoices,
    createWorkshop: createWorkshop,
    workshopView: workshopView,
    workshopState: workshopState,
    restoreWorkshop: restoreWorkshop,
    easy: EASY,
    hard: HARD,
    own: OWN,
    submitFormula: submitFormula,
    submitNumbers: submitNumbers,
    submitEasyArea: submitEasyArea,
    answerHardThink: answerHardThink,
    splitLength: splitLength,
    gradeStw: gradeStw,
    submitSplit: submitSplit,
    submitOwnSplit: submitOwnSplit,
    submitOwnAreas: submitOwnAreas,
    gradePartition: gradePartition,
    matchRegion: matchRegion,
    setThreeMode: setThreeMode,
    combineThree: combineThree,
    distributeThree: distributeThree,
    submitThree: submitThree,
    undoWorkshop: undoWorkshop,
    gradeAreas: gradeAreas,
    gradeThree: gradeThree,
    createRun: createRun,
    view: view,
    hint: hint,
    answerPurpose: answerPurpose,
    answerGoal: answerGoal,
    planMove: planMove,
    planExpand: planExpand,
    applyMove: applyMove,
    applyExpand: applyExpand,
    applyMerge: applyMerge,
    applyScale: applyScale,
    undo: undo,
    finishGate: finishGate,
    formAdvice: formAdvice,
    gradeClassify: gradeClassify,
    classifyTask: classifyTask,
    submitCheck: submitCheck,
    readSolution: readSolution,
    resultOf: resultOf,
    lampHelp: lampHelp,
    isLevel: isLevel,
    parseStudent: parseStudent,
    isSolvedForm: isSolvedForm,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BracketEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
