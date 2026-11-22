import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Info } from 'lucide-react';
import { api } from '../services/api';

/* ── State definitions ───────────────────────────────────────────────── */
const STATES = {
  NEW:        { label: 'New',        color: '#7c3aed', light: '#f5f3ff', x: 80,  y: 160 },
  READY:      { label: 'Ready',      color: '#0891b2', light: '#ecfeff', x: 240, y: 60  },
  RUNNING:    { label: 'Running',    color: '#059669', light: '#ecfdf5', x: 420, y: 160 },
  WAITING:    { label: 'Waiting',    color: '#d97706', light: '#fffbeb', x: 240, y: 270 },
  TERMINATED: { label: 'Terminated', color: '#dc2626', light: '#fff1f2', x: 580, y: 160 },
};

const TRANSITIONS = [
  { from: 'NEW',     to: 'READY',      label: 'Admitted',        cx: 160, cy: 80  },
  { from: 'READY',   to: 'RUNNING',    label: 'Dispatch',        cx: 335, cy: 90  },
  { from: 'RUNNING', to: 'READY',      label: 'Preempt / Timer', cx: 335, cy: 190 },
  { from: 'RUNNING', to: 'WAITING',    label: 'I/O Request',     cx: 400, cy: 240 },
  { from: 'WAITING', to: 'READY',      label: 'I/O Complete',    cx: 240, cy: 185 },
  { from: 'RUNNING', to: 'TERMINATED', label: 'Exit',            cx: 510, cy: 130 },
];

function arrow(from, to) {
  const f = STATES[from], t = STATES[to];
  const fx = f.x + 44, fy = f.y + 20;
  const tx = t.x + 44, ty = t.y + 20;
  const dx = tx - fx, dy = ty - fy;
  const dist = Math.sqrt(dx*dx + dy*dy) || 1;
  const r = 28;
  const x1 = fx + (dx/dist)*r, y1 = fy + (dy/dist)*r;
  const x2 = tx - (dx/dist)*(r+4), y2 = ty - (dy/dist)*(r+4);
  // slight curve
  const mx = (x1+x2)/2 - dy*0.15, my = (y1+y2)/2 + dx*0.15;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}

/* Map psutil status -> our states */
function mapStatus(status) {
  if (!status) return 'READY';
  const s = status.toLowerCase();
  if (s === 'running')                  return 'RUNNING';
  if (s === 'sleeping' || s === 'disk') return 'WAITING';
  if (s === 'stopped')                  return 'TERMINATED';
  if (s === 'zombie')                   return 'TERMINATED';
  return 'READY';
}

export default function ProcessStateDiagram() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [counts, setCounts]       = useState({ NEW:0, READY:0, RUNNING:0, WAITING:0, TERMINATED:0 });
  const [selected, setSelected]   = useState(null);
  const intervalRef               = useRef(null);
  const [pulse, setPulse]         = useState('RUNNING');

  const fetchProcs = async () => {
    try {
      setLoading(true);
      const data = await api.getProcesses({ limit: 100, sortBy: 'cpu_percent', order: 'desc' });
      const procs = data.processes || [];
      setProcesses(procs.slice(0, 20));

      const c = { NEW: 0, READY: 0, RUNNING: 0, WAITING: 0, TERMINATED: 0 };
      procs.forEach(p => { const s = mapStatus(p.status); c[s]++; });
      // Simulate a few NEW (just-spawned) processes from total count
      c.NEW = Math.max(1, Math.floor(data.total * 0.02));
      setCounts(c);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchProcs();
    intervalRef.current = setInterval(fetchProcs, 3000);
    // Animate pulse through states
    const states = ['NEW','READY','RUNNING','WAITING','TERMINATED'];
    let idx = 2;
    const pInterval = setInterval(() => { idx = (idx+1) % states.length; setPulse(states[idx]); }, 1200);
    return () => { clearInterval(intervalRef.current); clearInterval(pInterval); };
  }, []);

  const W = 700, H = 360;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-500" /> Process State Diagram
          </h2>
          <p className="section-subtitle">Live animated view of process state transitions — New → Ready → Running → Waiting → Terminated.</p>
        </div>
        <button onClick={fetchProcs} disabled={loading} className="btn btn-secondary">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* SVG Diagram */}
      <div className="card p-5">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
          <defs>
            <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
            </marker>
            <marker id="arr-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#06b6d4" />
            </marker>
            <filter id="glow-state">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Transition arrows */}
          {TRANSITIONS.map((t, i) => {
            const isActive = t.from === pulse || t.to === pulse;
            return (
              <g key={i}>
                <path d={arrow(t.from, t.to)}
                  stroke={isActive ? '#06b6d4' : '#cbd5e1'}
                  strokeWidth={isActive ? 2 : 1.5}
                  fill="none"
                  markerEnd={isActive ? 'url(#arr-active)' : 'url(#arr)'}
                  strokeDasharray={isActive ? '6,3' : 'none'}
                  style={{ transition: 'stroke 0.4s' }}
                />
                <text x={t.cx} y={t.cy} textAnchor="middle"
                  fill={isActive ? '#0891b2' : '#94a3b8'}
                  fontSize={isActive ? 10 : 9}
                  fontWeight={isActive ? 700 : 500}
                  fontFamily="monospace"
                  style={{ transition: 'fill 0.4s' }}
                >
                  {t.label}
                </text>
              </g>
            );
          })}

          {/* State nodes */}
          {Object.entries(STATES).map(([key, s]) => {
            const isActive  = key === pulse;
            const count     = counts[key] || 0;
            const r         = 38;
            return (
              <g key={key} style={{ cursor: 'pointer' }} onClick={() => setSelected(key === selected ? null : key)}>
                {/* glow ring when active */}
                {isActive && (
                  <circle cx={s.x + 44} cy={s.y + 20} r={r + 8}
                    fill="none" stroke={s.color} strokeWidth={2} opacity={0.3}
                    filter="url(#glow-state)"
                  />
                )}
                <circle cx={s.x + 44} cy={s.y + 20} r={r}
                  fill={isActive ? s.color : selected === key ? s.color : '#fff'}
                  stroke={s.color} strokeWidth={isActive ? 3 : 2}
                  filter={isActive ? 'url(#glow-state)' : ''}
                  style={{ transition: 'all 0.3s' }}
                />
                <text x={s.x + 44} y={s.y + 16} textAnchor="middle" dominantBaseline="middle"
                  fill={isActive || selected === key ? '#fff' : s.color}
                  fontSize={11} fontWeight={700} fontFamily="monospace"
                  style={{ transition: 'fill 0.3s' }}
                >
                  {s.label}
                </text>
                <text x={s.x + 44} y={s.y + 30} textAnchor="middle" dominantBaseline="middle"
                  fill={isActive || selected === key ? 'rgba(255,255,255,0.8)' : '#94a3b8'}
                  fontSize={13} fontWeight={800} fontFamily="monospace"
                >
                  {count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Count cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATES).map(([key, s]) => (
          <div key={key} className="card p-3 text-center cursor-pointer card-hover"
            style={{ borderTop: `3px solid ${s.color}`, background: selected === key ? s.light : '#fff' }}
            onClick={() => setSelected(key === selected ? null : key)}>
            <div className="stat-label" style={{ color: s.color }}>{s.label}</div>
            <div className="text-2xl font-extrabold mono mt-1" style={{ color: s.color }}>{counts[key] || 0}</div>
            <div className="text-[10px] text-slate-400 mono mt-0.5">processes</div>
          </div>
        ))}
      </div>

      {/* Process list for selected state */}
      {selected && (
        <div className="card p-5 space-y-3 fade-up">
          <h3 className="section-title" style={{ color: STATES[selected].color }}>
            {STATES[selected].label} Processes
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>PID</th><th>Name</th><th>CPU %</th><th>RAM %</th><th>Status</th></tr></thead>
              <tbody>
                {processes
                  .filter(p => mapStatus(p.status) === selected)
                  .slice(0, 10)
                  .map(p => (
                    <tr key={p.pid}>
                      <td className="font-bold mono text-cyan-600">{p.pid}</td>
                      <td className="font-semibold">{p.name}</td>
                      <td className="mono">{p.cpu_percent}%</td>
                      <td className="mono">{p.memory_percent}%</td>
                      <td><span className="badge badge-cyan">{p.status}</span></td>
                    </tr>
                  ))
                }
                {processes.filter(p => mapStatus(p.status) === selected).length === 0 && (
                  <tr><td colSpan={5} className="text-center text-slate-400 italic py-4">No processes in this state right now.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Theory callout */}
      <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { state: 'New → Ready',      desc: 'OS admits process into the ready queue after creation.' },
          { state: 'Ready → Running',  desc: 'Scheduler dispatches CPU to the next process via context switch.' },
          { state: 'Running → Waiting',desc: 'Process issues I/O request and waits for device completion.' },
          { state: 'Waiting → Ready',  desc: 'I/O completes; process returns to ready queue to await CPU.' },
          { state: 'Running → Ready',  desc: 'Timer interrupt or higher-priority process preempts execution.' },
          { state: 'Running → Terminated', desc: 'Process completes or is killed; OS reclaims all resources.' },
        ].map(t => (
          <div key={t.state} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[11px] font-bold mono text-cyan-700 mb-1">{t.state}</div>
            <div className="text-[11px] text-slate-600">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
