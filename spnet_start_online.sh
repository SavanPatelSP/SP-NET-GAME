#!/bin/bash
set -e

BASE="/Users/savanpatel/Documents/SP-NET-GAME"
NGROK_BIN="/Users/savanpatel/Documents/ngrok_bin/ngrok"
VENV_PY="$BASE/backend/.venv/bin/python"

if [ ! -x "$NGROK_BIN" ]; then
  echo "ngrok not found at $NGROK_BIN"
  exit 1
fi

if [ ! -x "$VENV_PY" ]; then
  echo "Python venv not found. Creating..."
  python3 -m venv "$BASE/backend/.venv"
  source "$BASE/backend/.venv/bin/activate"
  pip install -r "$BASE/backend/requirements.txt"
fi

nohup python3 "$BASE/backend/server.py" > /tmp/spnet-backend.log 2>&1 & echo $! > /tmp/spnet-backend.pid
nohup python3 "$BASE/backend/rt_server.py" > /tmp/spnet-rt.log 2>&1 & echo $! > /tmp/spnet-rt.pid
nohup "$VENV_PY" "$BASE/backend/gateway.py" --port 8090 > /tmp/spnet-gateway.log 2>&1 & echo $! > /tmp/spnet-gateway.pid
nohup "$NGROK_BIN" http 8090 --log=stdout --log-format=logfmt --inspect=false > /tmp/spnet-ngrok.log 2>&1 & echo $! > /tmp/spnet-ngrok.pid

nohup caffeinate -dimsu > /tmp/spnet-caffeinate.log 2>&1 & echo $! > /tmp/spnet-caffeinate.pid

sleep 2
python3 - <<'PY'
import json, urllib.request
try:
    data = json.loads(urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels").read())
    tunnels = data.get("tunnels", [])
    url = tunnels[0]["public_url"] if tunnels else ""
    if url:
        print("\nSP NET GAMERS ONLINE URL:")
        print(url)
        print("\nShare this link with friends.")
    else:
        print("ngrok is running, but URL not found. Check /tmp/spnet-ngrok.log")
except Exception as e:
    print("ngrok is running, but URL not found. Check /tmp/spnet-ngrok.log")
PY
