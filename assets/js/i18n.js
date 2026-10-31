// Language: the page's static copy is written in both languages (<span data-l="zh"> / <span data-l="en">) and
// CSS shows one; attributes that differ (alt, aria-label, a screenshot's src…) carry their English in
// data-en-<attr>; the strings the scripts write come from the table below.

const D = {
  zh: {
    "cap.16:9": "B站 / YouTube · 16:9",
    "cap.4:3": "B站 / 抖音 / 视频号 · 4:3",
    "cap.3:4": "抖音 / 小红书 / 视频号 · 3:4",
    "cap.9:16": "YouTube · 9:16",
    "cap.1:1": "公众号 · 1:1",
    "cap.2.35:1": "公众号 · 2.35:1",
    "reflow.pause": "暂停轮播",
    "reflow.play": "继续轮播",
    "picker.result": "要出 {n} 个尺寸：",
    "picker.none": "先选一个平台。",
    "kind.night": "夜景", "kind.illustration": "插画", "kind.poster": "海报", "kind.print": "印刷", "kind.experimental": "实验",
    "look.alt": "「{name}」风格的封面：雨夜东京漫步",
    "deal.first": "✓ 已放到画布",
    "deal.of": "第 {n} 次 / 共 {all} 次",
    "rel.latest": "最新",
    "rel.full": "完整更新说明（英文原文）",
    "rel.full.en": "完整更新说明",
    "rel.gh": "在 GitHub 上查看",
    "rel.img": "截图（在 GitHub 上看）",
    "rel.src.github": "数据来自 GitHub · {when}",
    "rel.src.static": "离线副本 · 生成于 {when}",
    "rel.src.mirror": "最新版本来自国内镜像",
    "rel.none": "暂时拿不到更新记录。可以直接去 GitHub Releases 查看。",
    "rel.upcoming": "这一版的说明还在 GitHub 上整理，先看镜像带来的简短说明。",
    "time.now": "刚刚更新",
    "time.min": "{n} 分钟前更新",
    "time.hour": "{n} 小时前更新",
    "dl.get": "下载 {os} 版",
    "dl.getShort": "下载",
    "dl.all": "其他系统和全部安装包",
    "dl.meta": "v{v} · {date} 发布",
    "dl.whatsnew": "这一版更新了什么",
    "dl.alsoIntel": "Intel 芯片的 Mac？下载 Intel 版",
    "dl.alsoArm": "Apple 芯片的 Mac？下载 Apple 芯片版",
    "dl.alsoMsi": "也有 .msi 安装包",
    "dl.alsoLinux": "也有 .deb 和 .rpm",
    "dl.whichMac": "<b>选哪个？</b>点屏幕左上角的 Apple 菜单 →「关于本机」：「芯片」一栏写着 Apple M1、M2……选 Apple 芯片；「处理器」写着 Intel 选 Intel。",
    "dl.armOnly": "目前只有 x64 版本。",
    "dl.pick": "选择你的系统",
    "dl.fail": "读不到安装包列表。可以直接去 GitHub Releases 下载。",
    "dl.noSize": "",
    "dl.rec": "推荐",
    "dl.mirrorDown": "国内镜像暂时连不上，已改用 GitHub。",
    "f.mac-arm": "Apple 芯片（M1、M2…）",
    "f.mac-x64": "Intel 芯片",
    "f.win-setup": "安装程序（.exe）",
    "f.win-msi": "MSI 安装包",
    "f.linux-appimage": "AppImage（免安装）",
    "f.linux-deb": "Debian / Ubuntu（.deb）",
    "f.linux-rpm": "Fedora 等（.rpm）",
    "os.mac": "macOS", "os.win": "Windows", "os.linux": "Linux",
    "arch.arm": "Apple 芯片", "arch.x86": "Intel",
    "copy": "复制", "copied": "已复制", "copyFail": "复制失败",
    "soon": "即将推出",
    "says.深底": "深底", "says.浅底": "浅底", "says.风格自己的字": "风格自己的字", "says.底边色带": "底边色带",
  },
  en: {
    "cap.16:9": "Bilibili / YouTube · 16:9",
    "cap.4:3": "Bilibili / Douyin / WeChat Channels · 4:3",
    "cap.3:4": "Douyin / RED / WeChat Channels · 3:4",
    "cap.9:16": "YouTube · 9:16",
    "cap.1:1": "WeChat article · 1:1",
    "cap.2.35:1": "WeChat article · 2.35:1",
    "reflow.pause": "Pause the slideshow",
    "reflow.play": "Play the slideshow",
    "picker.result": "{n} sizes to export: ",
    "picker.none": "Pick a platform first.",
    "kind.night": "Night", "kind.illustration": "Illustration", "kind.poster": "Poster", "kind.print": "Print", "kind.experimental": "Experimental",
    "look.alt": "The cover in the {name} look",
    "deal.first": "✓ On the canvas",
    "deal.of": "Deal {n} of {all}",
    "rel.latest": "Latest",
    "rel.full": "Full release notes",
    "rel.full.en": "Full release notes",
    "rel.gh": "View on GitHub",
    "rel.img": "Screenshot (on GitHub)",
    "rel.src.github": "From GitHub · {when}",
    "rel.src.static": "Offline copy · made {when}",
    "rel.src.mirror": "The newest version comes from the China mirror",
    "rel.none": "The release notes can't be reached right now. See GitHub Releases instead.",
    "rel.upcoming": "The notes for this version are still being written up on GitHub; here is the mirror's short note.",
    "time.now": "updated just now",
    "time.min": "updated {n} min ago",
    "time.hour": "updated {n} h ago",
    "dl.get": "Download for {os}",
    "dl.getShort": "Download",
    "dl.all": "Other systems and every installer",
    "dl.meta": "v{v} · released {date}",
    "dl.whatsnew": "What's new in this version",
    "dl.alsoIntel": "Mac with Intel? Get the Intel version",
    "dl.alsoArm": "Mac with Apple silicon? Get that version",
    "dl.alsoMsi": "There is an .msi as well",
    "dl.alsoLinux": "Also as .deb and .rpm",
    "dl.whichMac": "<b>Which one?</b> Apple menu → About This Mac: a <i>Chip</i> line reading Apple M1, M2… means Apple silicon; a <i>Processor</i> line reading Intel means Intel.",
    "dl.armOnly": "Only x64 builds for now.",
    "dl.pick": "Choose your system",
    "dl.fail": "The list of installers can't be reached. Download from GitHub Releases instead.",
    "dl.noSize": "",
    "dl.rec": "Recommended",
    "dl.mirrorDown": "The China mirror can't be reached right now; using GitHub.",
    "f.mac-arm": "Apple silicon (M1, M2…)",
    "f.mac-x64": "Intel",
    "f.win-setup": "Installer (.exe)",
    "f.win-msi": "MSI package",
    "f.linux-appimage": "AppImage (no install)",
    "f.linux-deb": "Debian / Ubuntu (.deb)",
    "f.linux-rpm": "Fedora and others (.rpm)",
    "os.mac": "macOS", "os.win": "Windows", "os.linux": "Linux",
    "arch.arm": "Apple silicon", "arch.x86": "Intel",
    "copy": "Copy", "copied": "Copied", "copyFail": "Couldn't copy",
    "soon": "Coming soon",
    "says.深底": "Dark", "says.浅底": "Light", "says.风格自己的字": "The look's own", "says.底边色带": "Band",
    "says.磨损": "Worn", "says.内阴影": "Inner shadow", "says.描边加投影": "Outline and shadow", "says.贴纸字": "Sticker",
    "says.剪报字": "Ransom note", "says.字内网点": "Halftone inside", "says.字内条纹": "Stripes inside", "says.逐行错位": "Row shift",
    "says.侧边色块": "Side panel", "says.细通栏": "Slim banner", "says.纯文字": "Plain",
  },
};

const root = document.documentElement;
export const lang = () => (root.dataset.lang === "en" ? "en" : "zh");

/** A string for the scripts, {name}s filled from vars; Chinese, then the key itself, when English has none. */
export function t(key, vars) {
  let s = D[lang()][key] ?? D.zh[key] ?? (key.startsWith("says.") ? key.slice(5) : key);
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
  return s;
}

const ATTRS = ["alt", "aria-label", "title", "content", "src", "srcset", "text"];
const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());

/** Puts every data-en-<attr> in place (or back), for the language now set. */
export function applyLang(scope = document) {
  const en = lang() === "en";
  for (const a of ATTRS) {
    const zhKey = "zh" + camel("-" + a);
    scope.querySelectorAll(`[data-en-${a}]`).forEach((el) => {
      const enVal = el.getAttribute(`data-en-${a}`);
      if (a === "text") {
        if (!(zhKey in el.dataset)) el.dataset[zhKey] = el.textContent;
        el.textContent = en ? enVal : el.dataset[zhKey];
        return;
      }
      if (!(zhKey in el.dataset)) el.dataset[zhKey] = el.getAttribute(a) ?? "";
      el.setAttribute(a, en ? enVal : el.dataset[zhKey]);
    });
  }
}

export function setLang(l) {
  root.dataset.lang = l === "en" ? "en" : "zh";
  root.lang = l === "en" ? "en" : "zh-CN";
  try { localStorage.setItem("sc.lang", root.dataset.lang); } catch (e) { /* private mode */ }
  try {
    const u = new URL(location.href);
    if (u.searchParams.has("lang")) { u.searchParams.delete("lang"); history.replaceState(null, "", u); }
  } catch (e) { /* file:// */ }
  applyLang();
  document.dispatchEvent(new CustomEvent("langchange"));
}

/** Both languages at once, for the spans the scripts write. */
export function both(zh, en) {
  const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  return `<span data-l="zh">${e(zh)}</span><span data-l="en" lang="en">${e(en)}</span>`;
}

/** The two languages' value of a key, for both(). */
export function pair(key, vars, varsEn = vars) {
  const fill = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? "")) : s);
  return [fill(D.zh[key] ?? key, vars), fill(D.en[key] ?? D.zh[key] ?? key, varsEn)];
}

export function fmtDate(iso, l = lang()) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  try {
    return new Intl.DateTimeFormat(l === "en" ? "en-US" : "zh-CN", { year: "numeric", month: l === "en" ? "short" : "long", day: "numeric" }).format(d);
  } catch (e) {
    return d.toISOString().slice(0, 10);
  }
}

export function fmtSize(bytes) {
  if (!bytes) return "";
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/** Sets an attribute that differs by language (kept in step with applyLang). */
export function setBoth(el, attr, zh, en) {
  el.setAttribute(`data-en-${attr}`, en);
  el.dataset["zh" + camel("-" + attr)] = zh;
  el.setAttribute(attr, lang() === "en" ? en : zh);
}
