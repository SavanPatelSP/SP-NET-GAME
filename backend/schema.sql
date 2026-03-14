CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS balances (
  user_id INTEGER PRIMARY KEY,
  coins INTEGER NOT NULL,
  gems INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS profile (
  user_id INTEGER PRIMARY KEY,
  level INTEGER NOT NULL,
  xp INTEGER NOT NULL,
  streak INTEGER NOT NULL,
  last_reward TEXT NOT NULL,
  matches INTEGER NOT NULL,
  lifetime_kills INTEGER NOT NULL,
  battle_xp INTEGER NOT NULL,
  battle_tier INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS inventory (
  user_id INTEGER PRIMARY KEY,
  items_json TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS store_offers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_coins INTEGER NOT NULL,
  price_gems INTEGER NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  offer_type TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  offer_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS daily_missions (
  user_id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  missions_json TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
