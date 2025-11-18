// server/mock-server.js
// Simple Express server with WS and endpoints for block/blackhole.
// Run: node server/mock-server.js
// Requires: npm i express express-ws
const express = require('express');
const expressWs = require('express-ws');
const path = require('path');

const app = express();
expressWs(app);

app.use(express.json());
// serve client/public statics
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));

app.post('/api/block', (req, res) => {
  console.log('Block request', req.body);
  res.json({ ok:true, action:'block', ip:req.body.ip });
});
app.post('/api/blackhole', (req, res) => {
  console.log('Blackhole request', req.body);
  res.json({ ok:true, action:'blackhole', ip:req.body.ip });
});

app.ws('/ws/traffic', function(ws, req) {
  console.log('ws connected');
  const interval = setInterval(() => {
    const now = Date.now();
    const ev = {
      srcIP: `192.168.1.${Math.ceil(Math.random()*12)}`,
      dstIP: `10.0.0.${Math.ceil(Math.random()*4)}`,
      bytes: Math.floor(Math.random()*1500)+40,
      timestamp: now
    };
    if (ws.readyState === 1) ws.send(JSON.stringify(ev));
  }, 400);
  ws.on('close', () => clearInterval(interval));
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('Mock server serving at http://localhost:'+port));