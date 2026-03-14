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

const dailyRewardText = document.getElementById("dailyRewardText");
const claimDailyBtn = document.getElementById("claimDaily");
const claimDailyBtn2 = document.getElementById("claimDaily2");
const dailyStatus = document.getElementById("dailyStatus");

const topbar = document.getElementById("topbar");
const levelChip = document.getElementById("levelChip");
const xpFill = document.getElementById("xpFill");
const coinsChip = document.getElementById("coinsChip");
const gemsChip = document.getElementById("gemsChip");
const profileBtn = document.getElementById("profileBtn");
const storeBtn = document.getElementById("storeBtn");

const panelProfile = document.getElementById("panelProfile");
const panelStore = document.getElementById("panelStore");
const closeProfile = document.getElementById("closeProfile");
const closeStore = document.getElementById("closeStore");
const profileSummary = document.getElementById("profileSummary");
const missionsList = document.getElementById("missionsList");
const battlePass = document.getElementById("battlePass");
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
const hudRemain = document.getElementById("remain");

let dpr = Math.max(1, window.devicePixelRatio || 1);

const API_BASE = localStorage.getItem("spnet_api") || "http://localhost:8787";
let authToken = localStorage.getItem("spnet_token") || "";
let onlineMode = false;

const WORLD = { w: 2000, h: 2000 };
const CENTER = { x: WORLD.w / 2, y: WORLD.h / 2 };

const TRAITS = {
  swift: { name: "Trailblazer", speedMult: 1.1, maxHealthAdd: 0 },
  bulwark: { name: "Bulwark", speedMult: 1.0, maxHealthAdd: 20 },
  sensor: { name: "Sensorist", speedMult: 1.0, maxHealthAdd: 0 },
  medic: { name: "Medicall", speedMult: 1.0, maxHealthAdd: 0 },
};

const WEAPONS = [
  { id: "Rift-19", type: "AR", fireRate: 9, damage: 14, speed: 720, spread: 0.06, range: 700 },
  { id: "Viper-K", type: "SMG", fireRate: 13, damage: 10, speed: 650, spread: 0.09, range: 520 },
  { id: "Grave-12", type: "SG", fireRate: 1.1, damage: 48, speed: 580, spread: 0.22, range: 260 },
  { id: "Siren-12", type: "DMR", fireRate: 3.5, damage: 28, speed: 860, spread: 0.04, range: 820 },
  { id: "Warden", type: "SN", fireRate: 0.8, damage: 85, speed: 980, spread: 0.02, range: 1100 },
  { id: "Bearclaw", type: "LMG", fireRate: 8, damage: 16, speed: 680, spread: 0.08, range: 700 },
];

const PROFILE_KEY = "spnet_profile_v101";
const MISSION_KEY = "spnet_missions_v101";
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
};

const LOCAL_MISSIONS = [
  { id: "play_1", title: "Play 1 match", target: 1, rewardCoins: 120, rewardGems: 0, rewardXp: 80 },
  { id: "kills_3", title: "Get 3 kills", target: 3, rewardCoins: 150, rewardGems: 0, rewardXp: 120 },
  { id: "win_1", title: "Win 1 match", target: 1, rewardCoins: 200, rewardGems: 1, rewardXp: 160 },
];

let PROFILE = loadProfile();
let MISSIONS = loadLocalMissions();
let OFFERS = [];

const GAME = {
  running: false,
  paused: false,
  matchEnded: false,
  lastTime: 0,
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
  },
  remaining: 0,
  trait: "swift",
};

const PHASES = [
  { wait: 10, shrink: 18, radius: 1000 },
  { wait: 8, shrink: 16, radius: 800 },
  { wait: 8, shrink: 14, radius: 600 },
  { wait: 6, shrink: 12, radius: 450 },
  { wait: 6, shrink: 10, radius: 320 },
  { wait: 4, shrink: 10, radius: 220 },
  { wait: 0, shrink: 12, radius: 140 },
];

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
    return { ...DEFAULT_PROFILE, ...data };
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
}

function updateProfilePanel() {
  profileSummary.textContent =
    `Name: ${PROFILE.name}\n` +
    `Level: ${PROFILE.level}  XP: ${PROFILE.xp}/${xpToNext(PROFILE.level)}\n` +
    `Streak: ${PROFILE.streak} days\n` +
    `Matches: ${PROFILE.matches}\n` +
    `Lifetime Kills: ${PROFILE.lifetimeKills}\n` +
    `Inventory: ${PROFILE.inventory.slice(0, 6).join(", ") || "None"}`;

  const battleNeed = battleXpToNext(PROFILE.battleTier);
  battlePass.textContent = `Tier ${PROFILE.battleTier} | XP ${PROFILE.battleXp}/${battleNeed}`;
  renderMissions();
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
    { id: "offer_ability", name: "Ability Kit", priceCoins: 0, priceGems: 15, offerType: "ability", payload: { items: ["kit_sensorist"] } },
  ];
  return offers.slice(day % 2, day % 2 + 3);
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
  return {
    id: "player",
    x: CENTER.x + rand(-120, 120),
    y: CENTER.y + rand(-120, 120),
    vx: 0,
    vy: 0,
    r: 14,
    speed: 210 * trait.speedMult,
    health: 100 + trait.maxHealthAdd,
    maxHealth: 100 + trait.maxHealthAdd,
    armor: 0,
    weapon: { ...WEAPONS[0] },
    cooldown: 0,
    kills: 0,
    alive: true,
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
  };
}

function createLoot() {
  const loot = [];
  for (let i = 0; i < 55; i++) {
    const typeRoll = Math.random();
    let kind = "weapon";
    if (typeRoll > 0.7) kind = "armor";
    if (typeRoll > 0.9) kind = "med";
    loot.push({
      id: `loot-${i}`,
      x: rand(80, WORLD.w - 80),
      y: rand(80, WORLD.h - 80),
      kind,
      weapon: kind === "weapon" ? { ...WEAPONS[Math.floor(rand(0, WEAPONS.length))] } : null,
      taken: false,
    });
  }
  return loot;
}

function createObstacles() {
  const obs = [];
  for (let i = 0; i < 20; i++) {
    const w = rand(90, 180);
    const h = rand(60, 140);
    obs.push({
      x: rand(150, WORLD.w - 150),
      y: rand(150, WORLD.h - 150),
      w,
      h,
    });
  }
  return obs;
}

function resetGame() {
  GAME.player = createPlayer();
  GAME.bots = [];
  for (let i = 0; i < 28; i++) GAME.bots.push(createBot(i));
  GAME.bullets = [];
  GAME.loot = createLoot();
  GAME.obstacles = createObstacles();
  GAME.zone.phaseIndex = 0;
  GAME.zone.phaseTime = 0;
  GAME.zone.currentRadius = PHASES[0].radius;
  GAME.zone.targetRadius = PHASES[1].radius;
  GAME.remaining = 1 + GAME.bots.length;
  GAME.matchEnded = false;
  GAME.paused = false;
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
  const phase = PHASES[GAME.zone.phaseIndex];
  const nextPhase = PHASES[GAME.zone.phaseIndex + 1];
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
  const d = dist(entity, CENTER);
  if (d > GAME.zone.currentRadius) {
    entity.health -= 10 * dt;
  }
}

function fireBullet(shooter, angle) {
  if (shooter.cooldown > 0) return;
  const w = shooter.weapon;
  shooter.cooldown = 1 / w.fireRate;
  const spread = (Math.random() - 0.5) * w.spread;
  const ang = angle + spread;
  const vx = Math.cos(ang) * w.speed;
  const vy = Math.sin(ang) * w.speed;
  GAME.bullets.push({
    x: shooter.x + Math.cos(ang) * shooter.r,
    y: shooter.y + Math.sin(ang) * shooter.r,
    vx,
    vy,
    damage: w.damage,
    life: w.range / w.speed,
    owner: shooter.id,
  });
}

function updatePlayer(dt) {
  const p = GAME.player;
  if (!p.alive) return;

  let dx = 0;
  let dy = 0;

  if (GAME.keys["KeyW"] || GAME.keys["ArrowUp"]) dy -= 1;
  if (GAME.keys["KeyS"] || GAME.keys["ArrowDown"]) dy += 1;
  if (GAME.keys["KeyA"] || GAME.keys["ArrowLeft"]) dx -= 1;
  if (GAME.keys["KeyD"] || GAME.keys["ArrowRight"]) dx += 1;

  if (GAME.touch.leftOrigin) {
    const lx = GAME.touch.leftDelta.x;
    const ly = GAME.touch.leftDelta.y;
    dx += lx;
    dy += ly;
  }

  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;

  const nx = p.x + dx * p.speed * dt;
  const ny = p.y + dy * p.speed * dt;
  moveWithCollisions(p, nx, ny);

  let aimAngle = Math.atan2(GAME.mouse.y - canvas.height / dpr / 2, GAME.mouse.x - canvas.width / dpr / 2);

  if (GAME.touch.rightOrigin) {
    const rx = GAME.touch.rightDelta.x;
    const ry = GAME.touch.rightDelta.y;
    if (Math.hypot(rx, ry) > 0.05) {
      aimAngle = Math.atan2(ry, rx);
    }
  }

  const wantsFire = GAME.mouse.down || (GAME.touch.rightOrigin && Math.hypot(GAME.touch.rightDelta.x, GAME.touch.rightDelta.y) > 0.15);
  if (wantsFire) fireBullet(p, aimAngle);

  if (p.cooldown > 0) p.cooldown -= dt;

  applyZoneDamage(p, dt);
  if (p.health <= 0) p.alive = false;

  for (const item of GAME.loot) {
    if (item.taken) continue;
    if (dist(p, item) < 20) {
      item.taken = true;
      if (item.kind === "weapon") p.weapon = { ...item.weapon };
      if (item.kind === "armor") p.armor = Math.min(50, p.armor + 25);
      if (item.kind === "med") p.health = Math.min(p.maxHealth, p.health + 35);
    }
  }
}

function updateBots(dt) {
  for (const b of GAME.bots) {
    if (!b.alive) continue;

    b.thinkTime -= dt;

    const player = GAME.player;
    const distToPlayer = dist(b, player);
    if (player.alive && distToPlayer < 420) {
      b.state = "attack";
      b.target = player;
    } else if (b.thinkTime <= 0) {
      b.state = Math.random() < 0.7 ? "wander" : "loot";
      b.target = { x: rand(100, WORLD.w - 100), y: rand(100, WORLD.h - 100) };
      b.thinkTime = rand(1.5, 3.5);
    }

    let dx = 0;
    let dy = 0;

    if (b.state === "attack" && b.target) {
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

    applyZoneDamage(b, dt);
    if (b.health <= 0) b.alive = false;

    for (const item of GAME.loot) {
      if (item.taken) continue;
      if (dist(b, item) < 18) {
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
        let dmg = b.damage;
        if (t.armor > 0) {
          const absorbed = Math.min(t.armor, dmg * 0.6);
          t.armor -= absorbed;
          dmg -= absorbed;
        }
        t.health -= dmg;
        b.life = 0;
        if (t.health <= 0) {
          t.alive = false;
          if (b.owner === "player") GAME.player.kills += 1;
        }
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
  updateZone(dt);
  updatePlayer(dt);
  updateBots(dt);
  updateBullets(dt);
  countRemaining();
  checkMatchEnd();
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
  ctx.arc(CENTER.x - cam.x, CENTER.y - cam.y, GAME.zone.currentRadius, 0, Math.PI * 2);
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
  ctx.arc(x + CENTER.x * scale, y + CENTER.y * scale, GAME.zone.currentRadius * scale, 0, Math.PI * 2);
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
  const cam = {
    x: clamp(GAME.player.x - canvas.width / dpr / 2, 0, WORLD.w - canvas.width / dpr),
    y: clamp(GAME.player.y - canvas.height / dpr / 2, 0, WORLD.h - canvas.height / dpr),
  };

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
  hudWeapon.textContent = `Weapon: ${GAME.player.weapon.id}`;
  hudRemain.textContent = `Remaining: ${GAME.remaining}  Kills: ${GAME.player.kills}`;

  if (!GAME.player.alive) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  } else if (GAME.remaining === 1) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  }
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

  resetGame();
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

window.addEventListener("keydown", (e) => {
  GAME.keys[e.code] = true;
  if (e.code === "Digit1" && GAME.player) GAME.player.weapon = { ...WEAPONS[0] };
  if (e.code === "Digit2" && GAME.player) GAME.player.weapon = { ...WEAPONS[1] };
  if (e.code === "Digit3" && GAME.player) GAME.player.weapon = { ...WEAPONS[2] };
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
  updateTopbar();
  updateProfilePanel();
  updateDailyUI();
  renderStore();
  if (authToken) await tryCloudProfile();
}

resize();
setTraitButtons();
initUI();
render();
