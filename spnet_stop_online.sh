#!/bin/bash
for f in /tmp/spnet-*.pid; do
  [ -f "$f" ] || continue
  pid=$(cat "$f")
  if [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null || true
  fi
  rm -f "$f"
done

echo "Stopped SP NET GAMERS online services."
