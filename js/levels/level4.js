// 關卡 4：找出可以調光的接法（可變電阻調光任務，SPEC §13）
// 承接 LED+電池+開關電路，加入可變電阻（3 腳 + 旋鈕）。
// 採「選腳位組合 + 轉旋鈕 → 同步呈現接線」互動；內部規則不外洩。
import { ASPECT, TERMINALS } from "./workbenchAnchors.js";

const W = (pts, col, flow, out = true) => ({ pts, col, flow, out });
const RED = "var(--wire-pos)", BLK = "#111";

// 腳位組合 → 接入主路徑的兩隻腳
const PAIR = { "12": ["leg1", "leg2"], "23": ["leg2", "leg3"], "13": ["leg1", "leg3"] };

function brightOf(combo, knobIdx) {
  if (combo === "13") return 0.75;               // 只接外側兩腳：固定阻值，轉旋鈕不變
  if (combo === "12") return [0.3, 0.62, 1.0][knobIdx]; // 中間腳+左腳：越轉越亮
  return [1.0, 0.62, 0.3][knobIdx];              // 中間腳+右腳：方向相反
}
const barOf = (b) => (b < 0.45 ? "▂" : b < 0.82 ? "▅" : "█");

export default {
  id: "level-4",
  index: 4,
  name: "找出可以調光的接法",
  badge: "potentiometer",
  badgeImg: "assets/badges/badge_potentiometer.png",
  manualWiring: false,

  intro: {
    title: "案件四：找出可以調光的接法",
    situation:
      "你的調光盒現在已經加入 2P 船型開關。最後一個功能：調整亮度。這要靠可變電阻。",
    fromPrev:
      "上一關你確認 2P 船型開關兩隻腳對調接入主路徑，測試結果仍然相同。這一關把可變電阻接進同一個電路，找出怎麼接、轉旋鈕才會改變亮度。",
    goal:
      "可變電阻有三隻腳（腳 1、腳 2、腳 3）。試不同的兩腳組合並轉動旋鈕，找出哪一種組合轉旋鈕時 LED 亮度會改變。",
    howto:
      "先在右邊選一種腳位組合，再轉動旋鈕到不同位置，按開始測試，觀察亮度條的變化。",
  },

  observation: {
    title: "證物觀察：可變電阻",
    intro: "先觀察可變電阻的旋鈕與三隻腳，工作台會用腳 1 / 腳 2 / 腳 3 標示可接位置。",
    items: [
      {
        img: "assets/potentiometer/potentiometer_front.png",
        label: "可變電阻正面",
        note: "上方有可旋轉的旋鈕，下方有三隻金屬腳。",
      },
      {
        img: "assets/potentiometer/potentiometer_pins.png",
        label: "三隻腳",
        note: "從左到右在工作台標成腳 1 / 腳 2 / 腳 3。",
      },
    ],
  },

  parts: [
    { id: "battery", x: 13, y: 55, w: 15, img: "assets/workbench/battery_holder_plus_top.png", aspect: ASPECT.batteryHolder, terminals: TERMINALS.batteryHolder },
    { id: "switch", x: 32, y: 42, w: 12, img: "assets/workbench/switch_on_top.png", aspect: ASPECT.switch, terminals: TERMINALS.switch },
    { id: "pot", x: 56, y: 44, w: 17, img: "assets/workbench/potentiometer_knob_1_top.png", aspect: ASPECT.potentiometer, terminals: TERMINALS.potentiometer },
    { id: "led", x: 83, y: 44, w: 4.6, kind: "led", aspect: ASPECT.led, terminals: TERMINALS.led, assets: { off: "assets/workbench/led_top.png" } },
  ],
  hotspots: [],
  terminals: [
    { id: "batPos", anchor: "battery.positiveTerminal", label: "接點 A", labelColor: "var(--ink)", labelPos: "up", shape: "circle" },
    { id: "batNeg", anchor: "battery.negativeTerminal", label: "接點 B", labelColor: "var(--ink)", labelPos: "down", shape: "square" },
    { id: "swIn", anchor: "switch.pin1Tip", label: "開關 1", labelColor: "var(--ink)", labelPos: "down", shape: "circle" },
    { id: "swOut", anchor: "switch.pin2Tip", label: "開關 2", labelColor: "var(--ink)", labelPos: "down", shape: "square" },
    { id: "leg1", anchor: "pot.pin1Tip", label: "腳 1", labelColor: "var(--ink)", labelPos: "down", shape: "circle" },
    { id: "leg2", anchor: "pot.pin2Tip", label: "腳 2", labelColor: "var(--ink)", labelPos: "down", shape: "circle" },
    { id: "leg3", anchor: "pot.pin3Tip", label: "腳 3", labelColor: "var(--ink)", labelPos: "down", shape: "square" },
    { id: "ledA", anchor: "led.anodeTip", label: "腳 A", labelColor: "var(--ink)", labelPos: "left", shape: "circle", className: "terminal-led" },
    { id: "ledB", anchor: "led.cathodeTip", label: "腳 B", labelColor: "var(--ink)", labelPos: "right", shape: "square", className: "terminal-led" },
  ],
  allowWire: () => false,

  controls: [
    {
      id: "combo", label: "腳位組合", type: "chips",
      options: [
        { value: "12", label: "腳 1 + 腳 2" },
        { value: "23", label: "腳 2 + 腳 3" },
        { value: "13", label: "腳 1 + 腳 3" },
      ],
      default: "12",
    },
    {
      id: "knob", label: "旋鈕位置", type: "slider", viewPart: "pot",
      options: [
        { value: "一", label: "位置一", img: "assets/workbench/potentiometer_knob_1_top.png" },
        { value: "二", label: "位置二", img: "assets/workbench/potentiometer_knob_2_top.png" },
        { value: "三", label: "位置三", img: "assets/workbench/potentiometer_knob_3_top.png" },
      ],
      default: "一",
    },
  ],

  wiresFor(c, _anchors, P) {
    const [xId, yId] = PAIR[c.combo];
    const x = P[xId], y = P[yId];
    return [
      W([P.batPos, [22, 36], [22, 64], [P.swIn[0], 64], P.swIn], RED, true),
      W([P.swOut, [P.swOut[0], 64], [43, 64], [43, 72], [x[0], 72], x], RED, true),
      W([y, [y[0], 76], [P.ledA[0], 76], P.ledA], RED, true),
      W([P.ledB, [87, 62], [87, 82], [13, 82], P.batNeg], BLK, true),
    ];
  },

  // 系統內部判斷（不可外洩）
  rules(ctx) {
    const c = ctx.controls;
    const knobIdx = ["一", "二", "三"].indexOf(c.knob);
    const b = brightOf(c.combo, knobIdx);
    return {
      complete: true, ledState: "on", brightness: b,
      observe: `LED 亮起，亮度 ${barOf(b)}`,
      combo: c.combo, knob: c.knob, bright: b,
    };
  },

  recordOf(ctx, result) {
    const label = { "12": "腳 1 + 腳 2", "23": "腳 2 + 腳 3", "13": "腳 1 + 腳 3" }[result.combo];
    return {
      combo: result.combo, knob: result.knob, bright: result.bright, observe: result.observe,
      cond: `${label}，旋鈕${result.knob}`,
    };
  },

  requiredRecords: [
    {
      id: "combos", label: "三種腳位組合都已各測過至少兩個旋鈕位置",
      done: (rs) => {
        const byCombo = group(rs);
        return ["12", "23", "13"].every((combo) =>
          new Set((byCombo[combo] || []).map((r) => r.knob)).size >= 2);
      },
    },
    {
      id: "changed", label: "已取得一組旋鈕位置改變、亮度也改變的紀錄",
      done: (rs) => Object.values(group(rs)).some((g) => new Set(g.map((r) => r.bright)).size >= 2),
    },
    {
      id: "same", label: "已取得一組旋鈕位置改變、亮度沒有改變的紀錄",
      done: (rs) => Object.values(group(rs)).some((g) => g.length >= 2 && new Set(g.map((r) => r.knob)).size >= 2 && new Set(g.map((r) => r.bright)).size === 1),
    },
  ],

  reasoning: [
    {
      kind: "evidence",
      prompt: "第一步：挑出能證明「轉旋鈕真的會改變亮度」的兩筆紀錄（同一種腳位組合，旋鈕位置不同，亮度不同）。",
      validate: (p) =>
        p.length === 2 && p[0].combo === p[1].combo && p[0].knob !== p[1].knob && p[0].bright !== p[1].bright,
      fail: "找同一種腳位組合、旋鈕兩個不同位置，而且兩筆亮度不一樣。",
    },
    {
      kind: "evidence",
      prompt: "第二步：挑出能證明「轉旋鈕亮度幾乎不變」的兩筆紀錄（同一種腳位組合，旋鈕位置不同，亮度卻一樣）。",
      validate: (p) =>
        p.length === 2 && p[0].combo === p[1].combo && p[0].knob !== p[1].knob && p[0].bright === p[1].bright,
      fail: "找同一種腳位組合、旋鈕兩個不同位置，但兩筆亮度一樣。",
    },
    {
      kind: "choice",
      prompt: "根據紀錄，可變電阻要怎麼接，轉旋鈕才能調整亮度？",
      options: [
        { value: "mid", label: "用中間腳（腳 2）加上其中一側的腳" },
        { value: "outer", label: "接最外面的兩隻腳（腳 1 + 腳 3）" },
        { value: "any", label: "隨便接哪兩隻腳都可以" },
      ],
      correct: "mid",
      fail: "看哪些組合轉旋鈕亮度會變：它們有沒有用到中間那隻腳？",
    },
    {
      kind: "choice",
      prompt: "如果只接最外面兩隻腳（腳 1 + 腳 3），轉旋鈕時會怎樣？",
      options: [
        { value: "nochange", label: "LED 會亮，但轉旋鈕亮度幾乎不變" },
        { value: "off", label: "LED 完全不亮" },
        { value: "dim", label: "亮度會隨旋鈕大幅改變" },
      ],
      correct: "nochange",
      fail: "回看腳 1 + 腳 3 那幾筆紀錄：LED 有亮嗎？轉旋鈕亮度有變嗎？",
    },
  ],

  reveal: {
    title: "案件四結案：調光工程徽章",
    concept:
      "可變電阻有三隻腳。要調光，通常要用中間腳（腳 2）加上其中一側的腳；旋轉旋鈕時，會改變中間腳與側邊腳之間的電阻大小，進而改變 LED 亮度。如果只接最外面兩隻腳（腳 1 + 腳 3），阻值是固定的，LED 會亮但轉旋鈕幾乎不會調光。",
    note:
      "用中間腳配左腳或配右腳都能調光，只是亮度變化的方向可能相反。",
    nextHint:
      "你已經掌握調光盒的亮度控制方式。現在你擁有 LED、電源、開關與調光元件。最後一關要把所有元件整合在同一個場景中，完成真正的調光盒主電路。",
  },
};

function group(rs) {
  const g = {};
  rs.forEach((r) => { (g[r.combo] = g[r.combo] || []).push(r); });
  return g;
}
