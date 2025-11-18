// server/config-api.js
// API konfigurasi kecil: GET /api/config  dan POST /api/config
// Aman: membuat folder server/data bila belum ada dan memvalidasi input
const fs = require('fs');
const path = require('path');
const express = require('express');

const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    const init = { target: '', ports: [], updatedAt: 0 };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(init, null, 2), { encoding: 'utf8' });
  }
}

function readConfig() {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('readConfig error', err);
    return { target:'', ports:[], updatedAt:0 };
  }
}

function writeConfig(obj) {
  try {
    ensureDataDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(obj, null, 2), { encoding: 'utf8' });
    return true;
  } catch (err) {
    console.error('writeConfig error', err);
    return false;
  }
}

function attachConfigApi(app) {
  app.get('/api/config', (req, res) => {
    const cfg = readConfig();
    res.json(cfg);
  });

  app.post('/api/config', (req, res) => {
    const body = req.body;
    if (!body || typeof body.target !== 'string') {
      return res.status(400).send('Bad request: missing or invalid target');
    }
    const ports = Array.isArray(body.ports) ? body.ports.map(p => Number(p)).filter(n => Number.isInteger(n) && n>0 && n<=65535) : [];
    const cfg = {
      target: body.target.trim(),
      ports,
      updatedAt: Date.now()
    };
    const ok = writeConfig(cfg);
    if (!ok) return res.status(500).send('Failed to write config');
    res.json(cfg);
  });

  return app;
}

// Jika dijalankan langsung, start server sederhana (berguna untuk dev)
if (require.main === module) {
  const app = express();
  app.use(express.json());
  attachConfigApi(app);

  const publicDir = path.join(__dirname, '..', 'client', 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Config API server running at http://localhost:${PORT}`));
}

module.exports = attachConfigApi;