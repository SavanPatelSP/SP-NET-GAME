import json
import os
import sqlite3
import secrets
import hashlib
import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "spnet.db")
STATIC_DIR = os.path.join(BASE_DIR, "static")

DEFAULT_COINS = 1000
DEFAULT_GEMS = 25

ROLE_ORDER = ["player", "supervisor", "manager", "admin"]

MISSION_TEMPLATES = [
    {"id": "play_1", "title": "Play 1 match", "target": 1, "rewardCoins": 120, "rewardGems": 0, "rewardXp": 80},
    {"id": "kills_3", "title": "Get 3 kills", "target": 3, "rewardCoins": 150, "rewardGems": 0, "rewardXp": 120},
    {"id": "win_1", "title": "Win 1 match", "target": 1, "rewardCoins": 200, "rewardGems": 1, "rewardXp": 160},
]

OFFER_SEED = [
    {
        "id": "offer_crate",
        "name": "Supply Crate",
        "priceCoins": 200,
        "priceGems": 0,
        "offerType": "item",
        "payload": {"items": ["crate_basic"]},
        "hours": 12,
    },
    {
        "id": "offer_skin",
        "name": "Elite Skin",
        "priceCoins": 0,
        "priceGems": 20,
        "offerType": "cosmetic",
        "payload": {"items": ["skin_elite"]},
        "hours": 24,
    },
    {
        "id": "offer_xp",
        "name": "XP Boost",
        "priceCoins": 500,
        "priceGems": 0,
        "offerType": "boost",
        "payload": {"items": ["xp_boost_2h"]},
        "hours": 18,
    },
    {
        "id": "offer_bundle_ops",
        "name": "Ops Bundle",
        "priceCoins": 0,
        "priceGems": 45,
        "offerType": "bundle",
        "payload": {"items": ["skin_ops", "banner_ops", "emote_ops"]},
        "hours": 24,
    },
    {
        "id": "offer_attachment",
        "name": "Attachment Pack",
        "priceCoins": 350,
        "priceGems": 0,
        "offerType": "gear",
        "payload": {"items": ["att_stability", "att_scope"]},
        "hours": 10,
    },
    {
        "id": "offer_ability",
        "name": "Ability Kit",
        "priceCoins": 0,
        "priceGems": 15,
        "offerType": "ability",
        "payload": {"items": ["kit_sensorist"]},
        "hours": 14,
    },
    {
        "id": "offer_power60",
        "name": "Power Core (60% Boost)",
        "priceCoins": 0,
        "priceGems": 60,
        "offerType": "power",
        "payload": {"items": ["boost_power60"]},
        "hours": 24,
    },
]


def now_iso():
    return datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def today_key():
    return datetime.date.today().isoformat()


def db_connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password, salt):
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000).hex()


def init_db():
    with db_connect() as conn:
        schema_path = os.path.join(BASE_DIR, "schema.sql")
        with open(schema_path, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
        seed_offers(conn)
        conn.commit()


def seed_offers(conn):
    existing = conn.execute("SELECT id FROM store_offers").fetchall()
    existing_ids = {row["id"] for row in existing}

    now = datetime.datetime.utcnow()
    for idx, offer in enumerate(OFFER_SEED):
        if offer["id"] in existing_ids:
            continue
        start = now + datetime.timedelta(hours=idx * 2)
        end = start + datetime.timedelta(hours=offer["hours"])
        conn.execute(
            "INSERT INTO store_offers (id, name, price_coins, price_gems, start_at, end_at, offer_type, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                offer["id"],
                offer["name"],
                offer["priceCoins"],
                offer["priceGems"],
                start.isoformat() + "Z",
                end.isoformat() + "Z",
                offer["offerType"],
                json.dumps(offer["payload"]),
            ),
        )


def get_user_by_token(conn, token):
    if not token:
        return None
    row = conn.execute(
        "SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?",
        (token,),
    ).fetchone()
    if row:
        conn.execute("UPDATE sessions SET last_seen = ? WHERE token = ?", (now_iso(), token))
    return row


def role_allows(user_role, required_roles):
    if user_role not in ROLE_ORDER:
        return False
    return user_role in required_roles


def ensure_daily_missions(conn, user_id):
    today = today_key()
    row = conn.execute("SELECT date, missions_json FROM daily_missions WHERE user_id = ?", (user_id,)).fetchone()
    if row and row["date"] == today:
        return json.loads(row["missions_json"])

    missions = []
    for m in MISSION_TEMPLATES:
        mission = {
            "id": m["id"],
            "title": m["title"],
            "target": m["target"],
            "progress": 0,
            "rewardCoins": m["rewardCoins"],
            "rewardGems": m["rewardGems"],
            "rewardXp": m["rewardXp"],
            "claimed": False,
        }
        missions.append(mission)

    payload = json.dumps(missions)
    if row:
        conn.execute("UPDATE daily_missions SET date = ?, missions_json = ? WHERE user_id = ?", (today, payload, user_id))
    else:
        conn.execute("INSERT INTO daily_missions (user_id, date, missions_json) VALUES (?, ?, ?)", (user_id, today, payload))
    return missions


def load_profile(conn, user_id):
    profile = conn.execute("SELECT * FROM profile WHERE user_id = ?", (user_id,)).fetchone()
    balances = conn.execute("SELECT * FROM balances WHERE user_id = ?", (user_id,)).fetchone()
    inventory = conn.execute("SELECT items_json FROM inventory WHERE user_id = ?", (user_id,)).fetchone()
    missions = ensure_daily_missions(conn, user_id)

    if not inventory:
        inventory_items = []
    else:
        inventory_items = json.loads(inventory["items_json"]) if inventory["items_json"] else []

    return profile, balances, inventory_items, missions


def xp_to_next(level):
    return 150 + (level * 50)


def battle_xp_to_next(tier):
    return 1000 + (tier * 200)


def active_offers(conn):
    now = now_iso()
    rows = conn.execute(
        "SELECT id, name, price_coins, price_gems, start_at, end_at, offer_type, payload FROM store_offers WHERE start_at <= ? AND end_at >= ?",
        (now, now),
    ).fetchall()
    offers = []
    for row in rows:
        offers.append(
            {
                "id": row["id"],
                "name": row["name"],
                "priceCoins": row["price_coins"],
                "priceGems": row["price_gems"],
                "startAt": row["start_at"],
                "endAt": row["end_at"],
                "offerType": row["offer_type"],
                "payload": json.loads(row["payload"]),
            }
        )
    return offers


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, payload=None, content_type="application/json"):
        self.send_response(code)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        if payload is not None:
            data = payload if isinstance(payload, (bytes, bytearray)) else json.dumps(payload).encode("utf-8")
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            self.end_headers()

    def _json(self):
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def _auth(self):
        auth = self.headers.get("Authorization", "")
        token = auth.replace("Bearer ", "") if auth.startswith("Bearer ") else ""
        with db_connect() as conn:
            return get_user_by_token(conn, token)

    def do_OPTIONS(self):
        self._send(204)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/static/"):
            return self._serve_static(parsed.path)

        if parsed.path == "/" or parsed.path == "/admin":
            return self._serve_file("admin.html", "text/html")

        if parsed.path == "/api/health":
            return self._send(200, {"ok": True, "time": now_iso()})

        if parsed.path == "/api/store/offers":
            with db_connect() as conn:
                offers = active_offers(conn)
            return self._send(200, {"ok": True, "offers": offers})

        if parsed.path == "/api/profile":
            user = self._auth()
            if not user:
                return self._send(401, {"ok": False, "error": "unauthorized"})
            with db_connect() as conn:
                profile, balances, inventory_items, missions = load_profile(conn, user["id"])
                offers = active_offers(conn)
            response = {
                "ok": True,
                "user": {"email": user["email"], "name": user["name"], "role": user["role"]},
                "profile": dict(profile),
                "balances": dict(balances),
                "inventory": inventory_items,
                "missions": missions,
                "offers": offers,
                "battlepass": {
                    "tier": profile["battle_tier"],
                    "xp": profile["battle_xp"],
                    "xpToNext": battle_xp_to_next(profile["battle_tier"]),
                },
            }
            return self._send(200, response)

        if parsed.path == "/api/missions/daily":
            user = self._auth()
            if not user:
                return self._send(401, {"ok": False, "error": "unauthorized"})
            with db_connect() as conn:
                missions = ensure_daily_missions(conn, user["id"])
            return self._send(200, {"ok": True, "missions": missions})

        if parsed.path == "/api/battlepass":
            user = self._auth()
            if not user:
                return self._send(401, {"ok": False, "error": "unauthorized"})
            with db_connect() as conn:
                profile = conn.execute("SELECT battle_xp, battle_tier FROM profile WHERE user_id = ?", (user["id"],)).fetchone()
            return self._send(200, {
                "ok": True,
                "battlepass": {
                    "tier": profile["battle_tier"],
                    "xp": profile["battle_xp"],
                    "xpToNext": battle_xp_to_next(profile["battle_tier"]),
                }
            })

        if parsed.path == "/api/admin/users":
            user = self._auth()
            if not user or not role_allows(user["role"], ["supervisor", "manager", "admin"]):
                return self._send(403, {"ok": False, "error": "forbidden"})

            query = parse_qs(parsed.query).get("q", [""])[0].lower()
            with db_connect() as conn:
                rows = conn.execute("SELECT u.email, u.name, u.role, b.coins, b.gems FROM users u JOIN balances b ON u.id = b.user_id ORDER BY u.id DESC").fetchall()
            results = []
            for row in rows:
                if query and query not in row["email"].lower() and query not in row["name"].lower():
                    continue
                results.append(dict(row))
            return self._send(200, {"ok": True, "users": results})

        return self._send(404, {"ok": False, "error": "not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        body = self._json()

        if parsed.path == "/api/register":
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            name = body.get("name", "").strip() or "Player"
            if not email or not password:
                return self._send(400, {"ok": False, "error": "missing fields"})

            salt = secrets.token_hex(8)
            pw_hash = hash_password(password, salt)
            now = now_iso()

            try:
                with db_connect() as conn:
                    cur = conn.execute(
                        "INSERT INTO users (email, password_hash, salt, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                        (email, pw_hash, salt, name, "player", now),
                    )
                    user_id = cur.lastrowid
                    conn.execute("INSERT INTO balances (user_id, coins, gems) VALUES (?, ?, ?)", (user_id, DEFAULT_COINS, DEFAULT_GEMS))
                    conn.execute(
                        "INSERT INTO profile (user_id, level, xp, streak, last_reward, matches, lifetime_kills, battle_xp, battle_tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        (user_id, 1, 0, 0, "", 0, 0, 0, 1),
                    )
                    conn.execute("INSERT INTO inventory (user_id, items_json) VALUES (?, ?)", (user_id, json.dumps([])))
                    conn.commit()
            except sqlite3.IntegrityError:
                return self._send(409, {"ok": False, "error": "email exists"})

            return self._send(200, {"ok": True})

        if parsed.path == "/api/login":
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            if not email or not password:
                return self._send(400, {"ok": False, "error": "missing fields"})

            with db_connect() as conn:
                user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
                if not user:
                    return self._send(401, {"ok": False, "error": "invalid credentials"})
                check = hash_password(password, user["salt"])
                if check != user["password_hash"]:
                    return self._send(401, {"ok": False, "error": "invalid credentials"})

                token = secrets.token_hex(16)
                now = now_iso()
                conn.execute("INSERT INTO sessions (token, user_id, created_at, last_seen) VALUES (?, ?, ?, ?)", (token, user["id"], now, now))
                profile, balances, inventory_items, missions = load_profile(conn, user["id"])
                offers = active_offers(conn)
                conn.commit()

            return self._send(200, {
                "ok": True,
                "token": token,
                "user": {"email": user["email"], "name": user["name"], "role": user["role"]},
                "profile": dict(profile),
                "balances": dict(balances),
                "inventory": inventory_items,
                "missions": missions,
                "offers": offers,
                "battlepass": {
                    "tier": profile["battle_tier"],
                    "xp": profile["battle_xp"],
                    "xpToNext": battle_xp_to_next(profile["battle_tier"]),
                },
            })

        if parsed.path == "/api/claim_daily":
            user = self._auth()
            if not user:
                return self._send(401, {"ok": False, "error": "unauthorized"})

            with db_connect() as conn:
                profile = conn.execute("SELECT streak, last_reward FROM profile WHERE user_id = ?", (user["id"],)).fetchone()
                balances = conn.execute("SELECT coins, gems FROM balances WHERE user_id = ?", (user["id"],)).fetchone()

                today = today_key()
                if profile["last_reward"] == today:
                    return self._send(200, {"ok": False, "error": "already claimed"})

                streak = profile["streak"]
                if profile["last_reward"]:
                    prev = datetime.date.fromisoformat(profile["last_reward"])
                    diff = (datetime.date.today() - prev).days
                    if diff == 1:
                        streak += 1
                    else:
                        streak = 1
                else:
                    streak = 1

                coins_reward = 200 + streak * 20
                gems_reward = 5 + (streak // 3)
                conn.execute("UPDATE profile SET streak = ?, last_reward = ? WHERE user_id = ?", (streak, today, user["id"]))
                conn.execute("UPDATE balances SET coins = ?, gems = ? WHERE user_id = ?", (balances["coins"] + coins_reward, balances["gems"] + gems_reward, user["id"]))
                conn.commit()

            return self._send(200, {"ok": True, "coins": coins_reward, "gems": gems_reward, "streak": streak})

        if parsed.path == "/api/store/buy":
            user = self._auth()
            if not user:
                return self._send(401, {"ok": False, "error": "unauthorized"})

            offer_id = body.get("offerId")
            if not offer_id:
                return self._send(400, {"ok": False, "error": "missing offer"})

            with db_connect() as conn:
                offer = conn.execute("SELECT * FROM store_offers WHERE id = ?", (offer_id,)).fetchone()
                if not offer:
                    return self._send(404, {"ok": False, "error": "offer not found"})

                now = now_iso()
                if offer["start_at"] > now or offer["end_at"] < now:
                    return self._send(400, {"ok": False, "error": "offer expired"})

                balances = conn.execute("SELECT coins, gems FROM balances WHERE user_id = ?", (user["id"],)).fetchone()
                if balances["coins"] < offer["price_coins"] or balances["gems"] < offer["price_gems"]:
                    return self._send(400, {"ok": False, "error": "insufficient funds"})

                new_coins = balances["coins"] - offer["price_coins"]
                new_gems = balances["gems"] - offer["price_gems"]
                conn.execute("UPDATE balances SET coins = ?, gems = ? WHERE user_id = ?", (new_coins, new_gems, user["id"]))

                inv_row = conn.execute("SELECT items_json FROM inventory WHERE user_id = ?", (user["id"],)).fetchone()
                inventory_items = json.loads(inv_row["items_json"]) if inv_row and inv_row["items_json"] else []
                payload = json.loads(offer["payload"])
                for item in payload.get("items", []):
                    inventory_items.append(item)
                conn.execute("UPDATE inventory SET items_json = ? WHERE user_id = ?", (json.dumps(inventory_items), user["id"]))

                conn.execute("INSERT INTO purchases (user_id, offer_id, created_at) VALUES (?, ?, ?)", (user["id"], offer_id, now_iso()))
                conn.commit()

            return self._send(200, {"ok": True, "coins": new_coins, "gems": new_gems, "inventory": inventory_items})

        if parsed.path == "/api/missions/claim":
            user = self._auth()
            if not user:
                return self._send(401, {"ok": False, "error": "unauthorized"})

            mission_id = body.get("missionId")
            if not mission_id:
                return self._send(400, {"ok": False, "error": "missing mission"})

            with db_connect() as conn:
                missions = ensure_daily_missions(conn, user["id"])
                updated = False
                for m in missions:
                    if m["id"] == mission_id:
                        if m["claimed"]:
                            return self._send(200, {"ok": False, "error": "already claimed"})
                        if m["progress"] < m["target"]:
                            return self._send(200, {"ok": False, "error": "not complete"})
                        m["claimed"] = True
                        updated = True
                        coins = m["rewardCoins"]
                        gems = m["rewardGems"]
                        xp = m["rewardXp"]
                        balances = conn.execute("SELECT coins, gems FROM balances WHERE user_id = ?", (user["id"],)).fetchone()
                        profile = conn.execute("SELECT level, xp FROM profile WHERE user_id = ?", (user["id"],)).fetchone()
                        new_xp = profile["xp"] + xp
                        level = profile["level"]
                        while new_xp >= xp_to_next(level):
                            new_xp -= xp_to_next(level)
                            level += 1
                        conn.execute("UPDATE balances SET coins = ?, gems = ? WHERE user_id = ?", (balances["coins"] + coins, balances["gems"] + gems, user["id"]))
                        conn.execute("UPDATE profile SET level = ?, xp = ? WHERE user_id = ?", (level, new_xp, user["id"]))
                        break
                if not updated:
                    return self._send(404, {"ok": False, "error": "mission not found"})
                conn.execute("UPDATE daily_missions SET missions_json = ? WHERE user_id = ?", (json.dumps(missions), user["id"]))
                conn.commit()
            return self._send(200, {"ok": True})

        if parsed.path == "/api/match/report":
            user = self._auth()
            if not user:
                return self._send(401, {"ok": False, "error": "unauthorized"})

            kills = int(body.get("kills", 0))
            won = bool(body.get("won", False))

            xp_earned = 40 + (kills * 20) + (120 if won else 0)
            coins_earned = 100 + (kills * 30) + (200 if won else 0)
            gems_earned = 2 if won else 0

            with db_connect() as conn:
                profile = conn.execute("SELECT level, xp, matches, lifetime_kills, battle_xp, battle_tier FROM profile WHERE user_id = ?", (user["id"],)).fetchone()
                balances = conn.execute("SELECT coins, gems FROM balances WHERE user_id = ?", (user["id"],)).fetchone()

                level = profile["level"]
                xp_val = profile["xp"] + xp_earned
                while xp_val >= xp_to_next(level):
                    xp_val -= xp_to_next(level)
                    level += 1

                battle_xp = profile["battle_xp"] + xp_earned
                battle_tier = profile["battle_tier"]
                while battle_xp >= battle_xp_to_next(battle_tier):
                    battle_xp -= battle_xp_to_next(battle_tier)
                    battle_tier += 1

                conn.execute(
                    "UPDATE profile SET level = ?, xp = ?, matches = ?, lifetime_kills = ?, battle_xp = ?, battle_tier = ? WHERE user_id = ?",
                    (level, xp_val, profile["matches"] + 1, profile["lifetime_kills"] + kills, battle_xp, battle_tier, user["id"]),
                )
                conn.execute(
                    "UPDATE balances SET coins = ?, gems = ? WHERE user_id = ?",
                    (balances["coins"] + coins_earned, balances["gems"] + gems_earned, user["id"]),
                )

                missions = ensure_daily_missions(conn, user["id"])
                for m in missions:
                    if m["id"] == "play_1":
                        m["progress"] = min(m["target"], m["progress"] + 1)
                    if m["id"] == "kills_3":
                        m["progress"] = min(m["target"], m["progress"] + kills)
                    if m["id"] == "win_1" and won:
                        m["progress"] = min(m["target"], m["progress"] + 1)
                conn.execute("UPDATE daily_missions SET missions_json = ? WHERE user_id = ?", (json.dumps(missions), user["id"]))
                conn.commit()

            return self._send(200, {
                "ok": True,
                "xp": xp_earned,
                "coins": coins_earned,
                "gems": gems_earned,
            })

        if parsed.path == "/api/admin/grant":
            user = self._auth()
            if not user or not role_allows(user["role"], ["manager", "admin"]):
                return self._send(403, {"ok": False, "error": "forbidden"})

            target_email = body.get("email", "").strip().lower()
            coins = int(body.get("coins", 0))
            gems = int(body.get("gems", 0))
            if not target_email:
                return self._send(400, {"ok": False, "error": "missing email"})

            with db_connect() as conn:
                target = conn.execute("SELECT id FROM users WHERE email = ?", (target_email,)).fetchone()
                if not target:
                    return self._send(404, {"ok": False, "error": "user not found"})
                balances = conn.execute("SELECT coins, gems FROM balances WHERE user_id = ?", (target["id"],)).fetchone()
                new_coins = balances["coins"] + max(0, coins)
                new_gems = balances["gems"] + max(0, gems)
                conn.execute("UPDATE balances SET coins = ?, gems = ? WHERE user_id = ?", (new_coins, new_gems, target["id"]))
                conn.commit()
            return self._send(200, {"ok": True, "coins": new_coins, "gems": new_gems})

        if parsed.path == "/api/admin/set-role":
            user = self._auth()
            if not user or not role_allows(user["role"], ["admin"]):
                return self._send(403, {"ok": False, "error": "forbidden"})

            target_email = body.get("email", "").strip().lower()
            role = body.get("role", "player")
            if role not in ROLE_ORDER:
                return self._send(400, {"ok": False, "error": "invalid role"})

            with db_connect() as conn:
                target = conn.execute("SELECT id FROM users WHERE email = ?", (target_email,)).fetchone()
                if not target:
                    return self._send(404, {"ok": False, "error": "user not found"})
                conn.execute("UPDATE users SET role = ? WHERE id = ?", (role, target["id"]))
                conn.commit()
            return self._send(200, {"ok": True})

        if parsed.path == "/api/profile":
            user = self._auth()
            if not user:
                return self._send(401, {"ok": False, "error": "unauthorized"})
            new_name = body.get("name", "").strip()
            if not new_name:
                return self._send(400, {"ok": False, "error": "missing name"})
            with db_connect() as conn:
                conn.execute("UPDATE users SET name = ? WHERE id = ?", (new_name, user["id"]))
                conn.commit()
            return self._send(200, {"ok": True})

        return self._send(404, {"ok": False, "error": "not found"})

    def _serve_static(self, path):
        filename = path.replace("/static/", "")
        return self._serve_file(filename)

    def _serve_file(self, filename, content_type=None):
        filepath = os.path.join(STATIC_DIR, filename)
        if not os.path.isfile(filepath):
            return self._send(404, {"ok": False, "error": "not found"})
        if content_type is None:
            if filename.endswith(".html"):
                content_type = "text/html"
            elif filename.endswith(".css"):
                content_type = "text/css"
            elif filename.endswith(".js"):
                content_type = "application/javascript"
            else:
                content_type = "application/octet-stream"
        with open(filepath, "rb") as f:
            data = f.read()
        return self._send(200, data, content_type)


def create_admin(email, password):
    init_db()
    salt = secrets.token_hex(8)
    pw_hash = hash_password(password, salt)
    now = now_iso()
    with db_connect() as conn:
        try:
            cur = conn.execute(
                "INSERT INTO users (email, password_hash, salt, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (email, pw_hash, salt, "Admin", "admin", now),
            )
            user_id = cur.lastrowid
            conn.execute("INSERT INTO balances (user_id, coins, gems) VALUES (?, ?, ?)", (user_id, DEFAULT_COINS, DEFAULT_GEMS))
            conn.execute(
                "INSERT INTO profile (user_id, level, xp, streak, last_reward, matches, lifetime_kills, battle_xp, battle_tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (user_id, 1, 0, 0, "", 0, 0, 0, 1),
            )
            conn.execute("INSERT INTO inventory (user_id, items_json) VALUES (?, ?)", (user_id, json.dumps([])))
            conn.commit()
            print("Admin user created.")
        except sqlite3.IntegrityError:
            print("Admin user already exists.")


def main():
    init_db()
    import sys
    if len(sys.argv) >= 3 and sys.argv[1] == "--create-admin":
        create_admin(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "admin123")
        return

    host = "0.0.0.0"
    port = 8787
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"SP NET backend running on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
