// Surprise me: three deals of six hands at 3:4, each hand put on the canvas (pick_hand) and rendered. Poll DEAL.done;
// JSON.stringify(DEAL.hands) is what index.html keeps in #deals-data (look id and the hand's words).
(async () => {
  globalThis.DEAL = { done: false, hands: [] };
  try {
    await SC.call("set_look", { look: "cel", resetParams: true });
    window.__smedcover.selectSize("1200x1600");
    for (let d = 1; d <= 3; d++) {
      const r = await SC.call("surprise", { channel: "shot", count: 6, images: "none" });
      const sc = r.structuredContent;
      for (const h of sc.hands) {
        await SC.call("pick_hand", { hand: h.hand });
        await SC.shot(`deal/d${d}-h${h.hand}.png`, { size: "3:4", maxSide: 960 });
      }
      DEAL.hands.push(sc);
    }
  } catch (e) { DEAL.error = String(e && e.stack || e); }
  DEAL.done = true;
  return "started";
})()
