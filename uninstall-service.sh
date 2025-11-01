#!/bin/bash
# Uninstall Twitch Clip Mate systemd service
systemctl stop twitch-clip-mate
systemctl disable twitch-clip-mate
rm /etc/systemd/system/twitch-clip-mate.service
systemctl daemon-reload
systemctl reset-failed

echo "Twitch Clip Mate service (twitch-clip-mate) uninstalled."
