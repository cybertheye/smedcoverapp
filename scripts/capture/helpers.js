// Loaded into the SmedCover editor page (ui/index.html served in a browser) with the example profile;
// defines SC.call (an agent tool through the dev hook globalThis.smedcoverAgent) and SC.shot (render_preview,
// posted to scripts/capture/receive.py, which writes renders/<name>.png).
(() => {
  const A = globalThis.smedcoverAgent;
  const call = async (name, args = {}) => {
    const r = await A.call(name, args);
    if (!r.ok) throw new Error(name + ": " + JSON.stringify(r.error || r).slice(0, 400));
    return r.result;
  };
  const save = async (name, b64) => {
    const res = await fetch("http://127.0.0.1:8732/save?name=" + encodeURIComponent(name), { method: "POST", body: b64 });
    if (!res.ok) throw new Error("save failed " + name);
  };
  // render a size and save it; retries while fonts/outlines are pending
  const shot = async (name, args) => {
    let r;
    for (let i = 0; i < 6; i++) {
      r = await call("render_preview", args);
      const p = r.structuredContent && r.structuredContent.pending;
      if (!p || (!p.fonts && !p.outlines)) break;
      await new Promise((ok) => setTimeout(ok, 800));
    }
    const img = r.content.find((c) => c.type === "image");
    await save(name, img.data);
    return { name, w: r.structuredContent.width, h: r.structuredContent.height };
  };
  globalThis.SC = { call, save, shot };
  return "helpers ready";
})()
