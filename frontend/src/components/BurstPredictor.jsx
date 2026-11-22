import React, { useState, useEffect } from 'react';
import { BrainCircuit, RefreshCw, TrendingUp, Info } from 'lucide-react';
import { api } from '../services/api';

const PROC_COLORS = ['#0891b2','#7c3aed','#059669','#d97706','#dc2626','#2563eb','#db2777','#0d9488','#6366f1','#f59e0b'];

function SparkLine({ values, color, width = 120, height = 36, predicted }) {
  if (!values || values.length < 2) return null;
  const all = predicted !== undefined ? [...values, predicted] : values;
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const lastX = ((values.length - 1) / values.length) * width;
  const lastY = height - ((values[values.length-1] - min) / range) * (height - 4) - 2;
  const predX = width;
  const predY = height - ((predicted - min) / range) * (height - 4) - 2;

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      {/* History line */}
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      {/* Dots */}
      {values.map((v, i) => {
        const x = (i / values.length) * width;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return <circle key={i} cx={x} cy={y} r={2.5} fill={color} />;
      })}
      {/* Dashed prediction line */}
      {predicted !== undefined && (
        <>
          <line x1={lastX} y1={lastY} x2={predX} y2={predY}
            stroke={color} strokeWidth={1.8} strokeDasharray="4,3" opacity={0.7} />
          <circle cx={predX} cy={predY} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
          <text x={predX + 5} y={predY + 4} fontSize={9} fill={color} fontWeight={700} fontFamily="monospace">
            {predicted}
          </text>
        </>
      )}
    </svg>
  );
}

export default function BurstPredictor() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = async () => {
    try {
      setLoading(true);
      setData(await api.getProcessBurstHistory());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); const id = setInterval(fetch_, 5000); return () => clearInterval(id); }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-cyan-500" /> CPU Burst Predictor
          </h2>
          <p className="section-subtitle">
            Predicts the next CPU burst for active processes using a 3-point Simple Moving Average — the same heuristic used by SJF scheduling in real OS kernels.
          </p>
        </div>
        <button onClick={fetch_} disabled={loading} className="btn btn-secondary">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* How it works */}
      <div className="card p-4 flex items-start gap-3" style={{ borderLeft: '3px solid #06b6d4' }}>
        <Info className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800">How prediction works:</strong> Real OS kernels (like Linux CFS) estimate a process's next CPU burst using an exponential moving average of past bursts.
          KAIROS uses a <strong>3-point SMA</strong> (average of the last 3 bursts) on live CPU usage samples to predict the next slice — the same principle that powers SJF and SRTF scheduling decisions.
          Processes with low predicted bursts are ideal candidates for SJF scheduling.
        </div>
      </div>

      {/* Process cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.processes.map((p, i) => {
            const color = PROC_COLORS[i % PROC_COLORS.length];
            const trend = p.predicted_next > p.avg_burst ? 'up' : p.predicted_next < p.avg_burst ? 'down' : 'stable';
            return (
              <div key={p.pid} className="card card-hover p-4 space-y-3" style={{ borderTop: `3px solid ${color}` }}>
                {/* Process header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{p.name}</div>
                    <div className="text-[10px] mono text-slate-400">PID {p.pid} · CPU {p.cpu_percent}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] mono text-slate-400">Next Burst</div>
                    <div className="text-lg font-extrabold mono" style={{ color }}>
                      {p.predicted_next}<span className="text-xs text-slate-400 ml-0.5">ms</span>
                    </div>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="flex items-center gap-3">
                  <SparkLine values={p.burst_history} predicted={p.predicted_next} color={color} />
                  <div className="text-[10px] mono text-slate-400 space-y-0.5 flex-shrink-0">
                    <div>Avg: <strong className="text-slate-700">{p.avg_burst}ms</strong></div>
                    <div>Trend:
                      <strong className={`ml-1 ${trend==='up'?'text-rose-600':trend==='down'?'text-emerald-600':'text-slate-500'}`}>
                        {trend === 'up' ? '↑ Rising' : trend === 'down' ? '↓ Falling' : '→ Stable'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Burst history bar */}
                <div className="space-y-1">
                  <div className="text-[10px] mono text-slate-400">Burst History</div>
                  <div className="flex gap-1 items-end h-6">
                    {p.burst_history.map((v, j) => {
                      const max = Math.max(...p.burst_history, 1);
                      const h = Math.max((v / max) * 24, 4);
                      return (
                        <div key={j} title={`Burst ${j+1}: ${v}ms`}
                          style={{ height: h, flex: 1, background: color, opacity: 0.6 + (j / p.burst_history.length) * 0.4, borderRadius: 2 }} />
                      );
                    })}
                    {/* Predicted bar */}
                    <div title={`Predicted: ${p.predicted_next}ms`}
                      style={{
                        height: Math.max((p.predicted_next / Math.max(...p.burst_history, 1)) * 24, 4),
                        flex: 1, background: color, borderRadius: 2,
                        border: `1.5px dashed ${color}`, opacity: 0.5,
                      }} />
                  </div>
                  <div className="flex justify-between text-[9px] mono text-slate-300">
                    <span>t-5</span><span>t-4</span><span>t-3</span><span>t-2</span><span>t-1</span><span style={{ color }}>t+1</span>
                  </div>
                </div>

                {/* Scheduling hint */}
                <div className="text-[10px] mono rounded-lg px-2.5 py-1.5 font-medium"
                  style={{ background: color + '14', color }}>
                  {p.predicted_next < 10 ? '⚡ Short burst — ideal for SJF' :
                   p.predicted_next < 25 ? '✓ Medium burst — suitable for RR' :
                   '⚠ Long burst — Priority scheduling recommended'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Methodology */}
      <div className="card p-5 space-y-3">
        <h3 className="section-title flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-500" /> Prediction Methodology</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mono">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <div className="font-bold text-cyan-700">SMA-3 Formula</div>
            <div className="text-slate-600">τ(n+1) = (τ(n) + τ(n-1) + τ(n-2)) / 3</div>
            <div className="text-slate-400 text-[10px]">Simple Moving Average of last 3 CPU usage samples</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <div className="font-bold text-violet-700">Real OS Equivalent</div>
            <div className="text-slate-600">τ(n+1) = α·t(n) + (1-α)·τ(n)</div>
            <div className="text-slate-400 text-[10px]">Exponential moving average used in Linux CFS (α=0.5)</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
            <div className="font-bold text-emerald-700">Why It Matters</div>
            <div className="text-slate-600">SJF requires knowing burst times in advance</div>
            <div className="text-slate-400 text-[10px]">Prediction turns theoretical SJF into a practical algorithm</div>
          </div>
        </div>
      </div>
    </div>
  );
}
