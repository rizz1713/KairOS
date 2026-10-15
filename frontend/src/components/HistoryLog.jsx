import React, { useState, useEffect } from 'react';
import { History, RefreshCw, Database, Sparkles, Clock } from 'lucide-react';
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
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="p-5 rounded-xl panel-border bg-[#0b1120] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#e2eaf5] flex items-center gap-2">
            <Database className="w-5 h-5 text-[#00d4ff]" />
            SQLite Historical Telemetry & Recommendations Audit Log
          </h2>
          <p className="text-xs text-[#4a6a8a] mt-0.5">

          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database Records</span>
        </button>
      </div>

      {/* Recommendations Audit Trail */}
      <div className="p-5 rounded-xl panel-border bg-[#0b1120] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#00d4ff]" />
            <h3 className="text-xs font-bold text-[#e2eaf5] uppercase tracking-wider">
              Historical ML Recommendations Log ({recHistory.length} Entries)
            </h3>
          </div>
          <span className="text-[10px] text-[#4a6a8a] font-medium">Table: `recommendations`</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e1c] text-[#7a9ab8] uppercase text-[10px] font-bold border-b border-[#132035]">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Recommended Heuristic</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Reasoning Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#132035] text-[#9ab8d4]">
              {recHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#4a6a8a] font-medium">
                    No recommendations logged yet. Run the ML Advisor to generate persistent records.
                  </td>
                </tr>
              ) : (
                recHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#070e1c]">
                    <td className="py-2.5 px-3 text-[#00d4ff] font-bold">{rec.id}</td>
                    <td className="py-2.5 px-3 text-[#4a6a8a]">
                      {new Date(rec.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 text-[#7a9ab8] font-medium">{rec.recommendation_type}</td>
                    <td className="py-2.5 px-3 font-bold text-[#e2eaf5]">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30 text-[10px] font-bold">
                        {rec.recommendation}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#00ff88] font-bold">
                      {Math.round(rec.confidence * 100)}%
                    </td>
                    <td className="py-2.5 px-3 text-[#7a9ab8] max-w-md truncate" title={rec.reason}>
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
      <div className="p-5 rounded-xl panel-border bg-[#0b1120] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#c084fc]" />
            <h3 className="text-xs font-bold text-[#e2eaf5] uppercase tracking-wider">
              Persisted Telemetry Snapshots
            </h3>
          </div>
          <span className="text-[10px] text-[#4a6a8a] font-medium">Tables: `cpu_history`, `memory_history`</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e1c] text-[#7a9ab8] uppercase text-[10px] font-bold border-b border-[#132035]">
              <tr>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">CPU Usage (%)</th>
                <th className="py-2 px-3">Process Count</th>
                <th className="py-2 px-3">Memory Usage (%)</th>
                <th className="py-2 px-3">Available Memory (MB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#132035] text-[#9ab8d4]">
              {metricsHistory.cpu.slice(-15).reverse().map((cItem, idx) => {
                const mItem = metricsHistory.memory[idx] || {};
                return (
                  <tr key={idx} className="hover:bg-[#070e1c]">
                    <td className="py-2 px-3 text-[#4a6a8a]">{cItem.timestamp}</td>
                    <td className="py-2 px-3 text-[#00d4ff] font-bold">{cItem.cpu_usage}%</td>
                    <td className="py-2 px-3 font-medium text-[#e2eaf5]">{cItem.process_count}</td>
                    <td className="py-2 px-3 font-bold text-[#00ff88]">{mItem.memory_usage || 'N/A'}%</td>
                    <td className="py-2 px-3 text-[#7a9ab8]">{mItem.available_mb || 'N/A'} MB</td>
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
