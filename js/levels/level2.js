// 關卡 2：追蹤電池的電力出口（CR2032 電源任務，SPEC §11）
// 承接關卡 1 的 LED。內部規則一律不外洩成畫面文案。
import { ASPECT, TERMINALS } from "./workbenchAnchors.js";

export default {
  id: "level-2",
  index: 2,
  name: "追蹤電池的電力出口",
  badge: "power",
  badgeImg: "assets/badges/badge_power.png",

  intro: {
    title: "案件二：追蹤電池的電力出口",
    situation:
      "上一關那顆 LED 你已經會接了。但真正的調光盒要放進作品裡，得用真實電池：CR2032 鈕扣電池 ＋ 電池座。",
    fromPrev:
      "上一關的線索：LED 的長腳（腳 A）要接到正極才會亮。這一關把那顆 LED 帶過來，接到電池座電路測試。",
    goal:
      "試出電池要怎麼放進電池座、電池座的兩個接點要怎麼接到 LED 的兩隻腳，才能讓 LED 亮起來。",
    howto:
      "先在右邊選電池安裝方式，再把電池座接點 A／B 接到 LED 的腳 A／腳 B，按開始測試。",
  },

  observation: {
    title: "證物觀察：CR2032 與電池座",
    intro: "先看真實元件外觀，進入工作台後仍用接點 A / 接點 B 做測試記錄。",
    items: [
      {
        img: "assets/battery/battery_install_correct.png",
        label: "安裝方式一",
        note: "外側可看見 CR2032 字樣與 ＋ 符號。",
      },
      {
        img: "assets/battery/battery_install_wrong.png",
        label: "安裝方式二",
        note: "外側看不到電池上的字樣，接點仍以 A / B 標示。",
      },
    ],
  },

  parts: [
    {
      id: "holder", x: 25, y: 55, w: 22, img: "assets/workbench/battery_holder_plus_top.png",
      aspect: ASPECT.batteryHolder,
      terminals: TERMINALS.batteryHolder,
    },
    {
      id: "led", x: 70, y: 40, w: 8.4, kind: "led",
      aspect: ASPECT.led,
      terminals: TERMINALS.led,
      assets: { off: "assets/workbench/led_top.png" },
    },
  ],

  // 電池座在左（接點 A／B），LED 直立放大在右（腳 A／腳 B）。
  // 接點只標示中性名稱，不標示正負極。
  hotspots: [
    { id: "contactA", anchor: "holder.positiveTerminal", group: "source", lane: "top", wireColor: "var(--wire-pos)", label: "接點 A", labelColor: "var(--ink)", labelPos: "up", shape: "circle" },
    { id: "contactB", anchor: "holder.negativeTerminal", group: "source", lane: "bot", wireColor: "#111", label: "接點 B", labelColor: "var(--ink)", labelPos: "down", shape: "square" },
    { id: "ledA", anchor: "led.anodeTip", group: "led", label: "腳 A", labelColor: "var(--ink)", labelPos: "left", shape: "circle", className: "terminal-led" },
    { id: "ledB", anchor: "led.cathodeTip", group: "led", label: "腳 B", labelColor: "var(--ink)", labelPos: "right", shape: "square", className: "terminal-led" },
  ],
  manualSingleRoutes: [
    { pair: ["contactA", "ledA"], pts: ["contactA", [40, 35.8], [40, 24], [60, 24], [60, 74], [68.66, 74], [68.66, 70.9], "ledA"], col: "var(--wire-pos)", out: true },
    { pair: ["contactA", "ledB"], pts: ["contactA", [40, 35.8], [40, 24], [88, 24], [88, 58.38], [74.4, 58.38], "ledB"], col: "var(--wire-pos)", out: true },
    { pair: ["contactB", "ledA"], pts: ["contactB", [25, 86], [68.66, 86], [68.66, 70.9], "ledA"], col: "#111", out: false },
    { pair: ["contactB", "ledB"], pts: ["contactB", [25, 86], [88, 86], [88, 58.38], [74.4, 58.38], "ledB"], col: "#111", out: false },
  ],
  manualRouteSets: [
    {
      pairs: [["contactA", "ledA"], ["contactB", "ledB"]],
      wires: [
        { pts: ["contactA", [40, 35.8], [40, 24], [60, 24], [60, 74], [68.66, 74], [68.66, 70.9], "ledA"], col: "var(--wire-pos)", out: true },
        { pts: ["contactB", [25, 86], [88, 86], [88, 58.38], [74.4, 58.38], "ledB"], col: "#111", out: false },
      ],
    },
    {
      pairs: [["contactA", "ledB"], ["contactB", "ledA"]],
      wires: [
        { pts: ["contactA", [40, 35.8], [40, 24], [88, 24], [88, 58.38], [74.4, 58.38], "ledB"], col: "var(--wire-pos)", out: true },
        { pts: ["contactB", [25, 86], [68.66, 86], [68.66, 70.9], "ledA"], col: "#111", out: false },
      ],
    },
  ],
  allowWire: (a, b) => a.group !== b.group,

  controls: [
    {
      id: "install", label: "電池安裝方式", type: "chips", viewPart: "holder",
      options: [
        { value: "one", label: "安裝方式一", img: "assets/workbench/battery_holder_plus_top.png" },
        { value: "two", label: "安裝方式二", img: "assets/workbench/battery_holder_plain_top.png" },
      ],
      default: "one",
    },
  ],

  // 系統內部判斷（不可外洩）：方式一→接點A為正極；LED腳A為正向。
  // 亮的組合 = 方式一 + 接法 A（接點A接腳A、接點B接腳B）。
  rules(ctx) {
    const { connections, controls } = ctx;
    const has = (x, y) => connections.some(
      (c) => (c.from === x && c.to === y) || (c.from === y && c.to === x));
    const wayA = has("contactA", "ledA") && has("contactB", "ledB");
    const wayB = has("contactA", "ledB") && has("contactB", "ledA");
    const inst = controls.install === "one" ? "一" : "二";
    if (!wayA && !wayB) return { complete: false, ledState: "off", observe: "尚未形成完整接線" };
    const way = wayA ? "A" : "B";
    const lit = controls.install === "one" && wayA;
    return { complete: true, ledState: lit ? "on" : "off", observe: lit ? "LED 亮起" : "LED 不亮", 安裝: inst, 接法: way };
  },

  recordOf(ctx, result) {
    return {
      安裝: result.安裝, 接法: result.接法, observe: result.observe,
      cond: `安裝方式${result.安裝}，接法 ${result.接法}`,
    };
  },

  requiredRecords: [
    {
      id: "instCompare", label: "已取得一組只改安裝方式、結果可比較的紀錄",
      done: (rs) => {
        return rs.some((a) => rs.some((b) =>
          a.接法 === b.接法 && a.安裝 !== b.安裝 && a.observe !== b.observe));
      },
    },
    {
      id: "wayCompare", label: "已取得一組只改接法、結果可比較的紀錄",
      done: (rs) => {
        return rs.some((a) => rs.some((b) =>
          a.安裝 === b.安裝 && a.接法 !== b.接法 && a.observe !== b.observe));
      },
    },
    { id: "lit", label: "已成功讓 LED 亮起至少一次", done: (rs) => rs.some((r) => r.observe === "LED 亮起") },
  ],

  reasoning: [
    {
      kind: "evidence",
      prompt: "第一步：挑出能證明「電池安裝方式會影響亮不亮」的兩筆紀錄（接法相同、安裝方式不同、結果不同）。",
      validate: (p) =>
        p.length === 2 && p[0].接法 === p[1].接法 && p[0].安裝 !== p[1].安裝 && p[0].observe !== p[1].observe,
      fail: "這兩筆的接法要相同、只有安裝方式不同，而且一筆亮、一筆不亮。",
    },
    {
      kind: "choice",
      prompt: "根據紀錄，哪一種電池安裝方式能讓 LED 亮起來？",
      options: [
        { value: "one", label: "安裝方式一（看得到 CR2032 與 ＋）" },
        { value: "two", label: "安裝方式二（看不到 CR2032 與 ＋）" },
      ],
      correct: "one",
      fail: "看紀錄：哪一種安裝方式的結果出現過「LED 亮起」？",
    },
    {
      kind: "choice",
      prompt: "能讓 LED 亮的安裝方式一，是「看得到 CR2032 與 ＋」的那一面朝外。看得到 ＋ 的這一面，是電池的哪一極？",
      options: [
        { value: "pos", label: "正極" },
        { value: "neg", label: "負極" },
      ],
      correct: "pos",
      fail: "電池上標示 ＋ 的那一面，就是正極面。",
    },
    {
      kind: "evidence",
      prompt: "第二步：挑出能證明「接點和腳位要正確配合」的兩筆紀錄（安裝方式相同、接法不同、結果不同）。",
      validate: (p) =>
        p.length === 2 && p[0].安裝 === p[1].安裝 && p[0].接法 !== p[1].接法 && p[0].observe !== p[1].observe,
      fail: "這兩筆的安裝方式要相同、只有接法不同，而且一筆亮、一筆不亮。",
    },
    {
      kind: "choice",
      prompt: "回看 LED 亮起的那筆紀錄：哪一個電池座接點接到了 LED 的腳 A？",
      options: [
        { value: "contactA", label: "接點 A" },
        { value: "contactB", label: "接點 B" },
      ],
      correct: "contactA",
      fail: "找觀察結果是「LED 亮起」的那筆紀錄，再看它是哪一種接法。",
    },
    {
      kind: "choice",
      prompt: "上一關你知道 LED 腳 A 要接到電源的正端才會亮。把兩個線索合起來，電池座哪個接點把正端引出來？",
      options: [
        { value: "contactA", label: "接點 A" },
        { value: "contactB", label: "接點 B" },
      ],
      correct: "contactA",
      fail: "亮起那筆紀錄中，LED 腳 A 接到哪個電池座接點？再連回上一關的發現。",
    },
  ],

  reveal: {
    title: "案件二結案：電源追蹤徽章",
    concept:
      "CR2032 有正負極，看得到 CR2032 與 ＋ 的那一面就是正極面。電池座會把電池的正負極引到外部接點。你用紀錄推論出：在安裝方式一時，接點 A 會把正端引出來。要讓 LED 亮起，電池要正確安裝，而且電池座接點要和 LED 腳位正確配合，讓 LED 的長腳接到正極那一端。",
    note:
      "電池有沒有卡穩、接觸好不好，會留到最後的總裝任務再處理。",
    nextHint:
      "你已經建立調光盒的電源模組，LED 可以靠 CR2032 電池座供電了。但作品還需要能控制亮與不亮。下一關將在這個電路中加入：2P 船型開關。",
  },
};
