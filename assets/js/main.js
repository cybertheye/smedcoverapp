// Starts the page: language and theme switches, the hero, the showcase, the releases and the downloads.
import { setLang, lang, applyLang } from "./i18n.js";
import { initHero } from "./hero.js";
import { initPicker, initLooks, initDeals, initCopy, initTabs, initReveal, markSince, initPhoneLink } from "./showcase.js";
import { loadReleases, renderReleases, cmpVersion } from "./releases.js";
import { createDownloads } from "./download.js";

const root = document.documentElement;

/* ---------- language ---------- */
applyLang();
document.getElementById("lang-btn")?.addEventListener("click", () => setLang(lang() === "en" ? "zh" : "en"));

/* ---------- theme ---------- */
const metaTheme = [...document.querySelectorAll('meta[name="theme-color"]')];
const effectiveTheme = () => root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
const paintThemeColor = () => {
  if (!root.dataset.theme) return;
  const c = getComputedStyle(root).getPropertyValue("--bg").trim() || "#0b0b11";
  metaTheme.forEach((m) => { m.removeAttribute("media"); m.setAttribute("content", c); });
};
paintThemeColor();
document.getElementById("theme-btn")?.addEventListener("click", () => {
  root.dataset.theme = effectiveTheme() === "dark" ? "light" : "dark";
  try { localStorage.setItem("sc.theme", root.dataset.theme); } catch (e) { /* private mode */ }
  paintThemeColor();
});

/* ---------- the page ---------- */
initHero();
initPicker();
initLooks();
initDeals();
initCopy();
initReveal();
initPhoneLink();

const downloads = createDownloads({
  root: document.getElementById("download"),
  primary: document.getElementById("dl-primary"),
  files: document.getElementById("files"),
  ver: document.getElementById("dl-ver"),
  source: document.getElementById("source"),
  phone: document.getElementById("dl-phone"),
  hero: document.getElementById("hero-dl"),
  badge: document.getElementById("ver-badge"),
});

const relList = document.getElementById("rel-list");
const relSource = document.getElementById("rel-source");
let last = null;
downloads.init().then((sys) => {
  initTabs(sys.os);
  if (last) downloads.update(last);
});
loadReleases((state) => {
  last = state;
  renderReleases(state, relList, relSource);
  downloads.update(state);
  markSince(state.releases[0] && state.releases[0].version, cmpVersion);
  applyLang(relList);
});

/* ---------- the nav marks the part of the page in view ---------- */
const links = Object.fromEntries([...document.querySelectorAll(".nav a")].map((a) => [a.getAttribute("href").slice(1), a]));
const navFor = (id) => (id === "releases" || id === "download" ? id : "show");
if ("IntersectionObserver" in window) {
  const seen = new Set();
  const sections = [...document.querySelectorAll("main > section[id]")].filter((s) => s.id !== "top");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id)));
    const ids = sections.map((s) => s.id).filter((id) => seen.has(id));
    Object.values(links).forEach((a) => a.removeAttribute("aria-current"));
    if (ids.length) links[navFor(ids[ids.length - 1])]?.setAttribute("aria-current", "true");
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => io.observe(s));
}
