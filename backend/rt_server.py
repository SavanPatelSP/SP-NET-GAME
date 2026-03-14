import asyncio
import json
import math
import random
import secrets
import time

import websockets

WORLD_W = 2000
WORLD_H = 2000
WORLD_CENTER = (WORLD_W / 2, WORLD_H / 2)

TICK_RATE = 20
MAX_PLAYERS = 12
MIN_START = 2
START_DELAY = 6
WARMUP_TIME = 4

WEAPONS = [
    {"id": "Rift-19", "fireRate": 9, "damage": 14, "speed": 720, "spread": 0.045, "range": 700, "mag": 30, "reserve": 120, "reload": 1.7},
    {"id": "Viper-K", "fireRate": 13, "damage": 10, "speed": 650, "spread": 0.065, "range": 520, "mag": 35, "reserve": 140, "reload": 1.5},
    {"id": "Grave-12", "fireRate": 1.1, "damage": 48, "speed": 580, "spread": 0.18, "range": 260, "mag": 6, "reserve": 30, "reload": 2.3},
]

PHASES = [
    {"wait": 6, "shrink": 14, "radius": 1000},
    {"wait": 5, "shrink": 12, "radius": 820},
    {"wait": 4, "shrink": 10, "radius": 620},
    {"wait": 3, "shrink": 9, "radius": 460},
    {"wait": 2, "shrink": 8, "radius": 320},
    {"wait": 1, "shrink": 8, "radius": 220},
    {"wait": 0, "shrink": 10, "radius": 140},
]


def clamp(v, a, b):
    return max(a, min(b, v))


class Player:
    def __init__(self, pid, name, ws):
        self.id = pid
        self.name = name
        self.ws = ws
        self.x = WORLD_CENTER[0] + random.uniform(-120, 120)
        self.y = WORLD_CENTER[1] + random.uniform(-120, 120)
        self.vx = 0
        self.vy = 0
        self.r = 14
        self.speed = 210
        self.health = 100
        self.maxHealth = 100
        self.armor = 0
        self.weapon_index = 0
        self.cooldown = 0
        self.reload_timer = 0
        self.ammo_in_mag = WEAPONS[0]["mag"]
        self.ammo_reserve = WEAPONS[0]["reserve"]
        self.kills = 0
        self.alive = True
        self.last_input = {"move": (0, 0), "aim": (1, 0), "fire": False, "swap": False, "reload": False}

    @property
    def weapon(self):
        return WEAPONS[self.weapon_index]


class Room:
    def __init__(self, rid):
        self.id = rid
        self.players = {}
        self.bullets = []
        self.created_at = time.time()
        self.started = False
        self.warmup = WARMUP_TIME
        self.phase_index = 0
        self.phase_time = 0
        self.zone_radius = PHASES[0]["radius"]
        self.center = WORLD_CENTER

    def match_live(self):
        return self.started and self.warmup <= 0

    def add_player(self, player):
        self.players[player.id] = player

    def remove_player(self, pid):
        if pid in self.players:
            del self.players[pid]

    def tick(self, dt):
        now = time.time()
        if not self.started:
            if len(self.players) >= MIN_START and (now - self.created_at) >= START_DELAY:
                self.started = True
                self.warmup = WARMUP_TIME
        else:
            if self.warmup > 0:
                self.warmup = max(0, self.warmup - dt)

        if self.match_live():
            self.update_zone(dt)

        for p in self.players.values():
            if not p.alive:
                continue
            if p.cooldown > 0:
                p.cooldown = max(0, p.cooldown - dt)
            if p.reload_timer > 0:
                p.reload_timer = max(0, p.reload_timer - dt)
                if p.reload_timer <= 0:
                    need = p.weapon["mag"] - p.ammo_in_mag
                    take = min(need, p.ammo_reserve)
                    p.ammo_in_mag += take
                    p.ammo_reserve -= take

            mvx, mvy = p.last_input["move"]
            p.x = clamp(p.x + mvx * p.speed * dt, p.r, WORLD_W - p.r)
            p.y = clamp(p.y + mvy * p.speed * dt, p.r, WORLD_H - p.r)

            if self.match_live():
                self.apply_zone_damage(p, dt)

            if p.last_input["swap"]:
                p.weapon_index = (p.weapon_index + 1) % len(WEAPONS)
                p.last_input["swap"] = False

            if p.last_input["reload"] and p.reload_timer <= 0 and p.ammo_reserve > 0 and p.ammo_in_mag < p.weapon["mag"]:
                p.reload_timer = p.weapon["reload"]
                p.last_input["reload"] = False

            if self.match_live() and p.last_input["fire"]:
                self.try_fire(p, p.last_input["aim"])

        self.update_bullets(dt)

    def update_zone(self, dt):
        if self.phase_index >= len(PHASES) - 1:
            return
        phase = PHASES[self.phase_index]
        next_phase = PHASES[self.phase_index + 1]
        self.phase_time += dt
        if self.phase_time < phase["wait"]:
            self.zone_radius = phase["radius"]
            return
        shrink_time = self.phase_time - phase["wait"]
        t = clamp(shrink_time / phase["shrink"], 0, 1)
        self.zone_radius = phase["radius"] + (next_phase["radius"] - phase["radius"]) * t
        if t >= 1:
            self.phase_index += 1
            self.phase_time = 0

    def apply_zone_damage(self, player, dt):
        dx = player.x - self.center[0]
        dy = player.y - self.center[1]
        if math.hypot(dx, dy) > self.zone_radius:
            player.health -= 14 * dt
            if player.health <= 0:
                player.alive = False

    def try_fire(self, player, aim):
        if player.cooldown > 0 or player.reload_timer > 0:
            return
        if player.ammo_in_mag <= 0:
            if player.ammo_reserve > 0:
                player.reload_timer = player.weapon["reload"]
            return

        player.ammo_in_mag -= 1
        player.cooldown = 1 / player.weapon["fireRate"]
        spread = (random.random() - 0.5) * player.weapon["spread"]
        ax, ay = aim
        base_angle = math.atan2(ay, ax)
        ang = base_angle + spread
        vx = math.cos(ang) * player.weapon["speed"]
        vy = math.sin(ang) * player.weapon["speed"]
        bullet = {
            "x": player.x + math.cos(ang) * player.r,
            "y": player.y + math.sin(ang) * player.r,
            "vx": vx,
            "vy": vy,
            "damage": player.weapon["damage"],
            "life": player.weapon["range"] / player.weapon["speed"],
            "owner": player.id,
        }
        self.bullets.append(bullet)

    def update_bullets(self, dt):
        for b in self.bullets:
            b["x"] += b["vx"] * dt
            b["y"] += b["vy"] * dt
            b["life"] -= dt
        self.bullets = [b for b in self.bullets if b["life"] > 0]

        for b in list(self.bullets):
            for p in self.players.values():
                if not p.alive or p.id == b["owner"]:
                    continue
                if math.hypot(p.x - b["x"], p.y - b["y"]) < p.r:
                    dmg = b["damage"]
                    if p.armor > 0:
                        absorbed = min(p.armor, dmg * 0.6)
                        p.armor -= absorbed
                        dmg -= absorbed
                    p.health -= dmg
                    b["life"] = 0
                    if p.health <= 0 and p.alive:
                        p.alive = False
                        if b["owner"] in self.players:
                            self.players[b["owner"]].kills += 1
                    break


ROOMS = {}


def find_room():
    for room in ROOMS.values():
        if len(room.players) < MAX_PLAYERS:
            return room
    rid = secrets.token_hex(3)
    room = Room(rid)
    ROOMS[rid] = room
    return room


async def send_safe(ws, payload):
    try:
        await ws.send(json.dumps(payload))
    except Exception:
        return


async def broadcast(room, payload):
    if not room.players:
        return
    msg = json.dumps(payload)
    for p in list(room.players.values()):
        try:
            await p.ws.send(msg)
        except Exception:
            continue


async def tick_loop():
    last = time.time()
    while True:
        now = time.time()
        dt = min(0.05, now - last)
        last = now
        for room in list(ROOMS.values()):
            room.tick(dt)
            await broadcast(
                room,
                {
                    "type": "state",
                    "players": [
                        {
                            "id": p.id,
                            "x": p.x,
                            "y": p.y,
                            "health": max(0, p.health),
                            "maxHealth": p.maxHealth,
                            "armor": p.armor,
                            "weaponId": p.weapon["id"],
                            "ammoInMag": p.ammo_in_mag,
                            "ammoReserve": p.ammo_reserve,
                            "kills": p.kills,
                            "alive": p.alive,
                        }
                        for p in room.players.values()
                    ],
                    "bullets": [{"x": b["x"], "y": b["y"]} for b in room.bullets],
                    "zone": {"radius": room.zone_radius, "center": {"x": room.center[0], "y": room.center[1]}},
                },
            )
            if room.started and room.warmup > 0:
                await broadcast(room, {"type": "warmup", "remaining": room.warmup})
        await asyncio.sleep(1 / TICK_RATE)


async def handle(ws):
    pid = None
    room = None
    try:
        async for message in ws:
            data = json.loads(message)
            if data.get("type") == "hello":
                pid = secrets.token_hex(4)
                room = find_room()
                player = Player(pid, data.get("name", "Player"), ws)
                room.add_player(player)
                await send_safe(ws, {"type": "welcome", "id": pid, "room": room.id, "serverTime": time.time()})
            elif data.get("type") == "input" and room and pid in room.players:
                p = room.players[pid]
                move = data.get("move", [0, 0])
                aim = data.get("aim", [1, 0])
                p.last_input["move"] = (float(move[0]), float(move[1]))
                p.last_input["aim"] = (float(aim[0]), float(aim[1]))
                p.last_input["fire"] = bool(data.get("fire", False))
                p.last_input["swap"] = bool(data.get("swap", False))
                p.last_input["reload"] = bool(data.get("reload", False))
    except Exception:
        pass
    finally:
        if room and pid:
            room.remove_player(pid)


async def main():
    server = await websockets.serve(lambda ws, path: handle(ws), "0.0.0.0", 8788)
    print("SP NET GAMERS realtime server on ws://0.0.0.0:8788")
    await server.wait_closed()


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.create_task(tick_loop())
    loop.run_until_complete(main())
