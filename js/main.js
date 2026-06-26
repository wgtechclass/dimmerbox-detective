// 啟動、路由、首頁 / 任務地圖 / 徽章頁
import { route, startRouter, navigate, render } from "./router.js";
import { store } from "./store.js";
import { BADGES } from "./data/badges.js";
import { LevelEngine } from "./engine/LevelEngine.js";
import level1 from "./levels/level1.js";
import level2 from "./levels/level2.js";
import level3 from "./levels/level3.js";
import level4 from "./levels/level4.js";
import level5 from "./levels/level5.js";

const app = document.getElementById("app");

// 五關全部實作完成
const LEVELS = { "level-1": level1, "level-2": level2, "level-3": level3, "level-4": level4, "level-5": level5 };

// 任務地圖節點（逐步組裝調光盒的路徑）
const MAP_NODES = [
  { id: "level-1", n: 1, name: "LED 點亮任務", unlocks: "LED" },
  { id: "level-2", n: 2, name: "CR2032 電源任務", unlocks: "CR2032 電源" },
  { id: "level-3", n: 3, name: "船型開關控制任務", unlocks: "船型開關" },
  { id: "level-4", n: 4, name: "可變電阻調光任務", unlocks: "可變電阻" },
  { id: "level-5", n: 5, name: "調光盒總裝修正任務", unlocks: "調光盒總裝" },
];

function hasAllBadges() {
  return BADGES.every((b) => store.hasBadge(b.id));
}

/* ---------- 首頁 ---------- */
function home() {
  app.innerHTML = `
    <div class="page">
      <div class="page-narrow" style="text-align:center;margin-top:6vh">
        <div style="font-size:3rem">🔍</div>
        <h1 style="font-size:2.6rem;color:var(--brand-dark);margin:8px 0">調光盒偵探所</h1>
        <p style="font-size:1.15rem;color:var(--ink-soft);margin-bottom:6px">電子元件推理任務</p>
        <div class="card" style="max-width:600px;margin:24px auto;text-align:left">
          <span class="tape"></span>
          <p style="line-height:1.9">歡迎加入偵探所。桌上有一盒待破解的「調光盒」案件，從一顆 LED 開始，
          你要靠接線、測試、觀察與推理，一步步查出每個電子元件的秘密，最後讓調光盒能亮、能調光。</p>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:10px">
          <button class="btn btn-lg btn-clue" id="start">開始辦案</button>
          <button class="btn btn-lg btn-ghost" id="to-map">任務地圖</button>
          <button class="btn btn-lg btn-ghost" id="to-badges">偵探通行證</button>
        </div>
      </div>
    </div>`;
  app.querySelector("#start").onclick = () => navigate("#/map");
  app.querySelector("#to-map").onclick = () => navigate("#/map");
  app.querySelector("#to-badges").onclick = () => navigate("#/badges");
}

/* ---------- 任務地圖 ---------- */
function map() {
  const allBadges = hasAllBadges();
  const nodes = MAP_NODES.map((nd) => {
    const unlocked = store.isUnlocked(nd.id);
    const done = store.isCompleted(nd.id);
    const built = !!LEVELS[nd.id];
    const status = done ? "已完成" : unlocked ? "可進入" : "尚未解鎖";
    const color = done ? "var(--ok)" : unlocked ? "var(--clue)" : "var(--idle)";
    return `
      <div class="card" style="display:flex;align-items:center;gap:16px;opacity:${unlocked ? 1 : .55};margin:0">
        <div style="width:46px;height:46px;border-radius:50%;background:${color};color:#fff;display:grid;place-items:center;font-weight:900;font-size:1.2rem">${done ? "✔" : nd.n}</div>
        <div style="flex:1">
          <div style="font-family:var(--font-serif);font-weight:700;font-size:1.1rem">案件 ${nd.n}：${nd.name}</div>
          <div class="hint-line">解鎖：${nd.unlocks} ・ 狀態：<b style="color:${color}">${status}</b></div>
        </div>
        <button class="btn ${unlocked ? "btn-clue" : ""}" ${unlocked && built ? "" : "disabled"} data-go="${nd.id}">
          ${!built ? "準備中" : done ? "重新挑戰" : "進入"}
        </button>
      </div>`;
  }).join(`<div style="text-align:center;color:var(--line-soft);font-size:1.4rem;line-height:.6">↓</div>`);

  app.innerHTML = `
    <div class="page">
      <div class="page-narrow">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
          <button class="btn btn-ghost" id="home">← 首頁</button>
          <h1 style="font-size:1.8rem;color:var(--brand-dark)">任務地圖</h1>
          <span style="flex:1"></span>
          ${allBadges ? '<button class="btn btn-clue" id="finale">結案畫面</button>' : ""}
          <button class="btn btn-ghost" id="badges">偵探通行證</button>
        </div>
        <p class="hint-line" style="margin-bottom:16px">沿著線索板，一步步把調光盒組裝起來。完成一關才會解鎖下一關。</p>
        <div style="display:flex;flex-direction:column;gap:8px">${nodes}</div>
      </div>
    </div>`;
  app.querySelector("#home").onclick = () => navigate("#/");
  app.querySelector("#badges").onclick = () => navigate("#/badges");
  app.querySelector("#finale")?.addEventListener("click", () => navigate("#/finale"));
  app.querySelectorAll("[data-go]").forEach((b) => b.onclick = () => navigate("#/level/" + b.dataset.go.split("-")[1]));
}

/* ---------- 徽章頁 ---------- */
function badges() {
  const allBadges = hasAllBadges();
  const cards = BADGES.map((b) => {
    const got = store.hasBadge(b.id);
    return `
      <div class="card" style="text-align:center;margin:0">
        <div class="badge-stamp ${got ? "" : "is-locked"}" style="margin:0 auto 10px"><img src="${b.img}" alt="${b.name}"></div>
        <div class="badge-card-title">${b.name}</div>
        <div class="hint-line badge-card-note">${got ? b.learn : "尚未解鎖"}</div>
      </div>`;
  }).join("");
  app.innerHTML = `
    <div class="page">
      <div class="page-narrow">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
          <button class="btn btn-ghost" id="map">← 任務地圖</button>
          <h1 style="font-size:1.8rem;color:var(--brand-dark)">偵探通行證</h1>
          <span style="flex:1"></span>
          ${allBadges ? '<button class="btn btn-clue" id="finale">查看結案畫面</button>' : ""}
        </div>
        ${allBadges ? '<p class="hint-line" style="margin-bottom:14px">五枚徽章已集滿，可以進入偵探所結案畫面。</p>' : ""}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px">${cards}</div>
      </div>
    </div>`;
  app.querySelector("#map").onclick = () => navigate("#/map");
  app.querySelector("#finale")?.addEventListener("click", () => navigate("#/finale"));
}

/* ---------- 結案恭喜畫面 ---------- */
function finale() {
  if (!hasAllBadges()) { navigate("#/badges"); return; }
  const badgeRow = BADGES.map((b) => `
    <figure class="finale-badge">
      <img src="${b.img}" alt="${b.name}">
      <figcaption>${b.name}</figcaption>
    </figure>`).join("");
  app.innerHTML = `
    <div class="page finale-page">
      <div class="page-narrow finale-wrap">
        <section class="finale-hero">
          <div class="finale-kicker">調光盒偵探所結案</div>
          <h1>恭喜完成偵探通行證</h1>
          <div class="finale-subtitle">五枚徽章已集滿</div>
          <p>你已完成 LED、電池座、船型開關、可變電阻與總裝排查任務，能依照觀察紀錄一步步推理，讓調光盒正常亮起並調整亮度。</p>
          <div class="finale-actions">
            <button class="btn btn-lg btn-clue" id="to-badges">查看通行證</button>
            <button class="btn btn-lg btn-ghost" id="to-map">回任務地圖</button>
          </div>
        </section>
        <section class="finale-pass">
          ${badgeRow}
        </section>
        <section class="finale-note">
          <h2>你完成的偵探能力</h2>
          <div class="finale-skills">
            <span>觀察元件特徵</span>
            <span>一次只改一個條件</span>
            <span>用紀錄找證據</span>
            <span>依現象排查電路</span>
          </div>
        </section>
      </div>
    </div>`;
  app.querySelector("#to-badges").onclick = () => navigate("#/badges");
  app.querySelector("#to-map").onclick = () => navigate("#/map");
}

/* ---------- 關卡 ---------- */
function level(params) {
  const id = "level-" + params.n;
  if (!store.isUnlocked(id)) { navigate("#/map"); return; }
  const data = LEVELS[id];
  if (!data) { navigate("#/map"); return; }
  new LevelEngine(app, data).start();
}

/* ---------- 路由表 ---------- */
route("/", home);
route("/map", map);
route("/badges", badges);
route("/finale", finale);
route("/level/:n", level);
startRouter();
