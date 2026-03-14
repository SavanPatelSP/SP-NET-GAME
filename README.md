# SP NET GAMERS v1.0.1

This repo contains the web prototype, backend (cloud save + admin), and Unity mobile prototype.

## Folders
- `web/` - browser prototype
- `backend/` - Python backend + admin dashboard
- `unity/` - Unity project

## Quick Start (Backend)
```bash
cd backend
python3 server.py
```
Health check: http://localhost:8787/api/health

Create admin:
```bash
cd backend
python3 server.py --create-admin admin@example.com admin123
```
Admin dashboard: http://localhost:8787/admin

## Quick Start (Realtime Multiplayer)
```bash
cd backend
python3 -m pip install -r requirements.txt
python3 rt_server.py
```
Realtime WS: ws://localhost:8788

## Quick Start (Gateway for Ngrok)
```bash
cd backend
python3 -m pip install -r requirements.txt
python3 gateway.py --port 8090
```
Gateway: http://localhost:8090

## Quick Start (Web)
```bash
cd web
python3 -m http.server 8080
```
Open: http://localhost:8080

If testing on phone, update API base in `web/game.js` from `http://localhost:8787` to your Mac IP.
If using multiplayer on phone, update WS base in `web/game.js` (search `spnet_ws`) to your Mac IP.

## Quick Start (Unity)
Open `unity/` in Unity 2022.3 LTS and press Play. Tap `Cloud` to login/register.

If building on device, update API base in `unity/Assets/Scripts/GameBootstrap.cs`.
