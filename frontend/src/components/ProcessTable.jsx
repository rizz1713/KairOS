import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Sliders, Trash2, XOctagon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const STATUS_BADGE = {
  running:  'badge badge-cyan',
  sleeping: 'badge badge-slate',
  idle:     'badge badge-slate',
  stopped:  'badge badge-amber',
  zombie:   'badge badge-rose',
};

export default function ProcessTable() {
  const [processes, setProcesses]           = useState([]);
  const [loading, setLoading]               = useState(false);
  const [search, setSearch]                 = useState('');
  const [sortBy, setSortBy]                 = useState('cpu_percent');
  const [order, setOrder]                   = useState('desc');
  const [actionMessage, setActionMessage]   = useState(null);
  const [priorityModal, setPriorityModal]   = useState(null);

  const fetchProcs = async () => {
    try { setLoading(true); const data = await api.getProcesses({ limit:60, sortBy, order, search }); setProcesses(data.processes||[]); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProcs(); const id = setInterval(fetchProcs, 3000); return () => clearInterval(id); }, [sortBy, order, search]);

  const handleTerminate = async (pid, name) => {
    if (!window.confirm(`Send SIGTERM to ${name} (PID ${pid})?`)) return;
    try { const r = await api.terminateProcess(pid); setActionMessage({ type:'success', text:r.message }); fetchProcs(); }
    catch (err) { setActionMessage({ type:'error', text:err.message }); }
  };

  const handleKill = async (pid, name) => {
    if (!window.confirm(`Force KILL ${name} (PID ${pid})?`)) return;
    try { const r = await api.killProcess(pid); setActionMessage({ type:'success', text:r.message }); fetchProcs(); }
    catch (err) { setActionMessage({ type:'error', text:err.message }); }
  };

  const handleRenice = async (pid, priority) => {
    try { const r = await api.reniceProcess(pid, priority); setActionMessage({ type:'success', text:r.message }); setPriorityModal(null); fetchProcs(); }
    catch (err) { setActionMessage({ type:'error', text:err.message }); }
  };

  const handleSort = (col) => { if (sortBy===col) setOrder(o=>o==='desc'?'asc':'desc'); else { setSortBy(col); setOrder('desc'); } };

  const SortTh = ({ col, children }) => (
    <th onClick={() => handleSort(col)} className="py-2.5 px-3.5 cursor-pointer hover:text-cyan-600 select-none whitespace-nowrap">
      {children}{sortBy===col && <span className="ml-1 text-cyan-500">{order==='desc'?'↓':'↑'}</span>}
    </th>
  );

  return (
    <div className="space-y-4">
      {actionMessage && (
        <div className={`alert ${actionMessage.type==='success'?'alert-success':'alert-danger'} justify-between`}>
          <span className="flex items-center gap-2">
            {actionMessage.type==='success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {actionMessage.text}
          </span>
          <button onClick={() => setActionMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100 ml-4">✕</button>
        </div>
      )}

      <div className="card p-3.5 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search PID or process name…" value={search}
            onChange={e => setSearch(e.target.value)} className="input-base w-full pl-8 py-2" />
        </div>
        <div className="flex items-center gap-3 ml-auto text-xs mono text-slate-500 font-medium">
          <span>{processes.length} processes</span>
          <button onClick={fetchProcs} className="btn btn-secondary">
            <RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <SortTh col="pid">PID</SortTh>
                <SortTh col="name">Process Name</SortTh>
                <SortTh col="cpu_percent">CPU %</SortTh>
                <SortTh col="memory_percent">RAM %</SortTh>
                <SortTh col="memory_mb">RSS (MB)</SortTh>
                <SortTh col="num_threads">Threads</SortTh>
                <th className="py-2.5 px-3.5">Priority</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {processes.map(proc => (
                <tr key={proc.pid}>
                  <td className="px-3.5 text-cyan-600 font-bold mono">{proc.pid}</td>
                  <td className="px-3.5 font-semibold text-slate-800">{proc.name}</td>
                  <td className="px-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`mono font-bold ${proc.cpu_percent>20?'text-rose-600':proc.cpu_percent>5?'text-amber-600':'text-slate-700'}`}>
                        {proc.cpu_percent}%
                      </span>
                      {proc.cpu_percent>1 && (
                        <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div className="bg-cyan-500 h-full rounded-full" style={{ width:`${Math.min(proc.cpu_percent*2,100)}%` }} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3.5 mono font-medium text-slate-700">{proc.memory_percent}%</td>
                  <td className="px-3.5 mono text-slate-600">{proc.memory_mb} MB</td>
                  <td className="px-3.5 mono text-slate-600">{proc.num_threads}</td>
                  <td className="px-3.5"><span className="badge badge-slate mono">{proc.priority}</span></td>
                  <td className="px-3.5">
                    <span className={STATUS_BADGE[proc.status?.toLowerCase()]||'badge badge-slate'}>{proc.status}</span>
                  </td>
                  <td className="px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setPriorityModal(proc)} title="Renice" className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-500 hover:text-cyan-600 transition"><Sliders className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleTerminate(proc.pid,proc.name)} title="SIGTERM" className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition"><XOctagon className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleKill(proc.pid,proc.name)} title="SIGKILL" className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {priorityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Adjust Priority</h3>
                <p className="text-xs text-slate-500 mono mt-0.5">{priorityModal.name} · PID {priorityModal.pid}</p>
              </div>
              <button onClick={() => setPriorityModal(null)} className="text-slate-400 hover:text-slate-700 text-lg leading-none">×</button>
            </div>
            <div className="space-y-1.5">
              {['IDLE','BELOW_NORMAL','NORMAL','ABOVE_NORMAL','HIGH','REALTIME'].map(level => (
                <button key={level} onClick={() => handleRenice(priorityModal.pid, level)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-semibold mono transition ${
                    priorityModal.priority===level
                      ? 'text-white border-cyan-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-cyan-50 hover:border-cyan-300'
                  }`}
                  style={priorityModal.priority===level ? { background:'linear-gradient(135deg,#0891b2,#06b6d4)' } : {}}
                >
                  <div className="flex justify-between">
                    <span>{level}</span>
                    {priorityModal.priority===level && <span className="opacity-70 text-[10px]">CURRENT</span>}
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
