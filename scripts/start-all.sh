#!/usr/bin/env bash
set -e
# Start config API (3001) and mock server (3000) for development
node server/config-api.js &
PID1=$!
nnode server/mock-server.js &
PID2=$!
echo "Config API PID $PID1, Mock server PID $PID2"
wait
