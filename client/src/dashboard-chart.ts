// client/src/dashboard-chart.ts
declare const Chart: any;

type TrafficEvent = { srcIP: string; dstIP: string; bytes:number; timestamp:number };

const canvas = document.getElementById('traffic-chart') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const labels: string[] = [];
const dataPoints: number[] = [];
const maxPoints = 60;

const trafficChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels,
    datasets: [{ label: 'Requests / sec', data: dataPoints, borderColor: '#007bff', backgroundColor: 'rgba(0,123,255,0.1)', tension: 0.2 }]
  },
  options: { animation: false, scales: { x: { display:true }, y: { beginAtZero:true } } }
});

const buckets = new Map<number, number>();
function addEventToChart(ev:TrafficEvent){ const sec = Math.floor(ev.timestamp/1000)*1000; buckets.set(sec, (buckets.get(sec)||0)+1); }
setInterval(()=>{ const now = Date.now(); const sec = Math.floor(now/1000)*1000; const count = buckets.get(sec) || 0; const label = new Date(now).toLocaleTimeString(); labels.push(label); dataPoints.push(count); if(labels.length>maxPoints){ labels.shift(); dataPoints.shift(); } for(const k of Array.from(buckets.keys())){ if(k < sec - maxPoints*1000) buckets.delete(k); } trafficChart.update(); },1000);
(window as any).onTrafficEventForChart = (ev:TrafficEvent)=>{ addEventToChart(ev); };