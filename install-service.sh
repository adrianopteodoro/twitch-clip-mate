#!/bin/bash

# Install Node.js and npm if not present
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
fi

# Install dependencies
npm install

# Create systemd service file
cat <<EOF > /etc/systemd/system/twitch-clip-mate.service
[Unit]
Description=Twitch Clip Mate Service
After=network.target

[Service]
Type=simple
WorkingDirectory=$(pwd)
ExecStart=$(which node) $(pwd)/server.js
Restart=always
User=$(whoami)
Environment=NODE_ENV=production
Environment=PORT=8800

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable twitch-clip-mate
systemctl start twitch-clip-mate

echo "Twitch Clip Mate Service installed and running as a service (twitch-clip-mate)."