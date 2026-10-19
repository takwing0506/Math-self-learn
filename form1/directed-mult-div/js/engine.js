/* 有向數乘除
   乘法、除法：只數括號裡的「−」。奇數是負，偶數是正。
   定了正負之後，直接計算絕對值。
   兩數中間的減號是減法，加號是加法，都不當成因數。
*/
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.M2 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function normalize(input) {
    return String(input)
      .replace(/\s+/g, "")
      .replace(/[＋]/g, "+")
      .replace(/[−–—－]/g, "-")
      .replace(/[×✕✖]/g, "*")
      .replace(/[÷]/g, "/")
      .replace(/[（]/g, "(")
      .replace(/[）]/g, ")");
  }

  function parsePiece(text) {
    let body = text;
    let paren = false;
    if (body.charAt(0) === "(" && body.charAt(body.length - 1) === ")") {
      paren = true;
      body = body.slice(1, -1);
    }
    const matched = body.match(/^([+-]?)(\d+)$/);
    if (!matched) return null;
    const abs = Number(matched[2]);
    if (!abs && abs !== 0) return null;
    return {
      n: matched[1] === "-" ? -abs : abs,
      paren: paren,
      explicitSign: matched[1] !== "",
    };
  }

  function readBrace(source, index) {
    if (source.charAt(index) !== "{") return null;
    let depth = 0;
    const start = index + 1;
    for (let k = index; k < source.length; k += 1) {
      if (source.charAt(k) === "{") depth += 1;
      else if (source.charAt(k) === "}") {
        depth -= 1;
        if (depth === 0) return { text: source.slice(start, k), next: k + 1 };
      }
    }
    return null;
  }

  function tokenize(source) {
    const tokens = [];
    let i = 0;
    while (i < source.length) {
      const ch = source.charAt(i);
      if (ch === "(") {
        const end = source.indexOf(")", i);
        if (end < 0) return null;
        const piece = parsePiece(source.slice(i, end + 1));
        if (!piece) return null;
        tokens.push({ t: "f", f: piece });
        i = end + 1;
        continue;
      }
      if (ch === "*" || ch === "/") {
        tokens.push({ t: "op", v: ch });
        i += 1;
        continue;
      }
      if ((ch === "+" || ch === "-") && tokens.length && tokens[tokens.length - 1].t === "f") {
        const next = source.charAt(i + 1);
        if (next === "(" || (next >= "0" && next <= "9")) {
          tokens.push({ t: "op", v: ch });
          i += 1;
          continue;
        }
      }
      if (ch === "+" || ch === "-" || (ch >= "0" && ch <= "9")) {
        const matched = source.slice(i).match(/^([+-]?\d+)/);
        if (!matched) return null;
        const piece = parsePiece(matched[1]);
        if (!piece) return null;
        tokens.push({ t: "f", f: piece });
        i += matched[1].length;
        continue;
      }
      return null;
    }
    return tokens;
  }

  function finish(kind, factors, between, display) {
    const values = factors.map(function (factor) { return factor.n; });
    if (kind === "add" || kind === "sub") {
      if (factors.length !== 2) return null;
      return {
        kind: kind,
        factors: factors,
        between: between,
        display: "symbol",
        juxtaposed: false,
        minusCount: null,
        magnitude: null,
        end: kind === "add" ? values[0] + values[1] : values[0] - values[1],
      };
    }
    if (values.some(function (value) { return value === 0 && kind === "div"; })) return null;
    let magnitude = 1;
    if (kind === "mul") {
      values.forEach(function (value) { magnitude *= Math.abs(value); });
    } else {
      if (values.length !== 2 || values[1] === 0) return null;
      magnitude = Math.abs(values[0]) / Math.abs(values[1]);
      if (!Number.isInteger(magnitude)) return null;
    }
    const minusCount = values.filter(function (value) { return value < 0; }).length;
    const sign = minusCount % 2 === 0 ? 1 : -1;
    return {
      kind: kind,
      factors: factors,
      between: between,
      display: display || "symbol",
      juxtaposed: kind === "mul" && between.every(function (item) { return item === ""; }),
      minusCount: minusCount,
      magnitude: magnitude,
      end: sign * magnitude,
    };
  }

  function fromTokens(tokens) {
    if (!tokens || !tokens.length || tokens[0].t !== "f") return null;
    const factors = [];
    const between = [];
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (token.t === "f") {
        if (factors.length && between.length !== factors.length) between.push("");
        if (between.length !== factors.length) return null;
        factors.push(token.f);
      } else if (token.t === "op") {
        if (!factors.length || between.length !== factors.length - 1) return null;
        between.push(token.v);
      } else return null;
    }
    if (factors.length < 2 || between.length !== factors.length - 1) return null;
    if (between.some(function (op) { return op === "+" || op === "-" || op === "/"; })) {
      if (factors.length !== 2 || between.length !== 1) return null;
      if (between[0] === "+") return finish("add", factors, ["＋"], "symbol");
      if (between[0] === "-") return finish("sub", factors, ["−"], "symbol");
      return finish("div", factors, ["÷"], "symbol");
    }
    if (between.every(function (op) { return op === "*" || op === ""; })) {
      return finish("mul", factors, between.map(function (op) { return op === "*" ? "×" : ""; }), "symbol");
    }
    return null;
  }

  function parse(input) {
    const source = normalize(input);
    if (source.indexOf("frac{") === 0) {
      const top = readBrace(source, 4);
      if (!top) return null;
      const bottom = readBrace(source, top.next);
      if (!bottom || bottom.next !== source.length) return null;
      const a = parsePiece(top.text);
      const b = parsePiece(bottom.text);
      if (!a || !b) return null;
      return finish("div", [a, b], ["÷"], "fraction");
    }
    return fromTokens(tokenize(source));
  }

  function signName(expr) {
    if (!expr || expr.minusCount == null) return null;
    return expr.minusCount % 2 === 0 ? "正" : "負";
  }

  function parseAnswer(text) {
    if (text == null) return null;
    let source = String(text).trim().replace(/[−–—－]/g, "-").replace(/＋/g, "+");
    source = source.replace(/[０-９]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
    });
    if (!source) return null;
    if (source.indexOf("=") >= 0) source = source.split("=").pop();
    source = source.replace(/\s+/g, "");
    if (!/^[+-]?\d+$/.test(source)) return null;
    return Number(source);
  }

  function formatSigned(n) {
    if (n === 0) return "0";
    return (n < 0 ? "−" : "+") + Math.abs(n);
  }

  function kindName(kind) {
    if (kind === "add") return "加法";
    if (kind === "sub") return "減法";
    if (kind === "mul") return "乘法";
    if (kind === "div") return "除法";
    return "";
  }

  return {
    parse: parse,
    signName: signName,
    parseAnswer: parseAnswer,
    formatSigned: formatSigned,
    kindName: kindName,
  };
});
