#!/usr/bin/env node
// Writes data/releases.json: the static copy of SmedCover's releases that the page falls back on when
// neither the mirror's latest.json nor GitHub's API can be reached.
//
//   node scripts/fetch-releases.mjs                 # Node 18 or newer (uses the built-in fetch)
//   GITHUB_TOKEN=… node scripts/fetch-releases.mjs   # optional: a token lifts GitHub's 60 requests/hour
//
// Drafts and prereleases are left out. Each release keeps only the files people download by hand
// (.dmg, -setup.exe, .msi, .AppImage, .deb, .rpm) — the same rule as assets/js/releases.js.
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = process.env.REPO || "cybertheye/smedcover";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "releases.json");
const HUMAN = /(\.dmg|-setup\.exe|\.msi|\.AppImage|\.deb|\.rpm)$/;

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": "smedcover-page", ...headers }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

const gh = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
if (process.env.GITHUB_TOKEN) gh.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const raw = await getJson(`https://api.github.com/repos/${REPO}/releases?per_page=50`, gh);
const releases = raw
  .filter((r) => !r.draft && !r.prerelease && r.published_at)
  .map((r) => ({
    tag: r.tag_name,
    version: r.tag_name.replace(/^v/, ""),
    name: r.name || r.tag_name,
    date: r.published_at,
    url: r.html_url,
    body: r.body || "",
    assets: r.assets
      .filter((a) => HUMAN.test(a.name))
      .map((a) => ({ name: a.name, size: a.size, url: a.browser_download_url })),
  }))
  .sort((a, b) => (a.date < b.date ? 1 : -1));

const out = { generated: new Date().toISOString(), repo: REPO, releases };
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`data/releases.json: ${releases.length} releases, newest ${releases[0]?.tag ?? "none"}`);
