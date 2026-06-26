// 徽章定義（徽章頁可顯示學習重點，因為是完成後才看到）
export const BADGES = [
  { id: "led", level: "level-1", name: "LED 點亮徽章", img: "assets/badges/badge_led.png", learn: "LED 有方向性，接法與測試條件都會影響發光。" },
  { id: "power", level: "level-2", name: "電源追蹤徽章", img: "assets/badges/badge_power.png", learn: "CR2032 有正負極，電池座把電力引到外部接點。" },
  { id: "switch", level: "level-3", name: "開關控制徽章", img: "assets/badges/badge_switch.png", learn: "2P 船型開關兩腳沒有正負極，對調接入主路徑仍能使用。" },
  { id: "potentiometer", level: "level-4", name: "調光工程徽章", img: "assets/badges/badge_potentiometer.png", learn: "中間腳配一側腳，旋轉才會改變電阻、改變亮度。" },
  { id: "dimmer", level: "level-5", name: "調光盒達人徽章", img: "assets/badges/badge_dimmer_final.png", learn: "完整迴路＋正確供電＋有效開關＋正確調光，依現象排查故障。" },
];
