#!/usr/bin/env bash
# ==============================================================================
# NEON FORENSIC - Kali Linux 1-Click Update & USB / Wireless ADB Fix
# ==============================================================================

set -e

CYAN='\033[0;36m'
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ███╗   ██╗███████╗ ██████╗ ███╗   ██╗"
echo "  ████╗  ██║██╔════╝██╔═══██╗████╗  ██║"
echo "  ██╔██╗ ██║█████╗  ██║   ██║██╔██╗ ██║"
echo "  ██║╚██╗██║██╔══╝  ██║   ██║██║╚██╗██║"
echo "  ██║ ╚████║███████╗╚██████╔╝██║ ╚████║ 1-CLICK KALI UPDATE & USB FIX"
echo "  ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝"
echo -e "${NC}"

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

echo -e "\n${CYAN}[3/5] Restarting ADB daemon to apply fresh handshake...${NC}"
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
