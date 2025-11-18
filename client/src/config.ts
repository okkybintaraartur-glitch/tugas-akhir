// client/src/config.ts
// Module untuk mengelola konfigurasi target & ports via /api/config
// Jika tidak menggunakan Vite, kompilasi ke JS dan letakkan di client/public/dist

type Config = {
  target: string;
  ports: number[];
  updatedAt?: number;
};

const form = document.getElementById('config-form') as HTMLFormElement;
const targetInput = document.getElementById('target-domain') as HTMLInputElement;
const portsInput = document.getElementById('target-ports') as HTMLInputElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const savingEl = document.getElementById('saving') as HTMLElement;
const msgEl = document.getElementById('msg') as HTMLElement;
const currentTargetEl = document.getElementById('current-target') as HTMLElement;
const currentPortsEl = document.getElementById('current-ports') as HTMLElement;

function showMessage(text: string, ok = true) {
  msgEl.textContent = text;
  msgEl.className = ok ? 'msg ok' : 'msg err';
}

function parsePorts(raw: string): number[] {
  if (!raw) return [];
  return raw.split(',')
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(s => Number(s))
    .filter(n => Number.isInteger(n) && n > 0 && n <= 65535);
}

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) {
      showMessage('Gagal memuat konfigurasi dari server', false);
      return;
    }
    const cfg: Config = await res.json();
    targetInput.value = cfg.target ?? '';
    portsInput.value = (cfg.ports && cfg.ports.length) ? cfg.ports.join(',') : '';
    currentTargetEl.textContent = cfg.target ?? '-';
    currentPortsEl.textContent = (cfg.ports && cfg.ports.length) ? cfg.ports.join(', ') : '-';
    showMessage('Konfigurasi dimuat', true);
    setTimeout(() => msgEl.textContent = '', 1500);
  } catch (err) {
    console.error(err);
    showMessage('Kesalahan saat memuat konfigurasi', false);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msgEl.textContent = '';
  const target = targetInput.value.trim();
  const ports = parsePorts(portsInput.value);

  if (!target) {
    showMessage('Target harus diisi', false);
    return;
  }
  if (target.length < 3) {
    showMessage('Target tidak valid', false);
    return;
  }

  const payload: Config = { target, ports, updatedAt: Date.now() };

  try {
    savingEl.style.display = 'inline';
    btnSave.disabled = true;
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Server error');
    }
    const saved: Config = await res.json();
    currentTargetEl.textContent = saved.target ?? '-';
    currentPortsEl.textContent = (saved.ports && saved.ports.length) ? saved.ports.join(', ') : '-';
    showMessage('Konfigurasi berhasil disimpan', true);
  } catch (err) {
    console.error(err);
    showMessage('Gagal menyimpan konfigurasi: ' + (err as Error).message, false);
  } finally {
    savingEl.style.display = 'none';
    btnSave.disabled = false;
    setTimeout(() => msgEl.textContent = '', 2500);
  }
});

btnReset.addEventListener('click', async () => {
  targetInput.value = '';
  portsInput.value = '';
  // trigger simpan otomatis
  form.dispatchEvent(new Event('submit', { cancelable: true }));
});

loadConfig();