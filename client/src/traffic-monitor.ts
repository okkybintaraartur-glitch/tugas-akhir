// client/src/traffic-monitor.ts
declare const Chart: any;

type TrafficEvent = { srcIP: string; dstIP: string; bytes:number; timestamp:number; meta?:any };

class DDoSDetector {
  private windows: Map<string, number[]> = new Map();
  constructor(private windowMs = 10000, private perIpThreshold = 30) {}
  addEvent(ev: TrafficEvent) {
    const now = ev.timestamp || Date.now();
    const arr = this.windows.get(ev.srcIP) ?? [];
    arr.push(now);
    const cutoff = now - this.windowMs;
    while (arr.length && arr[0] < cutoff) arr.shift();
    this.windows.set(ev.srcIP, arr);
    return this.scoreForIp(ev.srcIP);
  }
  scoreForIp(ip: string) {
    const arr = this.windows.get(ip) ?? [];
    const freq = arr.length;
    const ratio = Math.min(1, freq / this.perIpThreshold);
    return Math.round(ratio * 100);
  }
  isLikelyDDoS(ip: string) { return this.scoreForIp(ip) >= 80; }
}

const tableBody = document.querySelector('#traffic-table tbody')!;
const clockEl = document.getElementById('clock')!;
const modal = document.getElementById('modal')!;
const modalBody = document.getElementById('modal-body')!;
const modalClose = document.getElementById('modal-close')!;
const btnDashboard = document.getElementById('btn-dashboard') as HTMLButtonElement;
const btnRealtime = document.getElementById('btn-realtime') as HTMLButtonElement;
const monitorSection = document.getElementById('monitor-section')!;
const chartSection = document.getElementById('chart-section')!;

const detector = new DDoSDetector();
const rowMap = new Map<string, HTMLTableRowElement>();
let useMock = true;

function startClock() { function tick(){ clockEl.textContent = new Date().toLocaleString(); } tick(); setInterval(tick,1000); }
function formatLocal(ts:number){ return new Date(ts).toLocaleString(); }

function renderEvent(ev: TrafficEvent){
  const key = ev.srcIP + '|' + ev.dstIP;
  let row = rowMap.get(key);
  const score = detector.addEvent(ev);
  const isDDoS = detector.isLikelyDDoS(ev.srcIP);
  if (!row) {
    row = document.createElement('tr');
    const timeTd = document.createElement('td');
    const srcTd = document.createElement('td');
    const dstTd = document.createElement('td');
    const bytesTd = document.createElement('td');
    const scoreTd = document.createElement('td');
    const actionTd = document.createElement('td');
    row.appendChild(timeTd); row.appendChild(srcTd); row.appendChild(dstTd); row.appendChild(bytesTd); row.appendChild(scoreTd); row.appendChild(actionTd);
    tableBody.prepend(row);
    rowMap.set(key,row);
  }
  const [timeTd, srcTd, dstTd, bytesTd, scoreTd, actionTd] = Array.from(row.children) as HTMLTableCellElement[];
  timeTd.textContent = formatLocal(ev.timestamp || Date.now());
  srcTd.textContent = ev.srcIP; dstTd.textContent = ev.dstIP; bytesTd.textContent = String(ev.bytes);
  scoreTd.textContent = `${score}`; scoreTd.className = score >= 80 ? 'score-high' : '';
  actionTd.innerHTML = '';
  const viewBtn = document.createElement('button'); viewBtn.textContent='View'; viewBtn.onclick = () => openModal(ev);
  const blockBtn = document.createElement('button'); blockBtn.textContent='Blok'; blockBtn.onclick = () => mitigAction('block', ev.srcIP, row!);
  const blackBtn = document.createElement('button'); blackBtn.textContent='Blackhole'; blackBtn.onclick = () => mitigAction('blackhole', ev.srcIP, row!);
  const group = document.createElement('div'); group.className='button-group'; group.appendChild(viewBtn); group.appendChild(blockBtn); group.appendChild(blackBtn);
  actionTd.appendChild(group);
  if (isDDoS) row.style.background = '#ffe6e6'; else row.style.background='';
}
function openModal(ev:TrafficEvent){ modalBody.textContent = JSON.stringify(ev,null,2); modal.style.display='flex'; }
modalClose.onclick = () => modal.style.display='none'; modal.onclick = (e) => { if (e.target === modal) modal.style.display='none'; };
async function mitigAction(action:'block'|'blackhole', srcIP:string, row:HTMLTableRowElement){ const prev = row.style.opacity; row.style.opacity='0.6'; try{ const res = await fetch(`/api/${action}`,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ip: srcIP })}); if(!res.ok) throw new Error('Request failed'); row.dataset['mitigated']=action; const badge = document.createElement('span'); badge.textContent = action.toUpperCase(); badge.style.marginLeft='8px'; badge.style.padding='2px 6px'; badge.style.background = action==='block' ? '#ffcc00' : '#cc0000'; badge.style.color='#fff'; const actionTd = row.children[5] as HTMLTableCellElement; actionTd.appendChild(badge); }catch(err){ alert('Gagal melakukan mitigasi: '+err); }finally{ row.style.opacity = prev; }}

function initDataSource(){
  if (!useMock){
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws/traffic`);
    let opened=false; const openTimer = setTimeout(()=>{ if(!opened){ console.warn('WS tidak terbuka, fallback ke mock'); ws.close(); useMock=true; startMock(); } },3000);
    ws.onopen = () => { opened=true; clearTimeout(openTimer); console.log('WS connected'); };
    ws.onmessage = (evt) => { try{ const data = JSON.parse(evt.data) as TrafficEvent; data.timestamp = data.timestamp || Date.now(); renderEvent(data); (window as any).onTrafficEventForChart?.(data); }catch(e){ console.error(e); } };
    ws.onerror = (e) => { console.error('WS error', e); if(!opened){ useMock = true; startMock(); }};
    ws.onclose = () => { if(!useMock){ useMock = true; startMock(); }};
  } else {
    startMock();
  }
}
function startMock(){ setInterval(()=>{ const now = Date.now(); const ev = { srcIP:`192.168.1.${Math.ceil(Math.random()*12)}`, dstIP:`10.0.0.${Math.ceil(Math.random()*4)}`, bytes: Math.floor(Math.random()*1500)+40, timestamp: now }; if(Math.random()<0.08){ for(let i=0;i<40;i++){ const burstEv = {...ev, timestamp: Date.now()+i}; renderEvent(burstEv); (window as any).onTrafficEventForChart?.(burstEv); } } else { renderEvent(ev); (window as any).onTrafficEventForChart?.(ev); } },400); }
btnDashboard.onclick = () => { monitorSection.style.display=''; chartSection.style.display='none'; };
btnRealtime.onclick = () => { monitorSection.style.display='none'; chartSection.style.display=''; };
startClock(); initDataSource();