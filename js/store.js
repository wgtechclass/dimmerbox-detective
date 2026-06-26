// 全域進度狀態 + localStorage（SPEC §19.4）
const KEY = "dimmerbox.progress.v1";
const ALL_LEVELS = ["level-1", "level-2", "level-3", "level-4", "level-5"];

const DEFAULT = {
  completedLevels: [],
  unlockedLevels: ["level-1"],
  badges: [],
  lastPlayedLevel: "level-1",
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return structuredClone(DEFAULT);
}

let state = load();

function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

export const store = {
  get() { return state; },
  isUnlocked(id) { return state.unlockedLevels.includes(id); },
  isCompleted(id) { return state.completedLevels.includes(id); },
  hasBadge(b) { return state.badges.includes(b); },
  allLevels() { return ALL_LEVELS; },

  setLastPlayed(id) { state.lastPlayedLevel = id; save(); },

  completeLevel(id, badge) {
    if (!state.completedLevels.includes(id)) state.completedLevels.push(id);
    if (badge && !state.badges.includes(badge)) state.badges.push(badge);
    // 解鎖下一關
    const idx = ALL_LEVELS.indexOf(id);
    const next = ALL_LEVELS[idx + 1];
    if (next && !state.unlockedLevels.includes(next)) state.unlockedLevels.push(next);
    save();
  },

  reset() { state = structuredClone(DEFAULT); save(); },
};
