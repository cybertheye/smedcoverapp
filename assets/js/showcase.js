// The showcase's moving parts: the platform picker over the export sheet, the looks wall with its stage,
// Surprise me's deals, copy buttons, the install tabs and the gentle reveals.
import { both, pair, setBoth, t, applyLang } from "./i18n.js";


const RATIOS = ["16:9", "4:3", "3:4", "9:16", "1:1", "2.35:1"];
/** platforms.js in SmedCover: the covers each platform wants (checked on its upload page). */
const WANTS = {
  bili: () => ["16:9", "4:3"],
  youtube: (o) => (o.orient === "v" ? ["9:16"] : ["16:9"]),
  douyin: () => ["4:3", "3:4"],
  red: (o) => [o.red],
  channels: (o) => (o.orient === "v" ? ["3:4"] : ["3:4", "4:3"]),
  mp: () => ["2.35:1", "1:1"],
};

export function initPicker() {
  const box = document.getElementById("picker");
  if (!box) return;
  const sheet = document.getElementById("sheet");
  const result = document.getElementById("picker-result");
  const redRow = document.getElementById("red-row");
  const o = { orient: "h", red: "3:4" };
  const seg = (id, key) => {
    const g = document.getElementById(id);
    g.addEventListener("click", (e) => {
      const b = e.target.closest("[data-v]");
      if (!b) return;
      o[key] = b.dataset.v;
      g.querySelectorAll("[data-v]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      update();
    });
    radioKeys(g);
  };
  seg("orient", "orient");
  seg("red-ratio", "red");
  box.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => {
    b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
    update();
  }));
  function update() {
    const on = [...box.querySelectorAll("[data-p][aria-pressed=true]")].map((b) => b.dataset.p);
    const need = new Set(on.flatMap((p) => WANTS[p](o)));
    const list = RATIOS.filter((r) => need.has(r));
    redRow.hidden = !on.includes("red");
    sheet.querySelectorAll("figure[data-ratio]").forEach((f) => f.classList.toggle("off", !need.has(f.dataset.ratio)));
    result.innerHTML = list.length
      ? `${both(...pair("picker.result", { n: list.length }))}<span class="mono">${list.join(" · ")}</span>`
      : both(...pair("picker.none"));
  }
  update();
}

/** Only the checked radio of a group is in the tab order (arrow keys move within it). */
export function syncRoving(group) {
  if (!group) return;
  const items = [...group.querySelectorAll("[role=radio]")];
  const on = items.find((b) => b.getAttribute("aria-checked") === "true") || items[0];
  items.forEach((b) => { b.tabIndex = b === on ? 0 : -1; });
}

/** Arrow keys move the choice in a role=radiogroup made of buttons (skipping disabled ones). */
export function radioKeys(group) {
  if (!group) return;
  syncRoving(group);
  group.addEventListener("click", () => setTimeout(() => syncRoving(group)));
  group.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
    const items = [...group.querySelectorAll("[role=radio]")].filter((b) => b.getAttribute("aria-disabled") !== "true");
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
    const next = e.key === "Home" ? items[0] : e.key === "End" ? items[items.length - 1] : items[(i + (fwd ? 1 : items.length - 1)) % items.length];
    next.focus();
    next.click();
  });
}

let avif = null;
function supportsAvif() {
  if (avif) return avif;
  avif = new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok(img.width > 0);
    img.onerror = () => ok(false);
    img.src = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUEAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAJQAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBIAAAAAAAE2NvbHJuY2x4AAEAAgAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAALW1kYXQSAAoHOAAGkBAgaTIYHEJi5OmmmmFjYACQNjDwjcLOdmJe3fdA";
  });
  return avif;
}

export function initLooks() {
  const data = JSON.parse(document.getElementById("looks-data")?.textContent || "[]");
  const grid = document.getElementById("looks-grid");
  if (!grid || !data.length) return;
  const byId = Object.fromEntries(data.map((l, i) => [l.id, { ...l, i }]));
  const pic = document.getElementById("look-pic");
  const info = {
    kinds: document.getElementById("look-kinds"), name: document.getElementById("look-name"), alt: document.getElementById("look-alt"),
    for: document.getElementById("look-for"), count: document.getElementById("look-count"),
  };
  let pinned = "cel", shown = "cel", hoverTimer = 0, seq = 0;

  async function stage(id) {
    if (id === shown) return;
    shown = id;
    const l = byId[id];
    const my = ++seq;
    info.kinds.innerHTML = l.k.map((k) => `<span>${both(...pair(`kind.${k}`))}</span>`).join("");
    info.name.innerHTML = both(l.zh, l.en);
    info.alt.innerHTML = `<span data-l="zh" lang="en">${l.en.toUpperCase()}</span><span data-l="en" lang="zh-CN">${l.zh}</span>`;
    info.for.innerHTML = both(l.fz, l.fe);
    info.count.textContent = `${String(l.i + 1).padStart(2, "0")} / ${String(data.length).padStart(2, "0")}`;
    const ext = (await supportsAvif()) ? "avif" : "webp";
    const img = new Image();
    img.width = 1120; img.height = 630; img.decoding = "async";
    setBoth(img, "alt", ...pair("look.alt", { name: l.zh }, { name: l.en }));
    img.className = "hide";
    img.src = `assets/img/looks/${id}-lg.${ext}`;
    try { await img.decode(); } catch (e) { /* show it anyway */ }
    if (my !== seq) return;
    pic.append(img);
    requestAnimationFrame(() => {
      img.classList.remove("hide");
      const old = [...pic.querySelectorAll("img")].filter((x) => x !== img);
      setTimeout(() => old.forEach((x) => x.remove()), 400);
    });
  }
  const press = (id) => grid.querySelectorAll(".look").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.look === id)));

  grid.addEventListener("pointerover", (e) => {
    const b = e.target.closest(".look");
    if (!b || e.pointerType !== "mouse") return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => stage(b.dataset.look), 140);
  });
  grid.addEventListener("pointerleave", () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => stage(pinned), 220); });
  grid.addEventListener("click", (e) => {
    const b = e.target.closest(".look");
    if (!b) return;
    pinned = b.dataset.look;
    press(pinned);
    stage(pinned);
  });
  grid.addEventListener("focusin", (e) => { const b = e.target.closest(".look"); if (b) stage(b.dataset.look); });
  grid.addEventListener("focusout", (e) => { if (!grid.contains(e.relatedTarget)) stage(pinned); });

  // the stage starts with the static <img>; swap it for AVIF where it is smaller
  supportsAvif().then((ok) => {
    const first = document.getElementById("look-img");
    if (ok && first) {
      const io = new IntersectionObserver(([en], obs) => {
        if (!en.isIntersecting) return;
        obs.disconnect();
        if (shown === "cel") { shown = ""; stage("cel"); }
      }, { rootMargin: "200px" });
      io.observe(first);
    }
  });

  const filter = document.getElementById("looks-filter");
  filter.addEventListener("click", (e) => {
    const b = e.target.closest("[data-kind]");
    if (!b) return;
    const k = b.dataset.kind;
    filter.querySelectorAll("[data-kind]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    grid.querySelectorAll("li").forEach((li) => li.classList.toggle("gone", k !== "all" && !li.dataset.kinds.split(" ").includes(k)));
    const first = grid.querySelector("li:not(.gone) .look");
    if (first && byId[pinned] && k !== "all" && !byId[pinned].k.includes(k)) { pinned = first.dataset.look; press(pinned); stage(pinned); }
  });
}

export function initDeals() {
  const data = JSON.parse(document.getElementById("deals-data")?.textContent || "[]");
  const list = document.getElementById("hands");
  const btn = document.getElementById("deal-btn");
  if (!list || !data.length) return;
  const looks = Object.fromEntries(JSON.parse(document.getElementById("looks-data")?.textContent || "[]").map((l) => [l.id, l]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let n = 0;

  function render(i, animate) {
    const hands = data[i];
    list.innerHTML = hands.map((h, k) => {
      const l = looks[h.l] || { zh: h.l, en: h.l };
      const says = both(h.s.join(" · "), h.s.map((s) => pair(`says.${s}`)[1]).join(" · "));
      return `<li class="hand${k === 0 ? " first" : ""}" style="--i:${k}">
        <img src="assets/img/deal/d${i + 1}-h${k + 1}.webp" width="540" height="720" loading="${i === 0 ? "lazy" : "eager"}" decoding="async" alt="" >
        <b>${both(l.zh, l.en)}</b><span>${says}${k === 0 ? `<br>${both(...pair("deal.first"))}` : ""}</span></li>`;
    }).join("");
    list.querySelectorAll("img").forEach((img, k) => {
      const l = looks[hands[k].l] || { zh: hands[k].l, en: hands[k].l };
      setBoth(img, "alt", `第 ${k + 1} 手：「${l.zh}」风格的 3:4 封面`, `Hand ${k + 1}: a 3:4 cover in the ${l.en} look`);
    });
    if (animate && !reduce.matches) {
      list.classList.remove("dealing");
      void list.offsetWidth;
      list.classList.add("dealing");
    }
  }
  const preload = (i) => data[i].forEach((_, k) => { const im = new Image(); im.src = `assets/img/deal/d${i + 1}-h${k + 1}.webp`; });
  render(0, false);
  let preloaded = false;
  btn.addEventListener("click", () => {
    n = (n + 1) % data.length;
    render(n, true);
    preload((n + 1) % data.length);
  });
  btn.addEventListener("pointerenter", () => { if (!preloaded) { preloaded = true; preload(1); } }, { once: true });
  btn.addEventListener("focus", () => { if (!preloaded) { preloaded = true; preload(1); } }, { once: true });
}

/** Copy buttons: data-copy names the element whose text is copied. */
export function initCopy() {
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    const el = document.getElementById(b.dataset.copy);
    if (!el) return;
    const text = el.textContent.replace(/^\$ /gm, "");
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.append(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch (err2) { ok = false; }
      ta.remove();
    }
    if (!b.dataset.label) b.dataset.label = b.innerHTML;
    b.innerHTML = both(...pair(ok ? "copied" : "copyFail"));
    announce(...pair(ok ? "copied" : "copyFail"));
    clearTimeout(b._t);
    b._t = setTimeout(() => { b.innerHTML = b.dataset.label; }, 1600);
  });
}

/** Says something to screen readers (a polite live region at the end of the page). */
export function announce(zh, en) {
  let r = document.getElementById("sr-status");
  if (!r) {
    r = document.createElement("p");
    r.id = "sr-status"; r.className = "sr-only"; r.setAttribute("role", "status");
    document.body.append(r);
  }
  r.textContent = "";
  setTimeout(() => { r.textContent = document.documentElement.dataset.lang === "en" ? en : zh; }, 50);
}

/** The install tabs (ARIA tabs; arrow keys move between them). */
export function initTabs(os) {
  const box = document.getElementById("install-help");
  if (!box) return;
  const tabs = [...box.querySelectorAll("[role=tab]")];
  const select = (tab, focus) => {
    tabs.forEach((x) => {
      const on = x === tab;
      x.setAttribute("aria-selected", String(on));
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((x) => x.addEventListener("click", () => select(x)));
  box.querySelector("[role=tablist]").addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    let j = null;
    if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") j = (i + tabs.length - 1) % tabs.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = tabs.length - 1;
    if (j === null) return;
    e.preventDefault();
    select(tabs[j], true);
  });
  const start = { mac: "tab-mac", win: "tab-win", linux: "tab-linux" }[os] || "tab-mac";
  select(document.getElementById(start));
  // a link to a panel (the Mac chip hint) opens its tab
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#panel-"]');
    if (!a) return;
    const tab = tabs.find((x) => `#${x.getAttribute("aria-controls")}` === a.getAttribute("href"));
    if (tab) select(tab);
  });
}

export function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach((e) => e.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  els.forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.top < innerHeight) e.classList.add("in");   // already on screen: no fade, no flash
    io.observe(e);
  });
  document.documentElement.classList.add("anim");
}

/** data-since="0.5.0": a "coming soon" mark while the newest release is older than that. */
export function markSince(latest, cmp) {
  document.querySelectorAll("[data-since]").forEach((el) => {
    el.hidden = !!latest && cmp(latest, el.dataset.since) >= 0;
  });
}

export function initPhoneLink() {
  const b = document.getElementById("copy-link");
  if (!b) return;
  b.addEventListener("click", async () => {
    const url = location.origin + location.pathname + "#download";
    let ok = false;
    try { await navigator.clipboard.writeText(url); ok = true; } catch (e) { ok = false; }
    if (!b.dataset.label) b.dataset.label = b.innerHTML;
    b.innerHTML = both(...pair(ok ? "copied" : "copyFail"));
    announce(...pair(ok ? "copied" : "copyFail"));
    setTimeout(() => { b.innerHTML = b.dataset.label; }, 1800);
  });
}

export { applyLang, t };
