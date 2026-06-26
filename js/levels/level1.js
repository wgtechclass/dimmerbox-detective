// 關卡 1：讓 LED 亮起來（SPEC §10）
// 注意：rules / 內部判斷一律不外洩成畫面文案。
import { ASPECT, TERMINALS } from "./workbenchAnchors.js";

export default {
  id: "level-1",
  index: 1,
  name: "讓 LED 亮起來",
  badge: "led",
  badgeImg: "assets/badges/badge_led.png",

  intro: {
    title: "案件一：讓 LED 亮起來",
    situation:
      "偵探，第一件委託到了。桌上有一顆來路不明的 LED，沒有人知道它該怎麼接才會亮。",
    goal:
      "用「直流電電源供應器」接上 LED 的兩隻腳，調整測試電壓，按下開始測試，從現象找出讓它亮起來的條件。",
    howto:
      "點一個接點、再點另一個接點，就會接出一條線。先固定電壓比較兩種接法，再固定接法比較不同電壓。",
    fromPrev: "",
  },

  observation: {
    title: "證物觀察：LED",
    intro: "先觀察這一關會用到的元件，只記錄看得到的特徵。",
    items: [
      {
        img: "assets/led/led_off.png",
        label: "LED",
        note: "兩隻金屬腳長度不同，工作台會用腳 A / 腳 B 標示。",
      },
    ],
  },

  // 工作台元件
  parts: [
    {
      id: "tester", x: 17, y: 50, w: 20,
      aspect: ASPECT.tester,
      terminals: TERMINALS.tester,
      html: `<div style="background:#fff;border:0.4cqw solid var(--brand);border-radius:1.4cqw;width:100%;aspect-ratio:5/6;box-shadow:var(--shadow-card);display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:1.6cqw 0.6cqw">
               <div style="font-family:var(--font-serif);font-weight:700;color:var(--brand-dark);font-size:2.5cqw;line-height:1.25;text-align:center">直流電<br>電源供應器</div>
               <div style="font-size:1.8cqw;color:var(--ink-soft)">內建保護</div>
             </div>`,
    },
    {
      id: "led", x: 68, y: 40, w: 9, kind: "led",
      aspect: ASPECT.led,
      terminals: TERMINALS.led,
      assets: { off: "assets/workbench/led_top.png" },
    },
  ],

  // 電源在左（＋ 上、－ 下）。LED 直立放大，學生能直接觀察兩隻腳的長短。
  // 腳 A 綁 LED 長腳末端，腳 B 綁 LED 短腳末端；畫面仍只顯示中性名稱。
  hotspots: [
    { id: "pos", anchor: "tester.positiveTerminal", group: "source", label: "＋ 端子", labelColor: "var(--clue)", labelPos: "right", big: true, shape: "circle" },
    { id: "neg", anchor: "tester.negativeTerminal", group: "source", label: "－ 端子", labelColor: "#000", labelPos: "right", big: true, shape: "circle" },
    { id: "ledA", anchor: "led.anodeTip", group: "led", label: "腳 A", labelColor: "var(--ink)", labelPos: "left", shape: "circle", className: "terminal-led" },
    { id: "ledB", anchor: "led.cathodeTip", group: "led", label: "腳 B", labelColor: "var(--ink)", labelPos: "right", shape: "square", className: "terminal-led" },
  ],
  manualSingleRoutes: [
    { pair: ["pos", "ledA"], pts: ["pos", [39, 43], [39, 22], [60, 22], [60, 76], [66.56, 76], [66.56, 72.9], "ledA"], col: "var(--wire-pos)", out: true },
    { pair: ["pos", "ledB"], pts: ["pos", [39, 43], [39, 22], [86, 22], [86, 59.7], [72.5, 59.7], "ledB"], col: "var(--wire-pos)", out: true },
    { pair: ["neg", "ledA"], pts: ["neg", [42, 59], [42, 82], [66.56, 82], [66.56, 72.9], "ledA"], col: "#111", out: false },
    { pair: ["neg", "ledB"], pts: ["neg", [42, 59], [42, 82], [86, 82], [86, 59.7], [72.5, 59.7], "ledB"], col: "#111", out: false },
  ],
  manualRouteSets: [
    {
      pairs: [["pos", "ledA"], ["neg", "ledB"]],
      wires: [
        { pts: ["pos", [39, 43], [39, 22], [60, 22], [60, 76], [66.56, 76], [66.56, 72.9], "ledA"], col: "var(--wire-pos)", out: true },
        { pts: ["neg", [42, 59], [42, 82], [86, 82], [86, 59.7], [72.5, 59.7], "ledB"], col: "#111", out: false },
      ],
    },
    {
      pairs: [["pos", "ledB"], ["neg", "ledA"]],
      wires: [
        { pts: ["pos", [39, 43], [39, 22], [86, 22], [86, 59.7], [72.5, 59.7], "ledB"], col: "var(--wire-pos)", out: true },
        { pts: ["neg", [42, 59], [42, 82], [66.56, 82], [66.56, 72.9], "ledA"], col: "#111", out: false },
      ],
    },
  ],
  // 白名單：只允許 source 接 led
  allowWire: (a, b) => a.group !== b.group,

  // 條件設定區（電壓只顯示數值，不標低/合適/極高）
  controls: [
    {
      id: "voltage", label: "測試電壓", type: "slider",
      options: [
        { value: 1.5, label: "1.5V" },
        { value: 3.0, label: "3.0V" },
        { value: 4.0, label: "4.0V" },
        { value: 5.0, label: "5.0V" },
      ],
      default: 1.5,
    },
  ],

  // 系統內部判斷（不可外洩）
  rules(ctx) {
    const { connections, controls } = ctx;
    const has = (x, y) => connections.some(
      (c) => (c.from === x && c.to === y) || (c.from === y && c.to === x));
    const wayA = has("pos", "ledA") && has("neg", "ledB"); // 定義：腳A為正向
    const wayB = has("pos", "ledB") && has("neg", "ledA");
    const v = controls.voltage;

    if (!wayA && !wayB) return { complete: false, way: null, ledState: "off", observe: "尚未形成可測試的完整接線" };
    const way = wayA ? "A" : "B";
    if (wayB) return { complete: true, way, ledState: "off", observe: "LED 不亮" };
    // wayA（正向）依電壓
    let ledState, observe;
    if (v < 2.5) { ledState = "dim"; observe = "微亮"; }
    else if (v <= 3.6) { ledState = "on"; observe = "LED 亮起"; }
    else if (v <= 4.5) { ledState = "warn"; observe = "過亮警告"; }
    else { ledState = "broken"; observe = "損壞警告"; }
    return { complete: true, way, ledState, observe };
  },

  // 紀錄要記什麼（條件 + 觀察，不寫結論）
  recordOf(ctx, result) {
    return {
      接法: result.way,
      電壓: ctx.controls.voltage,
      cond: `接法 ${result.way}，測試電壓 ${ctx.controls.voltage.toFixed(1)}V`,
      observe: result.observe,
    };
  },

  // 必要紀錄（完成才解鎖推理）
  requiredRecords: [
    {
      id: "compare", label: "已在同一個電壓下，測過接法 A 與接法 B（可比較）",
      done: (rs) => {
        const va = rs.filter((r) => r.接法 === "A").map((r) => r.電壓);
        return rs.some((r) => r.接法 === "B" && va.includes(r.電壓));
      },
    },
    {
      id: "volts", label: "已在接法 A 下測過低、中、高三段電壓",
      done: (rs) => {
        const volts = new Set(rs.filter((r) => r.接法 === "A").map((r) => r.電壓));
        return volts.has(1.5) && volts.has(3.0) && [...volts].some((v) => v >= 4.0);
      },
    },
  ],

  // 完成必要測試後才開放的查表（小任務 3）
  reference: {
    label: "查看 LED 順向參考資料",
    title: "LED 順向參考資料",
    bodyHTML: `
      <p>不同顏色的 LED 可能需要不同的順向電壓，實際使用前應查詢元件規格。白光 LED 常見順向電壓約落在 3V 附近，但仍需依實際元件與電路設計判斷。</p>
      <p style="color:var(--clue)">本關用的是有保護的直流電電源供應器。真實電路中，LED 需要考慮限流與元件規格，不應任意直接接上高電壓。</p>`,
  },

  // 推理：先看證據 → 哪種接法會亮 → 連結到「長腳是正極」→ 電壓觀察
  reasoning: [
    {
      kind: "evidence",
      prompt: "第一步：挑出能證明「接法會影響發光」的兩筆紀錄（電壓相同、接法不同、結果不一樣）。",
      validate: (picks) =>
        picks.length === 2 && picks[0].電壓 === picks[1].電壓 &&
        picks[0].接法 !== picks[1].接法 && picks[0].observe !== picks[1].observe,
      fail: "這兩筆的電壓要相同、接法不同，而且一筆亮、一筆不亮，才能單獨看出接法的影響。",
    },
    {
      kind: "choice",
      prompt: "根據紀錄，哪一種接法能讓 LED 亮起來？",
      options: [
        { value: "A", label: "接法 A（正極接腳 A、負極接腳 B）" },
        { value: "B", label: "接法 B（正極接腳 B、負極接腳 A）" },
      ],
      correct: "A",
      fail: "看紀錄：哪一筆的觀察結果是「LED 亮起」？那是接法 A 還是接法 B？",
    },
    {
      kind: "choice",
      prompt: "會亮的接法裡，正極接的是腳 A。回頭仔細看工作台上的 LED，腳 A 是比較長、還是比較短的那隻腳？",
      options: [
        { value: "long", label: "腳 A 是比較長的腳" },
        { value: "short", label: "腳 A 是比較短的腳" },
      ],
      correct: "long",
      fail: "看一下 LED 的兩隻腳，伸出來比較長的那一隻就是腳 A。",
    },
    {
      kind: "choice",
      prompt: "根據你在不同電壓下的測試，下面哪一句最符合你的觀察？",
      options: [
        { value: "higher", label: "電壓越高，LED 一定越亮越好" },
        { value: "right", label: "要適當的電壓 LED 才正常亮，太低可能只會微亮、太高會過亮甚至損壞" },
        { value: "none", label: "電壓和 LED 亮不亮完全沒有關係" },
      ],
      correct: "right",
      fail: "回想你在很低（像 1.5V）和很高（像 5.0V）電壓下，看到的觀察結果。",
    },
  ],

  reveal: {
    title: "案件一結案：LED 點亮徽章",
    concept:
      "你查出來了：要讓 LED 亮，正極要接腳 A、負極接腳 B；反過來接就不亮，因為 LED 有方向性。而腳 A 正是比較長的那隻腳，所以記住這個重點：LED 的長腳是正極（接電源的＋）。電壓也要適當，大約 3V 附近才正常亮，太低可能只會微亮、太高會過亮甚至損壞。",
    note:
      "本關用的是有保護的直流電電源供應器。真實製作時，LED 不是「接上電壓就好」，還要考慮限流與元件規格。",
    nextHint:
      "你已經知道 LED 要長腳接正極、用適當電壓才會穩定亮。但真正的調光盒不能只靠電源供應器，下一步需要一個能放進作品裡的電源。下一關將解鎖：CR2032 電池與電池座。",
  },
};
