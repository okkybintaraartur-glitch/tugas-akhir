// server/mock-server.js
// Dev server: serves client/public + mounts config API, provides WS and mock endpoints.
// Listens on PORT 5000 by default.

const express = require('express');
const expressWs = require('express-ws');
const path = require('path');

// attach config-api module (server/config-api.js)
const attachConfigApi = require('./config-api');

const app = express();
expressWs(app);

app.use(express.json());

// mount config API routes on the same Express app
attachConfigApi(app);

// serve client/public statics (traffic-monitor, config UI, CSS, JS)
const publicDir = path.join(__dirname, '..', 'client', 'public');
if (publicDir) {
  app.use(express.static(publicDir));
}

// simple endpoints for block/blackhole (mock implementations)
app.post('/api/block', (req, res) => {
  console.log('Block request', req.body);
  // TODO: integrate with firewall/cloud API for real blocking
  res.json({ ok: true, action: 'block', ip: req.body && req.body.ip });
});
app.post('/api/blackhole', (req, res) => {
  console.log('Blackhole request', req.body);
  res.json({ ok: true, action: 'blackhole', ip: req.body && req.body.ip });
});

// WebSocket endpoint that streams mock traffic events to connected clients
app.ws('/ws/traffic', function (ws, req) {
  console.log('ws connected');
  const interval = setInterval(() => {
    const now = Date.now();
    const ev = {
      srcIP: `192.168.1.${Math.ceil(Math.random() * 12)}`,
      dstIP: `10.0.0.${Math.ceil(Math.random() * 4)}`,
      bytes: Math.floor(Math.random() * 1500) + 40,
      timestamp: now
    };
    if (ws.readyState === 1) ws.send(JSON.stringify(ev));
  }, 400);

  ws.on('close', () => clearInterval(interval));
});

// Use port 5000 for the dashboard as requested
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Dev server (mock + config API) serving at http://localhost:${port}`));
