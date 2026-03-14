# SP NET GAMERS Backend (Prototype)

Local backend for accounts, cloud save, store rotation, missions, battle pass, and admin dashboard.

## Run
```bash
cd /Users/savanpatel/Documents/SP-NET-GAME/backend
python3 server.py
```

Backend runs at `http://localhost:8787`.

## Realtime Multiplayer Server (WebSocket)
```bash
cd /Users/savanpatel/Documents/SP-NET-GAME/backend
python3 -m pip install -r requirements.txt
python3 rt_server.py
```
Realtime server runs at `ws://localhost:8788`.

## Create Admin User
```bash
cd /Users/savanpatel/Documents/SP-NET-GAME/backend
python3 server.py --create-admin admin@example.com admin123
```

## Admin Dashboard
Open in browser:
```
http://localhost:8787/admin
```

## API (high level)
- `POST /api/register`
- `POST /api/login`
- `GET /api/profile`
- `POST /api/claim_daily`
- `GET /api/store/offers`
- `POST /api/store/buy`
- `GET /api/missions/daily`
- `POST /api/missions/claim`
- `GET /api/battlepass`
- `POST /api/match/report`
- `GET /api/admin/users`
- `POST /api/admin/grant`
- `POST /api/admin/set-role`
