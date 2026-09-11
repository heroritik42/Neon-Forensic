#!/usr/bin/env bash
# ==============================================================================
# NEON FORENSIC - Automated Linux Installer & Environment Setup
# Tagline: Authorized Android Evidence Acquisition & Analysis Platform
# Supported OS: Ubuntu 20.04+, Debian 11+, Kali Linux, Fedora 38+, Arch Linux
# ==============================================================================

set -e

CYAN='\033[0;36m'
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "  ███╗   ██╗███████╗ ██████╗ ███╗   ██╗"
echo "  ████╗  ██║██╔════╝██╔═══██╗████╗  ██║"
echo "  ██╔██╗ ██║█████╗  ██║   ██║██╔██╗ ██║"
echo "  ██║╚██╗██║██╔══╝  ██║   ██║██║╚██╗██║"
echo "  ██║ ╚████║███████╗╚██████╔╝██║ ╚████║ FORENSIC WORKSTATION"
echo "  ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝ (Linux Native)"
echo -e "${NC}"
echo -e "${PURPLE}Authorized Android Evidence Acquisition & Analysis Platform${NC}\n"

# 1. Check Root / Sudo capabilities for udev rules
if [ "$EUID" -ne 0 ]; then
  SUDO='sudo'
else
  SUDO=''
fi

echo -e "${CYAN}[1/5] Detecting package manager and installing core dependencies...${NC}"
if command -v apt-get &> /dev/null; then
  echo -e "${GREEN}Detected Debian / Ubuntu / Kali environment.${NC}"
  $SUDO apt-get update -y
  $SUDO apt-get install -y android-tools-adb adb curl wget git libusb-1.0-0-dev build-essential
elif command -v dnf &> /dev/null; then
  echo -e "${GREEN}Detected Fedora / RHEL environment.${NC}"
  $SUDO dnf install -y android-tools curl wget git libusb-devel gcc-c++ make
elif command -v pacman &> /dev/null; then
  echo -e "${GREEN}Detected Arch Linux environment.${NC}"
  $SUDO pacman -Sy --noconfirm android-tools curl wget git libusb base-devel
else
  echo -e "${AMBER}Unrecognized package manager. Please ensure 'adb' and 'nodejs' (v20+) are installed.${NC}"
fi

# 2. Check Node.js
echo -e "\n${CYAN}[2/5] Checking Node.js runtime (v20+ recommended)...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${AMBER}Node.js not detected. Installing via NodeSource (v20 LTS)...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash -
  $SUDO apt-get install -y nodejs
else
  NODE_VER=$(node -v)
  echo -e "${GREEN}Node.js detected: ${NODE_VER}${NC}"
fi

# 3. Configure Android USB udev rules (Crucial for non-root ADB device communication)
echo -e "\n${CYAN}[3/5] Installing Android USB udev permissions (/etc/udev/rules.d/51-android.rules)...${NC}"
UDEV_FILE="/etc/udev/rules.d/51-android.rules"

$SUDO bash -c "cat << 'EOF' > $UDEV_FILE
# Google / Pixel
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"18d1\", MODE=\"0666\", GROUP=\"plugdev\"
# Samsung
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"04e8\", MODE=\"0666\", GROUP=\"plugdev\"
# Xiaomi
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"2717\", MODE=\"0666\", GROUP=\"plugdev\"
# OnePlus / Oppo
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"22d9\", MODE=\"0666\", GROUP=\"plugdev\"
# Motorola
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"22b8\", MODE=\"0666\", GROUP=\"plugdev\"
# Huawei
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"12d1\", MODE=\"0666\", GROUP=\"plugdev\"
# Sony
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"0fce\", MODE=\"0666\", GROUP=\"plugdev\"
# LG
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"1004\", MODE=\"0666\", GROUP=\"plugdev\"
# HTC
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"0bb4\", MODE=\"0666\", GROUP=\"plugdev\"
# MediaTek Generic
SUBSYSTEM==\"usb\", ATTR{idVendor}==\"0e8d\", MODE=\"0666\", GROUP=\"plugdev\"
EOF"

$SUDO groupadd -f plugdev
$SUDO usermod -aG plugdev "$USER" || true
$SUDO udevadm control --reload-rules || true
$SUDO udevadm trigger || true
echo -e "${GREEN}✓ udev rules installed and reloaded.${NC}"

# 4. Install npm dependencies and build workstation
echo -e "\n${CYAN}[4/5] Compiling application bundle...${NC}"
npm install
npm run build

# 5. Create Desktop Launcher Entry
echo -e "\n${CYAN}[5/5] Creating Desktop Launcher and Menu entry...${NC}"
INSTALL_DIR=$(pwd)
DESKTOP_DIR="$HOME/.local/share/applications"
mkdir -p "$DESKTOP_DIR"

chmod +x "$INSTALL_DIR/scripts/launch.sh" || true

cat << EOF > "$DESKTOP_DIR/neon-forensic.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=NEON FORENSIC
Comment=Authorized Android Evidence Acquisition & Analysis Platform
Exec=bash -c "$INSTALL_DIR/scripts/launch.sh"
Icon=utilities-terminal
Terminal=false
Categories=Development;Security;System;Forensics;
Keywords=Android;Forensics;ADB;Acquisition;Evidence;
StartupNotify=true
EOF

chmod +x "$DESKTOP_DIR/neon-forensic.desktop"
echo -e "${GREEN}✓ Desktop shortcut created at $DESKTOP_DIR/neon-forensic.desktop${NC}"

echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN}  NEON FORENSIC INSTALLATION COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo -e "To start NEON FORENSIC anytime, run:"
echo -e "  ${CYAN}cd $INSTALL_DIR && npm start${NC}"
echo -e "\nOr click '${PURPLE}NEON FORENSIC${NC}' in your Linux Application Menu."
echo -e "Workstation web interface runs locally at: ${CYAN}http://localhost:3000${NC}\n"
