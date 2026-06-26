// 關卡 3：比較 2P 船型開關的方向（船型開關控制任務，SPEC §12）
// 承接關卡 1+2 的 LED + CR2032 電路，加入 2P 船型開關。
// 採「選方向 → 同步呈現鏡射接線」互動；內部規則不外洩。
import { ASPECT, TERMINALS } from "./workbenchAnchors.js";

const W = (pts, col, flow, out = true, dash = false) => ({ pts, col, flow, out, dash });
const RED = "var(--wire-pos)", BLK = "#111";

export default {
  id: "level-3",
  index: 3,
  name: "比較船型開關的方向",
  badge: "switch",
  badgeImg: "assets/badges/badge_switch.png",
  manualWiring: false,

  intro: {
    title: "案件三：比較船型開關的方向",
    situation:
      "現在你有會亮的 LED，也有 CR2032 電池座供電。接下來要讓調光盒可以「被控制」：加入一顆 2P 船型開關。",
    fromPrev:
      "上一關你讓 LED 靠電池座亮起來了。這一關把船型開關接進同一條電路，觀察它換個方向時會發生什麼事。",
    goal:
      "比較船型開關的方向一與方向二，看看兩隻金屬腳對調接入同一條電路時，LED 的測試結果是否改變。",
    howto:
      "先在右邊選開關方向，再按開始測試。兩種方向都測過後，從紀錄比較結果。",
  },

  observation: {
    title: "證物觀察：船型開關",
    intro: "這一關先觀察開關外觀與兩隻金屬腳，測試時只比較開關擺放方向造成的現象。",
    items: [
      {
        img: "assets/switch/switch_off.png",
        label: "船型開關外觀",
        note: "外殼上有開關面，底部有兩個可接線的金屬腳。",
      },
      {
        img: "assets/switch/switch_bottom_pins.png",
        label: "開關腳",
        note: "工作台會把兩個金屬腳標成開關腳 1 / 開關腳 2。",
      },
    ],
  },

  parts: [
    { id: "battery", x: 18, y: 55, w: 18, img: "assets/workbench/battery_holder_plus_top.png", aspect: ASPECT.batteryHolder, terminals: TERMINALS.batteryHolder },
    { id: "switch", x: 49, y: 42, w: 16, img: "assets/workbench/switch_top.png", aspect: ASPECT.switch, terminals: TERMINALS.switch },
    { id: "led", x: 78, y: 44, w: 5.2, kind: "led", aspect: ASPECT.led, terminals: TERMINALS.led, assets: { off: "assets/workbench/led_top.png" } },
  ],
  hotspots: [],
  terminals: [
    { id: "batPos", anchor: "battery.positiveTerminal", label: "接點 A", labelColor: "var(--ink)", labelPos: "up", shape: "circle" },
    { id: "batNeg", anchor: "battery.negativeTerminal", label: "接點 B", labelColor: "var(--ink)", labelPos: "down", shape: "square" },
    { id: "swL", anchor: "switch.pin1Tip", label: "開關 1", labelColor: "var(--ink)", labelPos: "down", shape: "circle" },
    { id: "swR", anchor: "switch.pin2Tip", label: "開關 2", labelColor: "var(--ink)", labelPos: "down", shape: "square" },
    { id: "ledA", anchor: "led.anodeTip", label: "腳 A", labelColor: "var(--ink)", labelPos: "left", shape: "circle", className: "terminal-led" },
    { id: "ledB", anchor: "led.cathodeTip", label: "腳 B", labelColor: "var(--ink)", labelPos: "right", shape: "square", className: "terminal-led" },
  ],
  allowWire: () => false,

  controls: [
    {
      id: "direction", label: "開關方向", type: "chips", viewPart: "switch",
      options: [
        { value: "one", label: "方向一", img: "assets/workbench/switch_top.png", flipX: false },
        { value: "two", label: "方向二", img: "assets/workbench/switch_top.png", flipX: true },
      ],
      default: "one",
    },
  ],

  // 依目前方向，回傳紅黑線路。方向二會鏡射開關圖，並把兩隻開關腳對調接入。
  wiresFor(c, _anchors, P) {
    const flipped = c.direction === "two";
    const swIn = flipped ? P.swR : P.swL;
    const swOut = flipped ? P.swL : P.swR;
    const inSide = flipped ? swIn[0] + 4 : swIn[0] - 4;
    const inLaneY = flipped ? 46 : 62;
    const outSide = flipped ? swOut[0] - 4 : swOut[0] + 4;
    const outWire = flipped
      ? W([swOut, [swOut[0], 62], [outSide, 62], [outSide, 46], [64, 46], [64, P.ledA[1]], P.ledA], RED, true)
      : W([swOut, [swOut[0], 62], [outSide, 62], [outSide, 70], [64, 70], [64, P.ledA[1]], P.ledA], RED, true);
    return [
      W([P.batPos, [32, 36], [32, inLaneY], [inSide, inLaneY], [inSide, 62], [swIn[0], 62], swIn], RED, true),
      outWire,
      W([P.ledB, [84, 66], [84, 76], [18, 76], P.batNeg], BLK, true),
    ];
  },

  // 系統內部判斷（不可外洩）
  rules(ctx) {
    const c = ctx.controls;
    const direction = c.direction === "one" ? "方向一" : "方向二";
    return { complete: true, ledState: "on", observe: "LED 亮起", direction };
  },

  recordOf(ctx, result) {
    return {
      direction: result.direction, observe: result.observe,
      cond: `${result.direction}`,
    };
  },

  requiredRecords: [
    { id: "one", label: "已測試方向一", done: (rs) => rs.some((r) => r.direction === "方向一") },
    { id: "two", label: "已測試方向二", done: (rs) => rs.some((r) => r.direction === "方向二") },
  ],

  reasoning: [
    {
      kind: "evidence",
      prompt: "第一步：挑出能比較兩種開關方向的兩筆紀錄。",
      validate: (p) =>
        p.length === 2 && p[0].direction !== p[1].direction && p[0].observe === p[1].observe,
      fail: "請挑方向一與方向二各一筆，並比較兩筆觀察結果。",
    },
    {
      kind: "choice",
      prompt: "比較方向一與方向二，哪一句最符合你的紀錄？",
      options: [
        { value: "same", label: "兩種方向下 LED 都能亮起" },
        { value: "one", label: "只有方向一能讓 LED 亮起" },
        { value: "two", label: "只有方向二能讓 LED 亮起" },
      ],
      correct: "same",
      fail: "回看兩筆測試紀錄：方向一與方向二的觀察結果是否相同？",
    },
    {
      kind: "choice",
      prompt: "這表示接 2P 船型開關時，兩隻金屬腳應該怎麼看待？",
      options: [
        { value: "either", label: "兩隻腳可以對調接入同一條主路徑" },
        { value: "fixed", label: "只能固定某一隻腳接紅線" },
        { value: "led", label: "要像 LED 一樣分長腳短腳" },
      ],
      correct: "either",
      fail: "方向二已經把開關左右鏡射、兩腳對調接入，看看結果有沒有改變。",
    },
  ],

  reveal: {
    title: "案件三結案：開關控制徽章",
    concept:
      "2P 船型開關本身沒有正負極，兩隻金屬腳對調接入同一條主路徑，測試結果仍然相同。接線時要讓電流經過開關的兩隻腳，方向不需要像 LED 那樣分長短腳。",
    note:
      "紅線仍代表從正極出發，黑線仍代表接回負極；開關兩腳只是讓這條路徑接通或斷開的元件。",
    nextHint:
      "你已經確認 2P 船型開關的兩腳沒有方向性問題。下一關將在這個電路中加入：可變電阻調光功能。",
  },
};
