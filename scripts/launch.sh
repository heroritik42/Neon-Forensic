#!/usr/bin/env bash
# ==============================================================================
# NEON FORENSIC - Native Linux GUI Launcher
# Opens the workstation interface in app-window mode or default browser
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "=================================================="
echo "  Launching NEON FORENSIC Workstation GUI...      "
echo "=================================================="

# Check if server is already running on port 3000
if curl -s http://localhost:3000/api/devices > /dev/null 2>&1; then
  echo "[✓] NEON FORENSIC backend server is already running on http://localhost:3000"
else
  echo "[*] Starting background workstation engine..."
  npm start &
  SERVER_PID=$!
  # Wait for server to initialize
  for i in {1..10}; do
    if curl -s http://localhost:3000/api/devices > /dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done
fi

# Launch in dedicated App window if Chromium/Chrome is installed, else default browser
URL="http://localhost:3000"

if command -v google-chrome > /dev/null 2>&1; then
  echo "[*] Opening GUI via Google Chrome App Mode..."
  google-chrome --app="$URL" --user-data-dir="/tmp/neon-forensic-profile" > /dev/null 2>&1 &
elif command -v chromium > /dev/null 2>&1; then
  echo "[*] Opening GUI via Chromium App Mode..."
  chromium --app="$URL" --user-data-dir="/tmp/neon-forensic-profile" > /dev/null 2>&1 &
elif command -v chromium-browser > /dev/null 2>&1; then
  echo "[*] Opening GUI via Chromium Browser App Mode..."
  chromium-browser --app="$URL" --user-data-dir="/tmp/neon-forensic-profile" > /dev/null 2>&1 &
elif command -v brave-browser > /dev/null 2>&1; then
  echo "[*] Opening GUI via Brave App Mode..."
  brave-browser --app="$URL" --user-data-dir="/tmp/neon-forensic-profile" > /dev/null 2>&1 &
elif command -v xdg-open > /dev/null 2>&1; then
  echo "[*] Opening GUI via default system browser..."
  xdg-open "$URL" > /dev/null 2>&1 &
elif command -v firefox > /dev/null 2>&1; then
  echo "[*] Opening GUI via Firefox..."
  firefox "$URL" > /dev/null 2>&1 &
else
  echo "[!] Please open your web browser manually and navigate to: $URL"
fi

echo "[✓] GUI launched at: $URL"
