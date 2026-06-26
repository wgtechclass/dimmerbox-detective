// 極簡 hash 路由
const routes = [];

export function route(pattern, handler) { routes.push({ pattern, handler }); }

export function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

export function render() {
  const hash = location.hash.replace(/^#/, "") || "/";
  for (const r of routes) {
    const m = matchRoute(r.pattern, hash);
    if (m) { r.handler(m); return; }
  }
  // 找不到 → 回首頁
  navigate("#/");
}

function matchRoute(pattern, path) {
  const pp = pattern.split("/").filter(Boolean);
  const xp = path.split("/").filter(Boolean);
  if (pp.length !== xp.length) return null;
  const params = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) params[pp[i].slice(1)] = decodeURIComponent(xp[i]);
    else if (pp[i] !== xp[i]) return null;
  }
  return params;
}

export function startRouter() {
  window.addEventListener("hashchange", render);
  render();
}
