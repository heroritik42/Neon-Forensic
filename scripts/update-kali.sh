#!/usr/bin/env bash
# ==============================================================================
# NEON FORENSIC - Kali Linux 1-Click Update & USB / Wireless ADB Fix
# ==============================================================================

set -e

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

CYAN="${N_CYAN}"
PURPLE="${N_PURPLE}"
GREEN="${N_GREEN}"
AMBER="${N_YELLOW}"
RED='\033[0;31m'

echo -e "${N_CYAN}  ███╗   ██╗${N_PINK}███████╗${N_GREEN} ██████╗ ${N_PURPLE}███╗   ██╗"
echo -e "${N_CYAN}  ████╗  ██║${N_PINK}██╔════╝${N_GREEN}██╔═══██╗${N_PURPLE}████╗  ██║"
echo -e "${N_CYAN}  ██╔██╗ ██║${N_PINK}█████╗  ${N_GREEN}██║   ██║${N_PURPLE}██╔██╗ ██║"
echo -e "${N_CYAN}  ██║╚██╗██║${N_PINK}██╔══╝  ${N_GREEN}██║   ██║${N_PURPLE}██║╚██╗██║"
echo -e "${N_CYAN}  ██║ ╚████║${N_PINK}███████╗${N_GREEN}╚██████╔╝${N_PURPLE}██║ ╚████║  ${BOLD}${N_PINK}★ ${N_CYAN}Neon Forensic ${N_PINK}★"
echo -e "${N_CYAN}  ╚═╝  ╚═══╝${N_PINK}╚══════╝${N_GREEN} ╚═════╝ ${N_PURPLE}╚═╝  ╚═══╝  ${BOLD}${N_YELLOW}by ${N_GREEN}Hero ${N_PINK}Ritik"
echo ""
echo -e "  ${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${NC}"
echo -e "  ${N_CYAN}⚡  ${BOLD}${N_CYAN}Neon ${N_PINK}Forensic ${N_YELLOW}by ${N_GREEN}Hero ${N_PINK}Ritik  ${N_CYAN}⚡${NC}"
echo -e "  ${N_PURPLE}▶  ${N_CYAN}1-Click Kali Update ${N_BLUE}& ${N_GREEN}USB / Wireless ADB Fix  ${N_PURPLE}◀${NC}"
echo -e "  ${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${N_PINK}═${N_PURPLE}═${N_BLUE}═${N_CYAN}═${N_GREEN}═${N_YELLOW}═${N_ORANGE}═${NC}\n"

# Check sudo
if [ "$EUID" -ne 0 ]; then
  SUDO='sudo'
else
  SUDO=''
fi

echo -e "${CYAN}[1/5] Syncing latest updates from Git repository...${NC}"
git reset --hard HEAD || true
git clean -fd || true
git pull origin main

echo -e "\n${CYAN}[2/5] Updating Linux USB permissions (51-android.rules)...${NC}"
UDEV_FILE="/etc/udev/rules.d/51-android.rules"
$SUDO bash -c "cat << 'EOF' > $UDEV_FILE
# Google / Pixel
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"18d1\", MODE=\"0666\", GROUP=\"plugdev\"
# Samsung
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"04e8\", MODE=\"0666\", GROUP=\"plugdev\"
# Xiaomi / Redmi / Poco
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"2717\", MODE=\"0666\", GROUP=\"plugdev\"
# OnePlus / Oppo / Realme
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"22d9\", MODE=\"0666\", GROUP=\"plugdev\"
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"2a70\", MODE=\"0666\", GROUP=\"plugdev\"
# Vivo / iQOO
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"2d95\", MODE=\"0666\", GROUP=\"plugdev\"
# Motorola
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"22b8\", MODE=\"0666\", GROUP=\"plugdev\"
# Huawei / Honor
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"12d1\", MODE=\"0666\", GROUP=\"plugdev\"
# Sony Xperia
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"0fce\", MODE=\"0666\", GROUP=\"plugdev\"
# LG
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"1004\", MODE=\"0666\", GROUP=\"plugdev\"
# HTC
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"0bb4\", MODE=\"0666\", GROUP=\"plugdev\"
# MediaTek Generic
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"0e8d\", MODE=\"0666\", GROUP=\"plugdev\"
# Qualcomm Generic
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"05c6\", MODE=\"0666\", GROUP=\"plugdev\"
# ASUS
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"0b05\", MODE=\"0666\", GROUP=\"plugdev\"
# Transsion (Infinix, Tecno, Itel)
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"1782\", MODE=\"0666\", GROUP=\"plugdev\"
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"2a45\", MODE=\"0666\", GROUP=\"plugdev\"
EOF"

$SUDO groupadd -f plugdev || true
$SUDO usermod -aG plugdev "$USER" || true
$SUDO udevadm control --reload-rules || true
$SUDO udevadm trigger || true
echo -e "${GREEN}✓ USB udev permissions updated.${NC}"

echo -e "\n${CYAN}[3/5] Restarting ADB daemon & setting evidence vault permissions...${NC}"
$SUDO chmod -R 777 evidence_vault 2>/dev/null || true
if [ -n "$SUDO_USER" ]; then
  $SUDO chown -R "$SUDO_USER:$SUDO_USER" evidence_vault 2>/dev/null || true
fi
adb kill-server || true
adb start-server || true
adb reconnect || true

echo -e "\n${CYAN}[4/5] Installing dependencies & compiling production build...${NC}"
npm install
npm run build

echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN}  UPDATE COMPLETED SUCCESSFULLY! LAUNCHING NEON FORENSIC...${NC}"
echo -e "${GREEN}==============================================================================${NC}"
npm run gui
