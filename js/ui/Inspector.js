// 子母畫面：放大鏡檢視元件（點元件 → 角落小窗放大）
export function createInspector(mountEl) {
  const box = document.createElement("div");
  box.className = "inspector";
  box.innerHTML = `
    <div class="inspector-head"><span>🔍 放大檢視</span><span class="insp-close" style="cursor:pointer">×</span></div>
    <div class="inspector-body"><span class="inspector-hint">點工作台上的元件可放大看清楚</span></div>`;
  mountEl.appendChild(box);
  const body = box.querySelector(".inspector-body");
  box.querySelector(".insp-close").addEventListener("click", () => {
    body.innerHTML = `<span class="inspector-hint">點工作台上的元件可放大看清楚</span>`;
  });
  return {
    show(src, caption = "") {
      body.innerHTML = `<img src="${src}" alt="放大檢視" />` +
        (caption ? `<div class="inspector-hint">${caption}</div>` : "");
    },
  };
}
