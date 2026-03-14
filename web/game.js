const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const offlineBtn = document.getElementById("offlineBtn");
const authStatus = document.getElementById("authStatus");
const modeSelect = document.getElementById("modeSelect");
const mapSelect = document.getElementById("mapSelect");
const mpToggle = document.getElementById("mpToggle");

const dailyRewardText = document.getElementById("dailyRewardText");
const claimDailyBtn = document.getElementById("claimDaily");
const claimDailyBtn2 = document.getElementById("claimDaily2");
const dailyStatus = document.getElementById("dailyStatus");

const topbar = document.getElementById("topbar");
const levelChip = document.getElementById("levelChip");
const xpFill = document.getElementById("xpFill");
const coinsChip = document.getElementById("coinsChip");
const gemsChip = document.getElementById("gemsChip");
const powerChip = document.getElementById("powerChip");
const profileBtn = document.getElementById("profileBtn");
const storeBtn = document.getElementById("storeBtn");

const panelProfile = document.getElementById("panelProfile");
const panelStore = document.getElementById("panelStore");
const closeProfile = document.getElementById("closeProfile");
const closeStore = document.getElementById("closeStore");
const profileSummary = document.getElementById("profileSummary");
const missionsList = document.getElementById("missionsList");
const battlePass = document.getElementById("battlePass");
const battlePassTrack = document.getElementById("battlePassTrack");
const inventoryList = document.getElementById("inventoryList");
const storeList = document.getElementById("storeList");
const storeStatus = document.getElementById("storeStatus");

const summaryPanel = document.getElementById("summary");
const summaryTitle = document.getElementById("summaryTitle");
const summaryStats = document.getElementById("summaryStats");
const summaryBtn = document.getElementById("summaryBtn");
const toast = document.getElementById("toast");

const hudHealth = document.getElementById("health");
const hudArmor = document.getElementById("armor");
const hudWeapon = document.getElementById("weapon");
const hudAmmo = document.getElementById("ammo");
const hudVehicle = document.getElementById("vehicle");
const hudRemain = document.getElementById("remain");
const warmupPanel = document.getElementById("warmup");
const warmupText = document.getElementById("warmupText");
const killfeed = document.getElementById("killfeed");
const actionHeal = document.getElementById("actionHeal");
const actionSwap = document.getElementById("actionSwap");
const actionCapture = document.getElementById("actionCapture");

let dpr = Math.max(1, window.devicePixelRatio || 1);
let audioCtx = null;
let audioMaster = null;

const urlParams = new URLSearchParams(window.location.search);
const apiParam = urlParams.get("api");
const wsParam = urlParams.get("ws");
const AUTO_START = urlParams.get("autostart") === "1";
if (apiParam) localStorage.setItem("spnet_api", apiParam);
if (wsParam) localStorage.setItem("spnet_ws", wsParam);

const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const DEFAULT_API = IS_LOCAL ? "http://localhost:8787" : `${window.location.protocol}//${window.location.host}`;
const API_BASE = localStorage.getItem("spnet_api") || DEFAULT_API;
let authToken = localStorage.getItem("spnet_token") || "";
let onlineMode = false;

const WORLD = { w: 2000, h: 2000 };
const WORLD_CENTER = { x: WORLD.w / 2, y: WORLD.h / 2 };

const TRAITS = {
  swift: { name: "Trailblazer", speedMult: 1.1, maxHealthAdd: 0 },
  bulwark: { name: "Bulwark", speedMult: 1.0, maxHealthAdd: 20 },
  sensor: { name: "Sensorist", speedMult: 1.0, maxHealthAdd: 0 },
  medic: { name: "Medicall", speedMult: 1.0, maxHealthAdd: 0 },
};

const WEAPONS = [
  { id: "Rift-19", type: "AR", fireRate: 9, damage: 14, speed: 720, spread: 0.045, range: 700, mag: 30, reserve: 120, reload: 1.7 },
  { id: "Viper-K", type: "SMG", fireRate: 13, damage: 10, speed: 650, spread: 0.065, range: 520, mag: 35, reserve: 140, reload: 1.5 },
  { id: "Grave-12", type: "SG", fireRate: 1.1, damage: 48, speed: 580, spread: 0.18, range: 260, mag: 6, reserve: 30, reload: 2.3 },
  { id: "Siren-12", type: "DMR", fireRate: 3.5, damage: 28, speed: 860, spread: 0.03, range: 820, mag: 14, reserve: 60, reload: 2.1 },
  { id: "Warden", type: "SN", fireRate: 0.8, damage: 85, speed: 980, spread: 0.015, range: 1100, mag: 5, reserve: 25, reload: 2.6 },
  { id: "Bearclaw", type: "LMG", fireRate: 8, damage: 16, speed: 680, spread: 0.06, range: 700, mag: 60, reserve: 180, reload: 2.8 },
];

const ATTACHMENTS = [
  { id: "att_stability", name: "Stability Grip", spreadMult: 0.78 },
  { id: "att_scope", name: "Tactical Scope", rangeMult: 1.12 },
  { id: "att_extended", name: "Extended Mag", magAdd: 12 },
  { id: "att_quick", name: "Quick Reload", reloadMult: 0.85 },
  { id: "att_tuned", name: "Tuned Trigger", fireRateMult: 1.08 },
  { id: "att_rifled", name: "Rifled Barrel", damageMult: 1.05 },
];

const MODES = {
  classic: { name: "Classic", botCount: 28, lootCount: 55, vehicleRate: 0.06, phaseScale: 1, zoneDamage: 14 },
  blitz: { name: "Blitz", botCount: 18, lootCount: 42, vehicleRate: 0.08, phaseScale: 0.7, zoneDamage: 18 },
  duo: { name: "Duo", botCount: 20, lootCount: 50, vehicleRate: 0.07, phaseScale: 0.9, zoneDamage: 15 },
  squad: { name: "Squad", botCount: 32, lootCount: 65, vehicleRate: 0.06, phaseScale: 1, zoneDamage: 14 },
  vehicle: { name: "Vehicle Rush", botCount: 24, lootCount: 55, vehicleRate: 0.18, phaseScale: 0.85, zoneDamage: 16 },
  arena: { name: "MP Arena (Beta)", botCount: 0, lootCount: 0, vehicleRate: 0, phaseScale: 1, zoneDamage: 12, arena: true },
};

const MAPS = {
  ridge: { name: "Ridgefront", seed: 19, center: { x: WORLD_CENTER.x, y: WORLD_CENTER.y }, type: "ridge" },
  harbor: { name: "Harborline", seed: 42, center: { x: WORLD_CENTER.x + 120, y: WORLD_CENTER.y - 80 }, type: "harbor" },
  metro: { name: "Metro Grid", seed: 7, center: { x: WORLD_CENTER.x - 80, y: WORLD_CENTER.y + 140 }, type: "metro" },
};

const PROFILE_KEY = "spnet_profile_v101";
const MISSION_KEY = "spnet_missions_v101";
const MODE_KEY = "spnet_mode_v101";
const MAP_KEY = "spnet_map_v101";
const MP_KEY = "spnet_mp_v101";
const POWER_OUT_MULT = 1.3;
const POWER_IN_MULT = 0.8;
const DEFAULT_PROFILE = {
  name: "Player",
  level: 1,
  xp: 0,
  coins: 1000,
  gems: 25,
  streak: 0,
  lastReward: "",
  matches: 0,
  lifetimeKills: 0,
  battleTier: 1,
  battleXp: 0,
  inventory: [],
  powerActive: false,
  equippedAttachments: ["att_stability"],
};

const LOCAL_MISSIONS = [
  { id: "play_1", title: "Play 1 match", target: 1, rewardCoins: 120, rewardGems: 0, rewardXp: 80 },
  { id: "kills_3", title: "Get 3 kills", target: 3, rewardCoins: 150, rewardGems: 0, rewardXp: 120 },
  { id: "win_1", title: "Win 1 match", target: 1, rewardCoins: 200, rewardGems: 1, rewardXp: 160 },
];

const SEASON_TRACK = [
  { tier: 1, free: "100 Coins", premium: "Neon Banner" },
  { tier: 2, free: "150 Coins", premium: "Crate: Echo" },
  { tier: 3, free: "200 Coins", premium: "Skin: Shadow Ops" },
  { tier: 4, free: "250 Coins", premium: "Emote: Pulse" },
  { tier: 5, free: "300 Coins", premium: "Weapon Skin: Rift" },
  { tier: 6, free: "350 Coins", premium: "Attachment: Stability" },
  { tier: 7, free: "400 Coins", premium: "Crate: Nova" },
  { tier: 8, free: "450 Coins", premium: "Skin: Harborline" },
  { tier: 9, free: "500 Coins", premium: "Vehicle Skin: Strider" },
  { tier: 10, free: "600 Coins", premium: "Legend Title" },
];

let PROFILE = loadProfile();
let MISSIONS = loadLocalMissions();
let OFFERS = [];

const GAME = {
  running: false,
  paused: false,
  matchEnded: false,
  lastTime: 0,
  warmupActive: false,
  warmupTimer: 0,
  hitMarker: 0,
  damageFlash: 0,
  knockFlash: 0,
  cameraShake: 0,
  zonePulse: 0,
  killfeed: [],
  mode: "classic",
  map: "ridge",
  modeConfig: MODES.classic,
  phases: buildPhases(1),
  zoneDamage: 14,
  multiplayer: false,
  netSwap: false,
  player: null,
  bots: [],
  bullets: [],
  loot: [],
  obstacles: [],
  keys: {},
  mouse: { x: 0, y: 0, down: false },
  touch: {
    leftId: null,
    rightId: null,
    leftOrigin: null,
    rightOrigin: null,
    leftDelta: { x: 0, y: 0 },
    rightDelta: { x: 0, y: 0 },
  },
  zone: {
    phaseIndex: 0,
    phaseTime: 0,
    currentRadius: 1000,
    targetRadius: 800,
    center: { x: WORLD_CENTER.x, y: WORLD_CENTER.y },
  },
  remaining: 0,
  trait: "swift",
};

const wsProto = window.location.protocol === "https:" ? "wss" : "ws";
const DEFAULT_WS = IS_LOCAL ? "ws://localhost:8788" : `${wsProto}://${window.location.host}/ws`;
const NET = {
  enabled: false,
  socket: null,
  selfId: null,
  connected: false,
  state: null,
  lastStateAt: 0,
  inputSeq: 0,
  connectTimer: null,
  serverUrl: localStorage.getItem("spnet_ws") || DEFAULT_WS,
};

const WARMUP_TIME = 4;
const PHASES = [
  { wait: 6, shrink: 14, radius: 1000 },
  { wait: 5, shrink: 12, radius: 820 },
  { wait: 4, shrink: 10, radius: 620 },
  { wait: 3, shrink: 9, radius: 460 },
  { wait: 2, shrink: 8, radius: 320 },
  { wait: 1, shrink: 8, radius: 220 },
  { wait: 0, shrink: 10, radius: 140 },
];

function buildPhases(scale = 1) {
  return PHASES.map((p) => ({
    wait: Math.max(0, p.wait * scale),
    shrink: Math.max(1, p.shrink * scale),
    radius: p.radius,
  }));
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", () => {
  dpr = Math.max(1, window.devicePixelRatio || 1);
  resize();
});

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function xpToNext(level) {
  return 150 + level * 50;
}

function battleXpToNext(tier) {
  return 1000 + tier * 200;
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(a, b) {
  if (!a || !b) return 999;
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  const diff = (db - da) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const data = JSON.parse(raw);
    const merged = { ...DEFAULT_PROFILE, ...data };
    merged.powerActive = (merged.inventory || []).includes("boost_power60");
    if (!Array.isArray(merged.equippedAttachments)) merged.equippedAttachments = [];
    merged.equippedAttachments = merged.equippedAttachments.filter((id) => (merged.inventory || []).includes(id));
    return merged;
  } catch (e) {
    return { ...DEFAULT_PROFILE };
  }
}

function saveProfile() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(PROFILE));
}

function loadLocalMissions() {
  const today = todayKey();
  try {
    const raw = localStorage.getItem(MISSION_KEY);
    if (!raw) throw new Error("no missions");
    const data = JSON.parse(raw);
    if (data.date !== today) throw new Error("new day");
    return data.missions;
  } catch (e) {
    return LOCAL_MISSIONS.map((m) => ({ ...m, progress: 0, claimed: false }));
  }
}

function saveLocalMissions() {
  localStorage.setItem(MISSION_KEY, JSON.stringify({ date: todayKey(), missions: MISSIONS }));
}

async function api(path, method = "GET", body) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function tryCloudProfile() {
  if (!authToken) return false;
  try {
    const data = await api("/api/profile");
    if (!data.ok) return false;
    applyServerProfile(data);
    onlineMode = true;
    authStatus.textContent = "Cloud connected.";
    return true;
  } catch (e) {
    onlineMode = false;
    return false;
  }
}

function applyServerProfile(data) {
  const equipped = Array.isArray(PROFILE.equippedAttachments) ? PROFILE.equippedAttachments : [];
  PROFILE.name = data.user.name;
  PROFILE.level = data.profile.level;
  PROFILE.xp = data.profile.xp;
  PROFILE.streak = data.profile.streak;
  PROFILE.lastReward = data.profile.last_reward;
  PROFILE.matches = data.profile.matches;
  PROFILE.lifetimeKills = data.profile.lifetime_kills;
  PROFILE.battleTier = data.profile.battle_tier;
  PROFILE.battleXp = data.profile.battle_xp;
  PROFILE.coins = data.balances.coins;
  PROFILE.gems = data.balances.gems;
  PROFILE.inventory = data.inventory || [];
  PROFILE.powerActive = PROFILE.inventory.includes("boost_power60");
  PROFILE.equippedAttachments = equipped.length ? equipped : DEFAULT_PROFILE.equippedAttachments.slice();
  PROFILE.equippedAttachments = PROFILE.equippedAttachments.filter((id) => PROFILE.inventory.includes(id));
  MISSIONS = data.missions || MISSIONS;
  OFFERS = data.offers || [];
  saveProfile();
  updateTopbar();
  updateProfilePanel();
  updateDailyUI();
  renderStore();
}

async function login() {
  authStatus.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) {
    authStatus.textContent = "Enter email and password.";
    return;
  }
  const data = await api("/api/login", "POST", { email, password });
  if (!data.ok) {
    authStatus.textContent = data.error || "Login failed.";
    return;
  }
  authToken = data.token;
  localStorage.setItem("spnet_token", authToken);
  onlineMode = true;
  applyServerProfile(data);
  authStatus.textContent = "Logged in. Cloud save enabled.";
}

async function register() {
  authStatus.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const name = nameInput.value.trim() || "Player";
  if (!email || !password) {
    authStatus.textContent = "Enter email and password.";
    return;
  }
  const data = await api("/api/register", "POST", { email, password, name });
  if (!data.ok) {
    authStatus.textContent = data.error || "Registration failed.";
    return;
  }
  authStatus.textContent = "Account created. Please login.";
}

function offlineMode() {
  onlineMode = false;
  authStatus.textContent = "Offline mode. Cloud save disabled.";
}

async function updateNameIfOnline() {
  if (!onlineMode) return;
  const newName = nameInput.value.trim() || PROFILE.name;
  if (newName && newName !== PROFILE.name) {
    await api("/api/profile", "POST", { name: newName });
    PROFILE.name = newName;
  }
}

function updateTopbar() {
  levelChip.textContent = `LVL ${PROFILE.level}`;
  const xpNeed = xpToNext(PROFILE.level);
  const pct = Math.min(100, Math.max(0, (PROFILE.xp / xpNeed) * 100));
  xpFill.style.width = `${pct}%`;
  coinsChip.textContent = `SP Coins ${PROFILE.coins}`;
  gemsChip.textContent = `SP Gems ${PROFILE.gems}`;
  if (powerChip) {
    if (PROFILE.powerActive) powerChip.classList.remove("hidden");
    else powerChip.classList.add("hidden");
  }
}

function updateProfilePanel() {
  profileSummary.textContent =
    `Name: ${PROFILE.name}\n` +
    `Level: ${PROFILE.level}  XP: ${PROFILE.xp}/${xpToNext(PROFILE.level)}\n` +
    `Streak: ${PROFILE.streak} days\n` +
    `Matches: ${PROFILE.matches}\n` +
    `Lifetime Kills: ${PROFILE.lifetimeKills}\n` +
    `Power Boost: ${PROFILE.powerActive ? "Active (60%)" : "Inactive"}\n` +
    `Attachments: ${(PROFILE.equippedAttachments || []).join(", ") || "None"}\n` +
    `Inventory: ${PROFILE.inventory.slice(0, 6).join(", ") || "None"}`;

  const battleNeed = battleXpToNext(PROFILE.battleTier);
  battlePass.textContent = `Tier ${PROFILE.battleTier} | XP ${PROFILE.battleXp}/${battleNeed}`;
  renderMissions();
  renderInventory();
  renderBattlePassTrack();
}

function updateDailyUI() {
  const today = todayKey();
  const canClaim = PROFILE.lastReward !== today;
  const streakPreview = canClaim
    ? (PROFILE.lastReward && daysBetween(PROFILE.lastReward, today) === 1 ? PROFILE.streak + 1 : 1)
    : PROFILE.streak;
  const coinsReward = 200 + streakPreview * 20;
  const gemsReward = 5 + Math.floor(streakPreview / 3);
  dailyRewardText.textContent = `+${coinsReward} SP Coins, +${gemsReward} SP Gems (Streak ${streakPreview})`;
  claimDailyBtn.disabled = !canClaim;
  claimDailyBtn2.disabled = !canClaim;
  dailyStatus.textContent = canClaim ? "Daily reward available." : "Daily reward claimed today.";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
}

function initAudio() {
  if (audioCtx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audioCtx = new Ctx();
  audioMaster = audioCtx.createGain();
  audioMaster.gain.value = 0.12;
  audioMaster.connect(audioCtx.destination);
}

function playTone(freq, duration, type = "sine", gain = 0.2) {
  if (!audioCtx || !audioMaster) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(audioMaster);
  osc.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.stop(now + duration);
}

function sfxShoot() { playTone(560, 0.05, "square", 0.12); }
function sfxHit() { playTone(980, 0.04, "triangle", 0.14); }
function sfxKnock() { playTone(220, 0.18, "sawtooth", 0.2); }
function sfxSwap() { playTone(740, 0.05, "triangle", 0.08); }
function sfxReload() { playTone(320, 0.08, "square", 0.08); }
function sfxHeal() { playTone(640, 0.1, "sine", 0.1); }
function sfxZone() { playTone(160, 0.12, "sine", 0.12); }

function startWarmup(seconds) {
  GAME.warmupActive = true;
  GAME.warmupTimer = seconds;
  if (warmupPanel) warmupPanel.classList.remove("hidden");
  if (warmupText) warmupText.textContent = `Deploying in ${Math.ceil(seconds)}...`;
}

function updateWarmup(dt) {
  if (!GAME.warmupActive) return;
  if (!GAME.multiplayer) {
    GAME.warmupTimer = Math.max(0, GAME.warmupTimer - dt);
  }
  if (warmupText) warmupText.textContent = `Deploying in ${Math.max(1, Math.ceil(GAME.warmupTimer))}...`;
  if (GAME.warmupTimer <= 0) {
    GAME.warmupActive = false;
    if (warmupPanel) warmupPanel.classList.add("hidden");
    showToast("Drop live - move fast!");
    sfxZone();
  }
}

function addKillfeed(text) {
  GAME.killfeed.unshift({ text, ts: performance.now() });
  if (GAME.killfeed.length > 4) GAME.killfeed.pop();
}

function updateKillfeed() {
  if (!killfeed) return;
  const now = performance.now();
  GAME.killfeed = GAME.killfeed.filter((k) => now - k.ts < 4200);
  killfeed.innerHTML = GAME.killfeed.map((k) => `<div class="entry">${k.text}</div>`).join("");
}

function formatName(id) {
  if (id === "player") return "You";
  if (id.startsWith("bot-")) return `Bot ${id.split("-")[1]}`;
  return id;
}

function startReload(p) {
  if (p.reloadTimer > 0) return;
  const w = p.weapon;
  if (!w || p.ammoReserve <= 0 || p.ammoInMag >= w.mag) return;
  p.reloadTimer = w.reload || 1.6;
  sfxReload();
}

function finishReload(p) {
  const w = p.weapon;
  const need = Math.max(0, w.mag - p.ammoInMag);
  const take = Math.min(need, p.ammoReserve);
  p.ammoInMag += take;
  p.ammoReserve -= take;
}

function equipWeapon(p, weapon) {
  if (!weapon) return;
  const newWeapon = p.id === "player" ? buildWeapon(weapon) : { ...weapon };
  if (!p.weaponSlots) p.weaponSlots = [newWeapon, null];

  if (!p.weaponSlots[0]) {
    p.weaponSlots[0] = newWeapon;
    p.weaponIndex = 0;
  } else if (!p.weaponSlots[1]) {
    p.weaponSlots[1] = newWeapon;
    p.weaponIndex = 1;
  } else {
    p.weaponSlots[p.weaponIndex] = newWeapon;
  }

  p.weapon = p.weaponSlots[p.weaponIndex];
  p.ammoReserve += Math.floor(p.weapon.mag * 1.8);
  if (p.ammoInMag > p.weapon.mag) p.ammoInMag = p.weapon.mag;
  if (p.ammoInMag === 0) startReload(p);
  sfxSwap();
}

function swapWeapon(p) {
  if (!p || !p.weaponSlots || !p.weaponSlots[1]) return;
  p.weaponIndex = p.weaponIndex === 0 ? 1 : 0;
  p.weapon = p.weaponSlots[p.weaponIndex];
  if (p.ammoInMag > p.weapon.mag) p.ammoInMag = p.weapon.mag;
  if (p.ammoInMag === 0) startReload(p);
  sfxSwap();
}

function useMedkit(p) {
  if (!p || p.medkits <= 0 || p.health >= p.maxHealth || p.healCooldown > 0) return;
  p.medkits -= 1;
  p.health = Math.min(p.maxHealth, p.health + 45);
  p.healCooldown = 0.6;
  sfxHeal();
  showToast("Healed +45");
}

function enterVehicle(p, type = "Strider") {
  if (!p) return;
  p.vehicle = { type, speedMult: 1.6, timer: 8 };
  showToast(`${type} engaged`);
}

function captureScreenshot() {
  try {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `spnet_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("Screenshot saved");
  } catch (e) {
    showToast("Screenshot failed");
  }
}

function startMultiplayer() {
  GAME.multiplayer = true;
  NET.enabled = true;
  NET.connected = false;
  NET.selfId = null;
  NET.state = null;
  NET.inputSeq = 0;
  if (NET.connectTimer) {
    clearTimeout(NET.connectTimer);
    NET.connectTimer = null;
  }

  try {
    const ws = new WebSocket(NET.serverUrl);
    NET.socket = ws;
    NET.connectTimer = setTimeout(() => {
      if (!NET.connected) {
        stopMultiplayer();
        showToast("Multiplayer offline - starting local match.");
        // Allow local warmup timer to tick down.
        if (GAME.warmupActive && GAME.warmupTimer <= 0) {
          GAME.warmupTimer = WARMUP_TIME;
        }
      }
    }, 3500);
    ws.onopen = () => {
      NET.connected = true;
      if (NET.connectTimer) {
        clearTimeout(NET.connectTimer);
        NET.connectTimer = null;
      }
      ws.send(JSON.stringify({ type: "hello", name: PROFILE.name || "Player", version: "v1.0.1" }));
      showToast("Matchmaking...");
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        handleNetMessage(msg);
      } catch (e) {
        // ignore malformed packet
      }
    };
    ws.onerror = () => {
      stopMultiplayer();
      showToast("Multiplayer error.");
    };
    ws.onclose = () => {
      NET.connected = false;
      NET.enabled = false;
      GAME.multiplayer = false;
      if (NET.connectTimer) {
        clearTimeout(NET.connectTimer);
        NET.connectTimer = null;
      }
      showToast("Multiplayer disconnected.");
    };
  } catch (e) {
    GAME.multiplayer = false;
    NET.enabled = false;
    if (NET.connectTimer) {
      clearTimeout(NET.connectTimer);
      NET.connectTimer = null;
    }
    showToast("Multiplayer server unavailable.");
  }
}

function stopMultiplayer() {
  if (NET.socket) {
    try { NET.socket.close(); } catch (e) {}
  }
  NET.socket = null;
  NET.enabled = false;
  NET.connected = false;
  NET.selfId = null;
  GAME.multiplayer = false;
  if (NET.connectTimer) {
    clearTimeout(NET.connectTimer);
    NET.connectTimer = null;
  }
}

function handleNetMessage(msg) {
  if (!msg || !msg.type) return;
  if (msg.type === "welcome") {
    NET.selfId = msg.id;
    if (msg.serverTime) NET.lastStateAt = performance.now();
    return;
  }
  if (msg.type === "warmup") {
    GAME.warmupActive = msg.remaining > 0;
    GAME.warmupTimer = msg.remaining || 0;
    if (GAME.warmupActive && warmupPanel) warmupPanel.classList.remove("hidden");
    if (!GAME.warmupActive && warmupPanel) warmupPanel.classList.add("hidden");
    return;
  }
  if (msg.type === "event") {
    if (msg.event === "killfeed") addKillfeed(msg.text || "");
    if (msg.event === "hit") GAME.hitMarker = Math.max(GAME.hitMarker, 0.12);
    if (msg.event === "damage") GAME.damageFlash = Math.max(GAME.damageFlash, 0.25);
    if (msg.event === "knock") GAME.knockFlash = Math.max(GAME.knockFlash, 0.5);
    return;
  }
  if (msg.type === "state") {
    applyNetState(msg);
  }
}

function applyNetState(state) {
  NET.state = state;
  NET.lastStateAt = performance.now();
  const players = state.players || [];
  const self = players.find((p) => p.id === NET.selfId);
  if (!self) return;

  if (!GAME.player) {
    GAME.player = createPlayer();
  }

  GAME.player.id = self.id;
  GAME.player.x = self.x;
  GAME.player.y = self.y;
  GAME.player.health = self.health;
  GAME.player.maxHealth = self.maxHealth || GAME.player.maxHealth;
  GAME.player.armor = self.armor;
  GAME.player.alive = self.alive;
  GAME.player.kills = self.kills;
  GAME.player.ammoInMag = self.ammoInMag ?? GAME.player.ammoInMag;
  GAME.player.ammoReserve = self.ammoReserve ?? GAME.player.ammoReserve;
  GAME.player.weapon = WEAPONS.find((w) => w.id === self.weaponId) || GAME.player.weapon;
  GAME.player.weaponSlots = [GAME.player.weapon, null];
  GAME.player.weaponIndex = 0;

  const others = players.filter((p) => p.id !== NET.selfId);
  GAME.bots = others.map((p, idx) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    r: 13,
    health: p.health,
    maxHealth: p.maxHealth || 100,
    armor: p.armor,
    weapon: WEAPONS.find((w) => w.id === p.weaponId) || WEAPONS[0],
    alive: p.alive,
    kills: p.kills,
  }));

  GAME.bullets = (state.bullets || []).map((b) => ({ x: b.x, y: b.y, life: 0.2 }));
  if (state.zone) {
    GAME.zone.currentRadius = state.zone.radius;
    if (state.zone.center) GAME.zone.center = state.zone.center;
  }
  GAME.remaining = players.filter((p) => p.alive).length;
}

function sendNetInput() {
  if (!NET.connected || !NET.socket) return;
  const move = getMoveVector();
  const aimAngle = getAimAngle();
  const wantsFire = getWantsFire();
  NET.inputSeq += 1;
  const payload = {
    type: "input",
    seq: NET.inputSeq,
    move: [move.x, move.y],
    aim: [Math.cos(aimAngle), Math.sin(aimAngle)],
    fire: wantsFire,
    swap: GAME.netSwap,
    reload: GAME.keys["KeyR"] || false,
    heal: false,
  };
  GAME.netSwap = false;
  try {
    NET.socket.send(JSON.stringify(payload));
  } catch (e) {
    // ignore send failure
  }
}

async function claimDailyReward() {
  if (onlineMode) {
    const data = await api("/api/claim_daily", "POST", {});
    if (!data.ok) {
      showToast(data.error || "Already claimed.");
      return;
    }
    PROFILE.streak = data.streak;
    PROFILE.lastReward = todayKey();
    PROFILE.coins += data.coins;
    PROFILE.gems += data.gems;
    saveProfile();
    updateTopbar();
    updateProfilePanel();
    updateDailyUI();
    showToast(`Daily claimed: +${data.coins} coins, +${data.gems} gems`);
    return;
  }

  const today = todayKey();
  if (PROFILE.lastReward === today) {
    showToast("Daily reward already claimed.");
    return;
  }

  const diff = PROFILE.lastReward ? daysBetween(PROFILE.lastReward, today) : 999;
  if (diff === 1) PROFILE.streak += 1;
  else PROFILE.streak = 1;

  const coinsReward = 200 + PROFILE.streak * 20;
  const gemsReward = 5 + Math.floor(PROFILE.streak / 3);
  PROFILE.coins += coinsReward;
  PROFILE.gems += gemsReward;
  PROFILE.lastReward = today;

  saveProfile();
  updateTopbar();
  updateProfilePanel();
  updateDailyUI();
  showToast(`Daily claimed: +${coinsReward} coins, +${gemsReward} gems`);
}

async function spendOffer(offer) {
  if (onlineMode) {
    const data = await api("/api/store/buy", "POST", { offerId: offer.id });
    if (!data.ok) {
      storeStatus.textContent = data.error || "Purchase failed.";
      return;
    }
    PROFILE.coins = data.coins;
    PROFILE.gems = data.gems;
    PROFILE.inventory = data.inventory || PROFILE.inventory;
    PROFILE.powerActive = PROFILE.inventory.includes("boost_power60");
    saveProfile();
    updateTopbar();
    updateProfilePanel();
    storeStatus.textContent = `Purchased: ${offer.name}`;
    return;
  }

  if (offer.priceCoins && PROFILE.coins < offer.priceCoins) {
    storeStatus.textContent = "Not enough SP Coins.";
    return;
  }
  if (offer.priceGems && PROFILE.gems < offer.priceGems) {
    storeStatus.textContent = "Not enough SP Gems.";
    return;
  }
  PROFILE.coins -= offer.priceCoins || 0;
  PROFILE.gems -= offer.priceGems || 0;
  (offer.payload?.items || []).forEach((item) => PROFILE.inventory.push(item));
  PROFILE.powerActive = PROFILE.inventory.includes("boost_power60");
  saveProfile();
  updateTopbar();
  updateProfilePanel();
  storeStatus.textContent = `Purchased: ${offer.name}`;
}

function localOffers() {
  const day = new Date().getDay();
  const offers = [
    { id: "offer_crate", name: "Supply Crate", priceCoins: 200, priceGems: 0, offerType: "item", payload: { items: ["crate_basic"] } },
    { id: "offer_skin", name: "Elite Skin", priceCoins: 0, priceGems: 20, offerType: "cosmetic", payload: { items: ["skin_elite"] } },
    { id: "offer_xp", name: "XP Boost", priceCoins: 500, priceGems: 0, offerType: "boost", payload: { items: ["xp_boost_2h"] } },
    { id: "offer_attachment", name: "Attachment Pack", priceCoins: 350, priceGems: 0, offerType: "gear", payload: { items: ["att_stability", "att_scope"] } },
    { id: "offer_att_extended", name: "Extended Mag", priceCoins: 0, priceGems: 18, offerType: "gear", payload: { items: ["att_extended"] } },
    { id: "offer_att_quick", name: "Quick Reload", priceCoins: 300, priceGems: 0, offerType: "gear", payload: { items: ["att_quick"] } },
    { id: "offer_att_tuned", name: "Tuned Trigger", priceCoins: 0, priceGems: 22, offerType: "gear", payload: { items: ["att_tuned"] } },
    { id: "offer_att_rifled", name: "Rifled Barrel", priceCoins: 260, priceGems: 0, offerType: "gear", payload: { items: ["att_rifled"] } },
    { id: "offer_ability", name: "Ability Kit", priceCoins: 0, priceGems: 15, offerType: "ability", payload: { items: ["kit_sensorist"] } },
    { id: "offer_power60", name: "Power Core (60% Boost)", priceCoins: 0, priceGems: 60, offerType: "power", payload: { items: ["boost_power60"] } },
    { id: "offer_pass", name: "Season Pass Premium", priceCoins: 0, priceGems: 80, offerType: "pass", payload: { items: ["pass_premium_s1"] } },
    { id: "offer_vehicle_skin", name: "Vehicle Skin: Strider", priceCoins: 0, priceGems: 30, offerType: "cosmetic", payload: { items: ["vehicle_skin_strider"] } },
  ];
  return offers.slice(day % 4, day % 4 + 5);
}

function renderStore() {
  storeList.innerHTML = "";
  const list = onlineMode && OFFERS.length ? OFFERS : localOffers();
  list.forEach((offer) => {
    const item = document.createElement("div");
    item.className = "store-item";
    item.innerHTML = `
      <div>
        <div class="store-label">${offer.name}</div>
        <div class="store-cost">${offer.priceCoins ? offer.priceCoins + " SP Coins" : ""} ${offer.priceGems ? offer.priceGems + " SP Gems" : ""}</div>
      </div>
      <button class="ghost small">Buy</button>
    `;
    item.querySelector("button").addEventListener("click", () => spendOffer(offer));
    storeList.appendChild(item);
  });
}

function renderMissions() {
  missionsList.innerHTML = "";
  const list = MISSIONS || [];
  list.forEach((m) => {
    const item = document.createElement("div");
    item.className = "mission-item";
    const complete = m.progress >= m.target;
    const status = m.claimed ? "Claimed" : complete ? "Claim" : `${m.progress}/${m.target}`;
    item.innerHTML = `
      <div>
        <div class="store-label">${m.title}</div>
        <div class="store-cost">Reward: ${m.rewardCoins} Coins ${m.rewardGems ? "+ " + m.rewardGems + " Gems" : ""}</div>
      </div>
      <button class="ghost small" ${m.claimed || !complete ? "disabled" : ""}>${status}</button>
    `;
    const btn = item.querySelector("button");
    btn.addEventListener("click", () => claimMission(m.id));
    missionsList.appendChild(item);
  });
}

function getAttachmentMods(attachments) {
  const mods = {
    spreadMult: 1,
    rangeMult: 1,
    reloadMult: 1,
    fireRateMult: 1,
    damageMult: 1,
    magAdd: 0,
  };
  attachments.forEach((id) => {
    const a = ATTACHMENTS.find((att) => att.id === id);
    if (!a) return;
    if (a.spreadMult) mods.spreadMult *= a.spreadMult;
    if (a.rangeMult) mods.rangeMult *= a.rangeMult;
    if (a.reloadMult) mods.reloadMult *= a.reloadMult;
    if (a.fireRateMult) mods.fireRateMult *= a.fireRateMult;
    if (a.damageMult) mods.damageMult *= a.damageMult;
    if (a.magAdd) mods.magAdd += a.magAdd;
  });
  return mods;
}

function applyAttachments(weapon, attachments) {
  const mods = getAttachmentMods(attachments);
  return {
    ...weapon,
    id: weapon.id,
    baseId: weapon.baseId || weapon.id,
    spread: weapon.spread * mods.spreadMult,
    range: weapon.range * mods.rangeMult,
    reload: weapon.reload * mods.reloadMult,
    fireRate: weapon.fireRate * mods.fireRateMult,
    damage: weapon.damage * mods.damageMult,
    mag: weapon.mag + mods.magAdd,
  };
}

function buildWeapon(baseWeapon) {
  const attachments = PROFILE.equippedAttachments || [];
  return applyAttachments({ ...baseWeapon, baseId: baseWeapon.id }, attachments);
}

function renderInventory() {
  if (!inventoryList) return;
  inventoryList.innerHTML = "";
  const owned = new Set(PROFILE.inventory || []);
  ATTACHMENTS.forEach((att) => {
    const item = document.createElement("div");
    item.className = "inventory-item";
    const equipped = (PROFILE.equippedAttachments || []).includes(att.id);
    const locked = !owned.has(att.id);
    item.innerHTML = `
      <div>
        <div class="store-label">${att.name}</div>
        <div class="store-cost">${locked ? "Locked - buy in Store" : "Owned"}</div>
      </div>
      <button class="toggle" ${locked ? "disabled" : ""}>${equipped ? "Equipped" : "Equip"}</button>
    `;
    const btn = item.querySelector("button");
    btn.addEventListener("click", () => toggleAttachment(att.id));
    inventoryList.appendChild(item);
  });
}

function toggleAttachment(id) {
  const owned = new Set(PROFILE.inventory || []);
  if (!owned.has(id)) return;
  const list = new Set(PROFILE.equippedAttachments || []);
  if (list.has(id)) list.delete(id);
  else {
    if (list.size >= 3) {
      showToast("Max 3 attachments equipped.");
      return;
    }
    list.add(id);
  }
  PROFILE.equippedAttachments = Array.from(list);
  saveProfile();
  renderInventory();
  showToast("Attachments updated (applies next match).");
}

function renderBattlePassTrack() {
  if (!battlePassTrack) return;
  battlePassTrack.innerHTML = "";
  const wrapper = document.createElement("div");
  wrapper.className = "battle-track";
  SEASON_TRACK.forEach((tier) => {
    const row = document.createElement("div");
    row.className = "battle-tier" + (PROFILE.battleTier >= tier.tier ? " active" : "");
    row.innerHTML = `
      <div>Tier ${tier.tier}</div>
      <div>Free: ${tier.free} | Premium: ${tier.premium}</div>
    `;
    wrapper.appendChild(row);
  });
  battlePassTrack.appendChild(wrapper);
}

async function claimMission(missionId) {
  if (onlineMode) {
    const data = await api("/api/missions/claim", "POST", { missionId });
    if (!data.ok) {
      showToast(data.error || "Cannot claim.");
      return;
    }
    const profileData = await api("/api/profile");
    if (profileData.ok) applyServerProfile(profileData);
    showToast("Mission claimed.");
    return;
  }

  const mission = MISSIONS.find((m) => m.id === missionId);
  if (!mission || mission.claimed || mission.progress < mission.target) return;
  mission.claimed = true;
  PROFILE.coins += mission.rewardCoins;
  PROFILE.gems += mission.rewardGems;
  PROFILE.xp += mission.rewardXp;
  while (PROFILE.xp >= xpToNext(PROFILE.level)) {
    PROFILE.xp -= xpToNext(PROFILE.level);
    PROFILE.level += 1;
  }
  saveProfile();
  saveLocalMissions();
  updateTopbar();
  updateProfilePanel();
  showToast("Mission claimed.");
}

async function awardMatchRewards(won, kills) {
  if (onlineMode) {
    const data = await api("/api/match/report", "POST", { kills, won });
    if (!data.ok) return { xpEarned: 0, coinsEarned: 0, gemsEarned: 0 };
    const profileData = await api("/api/profile");
    if (profileData.ok) applyServerProfile(profileData);
    return { xpEarned: data.xp, coinsEarned: data.coins, gemsEarned: data.gems };
  }

  const xpEarned = 40 + kills * 20 + (won ? 120 : 0);
  const coinsEarned = 100 + kills * 30 + (won ? 200 : 0);
  const gemsEarned = won ? 2 : 0;

  PROFILE.xp += xpEarned;
  while (PROFILE.xp >= xpToNext(PROFILE.level)) {
    PROFILE.xp -= xpToNext(PROFILE.level);
    PROFILE.level += 1;
  }

  PROFILE.battleXp += xpEarned;
  while (PROFILE.battleXp >= battleXpToNext(PROFILE.battleTier)) {
    PROFILE.battleXp -= battleXpToNext(PROFILE.battleTier);
    PROFILE.battleTier += 1;
  }

  PROFILE.coins += coinsEarned;
  PROFILE.gems += gemsEarned;
  PROFILE.matches += 1;
  PROFILE.lifetimeKills += kills;

  // Update local missions progress
  MISSIONS.forEach((m) => {
    if (m.id === "play_1") m.progress = Math.min(m.target, m.progress + 1);
    if (m.id === "kills_3") m.progress = Math.min(m.target, m.progress + kills);
    if (m.id === "win_1" && won) m.progress = Math.min(m.target, m.progress + 1);
  });

  saveProfile();
  saveLocalMissions();
  updateTopbar();
  updateProfilePanel();

  return { xpEarned, coinsEarned, gemsEarned };
}

function createPlayer() {
  const trait = TRAITS[GAME.trait];
  const starterWeapon = buildWeapon(WEAPONS[0]);
  return {
    id: "player",
    x: GAME.zone.center.x + rand(-120, 120),
    y: GAME.zone.center.y + rand(-120, 120),
    vx: 0,
    vy: 0,
    r: 14,
    speed: 210 * trait.speedMult,
    health: 100 + trait.maxHealthAdd,
    maxHealth: 100 + trait.maxHealthAdd,
    armor: 0,
    weapon: starterWeapon,
    weaponSlots: [starterWeapon, null],
    weaponIndex: 0,
    ammoInMag: starterWeapon.mag,
    ammoReserve: starterWeapon.reserve,
    reloadTimer: 0,
    medkits: 1,
    healCooldown: 0,
    vehicle: null,
    cooldown: 0,
    kills: 0,
    alive: true,
    damageOutMult: PROFILE.powerActive ? POWER_OUT_MULT : 1,
    damageInMult: PROFILE.powerActive ? POWER_IN_MULT : 1,
  };
}

function createBot(i) {
  const weapon = { ...WEAPONS[Math.floor(rand(0, WEAPONS.length))] };
  return {
    id: `bot-${i}`,
    x: rand(200, WORLD.w - 200),
    y: rand(200, WORLD.h - 200),
    vx: 0,
    vy: 0,
    r: 13,
    speed: rand(170, 200),
    health: rand(80, 110),
    maxHealth: 110,
    armor: Math.random() < 0.4 ? 25 : 0,
    weapon,
    cooldown: 0,
    alive: true,
    target: null,
    thinkTime: 0,
    state: "wander",
    damageOutMult: 1,
    damageInMult: 1,
  };
}

function createLoot(count, vehicleRate) {
  const loot = [];
  for (let i = 0; i < count; i++) {
    const typeRoll = Math.random();
    let kind = "weapon";
    if (typeRoll > 0.72) kind = "armor";
    if (typeRoll > 0.86) kind = "med";
    if (typeRoll > 0.92) kind = "attachment";
    if (typeRoll > 0.98 || Math.random() < vehicleRate) kind = "vehicle";
    loot.push({
      id: `loot-${i}`,
      x: rand(80, WORLD.w - 80),
      y: rand(80, WORLD.h - 80),
      kind,
      weapon: kind === "weapon" ? { ...WEAPONS[Math.floor(rand(0, WEAPONS.length))] } : null,
      attachment: kind === "attachment" ? ATTACHMENTS[Math.floor(rand(0, ATTACHMENTS.length))] : null,
      vehicleType: kind === "vehicle" ? "Strider" : null,
      taken: false,
    });
  }
  return loot;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function createObstacles(map) {
  const obs = [];
  const seed = map?.seed || Math.floor(Math.random() * 99999);
  const rnd = mulberry32(seed);
  const r = (min, max) => rnd() * (max - min) + min;
  const count = map?.type === "metro" ? 26 : map?.type === "harbor" ? 18 : 22;

  for (let i = 0; i < count; i++) {
    let w = r(90, 180);
    let h = r(60, 140);
    let x = r(150, WORLD.w - 150);
    let y = r(150, WORLD.h - 150);

    if (map?.type === "harbor") {
      if (i % 3 === 0) {
        w = r(180, 260);
        h = r(40, 80);
        x = r(160, WORLD.w - 160);
        y = r(160, WORLD.h * 0.45);
      } else {
        x = r(160, WORLD.w - 160);
        y = r(WORLD.h * 0.55, WORLD.h - 160);
      }
    }

    if (map?.type === "metro") {
      w = r(80, 140);
      h = r(80, 140);
      const grid = 220;
      x = Math.round(x / grid) * grid;
      y = Math.round(y / grid) * grid;
    }

    obs.push({ x, y, w, h });
  }
  return obs;
}

function resetGame() {
  const modeKey = modeSelect?.value || "classic";
  let mode = MODES[modeKey] || MODES.classic;
  const wantsMp = (mpToggle && mpToggle.checked) || mode.arena;
  if (wantsMp) {
    mode = { ...mode, botCount: 0, lootCount: 0, vehicleRate: 0 };
  }
  GAME.mode = modeKey;
  GAME.modeConfig = mode;
  GAME.phases = buildPhases(mode.phaseScale || 1);
  GAME.zoneDamage = mode.zoneDamage || 14;

  const mapKey = mapSelect?.value || "ridge";
  const map = MAPS[mapKey] || MAPS.ridge;
  GAME.map = mapKey;
  GAME.zone.center = { x: map.center.x, y: map.center.y };

  GAME.player = createPlayer();
  GAME.bots = [];
  for (let i = 0; i < (mode.botCount || 0); i++) GAME.bots.push(createBot(i));
  GAME.bullets = [];
  GAME.loot = createLoot(mode.lootCount || 0, mode.vehicleRate || 0);
  GAME.obstacles = createObstacles(map);
  GAME.zone.phaseIndex = 0;
  GAME.zone.phaseTime = 0;
  GAME.zone.currentRadius = GAME.phases[0].radius;
  GAME.zone.targetRadius = GAME.phases[1].radius;
  GAME.remaining = 1 + GAME.bots.length;
  GAME.matchEnded = false;
  GAME.paused = false;
  GAME.warmupActive = false;
  GAME.warmupTimer = 0;
  GAME.hitMarker = 0;
  GAME.damageFlash = 0;
  GAME.knockFlash = 0;
  GAME.cameraShake = 0;
  GAME.zonePulse = 0;
  GAME.killfeed = [];
  if (killfeed) killfeed.innerHTML = "";
}

function circleRectOverlap(cx, cy, r, rect) {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < r * r;
}

function moveWithCollisions(entity, nx, ny) {
  const r = entity.r;
  let x = nx;
  let y = ny;

  for (const o of GAME.obstacles) {
    if (circleRectOverlap(x, y, r, o)) {
      if (!circleRectOverlap(entity.x, y, r, o)) {
        x = entity.x;
      } else if (!circleRectOverlap(x, entity.y, r, o)) {
        y = entity.y;
      } else {
        x = entity.x;
        y = entity.y;
      }
    }
  }

  entity.x = clamp(x, r, WORLD.w - r);
  entity.y = clamp(y, r, WORLD.h - r);
}

function updateZone(dt) {
  const phases = GAME.phases || PHASES;
  const phase = phases[GAME.zone.phaseIndex];
  const nextPhase = phases[GAME.zone.phaseIndex + 1];
  if (!nextPhase) return;

  GAME.zone.phaseTime += dt;

  if (GAME.zone.phaseTime < phase.wait) {
    GAME.zone.currentRadius = phase.radius;
    return;
  }

  const shrinkTime = GAME.zone.phaseTime - phase.wait;
  const t = clamp(shrinkTime / phase.shrink, 0, 1);
  GAME.zone.currentRadius = phase.radius + (nextPhase.radius - phase.radius) * t;

  if (t >= 1) {
    GAME.zone.phaseIndex++;
    GAME.zone.phaseTime = 0;
  }
}

function applyZoneDamage(entity, dt) {
  const d = dist(entity, GAME.zone.center);
  if (d > GAME.zone.currentRadius) {
    const dmg = GAME.zoneDamage || 14;
    entity.health -= dmg * dt;
    if (entity.id === "player" && GAME.zonePulse <= 0) {
      GAME.zonePulse = 1.2;
      sfxZone();
    }
    if (entity.id === "player") {
      GAME.damageFlash = Math.max(GAME.damageFlash, 0.12);
    }
  }
}

function fireBullet(shooter, angle) {
  if (shooter.cooldown > 0) return;
  const w = shooter.weapon;
  if (shooter.id === "player") {
    if (GAME.warmupActive) return;
    if (shooter.reloadTimer > 0) return;
    if (shooter.ammoInMag <= 0) {
      startReload(shooter);
      return;
    }
    shooter.ammoInMag -= 1;
    sfxShoot();
  }
  shooter.cooldown = 1 / w.fireRate;
  const spread = (Math.random() - 0.5) * w.spread;
  const ang = angle + spread;
  const vx = Math.cos(ang) * w.speed;
  const vy = Math.sin(ang) * w.speed;
  const outMult = shooter.damageOutMult || 1;
  GAME.bullets.push({
    x: shooter.x + Math.cos(ang) * shooter.r,
    y: shooter.y + Math.sin(ang) * shooter.r,
    vx,
    vy,
    damage: w.damage * outMult,
    life: w.range / w.speed,
    owner: shooter.id,
  });

  if (shooter.id === "player" && shooter.ammoInMag <= 0) {
    startReload(shooter);
  }
}

function getMoveVector() {
  let dx = 0;
  let dy = 0;

  if (GAME.keys["KeyW"] || GAME.keys["ArrowUp"]) dy -= 1;
  if (GAME.keys["KeyS"] || GAME.keys["ArrowDown"]) dy += 1;
  if (GAME.keys["KeyA"] || GAME.keys["ArrowLeft"]) dx -= 1;
  if (GAME.keys["KeyD"] || GAME.keys["ArrowRight"]) dx += 1;

  if (GAME.touch.leftOrigin) {
    dx += GAME.touch.leftDelta.x;
    dy += GAME.touch.leftDelta.y;
  }

  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

function getAimAngle() {
  let aimAngle = Math.atan2(GAME.mouse.y - canvas.height / dpr / 2, GAME.mouse.x - canvas.width / dpr / 2);
  if (GAME.touch.rightOrigin) {
    const rx = GAME.touch.rightDelta.x;
    const ry = GAME.touch.rightDelta.y;
    if (Math.hypot(rx, ry) > 0.05) {
      aimAngle = Math.atan2(ry, rx);
    }
  }
  return aimAngle;
}

function getWantsFire() {
  return GAME.mouse.down || (GAME.touch.rightOrigin && Math.hypot(GAME.touch.rightDelta.x, GAME.touch.rightDelta.y) > 0.15);
}

function updatePlayer(dt, live) {
  const p = GAME.player;
  if (!p.alive) return;

  const move = getMoveVector();
  const dx = move.x;
  const dy = move.y;

  let speed = p.speed;
  if (p.vehicle) {
    p.vehicle.timer -= dt;
    speed *= p.vehicle.speedMult;
    if (p.vehicle.timer <= 0) p.vehicle = null;
  }

  const nx = p.x + dx * speed * dt;
  const ny = p.y + dy * speed * dt;
  moveWithCollisions(p, nx, ny);

  const aimAngle = getAimAngle();
  const wantsFire = getWantsFire();
  if (wantsFire && live) fireBullet(p, aimAngle);

  if (p.cooldown > 0) p.cooldown -= dt;

  if (p.reloadTimer > 0) {
    p.reloadTimer -= dt;
    if (p.reloadTimer <= 0) finishReload(p);
  }
  if (p.ammoInMag <= 0 && p.reloadTimer <= 0 && p.ammoReserve > 0) {
    startReload(p);
  }

  if (p.healCooldown > 0) p.healCooldown -= dt;

  if (live) applyZoneDamage(p, dt);
  if (p.health <= 0) p.alive = false;

  for (const item of GAME.loot) {
    if (item.taken) continue;
    if (dist(p, item) < 26) {
      item.taken = true;
      if (item.kind === "weapon") equipWeapon(p, item.weapon);
      if (item.kind === "armor") p.armor = Math.min(50, p.armor + 25);
      if (item.kind === "med") p.medkits = Math.min(3, p.medkits + 1);
      if (item.kind === "attachment" && item.attachment) {
        if (!PROFILE.inventory.includes(item.attachment.id)) {
          PROFILE.inventory.push(item.attachment.id);
          saveProfile();
          updateProfilePanel();
        }
        if (!PROFILE.equippedAttachments.includes(item.attachment.id)) {
          PROFILE.equippedAttachments.push(item.attachment.id);
          saveProfile();
        }
        showToast(`${item.attachment.name} acquired`);
      }
      if (item.kind === "vehicle") {
        enterVehicle(p, item.vehicleType || "Strider");
      }
    }
  }

  if (actionHeal) {
    actionHeal.textContent = `Heal (${p.medkits})`;
    actionHeal.disabled = p.medkits <= 0 || p.health >= p.maxHealth || p.healCooldown > 0;
  }
  if (actionSwap) {
    actionSwap.textContent = "Swap (Q)";
    actionSwap.disabled = !p.weaponSlots || !p.weaponSlots[1];
  }
}

function updateBots(dt, live) {
  for (const b of GAME.bots) {
    if (!b.alive) continue;

    b.thinkTime -= dt;

    const player = GAME.player;
    const distToPlayer = dist(b, player);
    if (live && player.alive && distToPlayer < 420) {
      b.state = "attack";
      b.target = player;
    } else if (b.thinkTime <= 0) {
      b.state = Math.random() < 0.7 ? "wander" : "loot";
      b.target = { x: rand(100, WORLD.w - 100), y: rand(100, WORLD.h - 100) };
      b.thinkTime = rand(1.5, 3.5);
    }

    let dx = 0;
    let dy = 0;

    if (b.state === "attack" && b.target && live) {
      const angle = Math.atan2(b.target.y - b.y, b.target.x - b.x);
      dx = Math.cos(angle);
      dy = Math.sin(angle);
      if (distToPlayer < 260) {
        fireBullet(b, angle);
      }
    } else if (b.state === "loot") {
      let closest = null;
      let best = Infinity;
      for (const item of GAME.loot) {
        if (item.taken) continue;
        const d = dist(b, item);
        if (d < best) {
          best = d;
          closest = item;
        }
      }
      if (closest) {
        const angle = Math.atan2(closest.y - b.y, closest.x - b.x);
        dx = Math.cos(angle);
        dy = Math.sin(angle);
      }
    } else if (b.target) {
      const angle = Math.atan2(b.target.y - b.y, b.target.x - b.x);
      dx = Math.cos(angle);
      dy = Math.sin(angle);
    }

    const nx = b.x + dx * b.speed * dt;
    const ny = b.y + dy * b.speed * dt;
    moveWithCollisions(b, nx, ny);

    if (b.cooldown > 0) b.cooldown -= dt;

    if (live) applyZoneDamage(b, dt);
    if (b.health <= 0) b.alive = false;

    for (const item of GAME.loot) {
      if (item.taken) continue;
      if (dist(b, item) < 22) {
        item.taken = true;
        if (item.kind === "weapon") b.weapon = { ...item.weapon };
        if (item.kind === "armor") b.armor = Math.min(50, b.armor + 25);
        if (item.kind === "med") b.health = Math.min(b.maxHealth, b.health + 30);
      }
    }
  }
}

function updateBullets(dt) {
  for (const bullet of GAME.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
  }

  GAME.bullets = GAME.bullets.filter((b) => b.life > 0);

  const allTargets = [GAME.player, ...GAME.bots];
  for (const b of GAME.bullets) {
    for (const t of allTargets) {
      if (!t.alive || t.id === b.owner) continue;
      if (dist(b, t) < t.r) {
        const inMult = t.damageInMult || 1;
        let dmg = b.damage * inMult;
        if (t.armor > 0) {
          const absorbed = Math.min(t.armor, dmg * 0.6);
          t.armor -= absorbed;
          dmg -= absorbed;
        }
        t.health -= dmg;
        b.life = 0;
        if (t.id === "player") {
          GAME.damageFlash = Math.max(GAME.damageFlash, 0.25);
          GAME.cameraShake = Math.max(GAME.cameraShake, 6);
        }
        if (b.owner === "player") {
          GAME.hitMarker = Math.max(GAME.hitMarker, 0.12);
          sfxHit();
        }
        if (t.health <= 0) {
          t.alive = false;
          if (b.owner === "player") GAME.player.kills += 1;
          const killerName = formatName(b.owner);
          const victimName = formatName(t.id);
          if (b.owner === "player") addKillfeed(`You eliminated ${victimName}`);
          else if (t.id === "player") addKillfeed(`${killerName} eliminated you`);
          else addKillfeed(`${killerName} eliminated ${victimName}`);
          GAME.knockFlash = Math.max(GAME.knockFlash, 0.5);
          sfxKnock();
        }
        if (b.life <= 0) break;
      }
    }
  }
}

function countRemaining() {
  let alive = 0;
  if (GAME.player.alive) alive++;
  for (const b of GAME.bots) if (b.alive) alive++;
  GAME.remaining = alive;
}

function endMatch(won) {
  if (GAME.matchEnded) return;
  GAME.matchEnded = true;
  GAME.paused = true;

  awardMatchRewards(won, GAME.player.kills).then((rewards) => {
    summaryTitle.textContent = won ? "Winner" : "Eliminated";
    summaryStats.textContent =
      `Kills: ${GAME.player.kills}\n` +
      `Rewards: +${rewards.xpEarned} XP, +${rewards.coinsEarned} Coins${won ? `, +${rewards.gemsEarned} Gems` : ""}`;
    summaryPanel.classList.remove("hidden");
  });
}

function checkMatchEnd() {
  const won = GAME.player.alive && GAME.remaining === 1;
  const eliminated = !GAME.player.alive;
  if (won || eliminated) endMatch(won);
}

function update(dt) {
  if (GAME.multiplayer) {
    updateWarmup(dt);
    sendNetInput();
    updateFeedback(dt);
    return;
  }

  updateWarmup(dt);
  const live = !GAME.warmupActive;
  if (live) updateZone(dt);
  updatePlayer(dt, live);
  updateBots(dt, live);
  if (live) updateBullets(dt);
  updateFeedback(dt);
  countRemaining();
  if (live) checkMatchEnd();
}

function updateFeedback(dt) {
  if (GAME.hitMarker > 0) GAME.hitMarker = Math.max(0, GAME.hitMarker - dt);
  if (GAME.damageFlash > 0) GAME.damageFlash = Math.max(0, GAME.damageFlash - dt);
  if (GAME.knockFlash > 0) GAME.knockFlash = Math.max(0, GAME.knockFlash - dt);
  if (GAME.cameraShake > 0) GAME.cameraShake = Math.max(0, GAME.cameraShake - dt * 20);
  if (GAME.zonePulse > 0) GAME.zonePulse = Math.max(0, GAME.zonePulse - dt);
}

function drawGrid(cam) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  for (let x = 0; x <= WORLD.w; x += 100) {
    const sx = x - cam.x;
    ctx.beginPath();
    ctx.moveTo(sx, -cam.y);
    ctx.lineTo(sx, WORLD.h - cam.y);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD.h; y += 100) {
    const sy = y - cam.y;
    ctx.beginPath();
    ctx.moveTo(-cam.x, sy);
    ctx.lineTo(WORLD.w - cam.x, sy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawZone(cam) {
  ctx.save();
  ctx.strokeStyle = "rgba(80,220,170,0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(GAME.zone.center.x - cam.x, GAME.zone.center.y - cam.y, GAME.zone.currentRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawObstacles(cam) {
  ctx.save();
  ctx.fillStyle = "rgba(24,32,50,0.9)";
  for (const o of GAME.obstacles) {
    ctx.fillRect(o.x - cam.x, o.y - cam.y, o.w, o.h);
  }
  ctx.restore();
}

function drawLoot(cam) {
  ctx.save();
  for (const item of GAME.loot) {
    if (item.taken) continue;
    if (item.kind === "weapon") ctx.fillStyle = "#ffd36b";
    if (item.kind === "armor") ctx.fillStyle = "#6bd0ff";
    if (item.kind === "med") ctx.fillStyle = "#78ff9b";
    if (item.kind === "attachment") ctx.fillStyle = "#b48bff";
    if (item.kind === "vehicle") ctx.fillStyle = "#ff8b3d";
    ctx.beginPath();
    ctx.arc(item.x - cam.x, item.y - cam.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayers(cam) {
  for (const b of GAME.bots) {
    if (!b.alive) continue;
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.arc(b.x - cam.x, b.y - cam.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const p = GAME.player;
  if (p.alive) {
    ctx.fillStyle = "#4fd6ff";
    ctx.beginPath();
    ctx.arc(p.x - cam.x, p.y - cam.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBullets(cam) {
  ctx.fillStyle = "#fff";
  for (const b of GAME.bullets) {
    ctx.beginPath();
    ctx.arc(b.x - cam.x, b.y - cam.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMinimap() {
  const size = 140;
  const pad = 14;
  const x = canvas.width / dpr - size - pad;
  const y = pad + 70;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.strokeRect(x, y, size, size);

  const scale = size / WORLD.w;
  ctx.strokeStyle = "rgba(80,220,170,0.8)";
  ctx.beginPath();
  ctx.arc(x + GAME.zone.center.x * scale, y + GAME.zone.center.y * scale, GAME.zone.currentRadius * scale, 0, Math.PI * 2);
  ctx.stroke();

  for (const b of GAME.bots) {
    if (!b.alive) continue;
    ctx.fillStyle = "#ff6b6b";
    ctx.fillRect(x + b.x * scale - 2, y + b.y * scale - 2, 4, 4);
  }

  const p = GAME.player;
  if (p.alive) {
    ctx.fillStyle = "#4fd6ff";
    ctx.fillRect(x + p.x * scale - 3, y + p.y * scale - 3, 6, 6);
  }

  ctx.restore();
}

function drawJoysticks() {
  if (!GAME.touch.leftOrigin && !GAME.touch.rightOrigin) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;

  if (GAME.touch.leftOrigin) {
    const o = GAME.touch.leftOrigin;
    ctx.beginPath();
    ctx.arc(o.x, o.y, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(o.x + GAME.touch.leftDelta.x * 36, o.y + GAME.touch.leftDelta.y * 36, 18, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (GAME.touch.rightOrigin) {
    const o = GAME.touch.rightOrigin;
    ctx.beginPath();
    ctx.arc(o.x, o.y, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(o.x + GAME.touch.rightDelta.x * 36, o.y + GAME.touch.rightDelta.y * 36, 18, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!GAME.player) {
    ctx.fillStyle = "#0e1528";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    return;
  }
  const cam = {
    x: clamp(GAME.player.x - canvas.width / dpr / 2, 0, WORLD.w - canvas.width / dpr),
    y: clamp(GAME.player.y - canvas.height / dpr / 2, 0, WORLD.h - canvas.height / dpr),
  };
  if (GAME.cameraShake > 0) {
    cam.x = clamp(cam.x + rand(-GAME.cameraShake, GAME.cameraShake), 0, WORLD.w - canvas.width / dpr);
    cam.y = clamp(cam.y + rand(-GAME.cameraShake, GAME.cameraShake), 0, WORLD.h - canvas.height / dpr);
  }

  ctx.fillStyle = "#0e1528";
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  drawGrid(cam);
  drawZone(cam);
  drawObstacles(cam);
  drawLoot(cam);
  drawBullets(cam);
  drawPlayers(cam);
  drawMinimap();
  drawJoysticks();

  hudHealth.textContent = `HP: ${Math.max(0, Math.floor(GAME.player.health))}/${GAME.player.maxHealth}`;
  hudArmor.textContent = `Armor: ${Math.floor(GAME.player.armor)}`;
  const slotCount = GAME.player.weaponSlots && GAME.player.weaponSlots[1] ? 2 : 1;
  hudWeapon.textContent = `Weapon: ${GAME.player.weapon.id} (${GAME.player.weaponIndex + 1}/${slotCount})`;
  if (hudAmmo) {
    hudAmmo.textContent = GAME.player.reloadTimer > 0
      ? `Ammo: Reloading ${GAME.player.reloadTimer.toFixed(1)}s`
      : `Ammo: ${GAME.player.ammoInMag}/${GAME.player.ammoReserve}`;
  }
  if (hudVehicle) {
    hudVehicle.textContent = GAME.player.vehicle
      ? `Vehicle: ${GAME.player.vehicle.type} ${GAME.player.vehicle.timer.toFixed(1)}s`
      : "Vehicle: None";
  }
  const modeLabel = MODES[GAME.mode]?.name || "Classic";
  const mapLabel = MAPS[GAME.map]?.name || "Ridgefront";
  hudRemain.textContent = `Remaining: ${GAME.remaining}  Kills: ${GAME.player.kills}  | ${modeLabel} @ ${mapLabel}`;

  if (!GAME.player.alive) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  } else if (GAME.remaining === 1) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  }

  if (GAME.damageFlash > 0) {
    ctx.fillStyle = `rgba(255, 80, 80, ${0.35 * GAME.damageFlash})`;
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  }

  if (GAME.hitMarker > 0) {
    const alpha = Math.min(1, GAME.hitMarker * 6);
    const cx = canvas.width / dpr / 2;
    const cy = canvas.height / dpr / 2;
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 10);
    ctx.lineTo(cx - 2, cy - 2);
    ctx.moveTo(cx + 10, cy - 10);
    ctx.lineTo(cx + 2, cy - 2);
    ctx.moveTo(cx - 10, cy + 10);
    ctx.lineTo(cx - 2, cy + 2);
    ctx.moveTo(cx + 10, cy + 10);
    ctx.lineTo(cx + 2, cy + 2);
    ctx.stroke();
    ctx.restore();
  }

  if (GAME.knockFlash > 0) {
    const alpha = Math.min(1, GAME.knockFlash * 2);
    ctx.save();
    ctx.fillStyle = `rgba(240, 200, 120, ${alpha})`;
    ctx.font = "bold 18px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("KNOCK!", canvas.width / dpr / 2, canvas.height / dpr / 2 - 40);
    ctx.restore();
  }

  updateKillfeed();
}

function loop(ts) {
  if (!GAME.running) return;
  const dt = Math.min(0.05, (ts - GAME.lastTime) / 1000 || 0);
  GAME.lastTime = ts;

  if (!GAME.paused) update(dt);
  render();

  requestAnimationFrame(loop);
}

function setTraitButtons() {
  const buttons = document.querySelectorAll(".trait");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      GAME.trait = btn.dataset.trait;
    });
  });
  buttons[0].classList.add("selected");
}

async function startGame() {
  PROFILE.name = nameInput.value.trim() || PROFILE.name || "Player";
  await updateNameIfOnline();
  saveProfile();
  updateTopbar();
  updateProfilePanel();

  const modeKey = modeSelect?.value || "classic";
  const mode = MODES[modeKey] || MODES.classic;
  const wantsMp = (mpToggle && mpToggle.checked) || mode.arena;

  resetGame();
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  startWarmup(WARMUP_TIME);
  if (wantsMp) {
    startMultiplayer();
  } else {
    stopMultiplayer();
  }
  GAME.running = true;
  GAME.lastTime = performance.now();
  overlay.classList.add("hidden");
  topbar.classList.remove("hidden");
  summaryPanel.classList.add("hidden");
  panelProfile.classList.add("hidden");
  panelStore.classList.add("hidden");
  requestAnimationFrame(loop);
}

function returnToLobby() {
  GAME.running = false;
  GAME.paused = false;
  summaryPanel.classList.add("hidden");
  if (warmupPanel) warmupPanel.classList.add("hidden");
  GAME.warmupActive = false;
  GAME.warmupTimer = 0;
  stopMultiplayer();
  overlay.classList.remove("hidden");
  render();
}

startBtn.addEventListener("click", startGame);
summaryBtn.addEventListener("click", returnToLobby);

loginBtn.addEventListener("click", login);
registerBtn.addEventListener("click", register);
offlineBtn.addEventListener("click", offlineMode);

claimDailyBtn.addEventListener("click", claimDailyReward);
claimDailyBtn2.addEventListener("click", claimDailyReward);
if (actionHeal) actionHeal.addEventListener("click", () => useMedkit(GAME.player));
if (actionSwap) actionSwap.addEventListener("click", () => {
  if (GAME.multiplayer) GAME.netSwap = true;
  else swapWeapon(GAME.player);
});
if (actionCapture) actionCapture.addEventListener("click", captureScreenshot);

profileBtn.addEventListener("click", () => {
  panelProfile.classList.remove("hidden");
  panelStore.classList.add("hidden");
});

storeBtn.addEventListener("click", () => {
  renderStore();
  panelStore.classList.remove("hidden");
  panelProfile.classList.add("hidden");
});

closeProfile.addEventListener("click", () => panelProfile.classList.add("hidden"));
closeStore.addEventListener("click", () => panelStore.classList.add("hidden"));

if (modeSelect) {
  modeSelect.addEventListener("change", () => {
    localStorage.setItem(MODE_KEY, modeSelect.value);
  });
}
if (mapSelect) {
  mapSelect.addEventListener("change", () => {
    localStorage.setItem(MAP_KEY, mapSelect.value);
  });
}
if (mpToggle) {
  mpToggle.addEventListener("change", () => {
    localStorage.setItem(MP_KEY, mpToggle.checked ? "1" : "0");
  });
}

window.addEventListener("keydown", (e) => {
  GAME.keys[e.code] = true;
  if (e.code === "Digit1" && GAME.player) equipWeapon(GAME.player, WEAPONS[0]);
  if (e.code === "Digit2" && GAME.player) equipWeapon(GAME.player, WEAPONS[1]);
  if (e.code === "Digit3" && GAME.player) equipWeapon(GAME.player, WEAPONS[2]);
  if (e.code === "KeyQ" && GAME.player) {
    if (GAME.multiplayer) GAME.netSwap = true;
    else swapWeapon(GAME.player);
  }
  if (e.code === "KeyR" && GAME.player) startReload(GAME.player);
  if (e.code === "KeyP") captureScreenshot();
});

window.addEventListener("keyup", (e) => {
  GAME.keys[e.code] = false;
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  GAME.mouse.x = e.clientX - rect.left;
  GAME.mouse.y = e.clientY - rect.top;
});

canvas.addEventListener("mousedown", () => {
  GAME.mouse.down = true;
});

canvas.addEventListener("mouseup", () => {
  GAME.mouse.down = false;
});

canvas.addEventListener("touchstart", (e) => {
  const rect = canvas.getBoundingClientRect();
  for (const t of e.changedTouches) {
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    if (x < rect.width * 0.5 && !GAME.touch.leftOrigin) {
      GAME.touch.leftId = t.identifier;
      GAME.touch.leftOrigin = { x, y };
      GAME.touch.leftDelta = { x: 0, y: 0 };
    } else if (!GAME.touch.rightOrigin) {
      GAME.touch.rightId = t.identifier;
      GAME.touch.rightOrigin = { x, y };
      GAME.touch.rightDelta = { x: 0, y: 0 };
    }
  }
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
  const rect = canvas.getBoundingClientRect();
  for (const t of e.changedTouches) {
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    if (t.identifier === GAME.touch.leftId && GAME.touch.leftOrigin) {
      const dx = x - GAME.touch.leftOrigin.x;
      const dy = y - GAME.touch.leftOrigin.y;
      const max = 60;
      GAME.touch.leftDelta.x = clamp(dx / max, -1, 1);
      GAME.touch.leftDelta.y = clamp(dy / max, -1, 1);
    }
    if (t.identifier === GAME.touch.rightId && GAME.touch.rightOrigin) {
      const dx = x - GAME.touch.rightOrigin.x;
      const dy = y - GAME.touch.rightOrigin.y;
      const max = 60;
      GAME.touch.rightDelta.x = clamp(dx / max, -1, 1);
      GAME.touch.rightDelta.y = clamp(dy / max, -1, 1);
    }
  }
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === GAME.touch.leftId) {
      GAME.touch.leftId = null;
      GAME.touch.leftOrigin = null;
      GAME.touch.leftDelta = { x: 0, y: 0 };
    }
    if (t.identifier === GAME.touch.rightId) {
      GAME.touch.rightId = null;
      GAME.touch.rightOrigin = null;
      GAME.touch.rightDelta = { x: 0, y: 0 };
    }
  }
  e.preventDefault();
}, { passive: false });

async function initUI() {
  nameInput.value = PROFILE.name;
  if (modeSelect) modeSelect.value = localStorage.getItem(MODE_KEY) || "classic";
  if (mapSelect) mapSelect.value = localStorage.getItem(MAP_KEY) || "ridge";
  if (mpToggle) mpToggle.checked = localStorage.getItem(MP_KEY) === "1";
  updateTopbar();
  updateProfilePanel();
  updateDailyUI();
  renderStore();
  if (authToken) await tryCloudProfile();
  if (AUTO_START) {
    if (mpToggle) mpToggle.checked = false;
    setTimeout(() => {
      if (!GAME.running) startGame();
    }, 200);
  }
}

resize();
setTraitButtons();
initUI();
render();
