// A small Markdown renderer for release notes: headings, paragraphs, nested lists, fenced code, tables,
// block quotes, rules, and inline code, emphasis and links. Everything is escaped first; only the tags made
// here come out, and links are kept only when they are http(s). Raw HTML in the notes is dropped, except
// <img>, which becomes a link to where the picture can be seen (GitHub's attachments don't load elsewhere).

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

const IMG = "\u0001IMG\u0001";
const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : null);

/** Inline Markdown in one block of text → HTML. opts.imgLink: { href, label } for pictures. */
export function inline(text, opts = {}) {
  const codes = [];
  let s = String(text)
    .replace(/<img\b[^>]*>/gi, IMG)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[a-z][^>]*>/gi, "");
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0002${codes.length - 1}\u0002`; });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (m, label, href) => {
    const u = safeUrl(href.replace(/&amp;/g, "&"));
    return u ? `<a href="${esc(u)}" rel="noopener">${label}</a>` : label;
  });
  s = s.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_, u) => `<a href="${u}" rel="noopener">${u}</a>`);
  s = s.replace(/\*\*([^*]+?)\*\*|__([^_]+?)__/g, (_, a, b) => `<strong>${a ?? b}</strong>`);
  s = s.replace(/(^|[^\w*])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^\w])_([^_\s][^_]*?)_(?!\w)/g, "$1<em>$2</em>");
  s = s.replace(/\u0002(\d+)\u0002/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
  if (s.includes(IMG)) {
    const l = opts.imgLink;
    s = s.split(IMG).join(l ? `<a class="img-link" href="${esc(l.href)}" rel="noopener">${esc(l.label)} ↗</a>` : "");
  }
  return s.trim();
}

const RE = {
  fence: /^ {0,3}(`{3,}|~{3,})\s*([\w-]*)/,
  heading: /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/,
  hr: /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/,
  quote: /^ {0,3}>\s?/,
  item: /^( {0,3})([-*+]|\d{1,9}[.)])(\s+|$)/,
  tableSep: /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/,
};
const indentOf = (l) => l.match(/^ */)[0].length;
const isBlank = (l) => !l.trim();
const startsBlock = (l, next) =>
  RE.fence.test(l) || RE.heading.test(l) || RE.hr.test(l) || RE.quote.test(l) || RE.item.test(l) ||
  (l.includes("|") && next !== undefined && RE.tableSep.test(next));

function cells(row) {
  return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

function blocks(lines, opts, tight = false) {
  let out = "";
  let i = 0;
  const n = lines.length;
  let paragraphs = 0;
  while (i < n) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }
    let m;
    if ((m = RE.fence.exec(line))) {
      const fence = m[1], ind = indentOf(line);
      const body = [];
      i++;
      while (i < n && !new RegExp(`^ {0,3}${fence[0]}{${fence.length},}\\s*$`).test(lines[i])) {
        body.push(lines[i].slice(Math.min(ind, indentOf(lines[i]))));
        i++;
      }
      i++;
      out += `<pre><code>${esc(body.join("\n"))}</code></pre>`;
      continue;
    }
    if ((m = RE.heading.exec(line))) {
      const lvl = Math.min(6, m[1].length + (opts.shift || 0));
      out += `<h${lvl}>${inline(m[2], opts)}</h${lvl}>`;
      i++;
      continue;
    }
    if (RE.hr.test(line)) { out += "<hr>"; i++; continue; }
    if (line.includes("|") && i + 1 < n && RE.tableSep.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      let rows = "";
      while (i < n && lines[i].includes("|") && !isBlank(lines[i])) {
        rows += `<tr>${cells(lines[i]).map((c) => `<td>${inline(c, opts)}</td>`).join("")}</tr>`;
        i++;
      }
      out += `<table><thead><tr>${head.map((c) => `<th>${inline(c, opts)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
      continue;
    }
    if (RE.quote.test(line)) {
      const body = [];
      while (i < n && !isBlank(lines[i]) && (RE.quote.test(lines[i]) || body.length)) {
        body.push(lines[i].replace(RE.quote, ""));
        i++;
      }
      out += `<blockquote>${blocks(body, opts)}</blockquote>`;
      continue;
    }
    if ((m = RE.item.exec(line))) {
      const ordered = /\d/.test(m[2]);
      const items = [];
      let loose = false;
      while (i < n) {
        const mm = RE.item.exec(lines[i]);
        if (!mm || /\d/.test(mm[2]) !== ordered) break;
        const content = mm[1].length + mm[2].length + Math.max(1, Math.min(mm[3].length, 4));
        const body = [lines[i].slice(content)];
        i++;
        while (i < n) {
          const l = lines[i];
          if (isBlank(l)) {
            let j = i + 1;
            while (j < n && isBlank(lines[j])) j++;
            if (j < n && indentOf(lines[j]) >= content) { body.push(""); i++; loose = true; continue; }
            break;
          }
          if (indentOf(l) >= content) { body.push(l.slice(content)); i++; continue; }
          if (RE.item.test(l) || startsBlock(l, lines[i + 1])) break;
          if (!isBlank(body[body.length - 1])) { body.push(l.trim()); i++; continue; }
          break;
        }
        items.push(body);
        let j = i;
        while (j < n && isBlank(lines[j])) j++;
        if (j > i && j < n && RE.item.test(lines[j]) && indentOf(lines[j]) <= 3) { loose = true; i = j; }
      }
      const tag = ordered ? "ol" : "ul";
      out += `<${tag}>${items.map((b) => `<li>${blocks(b, opts, !loose)}</li>`).join("")}</${tag}>`;
      continue;
    }
    const para = [];
    while (i < n && !isBlank(lines[i]) && !(para.length && startsBlock(lines[i], lines[i + 1]))) {
      para.push(lines[i].trim());
      i++;
    }
    const html = inline(para.join("\n"), opts);
    if (html) { out += tight && !paragraphs ? html : `<p>${html}</p>`; paragraphs++; }
  }
  return out;
}

/** Markdown → HTML. opts: { imgLink: {href, label}, shift: how many levels to push headings down }. */
export function markdown(src, opts = {}) {
  const lines = String(src || "").replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  return blocks(lines, opts);
}

/**
 * What a release's notes say up front: the first paragraph after the title (summary) and the items of its
 * "Highlights" list (each as Markdown), and the body without its first heading.
 */
export function parseNotes(src) {
  const text = String(src || "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length && (isBlank(lines[i]) || /^#\s/.test(lines[i]))) i++;
  const para = [];
  while (i < lines.length && !isBlank(lines[i]) && !/^#{1,6}\s/.test(lines[i])) { para.push(lines[i].trim()); i++; }
  const summary = para.join(" ").replace(/<img\b[^>]*>/gi, "").trim();
  const highlights = [];
  const h = lines.findIndex((l) => /^##\s+highlights?\b/i.test(l.trim()));
  if (h >= 0) {
    for (let k = h + 1; k < lines.length; k++) {
      const l = lines[k];
      if (/^#{1,6}\s/.test(l)) break;
      const m = /^[-*+]\s+(.*)$/.exec(l);
      if (m) highlights.push(m[1]);
      else if (highlights.length && /^\s{2,}\S/.test(l) && !/^\s*[-*+]\s/.test(l)) highlights[highlights.length - 1] += " " + l.trim();
    }
  }
  const body = text.replace(/^\s*#\s[^\n]*\n/, "");
  return { summary, highlights, body };
}
