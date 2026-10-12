import React, { useState, useEffect } from 'react';
import { History, RefreshCw, Database, Sparkles, Clock, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export default function HistoryLog() {
  const [metricsHistory, setMetricsHistory] = useState({ cpu: [], memory: [] });
  const [recHistory, setRecHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [metrics, recs] = await Promise.all([
        api.getHistoryMetrics(40),
        api.getHistoryRecommendations(20)
      ]);
      setMetricsHistory(metrics);
      setRecHistory(recs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl panel-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-500" />
            SQLite Historical Telemetry & Recommendations Audit Log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable SQLite records managed via SQLAlchemy capturing periodic hardware telemetry and ML scheduling recommendations.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-mono font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database Records</span>
        </button>
      </div>

      {/* Recommendations Audit Trail */}
      <div className="p-5 rounded-xl panel-border bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900 font-mono">
              Historical ML Recommendations Log ({recHistory.length} Entries)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono font-medium">Table: `recommendations`</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Recommended Heuristic</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Reasoning Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                    No recommendations logged yet. Run the ML Advisor to generate persistent records.
                  </td>
                </tr>
              ) : (
                recHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-orange-600 font-bold">{rec.id}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(rec.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{rec.recommendation_type}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 font-semibold">
                        {rec.recommendation}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">
                      {Math.round(rec.confidence * 100)}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-md truncate" title={rec.reason}>
                      {rec.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Telemetry Hardware Samples Table */}
      <div className="p-5 rounded-xl panel-border bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900 font-mono">
              Persisted Telemetry Snapshots
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono font-medium">Tables: `cpu_history`, `memory_history`</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">CPU Usage (%)</th>
                <th className="py-2 px-3">Process Count</th>
                <th className="py-2 px-3">Memory Usage (%)</th>
                <th className="py-2 px-3">Available Memory (MB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {metricsHistory.cpu.slice(-15).reverse().map((cItem, idx) => {
                const mItem = metricsHistory.memory[idx] || {};
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{cItem.timestamp}</td>
                    <td className="py-2 px-3 text-orange-600 font-bold">{cItem.cpu_usage}%</td>
                    <td className="py-2 px-3 font-medium">{cItem.process_count}</td>
                    <td className="py-2 px-3 font-bold text-slate-800">{mItem.memory_usage || 'N/A'}%</td>
                    <td className="py-2 px-3 text-slate-600">{mItem.available_mb || 'N/A'} MB</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
