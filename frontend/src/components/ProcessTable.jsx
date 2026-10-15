import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  Sliders, 
  Trash2, 
  XOctagon, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';

export default function ProcessTable() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('cpu_percent');
  const [order, setOrder] = useState('desc');
  const [actionMessage, setActionMessage] = useState(null);
  const [selectedPid, setSelectedPid] = useState(null);
  const [priorityModal, setPriorityModal] = useState(null);

  const fetchProcs = async () => {
    try {
      setLoading(true);
      const data = await api.getProcesses({ limit: 60, sortBy, order, search });
      setProcesses(data.processes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcs();
    const interval = setInterval(fetchProcs, 3000);
    return () => clearInterval(interval);
  }, [sortBy, order, search]);

  const handleTerminate = async (pid, name) => {
    if (!window.confirm(`Send SIGTERM to process ${name} (PID: ${pid})?`)) return;
    try {
      const res = await api.terminateProcess(pid);
      setActionMessage({ type: 'success', text: res.message });
      fetchProcs();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleKill = async (pid, name) => {
    if (!window.confirm(`Force KILL process ${name} (PID: ${pid})? This is irreversible.`)) return;
    try {
      const res = await api.killProcess(pid);
      setActionMessage({ type: 'success', text: res.message });
      fetchProcs();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleRenice = async (pid, newPriority) => {
    try {
      const res = await api.reniceProcess(pid, newPriority);
      setActionMessage({ type: 'success', text: res.message });
      setPriorityModal(null);
      fetchProcs();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setOrder(order === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setOrder('desc');
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl flex items-center justify-between text-xs font-mono border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-[#4a6a8a] hover:text-[#e2eaf5] font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Control Bar: Search, Filters, Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl panel-border bg-[#0b1120]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#4a6a8a] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search PID or process name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#070e1c] border border-[#132035] rounded-lg pl-9 pr-4 py-2 text-xs text-[#e2eaf5] placeholder-[#3d5a78] focus:outline-none focus:border-[#00d4ff] transition font-mono"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end text-xs font-mono">
          <span className="text-[#4a6a8a] font-medium">Total: {processes.length} Processes</span>
          <button
            onClick={fetchProcs}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Process Table */}
      <div className="rounded-xl panel-border bg-[#0b1120] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#070e1c] text-[#7a9ab8] border-b border-[#132035] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th
                  onClick={() => handleSort('pid')}
                  className="py-3 px-4 cursor-pointer hover:text-[#00d4ff] transition-colors"
                >
                  PID {sortBy === 'pid' ? (order === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-[#00d4ff] transition-colors"
                >
                  Process Name {sortBy === 'name' ? (order === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th
                  onClick={() => handleSort('cpu_percent')}
                  className="py-3 px-4 cursor-pointer hover:text-[#00d4ff] transition-colors"
                >
                  CPU % {sortBy === 'cpu_percent' ? (order === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th
                  onClick={() => handleSort('memory_percent')}
                  className="py-3 px-4 cursor-pointer hover:text-[#00d4ff] transition-colors"
                >
                  RAM % {sortBy === 'memory_percent' ? (order === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th
                  onClick={() => handleSort('memory_mb')}
                  className="py-3 px-4 cursor-pointer hover:text-[#00d4ff] transition-colors"
                >
                  RSS (MB)
                </th>
                <th
                  onClick={() => handleSort('num_threads')}
                  className="py-3 px-4 cursor-pointer hover:text-[#00d4ff] transition-colors"
                >
                  Threads
                </th>
                <th className="py-3 px-4">Priority (Nice)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#132035] text-[#9ab8d4]">
              {processes.map((proc) => {
                const isSelected = selectedPid === proc.pid;
                return (
                  <tr
                    key={proc.pid}
                    className={`hover:bg-[#0d1e33]/60 transition-colors ${
                      isSelected ? 'bg-[#0d1e33]' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 text-[#00d4ff] font-bold">{proc.pid}</td>
                    <td className="py-2.5 px-4 text-[#e2eaf5] font-medium">{proc.name}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={
                            proc.cpu_percent > 20
                              ? 'text-[#ff4466] font-bold'
                              : proc.cpu_percent > 5
                              ? 'text-[#ffaa00] font-bold'
                              : 'text-[#9ab8d4] font-medium'
                          }
                        >
                          {proc.cpu_percent}%
                        </span>
                        {proc.cpu_percent > 1 && (
                          <div className="w-12 bg-[#070e1c] h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(proc.cpu_percent * 2, 100)}%`,
                                backgroundColor: proc.cpu_percent > 20 ? '#ff4466' : proc.cpu_percent > 5 ? '#ffaa00' : '#00d4ff'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[#e2eaf5]">{proc.memory_percent}%</td>
                    <td className="py-2.5 px-4 text-[#7a9ab8]">{proc.memory_mb} MB</td>
                    <td className="py-2.5 px-4 text-[#7a9ab8]">{proc.num_threads}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#070e1c] text-[#7a9ab8] border border-[#132035]">
                        {proc.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/40 text-[#00ff88] border border-emerald-500/30">
                        {proc.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setPriorityModal(proc)}
                          title="Adjust Priority Class (Renice)"
                          className="p-1.5 rounded bg-[#070e1c] hover:bg-[#132035] text-[#7a9ab8] hover:text-[#00d4ff] border border-[#132035] transition"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTerminate(proc.pid, proc.name)}
                          title="Send SIGTERM (Safe Termination)"
                          className="p-1.5 rounded bg-amber-950/30 hover:bg-amber-900/40 text-[#ffaa00] border border-amber-500/30 transition"
                        >
                          <XOctagon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleKill(proc.pid, proc.name)}
                          title="Send SIGKILL (Force Kill)"
                          className="p-1.5 rounded bg-rose-950/30 hover:bg-rose-900/40 text-[#ff4466] border border-rose-500/30 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority Renice Modal */}
      {priorityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0b1120] border border-[#1d3352] rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-[#132035] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#e2eaf5]">Adjust Priority Class</h3>
                <p className="text-xs text-[#4a6a8a]">
                  {priorityModal.name} (PID: {priorityModal.pid})
                </p>
              </div>
              <button
                onClick={() => setPriorityModal(null)}
                className="text-[#4a6a8a] hover:text-[#e2eaf5] text-xs font-bold"
              >
                CLOSE
              </button>
            </div>

            <p className="text-xs text-[#7a9ab8]">
              Modifying execution priority informs the kernel scheduler how to bias CPU cycle distribution.
            </p>

            <div className="space-y-1.5 text-xs">
              {['IDLE', 'BELOW_NORMAL', 'NORMAL', 'ABOVE_NORMAL', 'HIGH', 'REALTIME'].map((pLevel) => (
                <button
                  key={pLevel}
                  onClick={() => handleRenice(priorityModal.pid, pLevel)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition ${
                    priorityModal.priority === pLevel
                      ? 'bg-[#00d4ff]/15 border-[#00d4ff]/40 text-[#00d4ff]'
                      : 'bg-[#070e1c] border-[#132035] text-[#7a9ab8] hover:bg-[#132035] hover:text-[#e2eaf5]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{pLevel}</span>
                    {priorityModal.priority === pLevel && (
                      <span className="text-[10px] text-[#00d4ff] font-bold">CURRENT</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
