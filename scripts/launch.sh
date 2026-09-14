#!/usr/bin/env bash
# ==============================================================================
# NEON FORENSIC - Native Linux GUI Launcher
# Opens the workstation interface in app-window mode or default browser
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

# Multi-Neon Color Palette
N_CYAN='\033[38;5;51m'
N_PINK='\033[38;5;198m'
N_GREEN='\033[38;5;82m'
N_PURPLE='\033[38;5;141m'
N_YELLOW='\033[38;5;226m'
N_ORANGE='\033[38;5;208m'
N_BLUE='\033[38;5;39m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${N_CYAN}  ███╗   ██╗${N_PINK}███████╗${N_GREEN} ██████╗ ${N_PURPLE}███╗   ██╗"
echo -e "${N_CYAN}  ████╗  ██║${N_PINK}██╔════╝${N_GREEN}██╔═══██╗${N_PURPLE}████╗  ██║"
echo -e "${N_CYAN}  ██╔██╗ ██║${N_PINK}█████╗  ${N_GREEN}██║   ██║${N_PURPLE}██╔██╗ ██║"
echo -e "${N_CYAN}  ██║╚██╗██║${N_PINK}██╔══╝  ${N_GREEN}██║   ██║${N_PURPLE}██║╚██╗██║"
echo -e "${N_CYAN}  ██║ ╚████║${N_PINK}███████╗${N_GREEN}╚██████╔╝${N_PURPLE}██║ ╚████║  ${BOLD}${N_PINK}★ ${N_CYAN}Neon Forensic ${N_PINK}★"
echo -e "${N_CYAN}  ╚═╝  ╚═══╝${N_PINK}╚══════╝${N_GREEN} ╚═════╝ ${N_PURPLE}╚═╝  ╚═══╝  ${BOLD}${N_YELLOW}by ${N_GREEN}Hero ${N_PINK}Ritik"
echo ""
echo -e "  ${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${NC}"
echo -e "  ${N_CYAN}⚡  ${BOLD}${N_CYAN}Neon ${N_PINK}Forensic ${N_YELLOW}by ${N_GREEN}Hero ${N_PINK}Ritik  ${N_CYAN}⚡${NC}"
echo -e "  ${N_PURPLE}▶  ${N_CYAN}Launching Native Linux GUI & ADB Engine  ${N_PURPLE}◀${NC}"
echo -e "  ${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${NC}\n"

# Ensure evidence vault permissions
chmod -R 777 evidence_vault 2>/dev/null || true

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
