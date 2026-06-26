// 彈出視窗（任務開場 / 結果揭示 / 查表 / 卡關提示）
const root = () => document.getElementById("modal-root");

export function openModal({ title, bodyHTML, actions = [], showClose = true, tape = false }) {
  return new Promise((resolve) => {
    const mask = document.createElement("div");
    mask.className = "modal-mask";
    const acts = actions.map((a, i) =>
      `<button class="btn ${a.variant || ""}" data-i="${i}">${a.label}</button>`).join("");
    mask.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        ${tape ? '<span class="tape"></span>' : ""}
        ${showClose ? '<button class="modal-close" aria-label="關閉">×</button>' : ""}
        ${title ? `<h2>${title}</h2>` : ""}
        <div class="modal-body">${bodyHTML}</div>
        ${actions.length ? `<div class="modal-actions">${acts}</div>` : ""}
      </div>`;

    function close(val) { mask.remove(); document.removeEventListener("keydown", onKey); resolve(val); }
    function onKey(e) { if (e.key === "Escape" && showClose) close(null); }

    mask.addEventListener("click", (e) => { if (e.target === mask && showClose) close(null); });
    mask.querySelector(".modal-close")?.addEventListener("click", () => close(null));
    mask.querySelectorAll(".modal-actions .btn").forEach((b) =>
      b.addEventListener("click", () => {
        const a = actions[+b.dataset.i];
        close(a.value !== undefined ? a.value : a.label);
      }));
    document.addEventListener("keydown", onKey);
    root().appendChild(mask);
  });
}
