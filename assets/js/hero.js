// The hero: one cover, reflowing through every size the platforms ask for. The frame eases from one ratio to
// the next while that size's real export fades in (cropped by the frame until it gets there). It moves on by
// itself only while it is on screen, the tab is visible, nobody is pointing at or tabbing through it, and
// the visitor hasn't asked for less motion; the pause button and the size buttons hand control over.
import { both, pair, setBoth } from "./i18n.js";

const RATIO = { "16:9": 16 / 9, "4:3": 4 / 3, "1:1": 1, "3:4": 3 / 4, "9:16": 9 / 16, "2.35:1": 2.35 };
const PX = { "16:9": "1920×1080", "4:3": "1600×1200", "1:1": "1200×1200", "3:4": "1200×1600", "9:16": "1080×1920", "2.35:1": "900×383" };
const ORDER = ["16:9", "4:3", "1:1", "3:4", "9:16", "2.35:1"];
const STEP = 2600;

function load(pic) {
  const img = pic.querySelector("img");
  if (img.dataset.src) {
    const src = pic.querySelector("source[data-srcset]");
    if (src) { src.srcset = src.dataset.srcset; src.removeAttribute("data-srcset"); }
    if (img.dataset.srcset) { img.srcset = img.dataset.srcset; img.removeAttribute("data-srcset"); }
    img.src = img.dataset.src;
    img.removeAttribute("data-src");
  }
  if (img.complete && img.naturalWidth) return Promise.resolve();
  return new Promise((ok) => { img.addEventListener("load", ok, { once: true }); img.addEventListener("error", ok, { once: true }); });
}

export function initHero() {
  const root = document.getElementById("reflow");
  if (!root) return;
  const stage = document.getElementById("stage");
  const frame = document.getElementById("frame");
  const pics = Object.fromEntries([...frame.querySelectorAll("picture")].map((p) => [p.dataset.ratio, p]));
  const buttons = [...root.querySelectorAll(".strip [data-ratio]")];
  const caption = document.getElementById("reflow-caption");
  const big = document.getElementById("ratio-big");
  const play = document.getElementById("reflow-play");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  let current = "16:9";
  let userPaused = reduce.matches;
  let hovering = false, focused = false, visible = true;
  let timer = 0;
  let seq = 0;

  function fit(r) {
    const w = stage.clientWidth - 36, h = stage.clientHeight - 36;
    const ratio = RATIO[r];
    let fw = Math.min(w, 620), fh = fw / ratio;
    if (fh > h) { fh = h; fw = fh * ratio; }
    frame.style.width = `${Math.round(fw)}px`;
    frame.style.height = `${Math.round(fh)}px`;
  }

  async function show(r, announce) {
    current = r;
    const my = ++seq;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.ratio === r)));
    fit(r);
    big.textContent = r;
    caption.innerHTML = `${both(...pair(`cap.${r}`))}<span class="mono">${PX[r]}</span>`;
    caption.setAttribute("aria-live", announce ? "polite" : "off");
    await load(pics[r]);
    if (my !== seq) return;
    for (const [k, p] of Object.entries(pics)) {
      const img = p.querySelector("img");
      img.classList.toggle("on", k === r);
      img.setAttribute("aria-hidden", String(k !== r));
    }
  }

  const running = () => !userPaused && !hovering && !focused && visible && !document.hidden;
  function schedule() {
    clearTimeout(timer);
    if (!running()) return;
    timer = setTimeout(() => {
      if (!running()) return;
      show(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length], false).then(schedule);
    }, STEP);
  }

  function setPaused(p) {
    userPaused = p;
    play.setAttribute("aria-pressed", String(p));
    setBoth(play, "aria-label", ...pair(p ? "reflow.play" : "reflow.pause"));
    schedule();
  }

  buttons.forEach((b) => b.addEventListener("click", () => { setPaused(true); show(b.dataset.ratio, true); }));
  play.addEventListener("click", () => setPaused(!userPaused));
  root.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hovering = true; clearTimeout(timer); } });
  root.addEventListener("pointerleave", () => { hovering = false; schedule(); });
  root.addEventListener("focusin", () => { focused = true; clearTimeout(timer); });
  root.addEventListener("focusout", (e) => { if (!root.contains(e.relatedTarget)) { focused = false; schedule(); } });
  document.addEventListener("visibilitychange", schedule);
  
  reduce.addEventListener?.("change", () => setPaused(reduce.matches || userPaused));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: 0.25 }).observe(root);
  }
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => { frame.style.transition = "none"; fit(current); frame.offsetWidth; frame.style.transition = ""; }).observe(stage);
  }

  frame.style.transition = "none";
  fit(current);
  frame.offsetWidth;
  frame.style.transition = "";
  setPaused(userPaused);

  // the other five sizes, once the page itself has loaded
  const rest = () => ORDER.slice(1).forEach((r) => load(pics[r]));
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
  if (document.readyState === "complete") idle(rest);
  else window.addEventListener("load", () => idle(rest), { once: true });
}
