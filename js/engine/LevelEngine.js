// 關卡共用引擎：五關共用同一節奏，只換 level 資料
import { openModal } from "../ui/Modal.js";
import { toast } from "../ui/Toast.js";
import { store } from "../store.js";
import { navigate } from "../router.js";

export class LevelEngine {
  constructor(app, level) {
    this.app = app;
    this.level = level;
    this.connections = [];          // [{from,to}]
    this.armed = null;              // 目前已選的接點 id
    this.controlState = {};
    this.records = [];
    this.reasoningStep = 0;
    this.refUnlocked = false;
    for (const c of level.controls || []) this.controlState[c.id] = c.default;
    this.geometry = this.resolveLevelGeometry();
    this.anchorPoints = this.geometry.anchorPoints;
    this.hotspots = this.geometry.hotspots;
    this.terminals = this.geometry.terminals;
    this.pointsById = this.geometry.pointsById;
  }

  resolveLevelGeometry() {
    const anchorPoints = {};
    for (const p of this.level.parts || []) {
      const terms = p.terminals || {};
      const aspect = p.aspect || 1;
      const heightPct = p.w * aspect * 16 / 9;
      const left = p.x - p.w / 2;
      const top = p.y - heightPct / 2;
      Object.entries(terms).forEach(([name, pt]) => {
        anchorPoints[`${p.id}.${name}`] = [
          left + (pt.x / 100) * p.w,
          top + (pt.y / 100) * heightPct,
        ];
      });
    }
    const resolve = (item) => {
      const pt = item.anchor ? anchorPoints[item.anchor] : null;
      return pt ? { ...item, x: pt[0], y: pt[1] } : { ...item };
    };
    const hotspots = (this.level.hotspots || []).map(resolve);
    const terminals = (this.level.terminals || []).map(resolve);
    const pointsById = {};
    [...hotspots, ...terminals].forEach((item) => {
      if (item.id) pointsById[item.id] = [item.x, item.y];
    });
    return { anchorPoints, hotspots, terminals, pointsById };
  }

  async start() {
    this.renderShell();
    this.bindWiring();
    this.renderControls();
    this.renderRecords();
    window.addEventListener("resize", this._redraw = () => this.redrawWires());
    // 任務開場彈窗
    const L = this.level.intro;
    await openModal({
      title: L.title, tape: true, showClose: false,
      bodyHTML: `
        <p>${L.situation}</p>
        ${L.fromPrev ? `<p style="color:var(--ink-soft)">${L.fromPrev}</p>` : ""}
        <p><b>本關目標：</b>${L.goal}</p>
        <p class="hint-line"><b>操作：</b>${L.howto}</p>`,
      actions: [{ label: "開始辦案", variant: "btn-clue" }],
    });
    if (this.level.observation) await this.showObservation(true);
    store.setLastPlayed(this.level.id);
  }

  async showObservation(required = false) {
    const obs = this.level.observation;
    if (!obs) return;
    const items = (obs.items || []).map((item) => `
      <figure class="observation-card">
        <div class="observation-photo">
          <img src="${item.img}" alt="${item.label}">
        </div>
        <figcaption>
          <strong>${item.label}</strong>
          ${item.note ? `<span>${item.note}</span>` : ""}
        </figcaption>
      </figure>`).join("");
    await openModal({
      title: obs.title || "證物觀察",
      tape: true,
      showClose: !required,
      bodyHTML: `
        ${obs.intro ? `<p>${obs.intro}</p>` : ""}
        <div class="observation-grid">${items}</div>`,
      actions: [{ label: required ? "進入工作台" : "回到工作台", variant: "btn-clue" }],
    });
  }

  /* ---------- 版面 ---------- */
  renderShell() {
    const lv = this.level;
    this.app.innerHTML = `
      <div class="level">
        <div class="level-topbar">
          <button class="btn btn-ghost" style="color:#fff;border-color:rgba(255,255,255,.5)" id="back-map">← 任務地圖</button>
          <strong style="font-size:1.05rem">案件 ${lv.index}：${lv.name}</strong>
          <span style="flex:1"></span>
          <button class="btn btn-ghost" style="color:#fff;border-color:rgba(255,255,255,.5)" id="hint-btn">需要提示</button>
        </div>
        <div class="level-cols">
          <section class="col col-workbench">
            <div class="col-head">🔍 實驗工作台</div>
            <div class="col-body" style="padding:0">
              <div class="workbench" id="wb">
                <div class="stage" id="stage"></div>
              </div>
            </div>
          </section>
          <section class="col">
            <div class="col-head">🧰 操作設定區</div>
            <div class="col-body" id="controls"></div>
          </section>
          <section class="col">
            <div class="col-head">📓 實驗紀錄 / 推理判斷</div>
            <div class="col-body" id="record"></div>
          </section>
        </div>
      </div>`;
    this.app.querySelector("#back-map").onclick = () => navigate("#/map");
    this.app.querySelector("#hint-btn").onclick = () => this.showHint();

    const stage = this.app.querySelector("#stage");
    this.renderScene(stage, lv);
    const wiresSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    wiresSvg.classList.add("wire-svg");
    wiresSvg.id = "wires";
    stage.appendChild(wiresSvg);
    // 元件
    const shouldRenderParts = !lv.scene || lv.scene.showParts === true;
    for (const p of (shouldRenderParts ? (lv.parts || []) : [])) {
      const el = document.createElement("div");
      el.className = "part" + (p.kind === "led" ? " part-led off" : "") + (p.className ? ` ${p.className}` : "");
      el.style.left = p.x + "%"; el.style.top = p.y + "%"; el.style.width = p.w + "%";
      el.dataset.rotate = p.rotate || 0;
      el.dataset.flipX = p.flipX ? "true" : "false";
      this.applyPartTransform(el);
      el.dataset.part = p.id;
      if (p.kind === "led") el.innerHTML = `<div class="led-glow"></div><img src="${p.assets.off}" alt="LED" />`;
      else if (p.img) el.innerHTML = `<img src="${p.img}" alt="" ${p.blend ? `style="mix-blend-mode:${p.blend}"` : ""} />`;
      else el.innerHTML = p.html;
      stage.appendChild(el);
    }
    const callouts = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    callouts.classList.add("terminal-callouts");
    callouts.setAttribute("viewBox", "0 0 100 100");
    callouts.setAttribute("preserveAspectRatio", "none");
    stage.appendChild(callouts);

    const addCallout = (from, to) => {
      if (!from) return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", from[0]); line.setAttribute("y1", from[1]);
      line.setAttribute("x2", to[0]); line.setAttribute("y2", to[1]);
      callouts.appendChild(line);
    };
    const addTerminalMark = (h, cls) => {
      addCallout(h.calloutFrom, [h.x, h.y]);
      const hs = document.createElement("div");
      hs.className = `${cls} shape-${h.shape || "circle"}${h.className ? ` ${h.className}` : ""}${h.calloutFrom ? " is-extended" : ""}`;
      hs.style.left = h.x + "%"; hs.style.top = h.y + "%";
      if (h.id) hs.dataset.id = h.id;
      if (h.label) {
        const lb = document.createElement("span");
        lb.className = "hs-label " + (h.labelPos || "right") + (h.big ? " big" : "");
        lb.textContent = h.label;
        if (h.labelColor) lb.style.color = h.labelColor;
        hs.appendChild(lb);
      }
      stage.appendChild(hs);
    };
    // 接點 + 標註（標註是接點的子元素，用 CSS 定位 → 跟著接點走，螢幕比例改變也不會錯位）
    for (const h of this.hotspots || []) addTerminalMark(h, "hotspot");
    // 選接法模式的非互動端子，讓學生看得出線路接到哪個合理位置。
    for (const t of this.terminals || []) addTerminalMark(t, "teaching-terminal");
  }

  renderScene(stage, lv) {
    if (!lv.scene?.img) return;
    const img = document.createElement("img");
    img.className = "scene-img";
    img.src = lv.scene.img;
    img.alt = "";
    stage.appendChild(img);
    if (lv.scene.ledGlow) {
      const glow = document.createElement("div");
      glow.className = "scene-led-glow off";
      glow.style.left = lv.scene.ledGlow.x + "%";
      glow.style.top = lv.scene.ledGlow.y + "%";
      glow.style.width = lv.scene.ledGlow.w + "%";
      stage.appendChild(glow);
    }
  }

  partTransform(rotate = 0, flipX = false) {
    const rot = Number(rotate) ? ` rotate(${Number(rotate)}deg)` : "";
    const flip = flipX ? " scaleX(-1)" : "";
    return `translate(-50%, -50%)${rot}${flip}`;
  }

  applyPartTransform(part) {
    if (!part) return;
    part.style.transform = this.partTransform(part.dataset.rotate || 0, part.dataset.flipX === "true");
  }

  /* ---------- 接線 ---------- */
  bindWiring() {
    if (this.level.manualWiring === false) return; // 由「選接法→畫線」模式接管（SPEC §5.6 第4種）
    const stage = this.app.querySelector("#stage");
    stage.addEventListener("click", (e) => {
      const hs = e.target.closest(".hotspot");
      if (!hs) return;
      const id = hs.dataset.id;
      if (this.armed === null) { this.armed = id; this.refreshHotspots(); return; }
      if (this.armed === id) { this.armed = null; this.refreshHotspots(); return; }
      const a = this.findHot(this.armed), b = this.findHot(id);
      if (!this.level.allowWire(a, b)) {
        toast("這不是本關要測試的接法，請依任務提示選擇可測試的接點。");
        this.armed = null; this.refreshHotspots(); return;
      }
      if (!this.connections.some((c) => this.sameWire(c, this.armed, id))) {
        this.connections.push({ from: this.armed, to: id });
      }
      this.armed = null;
      this.refreshHotspots();
      this.redrawWires();
    });
  }
  findHot(id) { return this.hotspots.find((h) => h.id === id); }
  sameWire(c, a, b) { return (c.from === a && c.to === b) || (c.from === b && c.to === a); }

  refreshHotspots() {
    const linked = new Set(this.connections.flatMap((c) => [c.from, c.to]));
    this.app.querySelectorAll(".hotspot").forEach((hs) => {
      const id = hs.dataset.id;
      hs.classList.toggle("is-armed", this.armed === id);
      hs.classList.toggle("is-linked", linked.has(id));
    });
  }

  redrawWires(flow = false) {
    const svg = this.app.querySelector("#wires");
    const stage = this.app.querySelector("#stage");
    const r = stage.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
    const pt = (id) => { const h = this.findHot(id); return [h.x / 100 * r.width, h.y / 100 * r.height]; };
    const strokeW = Math.max(3, r.width * 0.009);             // 線寬隨舞台縮放
    const dotR = strokeW * 1.15;                              // 電流點隨線寬
    const toD = (pts) => "M" + pts.map((p) => `${p[0]},${p[1]}`).join(" L");
    const templatePoint = (p) => {
      if (typeof p === "string") return pt(p);
      return [p[0] / 100 * r.width, p[1] / 100 * r.height];
    };

    // 「選接法→畫線」模式：關卡自己給定每個狀態要畫的線（SPEC §5.6 第4種、§12.8）
    if (this.level.wiresFor) {
      const defs = this.level.wiresFor(this.controlState, this.anchorPoints, this.pointsById) || [];
      svg.innerHTML = defs.map((def) => {
        const pts = def.pts.map((p) => [p[0] / 100 * r.width, p[1] / 100 * r.height]);
        const d = toD(pts);
        const motionD = def.out === false ? toD(pts.slice().reverse()) : d;
        const width = strokeW * (def.widthScale || 1);
        const opacity = def.opacity != null ? ` opacity="${def.opacity}"` : "";
        const path = def.line === false
          ? ""
          : `<path d="${d}" stroke="${def.col}" stroke-width="${width}"${opacity} ${def.dash ? `stroke-dasharray="${width * 2} ${width * 2}"` : ""}/>`;
        const dot = (flow && def.flow)
          ? `<circle r="${dotR}" fill="${def.col}"><animateMotion dur="0.9s" repeatCount="indefinite" path="${motionD}"/></circle>`
          : "";
        return `${path}${dot}`;
      }).join("");
      return;
    }

    // 把每條接線整理成：電源端 / LED 端 / 走上或下通道（lane）/ 顏色
    // lane='top' 走上方、'bot' 走下方。預設用 pos/neg 推導（相容關卡 1）。
    const wires = this.connections.map((c) => {
      const a = this.findHot(c.from), b = this.findHot(c.to);
      const src = a.group === "source" ? a : b;
      const tgt = src === a ? b : a;
      const lane = src.lane || (src.id.includes("pos") ? "top" : "bot");
      const col = src.wireColor || (src.id.includes("pos") ? "var(--wire-pos)" : "#111");
      return { lane, col, s: pt(src.id), t: pt(tgt.id) };
    });
    const paths = [];
    const manualRoute = (this.level.manualRouteSets || []).find((set) =>
      set.pairs.length === this.connections.length &&
      set.pairs.every(([a, b]) => this.connections.some((c) => this.sameWire(c, a, b))));
    const manualSingleRoute = this.connections.length === 1
      ? (this.level.manualSingleRoutes || []).find((route) => this.sameWire(this.connections[0], route.pair[0], route.pair[1]))
      : null;
    if (manualRoute) {
      manualRoute.wires.forEach((w) => paths.push({
        pts: w.pts.map(templatePoint),
        col: w.col,
        out: w.out !== false,
      }));
    } else if (manualSingleRoute) {
      const singleWires = manualSingleRoute.wires || [manualSingleRoute];
      singleWires.forEach((w) => paths.push({
        pts: w.pts.map(templatePoint),
        col: w.col,
        out: w.out !== false,
      }));
    } else {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const routeSingle = (w, offset = 0.42) => {
      const minX = Math.min(w.s[0], w.t[0]);
      const maxX = Math.max(w.s[0], w.t[0]);
      const midX = clamp(w.s[0] + (w.t[0] - w.s[0]) * offset, minX + r.width * 0.05, maxX - r.width * 0.05);
      return [w.s, [midX, w.s[1]], [midX, w.t[1]], w.t];
    };

    if (wires.length === 2) {
      const bySource = [...wires].sort((a, b) => a.s[1] - b.s[1]);
      const byTarget = [...wires].sort((a, b) => a.t[1] - b.t[1]);
      const sameOrder = bySource[0] === byTarget[0];
      if (sameOrder) {
        paths.push({ pts: routeSingle(bySource[0], 0.38), col: bySource[0].col, out: bySource[0].lane === "top" });
        paths.push({ pts: routeSingle(bySource[1], 0.58), col: bySource[1].col, out: bySource[1].lane === "top" });
      } else {
        const upperSourceWire = bySource[0];
        const lowerSourceWire = bySource[1];
        const targetXs = wires.map((w) => w.t[0]);
        const targetYs = wires.map((w) => w.t[1]);
        const upperLane = clamp(Math.min(upperSourceWire.s[1], ...targetYs) - r.height * 0.16, r.height * 0.09, r.height * 0.42);
        const rightLane = clamp(Math.max(...targetXs) + r.width * 0.08, r.width * 0.58, r.width * 0.88);
        const leftLane = clamp(Math.min(...wires.map((w) => w.s[0])) + r.width * 0.08, r.width * 0.12, Math.min(...targetXs) - r.width * 0.08);
        paths.push({
          pts: [
            upperSourceWire.s,
            [leftLane, upperSourceWire.s[1]],
            [leftLane, upperLane],
            [rightLane, upperLane],
            [rightLane, upperSourceWire.t[1]],
            upperSourceWire.t,
          ],
          col: upperSourceWire.col,
          out: upperSourceWire.lane === "top",
        });
        paths.push({ pts: routeSingle(lowerSourceWire, 0.46), col: lowerSourceWire.col, out: lowerSourceWire.lane === "top" });
      }
    } else {
      wires.forEach((w) => paths.push({ pts: routeSingle(w), col: w.col, out: w.lane === "top" }));
    }
    }

    svg.innerHTML = paths.map((p) => {
      const d = toD(p.pts);
      // 電流小點：上通道線從電源往 LED 跑（流出）；下通道線從 LED 往電源跑（流回）。
      const motionD = p.out ? d : toD(p.pts.slice().reverse());
      const dot = flow
        ? `<circle r="${dotR}" fill="${p.col}"><animateMotion dur="0.9s" repeatCount="indefinite" path="${motionD}"/></circle>`
        : "";
      return `<path d="${d}" stroke="${p.col}" stroke-width="${strokeW}"/>${dot}`;
    }).join("");
  }

  clearWires() { this.connections = []; this.armed = null; this.refreshHotspots(); this.redrawWires(); this.setLed("off"); }

  // 控制項切換時，更新對應元件顯示的圖（例如電池安裝方式一/二）
  applyViewPart(ctrl, opt) {
    if (!ctrl.viewPart || !opt || !opt.img) return;
    const part = this.app.querySelector(`[data-part="${ctrl.viewPart}"]`);
    const img = part?.querySelector("img");
    if (img) img.src = opt.img;
    if (part) {
      part.dataset.viewValue = opt.value;
      if (opt.flipX != null) {
        part.dataset.flipX = opt.flipX ? "true" : "false";
        this.applyPartTransform(part);
      }
    }
  }

  /* ---------- 條件設定 + 測試 ---------- */
  renderControls() {
    const box = this.app.querySelector("#controls");
    const observationBtn = this.level.observation
      ? `<div class="workbench-tool-row"><button class="btn btn-ghost" id="show-observation">查看證物</button></div>`
      : "";
    const ctrlHTML = (this.level.controls || []).map((c) => {
      if (c.type === "slider") {
        const idx = Math.max(0, c.options.findIndex((o) => o.value === this.controlState[c.id]));
        return `
          <div style="margin-bottom:16px">
            <div class="subhead">${c.label}</div>
            <div class="slider-wrap" data-ctrl="${c.id}">
              <div class="slider-readout" id="ro-${c.id}">${c.options[idx].label}</div>
              <input type="range" class="vslider" min="0" max="${c.options.length - 1}" step="1" value="${idx}">
              <div class="slider-ticks">${c.options.map((o) => `<span>${o.label}</span>`).join("")}</div>
            </div>
          </div>`;
      }
      return `
        <div style="margin-bottom:14px">
          <div class="subhead">${c.label}</div>
          <div class="chips" data-ctrl="${c.id}">
            ${c.options.map((o) => `<button class="chip ${this.controlState[c.id] === o.value ? "is-active" : ""}" data-v="${o.value}">${o.label}</button>`).join("")}
          </div>
        </div>`;
    }).join("");
    box.innerHTML = `
      <p class="hint-line" style="margin-bottom:10px">提醒：一次只改變一個條件，比較才看得出差別。</p>
      ${observationBtn}
      ${ctrlHTML}
      <div style="display:flex;gap:8px;margin-top:6px">
        <button class="btn btn-test" id="run-test">開始測試</button>
        ${this.level.manualWiring === false ? "" : '<button class="btn btn-ghost" id="clear-wire">清除接線</button>'}
      </div>`;
    box.querySelector("#show-observation")?.addEventListener("click", () => this.showObservation(false));
    box.querySelectorAll(".slider-wrap").forEach((g) => {
      const cid = g.dataset.ctrl;
      const c = this.level.controls.find((x) => x.id === cid);
      g.querySelector(".vslider").addEventListener("input", (e) => {
        const opt = c.options[+e.target.value];
        this.controlState[cid] = opt.value;
        g.querySelector(`#ro-${cid}`).textContent = opt.label;
        this.applyViewPart(c, opt);
        if (this.level.wiresFor) this.redrawWires();
      });
    });
    box.querySelectorAll(".chips").forEach((g) => {
      const cid = g.dataset.ctrl;
      const ctrl = this.level.controls.find((c) => c.id === cid);
      g.querySelectorAll(".chip").forEach((ch) => ch.onclick = () => {
        const opt = ctrl.options.find((o) => String(o.value) === ch.dataset.v);
        this.controlState[cid] = opt.value;
        g.querySelectorAll(".chip").forEach((x) => x.classList.remove("is-active"));
        ch.classList.add("is-active");
        this.applyViewPart(ctrl, opt);
        if (this.level.wiresFor) this.redrawWires(); // 選接法/開關 → 即時更新接線畫面
      });
    });
    // 套用控制項初始的元件圖（例如電池安裝方式）
    (this.level.controls || []).forEach((c) => {
      if (c.viewPart) this.applyViewPart(c, c.options.find((o) => o.value === this.controlState[c.id]));
    });
    if (this.level.wiresFor) this.redrawWires(); // 初始接線
    box.querySelector("#run-test").onclick = () => this.runTest();
    const clearBtn = box.querySelector("#clear-wire");
    if (clearBtn) clearBtn.onclick = () => this.clearWires();
  }

  setLed(state, brightness) {
    const el = this.app.querySelector('[data-part="led"]');
    if (el) {
      el.className = "part part-led " + state; // 透明底圖固定，亮暗用 CSS 光暈/濾鏡
      if (brightness != null) el.style.setProperty("--led-bright", brightness); // 可變電阻調光用
    }
    const sceneGlow = this.app.querySelector(".scene-led-glow");
    if (sceneGlow) {
      sceneGlow.className = "scene-led-glow " + state;
      if (brightness != null) sceneGlow.style.setProperty("--led-bright", brightness);
    }
  }

  runTest() {
    const ctx = { connections: this.connections, controls: this.controlState };
    const result = this.level.rules(ctx);
    if (!result.complete) { toast("接線還沒形成完整可測試的迴路。"); this.setLed("off"); return; }
    this.redrawWires(result.ledState === "on" || result.ledState === "dim" ? true : false);
    this.setLed(result.ledState, result.brightness);
    const rec = this.level.recordOf(ctx, result);
    // 去重：同一組條件只留一筆，避免重複測試讓紀錄/證據清單爆長
    if (this.records.some((r) => r.cond === rec.cond)) {
      toast("這個條件剛剛測過了，紀錄裡已經有這一筆。");
    } else {
      this.records.push(rec);
    }
    this.renderRecords();
    if (this.allRequiredDone() && !this._unlockedToastShown) {
      this._unlockedToastShown = true;
      toast("必要測試已完成，右側推理區已解鎖。");
    }
  }

  /* ---------- 紀錄 + 推理 ---------- */
  allRequiredDone() { return this.level.requiredRecords.every((r) => r.done(this.records)); }

  renderRecords() {
    const box = this.app.querySelector("#record");
    const recRows = this.records.length
      ? this.records.map((r) => `<div class="rec-row"><span class="rec-cond">${r.cond}</span><span class="rec-obs">${r.observe}</span></div>`).join("")
      : `<div class="rec-empty">還沒有測試紀錄。接好線、選好條件，按「開始測試」。</div>`;
    const reqRows = this.level.requiredRecords.map((r) =>
      `<li class="${r.done(this.records) ? "done" : ""}">${r.label}</li>`).join("");
    const refBtn = this.allRequiredDone() && this.level.reference
      ? `<button class="btn btn-ghost" id="ref-btn" style="margin-top:12px">${this.level.reference.label}</button>` : "";
    box.innerHTML = `
      <div class="subhead">即時測試紀錄</div>
      <div class="recordbook">${recRows}</div>
      <div class="subhead" style="margin-top:14px">必要測試</div>
      <ul class="req-list">${reqRows}</ul>
      ${refBtn}
      <hr style="border:none;border-top:1px dashed var(--line-soft);margin:16px 0">
      <div class="subhead">推理判斷</div>
      <div id="reasoning"></div>`;
    if (refBtn) box.querySelector("#ref-btn").onclick = () => openModal({
      title: this.level.reference.title, tape: true,
      bodyHTML: this.level.reference.bodyHTML, actions: [{ label: "了解" }],
    });
    this.renderReasoning();
  }

  renderReasoning() {
    const box = this.app.querySelector("#reasoning");
    if (!this.allRequiredDone()) {
      box.innerHTML = `<div class="reason-lock">完成上方所有必要測試後，才能開始推理。</div>`;
      return;
    }
    const total = this.level.reasoning.length;
    const q = this.level.reasoning[this.reasoningStep];
    if (!q) { box.innerHTML = `<div class="reason-lock" style="color:var(--ok)">推理完成，正在結案…</div>`; return; }
    const kind = q.kind || "evidence";
    const step = `<div class="hint-line" style="margin-bottom:6px">推理 ${this.reasoningStep + 1} / ${total}</div>`;
    let body;
    if (kind === "evidence") {
      body = `<div class="evidence-pick" id="opts">
        ${this.records.map((r, i) => `
          <label class="pick-row"><input type="checkbox" value="${i}">
            <span class="hint-line">${r.cond} → <b>${r.observe}</b></span></label>`).join("")}
      </div>`;
    } else {
      const inputType = kind === "multi" ? "checkbox" : "radio";
      body = `<div class="evidence-pick" id="opts">
        ${q.options.map((o, i) => `
          <label class="pick-row"><input type="${inputType}" name="rq" value="${i}">
            <span>${o.label}</span></label>`).join("")}
      </div>`;
    }
    const limitNote = kind === "evidence" ? `<div class="hint-line" style="margin:2px 0 6px">挑出 2 筆即可。</div>` : "";
    box.innerHTML = `${step}<p class="reason-q">${q.prompt}</p>${limitNote}${body}
      <button class="btn" id="submit-reason">提交</button>`;

    // 選證據時限選 2 筆：選到第 3 筆就擋下
    if (kind === "evidence") {
      const boxes = [...box.querySelectorAll('#opts input')];
      boxes.forEach((b) => b.addEventListener("change", () => {
        const checked = boxes.filter((x) => x.checked);
        if (checked.length > 2) { b.checked = false; toast("一次只比較 2 筆紀錄。"); }
      }));
    }

    box.querySelector("#submit-reason").onclick = () => {
      const checkedIdx = [...box.querySelectorAll("#opts input:checked")].map((i) => +i.value);
      let pass;
      if (kind === "evidence") pass = q.validate(checkedIdx.map((i) => this.records[i]));
      else if (kind === "choice") pass = checkedIdx.length === 1 && q.options[checkedIdx[0]].value === q.correct;
      else { // multi
        const picked = checkedIdx.map((i) => q.options[i].value).sort();
        const want = [...q.correct].sort();
        pass = picked.length === want.length && picked.every((v, k) => v === want[k]);
      }
      if (pass) {
        this.reasoningStep++;
        if (this.reasoningStep >= total) this.finish();
        else { toast("答對了，繼續下一題。"); this.renderReasoning(); }
      } else {
        toast(q.fail || "再回看你的測試紀錄想一想。");
      }
    };
  }

  /* ---------- 結果揭示 + 徽章 ---------- */
  async finish() {
    const rv = this.level.reveal;
    await openModal({
      title: rv.title, tape: true, showClose: false,
      bodyHTML: `
        <div style="text-align:center;margin-bottom:14px">
          <div class="badge-stamp stamp-in" style="margin:0 auto"><img src="${this.level.badgeImg}" alt="徽章"></div>
        </div>
        <p><b>結論：</b>${rv.concept}</p>
        ${rv.note ? `<p class="hint-line">${rv.note}</p>` : ""}
        <p style="color:var(--clue);margin-top:10px"><b>下一步：</b>${rv.nextHint}</p>`,
      actions: [{ label: "解鎖下一關", variant: "btn-clue" }],
    });
    store.completeLevel(this.level.id, this.level.badge);
    const allDone = store.allLevels().every((id) => store.isCompleted(id));
    navigate(allDone ? "#/finale" : "#/map");
  }

  /* ---------- 提示（關卡可自訂） ---------- */
  showHint() {
    openModal({
      title: "偵探提示", tape: true,
      bodyHTML: this.level.hint ||
        `<p>先觀察工作台目前的接線與目前選的條件。</p>
         <p class="hint-line">記得一次只改變一個條件，再從測試紀錄比較現象、找證據，不要急著下結論。</p>`,
      actions: [{ label: "知道了" }],
    });
  }
}
