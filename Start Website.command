#!/bin/zsh
# Double-click to start the UMass Triangle website. Close this window (or press Control+C) to stop it.
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if lsof -i :3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "The website is already running."
  open -a "Google Chrome" "http://localhost:3000" 2>/dev/null || open "http://localhost:3000"
  exit 0
fi

[ -d node_modules ] || npm install

echo "Starting the website… (leave this window open while you use it)"
( sleep 2 && open -a "Google Chrome" "http://localhost:3000" 2>/dev/null || open "http://localhost:3000" ) &
npm run dev
