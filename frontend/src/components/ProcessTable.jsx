import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  Sliders, 
  Trash2, 
  XOctagon, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Layers
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
    <div className="space-y-4">
      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl flex items-center justify-between text-xs font-mono border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-500 hover:text-slate-800 font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Control Bar: Search, Filters, Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl panel-border bg-white">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search PID or process name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition font-mono"
          />
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end text-xs font-mono">
          <span className="text-slate-500 font-medium">Total: {processes.length} Processes</span>
          <button
            onClick={fetchProcs}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Process Table */}
      <div className="rounded-xl panel-border bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th
                  onClick={() => handleSort('pid')}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600"
                >
                  PID {sortBy === 'pid' ? (order === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600"
                >
                  Process Name {sortBy === 'name' ? (order === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th
                  onClick={() => handleSort('cpu_percent')}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600"
                >
                  CPU % {sortBy === 'cpu_percent' ? (order === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th
                  onClick={() => handleSort('memory_percent')}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600"
                >
                  RAM % {sortBy === 'memory_percent' ? (order === 'desc' ? '▼' : '▲') : ''}
                </th>
                <th
                  onClick={() => handleSort('memory_mb')}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600"
                >
                  RSS (MB)
                </th>
                <th
                  onClick={() => handleSort('num_threads')}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600"
                >
                  Threads
                </th>
                <th className="py-3 px-4">Priority (Nice)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Interactive Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {processes.map((proc) => {
                const isSelected = selectedPid === proc.pid;
                return (
                  <tr
                    key={proc.pid}
                    className={`hover:bg-orange-50/40 transition-colors ${
                      isSelected ? 'bg-orange-50/70' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 text-orange-600 font-bold">{proc.pid}</td>
                    <td className="py-2.5 px-4 text-slate-900 font-medium">{proc.name}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={
                            proc.cpu_percent > 20
                              ? 'text-rose-600 font-bold'
                              : proc.cpu_percent > 5
                              ? 'text-orange-600 font-bold'
                              : 'text-slate-700 font-medium'
                          }
                        >
                          {proc.cpu_percent}%
                        </span>
                        {proc.cpu_percent > 1 && (
                          <div className="w-12 bg-slate-100 h-1 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="bg-orange-500 h-full rounded-full"
                              style={{ width: `${Math.min(proc.cpu_percent * 2, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-medium">{proc.memory_percent}%</td>
                    <td className="py-2.5 px-4 text-slate-600">{proc.memory_mb} MB</td>
                    <td className="py-2.5 px-4 text-slate-600">{proc.num_threads}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {proc.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {proc.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setPriorityModal(proc)}
                          title="Adjust Priority Class (Renice)"
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-600 border border-slate-200 transition"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTerminate(proc.pid, proc.name)}
                          title="Send SIGTERM (Safe Termination)"
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                        >
                          <XOctagon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleKill(proc.pid, proc.name)}
                          title="Send SIGKILL (Force Kill)"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono">Adjust Priority Class</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {priorityModal.name} (PID: {priorityModal.pid})
                </p>
              </div>
              <button
                onClick={() => setPriorityModal(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold font-mono"
              >
                CLOSE
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Modifying execution priority informs the kernel scheduler how to bias CPU cycle distribution.
            </p>

            <div className="space-y-1.5 font-mono text-xs">
              {['IDLE', 'BELOW_NORMAL', 'NORMAL', 'ABOVE_NORMAL', 'HIGH', 'REALTIME'].map((pLevel) => (
                <button
                  key={pLevel}
                  onClick={() => handleRenice(priorityModal.pid, pLevel)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition ${
                    priorityModal.priority === pLevel
                      ? 'bg-orange-500 border-orange-500 text-white font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{pLevel}</span>
                    {priorityModal.priority === pLevel && (
                      <span className="text-[10px] text-white font-bold">CURRENT</span>
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
