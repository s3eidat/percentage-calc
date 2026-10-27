/* Percentage Calc — six live calculators, computed locally. */
(function () {
  "use strict";
  var $ = S3.$, $$ = S3.$$;
  var KEY = "pct.v1";
  var IDS = ["of-x", "of-y", "wh-x", "wh-y", "ch-x", "ch-y", "inc-y", "inc-x", "rv-y", "rv-x", "mm-c", "mm-p"];
  var dir = { inc: "+", rv: "+" };

  function num(v) {
    v = String(v == null ? "" : v)
      .replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 0x660; })
      .replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 0x6F0; })
      .replace(/٫/g, ".").replace(/[,\s_٬%]/g, "").replace(/^−/, "-");
    return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(v) ? parseFloat(v) : NaN;
  }
  // 12 significant digits hides float noise (0.1 + 0.2 → 0.3); show up to `dec` decimals (default 6).
  function fmt(v, dec) {
    if (!isFinite(v)) return "—";
    v = Number(v.toPrecision(12));
    if (Object.is(v, -0)) v = 0;
    return Math.abs(v) >= 1e15 || (v !== 0 && Math.abs(v) < 1e-10) ? v.toExponential(6) : v.toLocaleString("en-US", { maximumFractionDigits: dec == null ? 6 : dec });
  }

  // ---------- core maths ----------
  var M = {
    of: function (x, y) { return x / 100 * y; },
    what: function (x, y) { return y === 0 ? NaN : x / y * 100; },
    change: function (a, b) { return a === 0 ? NaN : (b - a) / Math.abs(a) * 100; },
    inc: function (y, x, d) { return y * (1 + (d === "-" ? -x : x) / 100); },
    rev: function (y, x, d) { var f = 1 + (d === "-" ? -x : x) / 100; return f === 0 ? NaN : y / f; },
    mm: function (cost, price) {
      var p = price - cost;
      return { profit: p, margin: price === 0 ? NaN : p / price * 100, markup: cost === 0 ? NaN : p / cost * 100 };
    }
  };

  function v(id) { return num($("#" + id).value); }
  function set(id, text) { $("#" + id).textContent = text; }
  function both(a, b) { return !isNaN(a) && !isNaN(b); }

  function render() {
    var x, y, r;
    x = v("of-x"); y = v("of-y");
    if (both(x, y)) { r = M.of(x, y); set("of-r", fmt(r)); set("of-h", fmt(x) + " ÷ 100 × " + fmt(y) + " = " + fmt(r)); } else { set("of-r", "—"); set("of-h", ""); }

    x = v("wh-x"); y = v("wh-y");
    if (both(x, y)) {
      r = M.what(x, y);
      set("wh-r", isFinite(r) ? fmt(r) + "%" : "—");
      set("wh-h", isFinite(r) ? fmt(x) + " ÷ " + fmt(y) + " × 100 = " + fmt(r) + "%" : "Can't divide by 0.");
    } else { set("wh-r", "—"); set("wh-h", ""); }

    x = v("ch-x"); y = v("ch-y");
    var chip = $("#ch-c");
    if (both(x, y)) {
      r = M.change(x, y);
      set("ch-r", isFinite(r) ? (r > 0 ? "+" : "") + fmt(r) + "%" : "—");
      set("ch-h", isFinite(r) ? "(" + fmt(y) + " − " + fmt(x) + ") ÷ |" + fmt(x) + "| × 100 · difference " + fmt(y - x) : "Change from 0 is undefined.");
      chip.hidden = !isFinite(r);
      chip.className = "chip " + (r > 0 ? "up" : r < 0 ? "down" : "");
      chip.textContent = r > 0 ? "increase" : r < 0 ? "decrease" : "no change";
    } else { set("ch-r", "—"); set("ch-h", ""); chip.hidden = true; }

    y = v("inc-y"); x = v("inc-x");
    if (both(x, y)) {
      r = M.inc(y, x, dir.inc);
      set("inc-r", fmt(r));
      set("inc-h", fmt(y) + " × (1 " + (dir.inc === "-" ? "−" : "+") + " " + fmt(x) + "/100) = " + fmt(r) + " · " + (dir.inc === "-" ? "−" : "+") + fmt(Math.abs(r - y)));
    } else { set("inc-r", "—"); set("inc-h", ""); }

    y = v("rv-y"); x = v("rv-x"); set("rv-s", dir.rv === "-" ? "−" : "+");
    if (both(x, y)) {
      r = M.rev(y, x, dir.rv);
      set("rv-r", fmt(r));
      set("rv-h", isFinite(r) ? "original = " + fmt(y) + " ÷ (1 " + (dir.rv === "-" ? "−" : "+") + " " + fmt(x) + "/100) = " + fmt(r) + " · the " + fmt(x) + "% part is " + fmt(Math.abs(y - r)) : "A 100% decrease leaves nothing to reverse.");
    } else { set("rv-r", "—"); set("rv-h", ""); }

    var c = v("mm-c"), p = v("mm-p"), box = $("#mm-r");
    if (both(c, p)) {
      var m = M.mm(c, p);
      box.innerHTML = "<div><b>" + S3.esc(fmt(m.profit)) + "</b><span>profit</span></div><div><b>" + S3.esc(isFinite(m.margin) ? fmt(m.margin, 2) + "%" : "—") +
        "</b><span>margin</span></div><div><b>" + S3.esc(isFinite(m.markup) ? fmt(m.markup, 2) + "%" : "—") + "</b><span>markup</span></div>";
      set("mm-h", "Margin = profit ÷ price. Markup = profit ÷ cost.");
    } else { box.innerHTML = '<div><b>—</b><span>profit</span></div><div><b>—</b><span>margin</span></div><div><b>—</b><span>markup</span></div>'; set("mm-h", ""); }

    var s = { dir: dir };
    IDS.forEach(function (id) { s[id] = $("#" + id).value; });
    S3.store(KEY, s);
  }

  function seg(el, key) {
    $$("button", el).forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.v === dir[key]));
      b.addEventListener("click", function () {
        dir[key] = b.dataset.v;
        $$("button", el).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        render();
      });
    });
  }

  // ---------- wiring ----------
  var saved = S3.store(KEY) || {};
  var defaults = { "of-x": "15", "of-y": "200", "wh-x": "30", "wh-y": "120", "ch-x": "80", "ch-y": "100", "inc-y": "250", "inc-x": "20", "rv-y": "115", "rv-x": "15", "mm-c": "60", "mm-p": "100" };
  IDS.forEach(function (id) { $("#" + id).value = saved[id] != null ? saved[id] : defaults[id]; $("#" + id).addEventListener("input", render); });
  if (saved.dir) { dir.inc = saved.dir.inc === "-" ? "-" : "+"; dir.rv = saved.dir.rv === "-" ? "-" : "+"; }
  seg($("#inc-d"), "inc"); seg($("#rv-d"), "rv");
  $$(".cp").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = $("#" + b.dataset.for).textContent;
      if (t === "—") return S3.toast("Nothing to copy yet", "error");
      S3.copy(t.replace(/,/g, "")); S3.done();
    });
  });
  render();

  window.S3_DEMO = function () {
    IDS.forEach(function (id) { $("#" + id).value = defaults[id]; });
    $("#inc-d button[data-v='+']").click(); $("#rv-d button[data-v='+']").click();
  };

  window.S3_SELFTEST = function () {
    var m = M.mm(80, 100);
    return M.of(15, 200) === 30 && fmt(M.what(30, 200)) === "15" && M.change(50, 75) === 50 && M.change(80, 60) === -25 &&
      fmt(M.change(-50, -25)) === "50" && isNaN(M.change(0, 5)) && isNaN(M.what(1, 0)) &&
      fmt(M.inc(200, 15, "+")) === "230" && fmt(M.inc(200, 15, "-")) === "170" &&
      fmt(M.rev(115, 15, "+")) === "100" && fmt(M.rev(80, 20, "-")) === "100" &&
      fmt(m.margin) === "20" && fmt(m.markup) === "25" && fmt(0.1 + 0.2) === "0.3" && fmt(1234.5) === "1,234.5" &&
      num("1,000") === 1000 && num("−5") === -5 && num("١٥") === 15;
  };
})();
