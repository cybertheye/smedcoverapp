// Where the releases come from, in this order of trust for what is newest:
//   1. the mirror's latest.json (when DL_HOST is set) — the Tauri updater manifest;
//   2. GitHub's REST API, kept in localStorage for CACHE_TTL (an old copy is used when GitHub can't be reached);
//   3. data/releases.json, the copy that ships with the page.
// Each source that answers calls back with the merged state, so the page fills in from the fastest and
// corrects itself as the others arrive.
import { DL_HOST, REPO, CACHE_TTL, FETCH_TIMEOUT, STATIC_RELEASES, NOTES_ZH } from "./config.js";
import { markdown, parseNotes, inline } from "./markdown.js";
import { both, pair, fmtDate } from "./i18n.js";

/** The files people download by hand; updater archives, signatures and latest.json are left out. */
export const HUMAN = /(\.dmg|-setup\.exe|\.msi|\.AppImage|\.deb|\.rpm)$/;
const CACHE_KEY = "sc.releases.v1";

/** Which build a file is: "mac-arm", "mac-x64", "win-setup", "win-msi", "linux-appimage", "linux-deb", "linux-rpm". */
export function kindOf(name) {
  if (/_aarch64\.dmg$/.test(name)) return "mac-arm";
  if (/_x64\.dmg$/.test(name) || /_x86_64\.dmg$/.test(name)) return "mac-x64";
  if (/-setup\.exe$/.test(name)) return "win-setup";
  if (/\.msi$/.test(name)) return "win-msi";
  if (/\.AppImage$/.test(name)) return "linux-appimage";
  if (/\.deb$/.test(name)) return "linux-deb";
  if (/\.rpm$/.test(name)) return "linux-rpm";
  return null;
}

/** The installers a version is expected to have, by the names the build gives them (for a version only the mirror knows). */
export function expectedAssets(v) {
  return [
    `SmedCover_${v}_aarch64.dmg`, `SmedCover_${v}_x64.dmg`, `SmedCover_${v}_x64-setup.exe`, `SmedCover_${v}_x64_en-US.msi`,
    `SmedCover_${v}_amd64.AppImage`, `SmedCover_${v}_amd64.deb`, `SmedCover-${v}-1.x86_64.rpm`,
  ].map((name) => ({ name, size: null, url: `https://github.com/${REPO}/releases/download/v${v}/${name}` }));
}

/** The mirror's base URL: DL_HOST as a host name ("dl.example.com" → https://dl.example.com), or a full origin as given. */
export const mirrorBase = () => (/^https?:\/\//.test(DL_HOST) ? DL_HOST : `https://${DL_HOST}`).replace(/\/+$/, "");
export const mirrorUrl = (version, name) => `${mirrorBase()}/v${version}/${encodeURIComponent(name)}`;

/** "0.10.2" > "0.9.9" */
export function cmpVersion(a, b) {
  const pa = String(a).replace(/^v/, "").split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  const pb = String(b).replace(/^v/, "").split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

async function getJson(url) {
  const ctl = typeof AbortController === "function" ? new AbortController() : null;
  const timer = ctl && setTimeout(() => ctl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctl && ctl.signal, cache: "no-cache" });
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return await res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function fromGithub(list) {
  return (Array.isArray(list) ? list : [])
    .filter((r) => r && !r.draft && !r.prerelease && r.published_at)
    .map((r) => ({
      tag: r.tag_name, version: String(r.tag_name).replace(/^v/, ""), name: r.name || r.tag_name, date: r.published_at,
      url: r.html_url, body: r.body || "",
      assets: (r.assets || []).filter((a) => HUMAN.test(a.name)).map((a) => ({ name: a.name, size: a.size, url: a.browser_download_url })),
    }));
}
const sorted = (list) => list.slice().sort((a, b) => cmpVersion(b.version, a.version));

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return c && Array.isArray(c.releases) ? c : null;
  } catch (e) { return null; }
}
function writeCache(releases) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), releases })); } catch (e) { /* full or blocked */ }
}

/** latest.json's notes: plain text, or a JSON string {"zh-CN": …, "en": …}. */
export function mirrorNotes(notes) {
  if (!notes) return null;
  if (typeof notes === "object") return { zh: notes["zh-CN"] || notes.zh || notes.en || "", en: notes.en || notes["zh-CN"] || "" };
  const s = String(notes).trim();
  if (s.startsWith("{")) {
    try { return mirrorNotes(JSON.parse(s)); } catch (e) { /* plain text after all */ }
  }
  return { zh: s, en: s };
}

/**
 * Loads everything; onChange(state) is called whenever a source answers. state: {
 *   releases: [{tag, version, date, url, body, assets, notesZh?, mirror?}], newest first,
 *   origin: "github" | "cache" | "static" | null, fetchedAt, mirror: {ok, version, notes, platforms} | null, done
 * }
 */
export function loadReleases(onChange) {
  const got = { github: null, cache: readCache(), static: null, notesZh: {}, mirror: null };
  const pending = new Set(["static", "notes", "github", ...(DL_HOST ? ["mirror"] : [])]);

  const emit = () => {
    let list = null, origin = null, fetchedAt = null;
    const candidates = [
      got.github && { list: got.github, origin: "github", at: Date.now() },
      got.cache && { list: got.cache.releases, origin: "cache", at: got.cache.t },
      got.static && { list: got.static.releases, origin: "static", at: Date.parse(got.static.generated) },
    ].filter((c) => c && c.list && c.list.length);
    // the source with the newest version wins; on a tie the earlier (fresher) one
    for (const c of candidates) {
      if (!list || cmpVersion(sorted(c.list)[0].version, list[0].version) > 0) { list = sorted(c.list); origin = c.origin; fetchedAt = c.at; }
    }
    list = (list || []).map((r) => ({ ...r, notesZh: got.notesZh[r.tag] || null }));
    let mirror = null;
    if (DL_HOST) {
      const m = got.mirror;
      mirror = m && m.version ? { ok: true, version: String(m.version).replace(/^v/, ""), notes: mirrorNotes(m.notes), date: m.pub_date, platforms: m.platforms || {} }
        : { ok: m === null ? null : false };
      if (mirror.ok) {
        const top = list[0];
        if (!top || cmpVersion(mirror.version, top.version) > 0) {
          list.unshift({ tag: `v${mirror.version}`, version: mirror.version, date: mirror.date, url: `https://github.com/${REPO}/releases/tag/v${mirror.version}`,
            body: "", assets: expectedAssets(mirror.version), notesZh: got.notesZh[`v${mirror.version}`] || null, fromMirror: true });
        }
        const same = list.find((r) => r.version === mirror.version);
        if (same && mirror.notes) same.mirrorNotes = mirror.notes;
      }
    }
    onChange({ releases: list, origin, fetchedAt, mirror, done: pending.size === 0 });
  };
  const finish = (k) => { pending.delete(k); emit(); };

  getJson(STATIC_RELEASES).then((d) => { got.static = d; }).catch(() => {}).finally(() => finish("static"));
  getJson(NOTES_ZH).then((d) => { got.notesZh = d || {}; }).catch(() => {}).finally(() => finish("notes"));
  if (DL_HOST) getJson(`${mirrorBase()}/latest.json`).then((d) => { got.mirror = d; }).catch(() => { got.mirror = false; }).finally(() => finish("mirror"));

  const fresh = got.cache && Date.now() - got.cache.t < CACHE_TTL;
  if (fresh) finish("github");
  else {
    getJson(`https://api.github.com/repos/${REPO}/releases?per_page=30`)
      .then((d) => { const r = fromGithub(d); if (r.length) { got.github = r; writeCache(r); } })
      .catch(() => {})
      .finally(() => finish("github"));
  }
}

/* ---------- rendering the release list ---------- */

const ago = (ms) => {
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 2) return pair("time.now");
  if (m < 60) return pair("time.min", { n: m });
  return pair("time.hour", { n: Math.round(m / 60) });
};

function sourceLine(state) {
  if (!state.origin) return "";
  let s;
  if (state.origin === "static") {
    const iso = state.fetchedAt ? new Date(state.fetchedAt).toISOString() : "";
    s = both(...pair("rel.src.static", { when: fmtDate(iso, "zh") }, { when: fmtDate(iso, "en") }));
  } else {
    const [az, ae] = ago(state.fetchedAt || Date.now());
    s = both(...pair("rel.src.github", { when: az }, { when: ae }));
  }
  if (state.releases[0] && state.releases[0].fromMirror) s += " · " + both(...pair("rel.src.mirror"));
  return s;
}

function li(items) { return items.map((h) => `<li>${h}</li>`).join(""); }

function releaseCard(r, i) {
  const notes = parseNotes(r.body);
  const imgLinkZh = { href: r.url, label: pair("rel.img")[0] };
  const imgLinkEn = { href: r.url, label: pair("rel.img")[1] };
  const sumEn = notes.summary ? inline(notes.summary, { imgLink: imgLinkEn }) : (r.mirrorNotes ? inline(r.mirrorNotes.en) : "");
  const sumZh = r.notesZh && r.notesZh.summary ? inline(r.notesZh.summary) : (r.mirrorNotes ? inline(r.mirrorNotes.zh) : sumEn);
  const hlEn = notes.highlights.map((h) => inline(h));
  const hlZh = r.notesZh && r.notesZh.highlights ? r.notesZh.highlights.map((h) => inline(h)) : hlEn;
  const latest = i === 0;
  const dateZh = fmtDate(r.date, "zh"), dateEn = fmtDate(r.date, "en");
  const full = notes.body.trim()
    ? `<details><summary>${both(...pair("rel.full"))}</summary>
         <div class="md" lang="en">${markdown(notes.body, { imgLink: imgLinkEn, shift: 0 }).replace(/<h1>/g, "<h2>").replace(/<\/h1>/g, "</h2>")}</div></details>`
    : "";
  const hl = latest && (hlZh.length || hlEn.length)
    ? `<ul class="rel-hl" data-l="zh">${li(hlZh)}</ul><ul class="rel-hl" data-l="en" lang="en">${li(hlEn)}</ul>`
    : "";
  return `<article class="rel${latest ? " latest" : ""}" aria-labelledby="rel-${r.version.replace(/\W/g, "-")}">
    <div class="rel-head">
      <h3 class="rel-ver" id="rel-${r.version.replace(/\W/g, "-")}">v${r.version}</h3>
      ${latest ? `<span class="rel-badge">${both("最新", "LATEST")}</span>` : ""}
      ${r.date ? `<time datetime="${r.date}">${both(dateZh, dateEn)}</time>` : ""}
    </div>
    ${sumZh || sumEn ? `<p class="rel-sum" data-l="zh">${sumZh}</p><p class="rel-sum" data-l="en" lang="en">${sumEn}</p>` : ""}
    ${hl}
    ${full}
    <p class="rel-actions"><a href="${r.url}" rel="noopener">${both(...pair("rel.gh"))} ↗</a>${latest ? ` <a href="#download">${both("下载这一版", "Download this version")}</a>` : ""}</p>
  </article>`;
}

const shown = new WeakMap();
export function renderReleases(state, listEl, sourceEl) {
  if (!state.releases.length) {
    if (state.done) listEl.innerHTML = `<p class="rel-empty">${both(...pair("rel.none"))} <a href="https://github.com/${REPO}/releases" rel="noopener">GitHub Releases ↗</a></p>`;
    return;
  }
  const html = state.releases.map(releaseCard).join("");
  if (shown.get(listEl) !== html) {
    const open = [...listEl.querySelectorAll("details[open]")].map((d) => d.closest(".rel").querySelector(".rel-ver").textContent);
    listEl.innerHTML = html;
    shown.set(listEl, html);
    listEl.querySelectorAll("details").forEach((d) => { if (open.includes(d.closest(".rel").querySelector(".rel-ver").textContent)) d.open = true; });
  }
  if (sourceEl) sourceEl.innerHTML = sourceLine(state);
}
