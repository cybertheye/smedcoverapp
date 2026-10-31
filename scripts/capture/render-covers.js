// Every render the page uses except Surprise me: the hero cover at six sizes, the same cover in all 35 looks,
// the text effects and bends, and one cover per channel. Run after helpers.js; poll PROD.done.
(async () => {
  const log = [];
  globalThis.PROD = { log, done: false };
  try {
    const sizes = ["16:9", "4:3", "3:4", "9:16", "1:1", "2.35:1"];
    // 1. hero: cel, every size
    await SC.call("set_channel", { channel: "shot", color: "#fcee0a" });
    await SC.call("set_text", { channel: "shot", title: "雨夜*东京*漫步", subtitle: "从涩谷走到新宿的一晚", tag: "EP.07" });
    await SC.call("set_look", { look: "cel", resetParams: true });
    for (const s of sizes) log.push(await SC.shot(`hero/cel-${s.replace(":", "x")}.png`, { size: s, maxSide: 1800 }));
    // 2. every look at 16:9
    const ids = ["cel","cyber","riso","anime","bluenote","editorial","songke","vivid","negative","cinema","cyano","monofilm","typo","toon","avant","collage","yellow","pitch","dots","neon","court","velvet","rave","chrome","netart","verse","glass","jelly","skies","spectrum","citypop","construct","deco","wasteland","facet"];
    for (const id of ids) {
      await SC.call("set_look", { look: id, resetParams: true });
      log.push(await SC.shot(`looks/${id}.png`, { size: "16:9", maxSide: 1280 }));
    }
    // 3. text effects and bends on the title, cel
    await SC.call("set_look", { look: "cel", resetParams: true });
    const fx = ["auto", "sticker", "ransom", "dots", "stripes", "inner", "worn", "rows", "plain"];   // outline effects (extrude, torn…) need the desktop app
    globalThis.PROD.boxes = {};
    for (const e of fx) {
      try { await SC.call("set_layer_effect", { layer: "title", effect: e }); } catch (err) { log.push({ skip: e }); continue; }
      const r = await SC.shot(`fx/${e}.png`, { size: "16:9", maxSide: 1600 });
      const pr = await SC.call("render_preview", { size: "16:9", maxSide: 256 });
      globalThis.PROD.boxes[e] = pr.structuredContent.boxes.filter((b) => b.id === "title" || b.id === "subtitle");
      log.push(r);
    }
    await SC.call("set_layer_effect", { layer: "title", effect: "auto" });
    for (const b of ["arc", "wave", "flag"]) {
      await SC.call("set_layer_bend", { layer: "title", bend: b, amount: 1 });
      log.push(await SC.shot(`fx/bend-${b}.png`, { size: "16:9", maxSide: 1600 }));
      const pr = await SC.call("render_preview", { size: "16:9", maxSide: 256 });
      globalThis.PROD.boxes["bend-" + b] = pr.structuredContent.boxes.filter((x) => x.id === "title" || x.id === "subtitle");
    }
    await SC.call("set_layer_bend", { layer: "title", bend: "none" });
    // 4. channels, each with its own title
    const ch = [
      ["shot", "雨夜*东京*漫步", "从涩谷走到新宿的一晚", "EP.07"],
      ["film", "一卷 *Portra 400*\n的夏天", "海边、旧相机和过期胶卷", "EP.12"],
      ["test", "*50mm* 定焦\n值不值得买", "三个月实拍之后的答案", "EP.03"],
      ["brkd", "一张照片的\n*构图*拆解", "为什么这张图让人停下来", "EP.21"],
      ["make", "自己做一个\n*胶片扫描架*", "零件清单和图纸都在评论区", "EP.05"],
    ];
    for (const [c, t, s, g] of ch) {
      await SC.call("set_text", { channel: c, title: t, subtitle: s, tag: g });
      await SC.call("show_layer", { channel: c, layer: "graphic", included: true, visible: true });
      log.push(await SC.shot(`channels/${c}.png`, { channel: c, size: "16:9", maxSide: 1280 }));
      log.push(await SC.shot(`channels/${c}-3x4.png`, { channel: c, size: "3:4", maxSide: 960 }));
    }
  } catch (e) {
    globalThis.PROD.error = String(e && e.stack || e);
  }
  globalThis.PROD.done = true;
  return "started";
})()
