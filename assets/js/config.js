// The page's settings — the only file to edit when hosting changes.

/**
 * The download mirror for mainland China, as a bare host name ("dl.example.com"), or "" for none.
 * When set, the page reads https://<DL_HOST>/latest.json (the Tauri updater manifest) and offers
 * "国内镜像 / GitHub" as the download source; installers are expected at
 * https://<DL_HOST>/v<version>/<the file name GitHub uses>.
 */
export const DL_HOST = "";

/** The GitHub repository the releases come from. */
export const REPO = "cybertheye/smedcover";

/** How long the GitHub API's answer is kept in the visitor's browser (unauthenticated: 60 requests an hour). */
export const CACHE_TTL = 60 * 60 * 1000;

/** How long to wait for latest.json or the GitHub API before falling back. */
export const FETCH_TIMEOUT = 8000;

/** The copy that ships with the page (scripts/fetch-releases.mjs writes it). */
export const STATIC_RELEASES = "data/releases.json";

/** Chinese summaries of the release notes, by tag. */
export const NOTES_ZH = "data/notes-zh.json";
