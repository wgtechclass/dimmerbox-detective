// 關卡 5：讓調光盒正常運作（總裝修正任務，SPEC §14）
// 單一完整總裝場景（非多個故障案件）。學生在同一場景反覆調整、測試、修正。
// 總裝診斷：能亮 → 能調光。內部規則不外洩。
import { ASPECT, TERMINALS } from "./workbenchAnchors.js";

const W = (pts, col, flow, out = true, dash = false, extra = {}) => ({ pts, col, flow, out, dash, ...extra });
const RED = "var(--wire-pos)", BLK = "#111";
const barOf = (b) => (b < 0.45 ? "▂" : b < 0.82 ? "▅" : "█");

export default {
  id: "level-5",
  index: 5,
  name: "讓調光盒正常運作",
  badge: "dimmer",
  badgeImg: "assets/badges/badge_dimmer_final.png",
  manualWiring: false,

  intro: {
    title: "案件五：讓調光盒正常運作",
    situation:
      "最後一件案子。所有元件都在桌上了：CR2032 電池座、LED、船型開關、可變電阻。但這台調光盒現在不正常。",
    fromPrev:
      "前四關你學到的：電池要正確安裝、LED 長腳接正極、2P 船型開關兩腳沒有方向性問題、可變電阻要用中間腳配側腳。這一關要把它們全部整合起來。",
    goal:
      "調整各個設定、反覆測試，讓調光盒做到兩件事：能亮、能用旋鈕調整亮度。",
    howto:
      "依「能亮 → 能調光」逐一檢查。每次只改一個地方，按開始測試看現象，再決定下一步修哪裡。",
  },

  hint: `<p><b>總裝診斷，一步一步來：</b></p>
    <p class="hint-line">① 能不能亮？若完全不亮，先檢查電池方向、LED 接法。<br>
    ② 能不能調光？轉旋鈕看亮度有沒有變；沒變就檢查可變電阻腳位。</p>`,

  observation: {
    title: "證物觀察：總裝元件",
    intro: "最後一關會把前面看過的元件放在同一張工作台上。先確認每個元件的可觀察特徵與中性標籤。",
    items: [
      {
        img: "assets/battery/battery_install_correct.png",
        label: "CR2032 與電池座",
        note: "工作台會用接點 A / 接點 B 標示電池座接線位置。",
      },
      {
        img: "assets/led/led_off.png",
        label: "LED",
        note: "兩隻腳長度不同，工作台會用腳 A / 腳 B 標示。",
      },
      {
        img: "assets/switch/switch_bottom_pins.png",
        label: "船型開關",
        note: "底部兩個金屬腳會標成開關腳 1 / 開關腳 2。",
      },
      {
        img: "assets/potentiometer/potentiometer_pins.png",
        label: "可變電阻",
        note: "三隻腳會標成腳 1 / 腳 2 / 腳 3。",
      },
    ],
  },

  parts: [
    { id: "battery", x: 13, y: 55, w: 15, img: "assets/workbench/battery_holder_plain_top.png", aspect: ASPECT.batteryHolder, terminals: TERMINALS.batteryHolder },
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
    { id: "pot1", anchor: "pot.pin1Tip", label: "腳 1", labelColor: "var(--ink)", labelPos: "down", shape: "circle" },
    { id: "pot2", anchor: "pot.pin2Tip", label: "腳 2", labelColor: "var(--ink)", labelPos: "down", shape: "circle" },
    { id: "pot3", anchor: "pot.pin3Tip", label: "腳 3", labelColor: "var(--ink)", labelPos: "down", shape: "square" },
    { id: "ledA", anchor: "led.anodeTip", label: "腳 A", labelColor: "var(--ink)", labelPos: "left", shape: "circle", className: "terminal-led" },
    { id: "ledB", anchor: "led.cathodeTip", label: "腳 B", labelColor: "var(--ink)", labelPos: "right", shape: "square", className: "terminal-led" },
  ],
  allowWire: () => false,
  wireLanes: { top: 14, bot: 82 },

  controls: [
    {
      id: "bat", label: "電池安裝方式", type: "chips", viewPart: "battery",
      options: [
        { value: "ok", label: "方式一", img: "assets/workbench/battery_holder_plus_top.png" },
        { value: "bad", label: "方式二", img: "assets/workbench/battery_holder_plain_top.png" },
      ],
      default: "bad",
    },
    {
      id: "led", label: "LED 接法", type: "chips",
      options: [{ value: "ok", label: "接法甲" }, { value: "bad", label: "接法乙" }],
      default: "ok",
    },
    {
      id: "pot", label: "可變電阻腳位", type: "chips",
      options: [{ value: "ok", label: "中間腳＋側腳" }, { value: "outer", label: "只接外側兩腳" }],
      default: "outer",
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

  // 全部接成同一條主路徑（電池→開關→可變電阻→LED→電池）
  wiresFor(c, _anchors, P) {
    const lit = c.bat !== "bad" && c.led !== "bad";
    const potIn = c.pot === "ok" ? P.pot2 : P.pot1;
    const potOut = P.pot3;
    return [
      W([P.batPos, [22, 36], [22, 64], [P.swIn[0], 64], P.swIn], RED, lit),
      W([P.swOut, [P.swOut[0], 64], [43, 64], [43, 72], [potIn[0], 72], potIn], RED, lit),
      W([potOut, [potOut[0], 76], [P.ledA[0], 76], P.ledA], RED, lit),
      W([P.ledB, [87, 62], [87, 82], [13, 82], P.batNeg], BLK, lit),
    ];
  },

  // 系統內部判斷（SPEC §14.9，不可外洩）
  rules(ctx) {
    const c = ctx.controls;
    const base = { complete: true, bat: c.bat, led: c.led, pot: c.pot, knob: c.knob };
    // 完全不亮：電池方向錯 或 LED 接法錯
    if (c.bat === "bad" || c.led === "bad") return { ...base, ledState: "off", bright: 0, observe: "完全不亮" };
    // 亮著 → 調光
    const knobIdx = ["一", "二", "三"].indexOf(c.knob);
    const b = c.pot === "ok" ? [0.3, 0.62, 1.0][knobIdx] : 0.78;
    return { ...base, ledState: "on", bright: b, observe: `LED 亮起，亮度 ${barOf(b)}` };
  },

  recordOf(ctx, result) {
    const r = result;
    const bat = r.bat === "ok" ? "方式一" : "方式二";
    const led = r.led === "ok" ? "接法甲" : "接法乙";
    const pot = r.pot === "ok" ? "中間+側" : "外側";
    return {
      bat: r.bat, led: r.led, pot: r.pot, knob: r.knob,
      ledState: r.ledState, bright: r.bright, observe: r.observe,
      cond: `${bat}・${led}・電阻${pot}・旋鈕${r.knob}`,
    };
  },

  // 功能驗證（全部通過才可結案）
  requiredRecords: [
    { id: "off", label: "① 已取得一筆完全不亮的診斷紀錄", done: (rs) => rs.some((r) => r.ledState === "off") },
    {
      id: "stuck", label: "② 已取得一組亮著但旋鈕無法改變亮度的紀錄",
      done: (rs) => {
        const fixed = rs.filter((r) => r.ledState === "on" && r.pot === "outer");
        return new Set(fixed.map((r) => r.knob)).size >= 2 &&
          new Set(fixed.map((r) => r.bright)).size === 1;
      },
    },
    { id: "lit", label: "③ 已讓 LED 穩定亮起（能亮）", done: (rs) => rs.some((r) => r.ledState === "on") },
    {
      id: "dim", label: "④ 已用旋鈕改變亮度（能調光）",
      done: (rs) => new Set(rs.filter((r) => r.pot === "ok" && r.ledState === "on").map((r) => r.bright)).size >= 2,
    },
  ],

  reasoning: [
    {
      kind: "multi",
      prompt: "你讓調光盒正常運作了。根據你的測試結果，哪些功能可以確定已經通過？（可複選）",
      options: [
        { value: "lit", label: "LED 可以亮" },
        { value: "dim", label: "旋鈕可以改變亮度" },
        { value: "battery", label: "電池一定不會沒電" },
        { value: "burn", label: "LED 一定不會燒壞" },
      ],
      correct: ["lit", "dim"],
      fail: "只勾「你測試時真的驗證過」的功能。電池會不會沒電、LED 會不會燒壞，這次測試沒辦法證明。",
    },
    {
      kind: "choice",
      prompt: "當 LED 完全不亮時，你會優先檢查哪些地方？",
      options: [
        { value: "power", label: "電池方向與 LED 接法" },
        { value: "knob", label: "旋鈕轉到第幾段" },
        { value: "pot", label: "可變電阻接哪兩隻腳" },
      ],
      correct: "power",
      fail: "回想：完全不亮通常是供電或 LED 方向出問題，先從這兩個查起。",
    },
    {
      kind: "choice",
      prompt: "當 LED 會亮、但旋鈕怎麼轉亮度都不太變時，最可能是哪裡的問題？",
      options: [
        { value: "pot", label: "可變電阻只接到固定阻值的兩端" },
        { value: "battery", label: "電池快沒電了" },
        { value: "led", label: "LED 接反了" },
      ],
      correct: "pot",
      fail: "回看可變電阻腳位紀錄：哪一種接法轉旋鈕時亮度沒有明顯改變？",
    },
  ],

  reveal: {
    title: "案件五結案：調光盒達人徽章",
    concept:
      "調光盒要正常運作，必須同時做到：電池正確供電、LED 長腳接正極、可變電阻用中間腳配側腳。任何一項出錯，都會從現象反映出來。電路故障時，要依「能亮 → 能調光」逐步排查，從現象回推原因。",
    note:
      "你已經能判斷 LED 方向、電池供電、可變電阻調光與常見故障原因。",
    nextHint:
      "你已完成調光盒的核心電路任務。接下來可以進入真實調光盒實作了！",
  },
};
