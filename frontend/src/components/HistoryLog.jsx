import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Sparkles, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function HistoryLog() {
  const [metricsHistory, setMetricsHistory] = useState({ cpu:[], memory:[] });
  const [recHistory, setRecHistory]         = useState([]);
  const [loading, setLoading]               = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try { setLoading(true);
      const [metrics,recs] = await Promise.all([api.getHistoryMetrics(40), api.getHistoryRecommendations(20)]);
      setMetricsHistory(metrics); setRecHistory(recs);
    } catch(err){ console.error(err); } finally { setLoading(false); }
  };

  const cpuRows = metricsHistory.cpu.slice(-15).reverse();

  return (
    <div className="space-y-5">
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title flex items-center gap-2"><Database className="w-4 h-4 text-cyan-500" /> Telemetry & Recommendations Log</h2>
          <p className="section-subtitle">Persisted SQLite records via SQLAlchemy — periodic hardware snapshots and ML recommendations.</p>
        </div>
        <button onClick={fetchHistory} disabled={loading} className="btn btn-secondary flex-shrink-0">
          <RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`} /> Refresh
        </button>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" /> ML Recommendations
            <span className="badge badge-cyan">{recHistory.length} entries</span>
          </h3>
          <span className="text-[11px] mono text-slate-400">table: recommendations</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Timestamp</th><th>Type</th><th>Algorithm</th><th>Confidence</th><th>Reasoning</th></tr></thead>
            <tbody>
              {recHistory.length===0
                ? <tr><td colSpan={6} className="py-10 text-center text-slate-400 italic">No recommendations yet — run the ML Advisor to generate records.</td></tr>
                : recHistory.map(rec=>(
                  <tr key={rec.id}>
                    <td className="text-cyan-600 font-bold mono">{rec.id}</td>
                    <td className="mono text-slate-500">{new Date(rec.timestamp).toLocaleTimeString()}</td>
                    <td className="text-slate-600 font-medium">{rec.recommendation_type}</td>
                    <td><span className="badge badge-cyan mono">{rec.recommendation}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-bold mono text-emerald-700">{Math.round(rec.confidence*100)}%</span>
                        <div className="w-16 progress-track hidden sm:block">
                          <div className="progress-fill bg-emerald-500" style={{ width:`${Math.round(rec.confidence*100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs truncate text-slate-600" title={rec.reason}>{rec.reason}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-500" /> Hardware Telemetry Snapshots</h3>
          <span className="text-[11px] mono text-slate-400">tables: cpu_history, memory_history</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Timestamp</th><th>CPU %</th><th>Processes</th><th>Memory %</th><th>Avail Memory</th></tr></thead>
            <tbody>
              {cpuRows.length===0
                ? <tr><td colSpan={5} className="py-10 text-center text-slate-400 italic">No telemetry snapshots yet.</td></tr>
                : cpuRows.map((c,idx)=>{
                  const m=metricsHistory.memory[idx]||{};
                  return (
                    <tr key={idx}>
                      <td className="mono text-slate-500">{c.timestamp}</td>
                      <td><span className={`font-bold mono ${c.cpu_usage>80?'text-rose-600':c.cpu_usage>60?'text-amber-600':'text-cyan-600'}`}>{c.cpu_usage}%</span></td>
                      <td className="mono font-medium">{c.process_count}</td>
                      <td className="mono font-bold text-slate-800">{m.memory_usage??'N/A'}%</td>
                      <td className="mono text-slate-600">{m.available_mb??'N/A'} MB</td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
