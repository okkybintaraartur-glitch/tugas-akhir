# Tugas-Akhir (with config UI & helpers)

This branch adds a configuration UI (client/public/config.html) and a small config API (server/config-api.js) that saves target and ports to server/data/config.json. It also includes a mock traffic server (server/mock-server.js) and helper scripts to start servers quickly.

Quick start (short commands):

From project root (ensure Node.js installed):

# make scripts executable if needed
chmod +x ./scripts/*.sh

# start config API only (serves client/public too)
./scripts/start-config-server.sh

# start mock traffic server only
./scripts/start-mock-server.sh

# start both for quick dev
./scripts/start-all.sh

Then open in your browser:
http://localhost:3001/config.html
http://localhost:3000/traffic-monitor.html

Notes:
- If you use Vite in client folder, you can run client dev server instead and point config API accordingly.
- The scripts are simple helpers and safe for development; they do not perform destructive system changes.

End of files.
