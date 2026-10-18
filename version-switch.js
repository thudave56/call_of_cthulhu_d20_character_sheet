/*
 * version-switch.js — a slim "Version" bar shared by the original sheet (v1)
 * and Investigator Sheets (v2), so players can move between them.
 *
 * Usage: <script src="version-switch.js" data-current="v1"
 *                 data-v1="index.html" data-v2="v2/index.html"></script>
 *
 * The choice is remembered in this browser. Opening the original page
 * redirects to v2 when v2 was the last choice; add ?v1 to the URL to stay
 * on the original regardless.
 */
(function () {
  "use strict";
  var KEY = "cocd20_version";
  var me = document.currentScript;
  if (!me) return;
  var current = me.getAttribute("data-current");
  var urls = { v1: me.getAttribute("data-v1"), v2: me.getAttribute("data-v2") };

  function getPref() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setPref(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ } }

  // The original page follows the remembered choice unless ?v1 is given.
  if (current === "v1" && getPref() === "v2" && !/[?&]v1\b/.test(location.search)) {
    location.replace(urls.v2);
    return;
  }

  var css =
    ".vswitch{display:flex;align-items:center;justify-content:center;gap:.5rem;flex-wrap:wrap;" +
    "padding:.3rem 16px;background:#1b2531;color:#e8e3d8;font:13px/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}" +
    ".vswitch label{display:inline-flex;align-items:center;gap:.4rem;font-weight:600;letter-spacing:.03em}" +
    ".vswitch select{font:inherit;font-weight:600;padding:.15rem .4rem;border-radius:6px;border:1px solid #4a5868;background:#fff;color:#1b2531}" +
    ".vswitch .vnote{opacity:.8}" +
    "@media (max-width:600px){.vswitch .vnote{display:none}}" +
    "@media print{.vswitch{display:none!important}}";

  function build() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement("div");
    bar.className = "vswitch";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Sheet version");

    var label = document.createElement("label");
    label.htmlFor = "vswitchSelect";
    label.textContent = "Version";
    var select = document.createElement("select");
    select.id = "vswitchSelect";
    [["v2", "New: Investigator Sheets (v2)"], ["v1", "Original sheet (v1)"]].forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o[0];
      opt.textContent = o[1];
      if (o[0] === current) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", function () {
      setPref(select.value);
      // Going back to the original adds ?v1 so the redirect doesn't bounce us to v2.
      location.href = select.value === "v1" ? urls.v1 + "?v1" : urls.v2;
    });
    label.appendChild(select);

    var note = document.createElement("span");
    note.className = "vnote";
    note.textContent = current === "v1"
      ? "Try the new version: rules-checked, three play layouts."
      : "Each version keeps its own saved characters in this browser.";

    bar.appendChild(label);
    bar.appendChild(note);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();
