// The download buttons: the visitor's system (and, where the browser says, a Mac's chip) picks the primary
// button; every installer is listed below it; "国内镜像 / GitHub" switches where the links point.
import { DL_HOST, REPO } from "./config.js";
import { kindOf, mirrorUrl } from "./releases.js";
import { both, pair, fmtDate, fmtSize, applyLang, lang } from "./i18n.js";

const GROUPS = [["macOS", ["mac-arm", "mac-x64"]], ["Windows", ["win-setup", "win-msi"]], ["Linux", ["linux-appimage", "linux-deb", "linux-rpm"]]];
const CN_ZONES = /^Asia\/(Shanghai|Chongqing|Chungking|Harbin|Urumqi|Kashgar)$/;

/** { os: "mac" | "win" | "linux" | "mobile" | "unknown", arch: "arm" | "x86" | null } */
export async function detectSystem() {
  const nav = navigator, ua = nav.userAgent || "", uad = nav.userAgentData;
  const plat = (uad && uad.platform) || nav.platform || "";
  let os = "unknown", arch = null;
  if ((uad && uad.mobile) || /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(ua)) os = "mobile";
  else if (/mac/i.test(plat) || /Mac OS X|Macintosh/.test(ua)) os = nav.maxTouchPoints > 1 ? "mobile" : "mac";
  else if (/win/i.test(plat) || /Windows/.test(ua)) os = "win";
  else if (/linux|x11|cros|bsd/i.test(plat) || /Linux|X11|CrOS/.test(ua)) os = "linux";
  if (uad && typeof uad.getHighEntropyValues === "function" && os !== "mobile") {
    try {
      const h = await uad.getHighEntropyValues(["architecture"]);
      if (h && h.architecture) arch = /arm/i.test(h.architecture) ? "arm" : "x86";
    } catch (e) { /* not given */ }
  }
  return { os, arch };
}

const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14"/></svg>';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function createDownloads(els) {
  let sys = { os: "unknown", arch: null };
  let state = null;
  let source = null;

  const mirrorUsable = () => DL_HOST && state && state.mirror && state.mirror.ok !== false;
  const pickSource = () => {
    if (!DL_HOST) return "github";
    let s = null;
    try { s = localStorage.getItem("sc.source"); } catch (e) { /* blocked */ }
    if (s === "mirror" || s === "github") return s;
    let zone = "";
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* old browser */ }
    return CN_ZONES.test(zone) || /^zh-(CN|Hans)/i.test(navigator.language || "") ? "mirror" : "github";
  };

  const release = () => state && state.releases[0];
  const files = () => {
    const r = release();
    if (!r) return {};
    const out = {};
    for (const a of r.assets) {
      const k = kindOf(a.name);
      if (!k || out[k]) continue;
      const useMirror = source === "mirror" && mirrorUsable();
      out[k] = { ...a, kind: k, href: useMirror ? mirrorUrl(r.version, a.name) : a.url };
    }
    return out;
  };

  function button(f, { label, sub } = {}) {
    const [lz, le] = label || pair("dl.get", { os: "macOS" });
    const size = f.size ? ` · ${fmtSize(f.size)}` : "";
    return `<a class="btn" href="${esc(f.href)}" download data-kind="${f.kind}">${both(lz, le)}<small>${sub ? both(...sub) : ""}${size}</small></a>`;
  }
  const subFor = (k) => {
    const ext = { "mac-arm": ".dmg", "mac-x64": ".dmg", "win-setup": ".exe", "win-msi": ".msi", "linux-appimage": ".AppImage", "linux-deb": ".deb", "linux-rpm": ".rpm" }[k];
    if (k === "mac-arm") return [`Apple 芯片 · ${ext}`, `Apple silicon · ${ext}`];
    if (k === "mac-x64") return [`Intel · ${ext}`, `Intel · ${ext}`];
    return [ext, ext];
  };
  const getLabel = (os) => pair("dl.get", { os: { mac: "macOS", win: "Windows", linux: "Linux" }[os] });

  /** The primary buttons for this system (hero: one line of help at most). */
  function primary(compact) {
    const f = files();
    const r = release();
    const link = (k, key) => (f[k] ? `<a class="dl-alt-mac" href="${esc(f[k].href)}" download>${both(...pair(key))} →</a>` : "");
    const all = `<a class="dl-alt-mac" href="#files">${both(...pair("dl.all"))} ↓</a>`;
    if (!r) return null;
    switch (sys.os) {
      case "mac":
        if (sys.arch === "arm" && f["mac-arm"]) return button(f["mac-arm"], { label: getLabel("mac"), sub: subFor("mac-arm") }) + link("mac-x64", "dl.alsoIntel");
        if (sys.arch === "x86" && f["mac-x64"]) return button(f["mac-x64"], { label: getLabel("mac"), sub: subFor("mac-x64") }) + link("mac-arm", "dl.alsoArm");
        if (f["mac-arm"] && f["mac-x64"]) {
          const [wz, we] = pair("dl.whichMac");
          const two = button(f["mac-arm"], { label: pair("arch.arm"), sub: ["macOS · .dmg", "macOS · .dmg"] }) + button(f["mac-x64"], { label: pair("arch.x86"), sub: ["macOS · .dmg", "macOS · .dmg"] });
          return compact
            ? `${two}<a class="dl-alt-mac" href="#panel-mac">${both("不知道是哪种芯片？", "Not sure which chip?")} ↓</a>`
            : `${two}<p class="dl-hint" style="flex-basis:100%"><span data-l="zh">${wz}</span><span data-l="en" lang="en">${we}</span></p>`;
        }
        break;
      case "win":
        if (f["win-setup"]) return button(f["win-setup"], { label: getLabel("win"), sub: subFor("win-setup") }) + (compact ? "" : link("win-msi", "dl.alsoMsi")) + (sys.arch === "arm" ? `<span class="dl-alt-mac">${both(...pair("dl.armOnly"))}</span>` : "");
        break;
      case "linux":
        if (f["linux-appimage"]) return button(f["linux-appimage"], { label: getLabel("linux"), sub: subFor("linux-appimage") }) + (compact ? "" : `<a class="dl-alt-mac" href="#files">${both(...pair("dl.alsoLinux"))} ↓</a>`) + (sys.arch === "arm" ? `<span class="dl-alt-mac">${both(...pair("dl.armOnly"))}</span>` : "");
        break;
      default:
        break;
    }
    return `<a class="btn" href="#files">${both(...pair("dl.pick"))}<small>macOS · Windows · Linux</small></a>`;
  }

  function list() {
    const f = files();
    const r = release();
    if (!r || !Object.keys(f).length) return `<p class="note">${both(...pair("dl.fail"))} <a href="https://github.com/${REPO}/releases/latest" rel="noopener">GitHub Releases ↗</a></p>`;
    const here = { mac: sys.arch === "x86" ? "mac-x64" : sys.arch === "arm" ? "mac-arm" : null, win: "win-setup", linux: "linux-appimage" }[sys.os];
    return GROUPS.map(([name, kinds]) => {
      const rows = kinds.filter((k) => f[k]).map((k) => {
        const a = f[k];
        const rec = k === "win-setup" ? `<span class="rec">${both(...pair("dl.rec"))}</span>` : "";
        return `<li><a class="file${k === here ? " here" : ""}" href="${esc(a.href)}" download><b>${both(...pair(`f.${k}`))}${rec}</b><span class="mono">${esc(a.name)}</span><span class="size">${a.size ? fmtSize(a.size) : ""}${ICON}</span></a></li>`;
      }).join("");
      return rows ? `<div><h4>${name}</h4><ul role="list">${rows}</ul></div>` : "";
    }).join("");
  }

  function render() {
    const r = release();
    if (!r) {
      if (state && state.done) els.files.innerHTML = list();
      return;
    }
    const prim = primary(false);
    if (prim) {
      els.primary.innerHTML = `<div class="dl-buttons">${prim}</div>${files()[mainKind()] ? `<p class="dl-file mono">${esc(files()[mainKind()].name)}</p>` : ""}`
        + `<p class="dl-hint">${both(...pair("dl.meta", { v: r.version, date: fmtDate(r.date, "zh") }, { v: r.version, date: fmtDate(r.date, "en") }))} · <a href="#releases">${both(...pair("dl.whatsnew"))}</a></p>`;
    }
    const heroPrim = primary(true);
    if (heroPrim && els.hero) els.hero.innerHTML = `<div class="hero-dl">${heroPrim}</div>`;
    els.files.innerHTML = list();
    els.ver.innerHTML = `v${esc(r.version)}<small>${both(fmtDate(r.date, "zh"), fmtDate(r.date, "en"))}</small>`;
    if (els.badge) { els.badge.hidden = false; els.badge.textContent = `v${r.version}`; els.badge.setAttribute("aria-label", lang() === "en" ? `Version ${r.version}: what's new` : `${r.version} 版：更新了什么`); }
    // the mirror switch
    if (els.source) {
      els.source.hidden = !DL_HOST;
      els.source.querySelectorAll("[data-src]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.src === source)));
      const down = DL_HOST && state.mirror && state.mirror.ok === false;
      let note = els.source.querySelector(".mirror-down");
      if (down && !note) { note = document.createElement("span"); note.className = "mirror-down note"; els.source.append(note); }
      if (note) note.innerHTML = down ? both(...pair("dl.mirrorDown")) : "";
    }
    applyLang(els.root);
  }
  const mainKind = () => ({ mac: sys.arch === "x86" ? "mac-x64" : sys.arch === "arm" ? "mac-arm" : "", win: "win-setup", linux: "linux-appimage" }[sys.os] || "");

  return {
    async init() {
      source = pickSource();
      sys = await detectSystem();
      if (els.phone) els.phone.hidden = sys.os !== "mobile";
      if (els.source) {
        els.source.addEventListener("click", (e) => {
          const b = e.target.closest("[data-src]");
          if (!b) return;
          source = b.dataset.src;
          try { localStorage.setItem("sc.source", source); } catch (err) { /* blocked */ }
          render();
        });
      }
      render();
      return sys;
    },
    update(s) {
      state = s;
      if (DL_HOST && s.mirror && s.mirror.ok === false && source === "mirror") source = "github";
      render();
    },
    get system() { return sys; },
  };
}
