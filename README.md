# SmedCover 项目主页

[SmedCover](https://github.com/cybertheye/smedcover) 的官网：**发布**（每一版改了什么）、**展示**（它做出来的封面和怎么做）、**下载**（按系统给出对的安装包）。中文为主，右上角切换英文；深色、浅色两套主题。

纯静态文件，没有构建步骤，也不依赖任何外部脚本、字体或 CDN：nginx、GitHub Pages、任何静态托管都能直接放。

## 设计思路

整页按 SmedCover 的默认风格「赛璐珞」来排，像一张用它做出来的封面：网格底、斜切的频道色色块和白色分界线、带硬投影的粗标题、每段开头一个 `EP.01` 式的角标、图片四角的裁切线；颜色取自应用本身（`#0b0b11`、`#fcee0a`）和图标上的五条色带。

首屏是产品最核心的承诺：同一张封面在 16:9 → 4:3 → 1:1 → 3:4 → 9:16 → 2.35:1 之间自己变形，每个尺寸都是 SmedCover 真实导出的图。页面上所有封面都由 SmedCover 自己的渲染器画出（见下面「图片从哪里来」），界面截图来自应用本身；没有伪造的界面。

## 本地预览

```bash
cd smedcover-page
python3 -m http.server 8000     # 或者 npx serve .
# 打开 http://localhost:8000/
```

页面用了 ES module 和 `fetch`，直接双击打开 `index.html`（`file://`）不行，要经过一个本地 HTTP 服务。`?lang=en` / `?lang=zh` 可以直接指定语言。

## 目录

```
index.html                 整页（中英文都在里面，CSS 只显示当前语言那一份）
assets/css/site.css        全部样式
assets/js/
  config.js                ← 唯一需要改的配置：DL_HOST 等
  main.js                  入口：语言、主题、各部分初始化
  i18n.js                  脚本里用到的中英文字符串、日期和大小格式
  releases.js              发布数据：镜像 latest.json → GitHub API → 静态副本
  download.js              识别系统和芯片，生成下载按钮、全部安装包列表、镜像切换
  markdown.js              发布说明的 Markdown 渲染（全部转义，只输出自己生成的标签）
  hero.js                  首屏的变形封面
  showcase.js              平台选择、风格墙、你看着办、复制按钮、安装说明标签页
assets/fonts/              Bebas Neue、JetBrains Mono 的拉丁子集（WOFF2，共约 23 KB，OFL 许可）
assets/img/                封面渲染图和截图（WebP，大图另有 AVIF）
assets/icons/, assets/og/  图标、Open Graph 分享图
data/releases.json         发布数据的静态副本（脚本生成，提交进仓库）
data/notes-zh.json         各版本更新说明的中文摘要（手写）
scripts/fetch-releases.mjs 重新生成 data/releases.json
scripts/encode-images.sh   把原始 PNG 渲染图转成页面用的 WebP/AVIF
scripts/capture/           生成封面渲染图、OG 图用的脚本
nginx/smedcover-page.conf  nginx 配置示例
```

## 配置：`assets/js/config.js`

| 常量 | 说明 |
|---|---|
| `DL_HOST` | 国内下载镜像的域名（如 `dl.example.com`，也可以写完整的 `https://…:端口`）。**留空 = 没有镜像**：下载按钮全部指向 GitHub，「国内镜像 / GitHub」切换不显示。 |
| `REPO` | 发布来自哪个 GitHub 仓库，默认 `cybertheye/smedcover`。 |
| `CACHE_TTL` | GitHub API 的结果在访客浏览器里缓存多久（默认 1 小时；未登录的 API 每小时 60 次）。 |
| `FETCH_TIMEOUT` | 等 latest.json / GitHub API 多久就放弃，改用下一个来源（默认 8 秒）。 |

### 设好 `DL_HOST` 以后，镜像上需要有

- `https://<DL_HOST>/latest.json`：Tauri updater 的清单 `{version, notes, pub_date, platforms}`。`notes` 可以是纯文本，也可以是 JSON 字符串 `{"zh-CN": "...", "en": "..."}`，页面按语言取。
- `https://<DL_HOST>/v<版本>/<和 GitHub 上一模一样的文件名>`，例如 `v0.6.0/SmedCover_0.6.0_aarch64.dmg`、`v0.6.0/SmedCover_0.6.0_x64-setup.exe`、`v0.6.0/SmedCover-0.6.0-1.x86_64.rpm`。
- **latest.json 必须带 `Access-Control-Allow-Origin` 响应头**（页面从另一个域名读它）；`nginx/smedcover-page.conf` 末尾有镜像的示例配置。
- 记得把镜像域名加进页面 CSP 的 `connect-src`（同一个文件里）。

从 latest.json 和 GitHub 拿到的版本号、日期和链接都会先校验（版本号只接受 `0.6.0`、`1.2.3-beta.1` 这样的格式，链接只接受 https），再写进页面。

默认下载源：访客在中国大陆时区（或浏览器语言是 zh-CN）时默认「国内镜像」，否则 GitHub；访客自己切换后会记住。latest.json 读不到时自动退回 GitHub，并提示一句。

## 发布数据怎么来、怎么更新

页面同时问三个来源，谁先到先显示，后到的更新时再纠正：

1. **镜像的 `latest.json`**（设了 `DL_HOST` 时）。下载源选「国内镜像」时，下载的就是它写的那个版本（链接只在 latest.json 读到之后才指向镜像，之前先用 GitHub 的）。它比 GitHub 上的新时（镜像先上线），更新记录最上面会多出这一版，安装包按命名规则推出来（没有文件大小）；选 GitHub 的访客仍然拿到 GitHub 上最新、带安装包的那一版，不会被指到 GitHub 上还不存在的文件。
2. **GitHub REST API** `GET /repos/cybertheye/smedcover/releases`（不带令牌），跳过草稿和预发布版本，在访客浏览器的 localStorage 里缓存 `CACHE_TTL`；GitHub 连不上或被限流时，用之前缓存的旧数据。
3. **`data/releases.json`**：随页面一起发布的静态副本。前两个都失败时（比如在国内连不上 GitHub、或者 API 被限流），更新记录和下载按钮照样能用。

页面只给人看 `.dmg`、`-setup.exe`、`.msi`、`.AppImage`、`.deb`、`.rpm`；`.app.tar.gz`、`.sig`、`latest.json` 这些更新器用的文件不显示。

**每次发新版以后：**

```bash
node scripts/fetch-releases.mjs            # Node 18+；有 GITHUB_TOKEN 环境变量时用它，避开限流
git add data/releases.json && git commit -m "releases: v0.6.0"
```

然后在 `data/notes-zh.json` 里加这一版的中文摘要（`summary` 一段、`highlights` 几条，Markdown）。没有中文摘要的版本，中文页面显示英文原文；完整的英文更新说明始终可以在「完整更新说明」里展开。发布说明里的截图（GitHub 的 user-attachments 只在 GitHub 页面上能加载）显示为「截图（在 GitHub 上看）」链接。

也可以把 `fetch-releases.mjs` 放进定时任务或 GitHub Actions，在发布后自动更新静态副本。

「命令行」卡片上的「即将推出」标记（`data-since="0.5.0"`）会在最新版本达到 0.5.0 以后自动消失。

## 部署

- **nginx**：见 `nginx/smedcover-page.conf`。要点：gzip（有 ngx_brotli 就加 brotli）；HTML、CSS、JS、`data/*.json` 用 `Cache-Control: no-cache`（每次用 ETag 校验，没变就是 304）；图片和字体缓存 30 天。文件名没有内容哈希，所以**替换图片时请换个文件名**，或者把图片的缓存时间调短。配置里还有一条 CSP，其中 `<head>` 里那段内联脚本按哈希放行：改了这段脚本，就用下面的命令重算哈希替换进去。

  ```bash
  python3 -c "import re,hashlib,base64;s=open('index.html').read();m=re.search(r'<script>(.*?)</script>',s,re.S);print(base64.b64encode(hashlib.sha256(m.group(1).encode()).digest()).decode())"
  ```

- **GitHub Pages**：直接发布仓库根目录即可（已放 `.nojekyll`）；主页的路径都是相对路径，放在子路径下也能用。`404.html` 用的是从根开始的路径（`/assets/…`），只有放在域名根下时样式才完整。
- 域名定下来以后：在 `index.html` 的 `<head>` 里加 `<link rel="canonical">`，把 `og:image` 改成完整网址（微信、微博等抓取分享图需要绝对地址），并加上 `og:url`。

## 图片从哪里来

SmedCover 的界面（`ui/`）可以直接在浏览器里跑（`HOST` 为 browser），并且在页面上留了给 agent 用的开发钩子 `globalThis.smedcoverAgent`。本页的图都是这样做出来的：

1. 在 SmedCover 仓库外起一个静态服务指向它的 `ui/` 目录，用浏览器打开，在欢迎页选「中文」→「载入完整示例」（虚构品牌 Pixel Harbor，五个频道）。
2. 起接收服务：`python3 scripts/capture/receive.py 8732 /某个临时目录/renders`。
3. 在页面里依次执行 `scripts/capture/helpers.js`、`render-covers.js`（首屏六个尺寸、35 种风格、文字效果和变形、五个频道）、`deal-hands.js`（「你看着办」抽三次、每次六手）。频道 1 的主色设成了 `#fcee0a`，并打开了频道图形。
4. 界面截图：1600×1000 视口、2 倍像素，在应用里切到要的面板截图（中英文各一张）。
5. `scripts/encode-images.sh /临时目录/renders /临时目录/shots /发布说明截图目录` 生成 `assets/img/`。
6. OG 图：本地预览起在 8740 端口时打开 `scripts/capture/og.html`，1200×630 截图，存成 `assets/og/og.jpg`。

浏览器里跑的渲染器和桌面版是同一套代码，但有几样只有桌面版有：改字形轮廓的文字效果（立体挤出、刺边、撕边……）、抠图、AI 功能。所以这些没有出现在渲染图里。

### 现在的占位和建议补拍的图

页面上**没有**占位图，所有图都是真实的；下面两处用的是 GitHub 发布说明里的截图，建议换成桌面版的新截图：

| 位置 | 现在 | 建议补拍 |
|---|---|---|
| EP.05 照片 | v0.3.1 发布说明截图里裁出的画布（抠出的人物和标题穿插，界面是旧版的） | 桌面版：一张有人物的照片，「抠出主体」后和标题穿插（自动或逐字），16:9 画布，1600×1000 视口 2 倍截图；中英文界面各一张更好 |
| EP.07 Agent | v0.4.0 发布说明里的「设置 → Agent 接入」截图（中文界面） | 桌面版同一页的英文界面截图；或者一张 Claude Code 终端和 SmedCover 窗口并排、agent 正在改封面（顶栏亮着 agent 的灯）的截图 |

「安装遇到提示？」里的说明（macOS 的「仍要打开」和 `xattr`、Windows SmartScreen、Linux 的安装命令、「安装包还没有代码签名」）是通用的系统操作，SmedCover 自己的文档里还没有这一节；代码里确实没有配置 macOS 签名/公证和 Windows 证书。以后签了名，记得把这一段和页面上的「为什么会被拦」一起改掉。

另外可以考虑：一张「抠图 + 照片铺满画布」的封面放进风格墙（很多风格会把照片画成自己的样子，比现在只有频道图形更好看），以及桌面版里立体挤出、融化等轮廓类文字效果的渲染。

## 许可

页面代码的许可还没定（仓库里没有放 LICENSE），由你决定，比如和 SmedCover 一样用 AGPL-3.0-or-later。字体 Bebas Neue、JetBrains Mono 采用 SIL Open Font License（`assets/fonts/OFL-*.txt`）。封面渲染图里的频道图形和贴纸来自 SmedCover 的内置素材（CC BY 4.0）。
