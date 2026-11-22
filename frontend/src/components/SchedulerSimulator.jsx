import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Download, Plus, Trash2, Cpu, BarChart3, Layers, ChevronRight, Flag } from 'lucide-react';
import { api } from '../services/api';
import AlgorithmRace from './AlgorithmRace';

const DEFAULT_PROCESSES = [
  { pid:1, name:'P1 (Compiler)',         arrival_time:0, burst_time:8, priority:3 },
  { pid:2, name:'P2 (Web Server)',        arrival_time:1, burst_time:4, priority:1 },
  { pid:3, name:'P3 (DB Query)',          arrival_time:2, burst_time:9, priority:4 },
  { pid:4, name:'P4 (Terminal IO)',       arrival_time:3, burst_time:2, priority:2 },
  { pid:5, name:'P5 (Telemetry Daemon)', arrival_time:4, burst_time:5, priority:2 },
];

const ALGO_OPTIONS = [
  { id:'ALL',          label:'Compare All'    },
  { id:'FCFS',         label:'FCFS'           },
  { id:'SJF',          label:'SJF'            },
  { id:'SRTF',         label:'SRTF'           },
  { id:'RR',           label:'Round Robin'    },
  { id:'PRIORITY_NON', label:'Priority (Non)' },
  { id:'PRIORITY_PRE', label:'Priority (Pre)' },
];

const GANTT_PALETTE = [
  { bg:'#0891b2', border:'#0e7490' },
  { bg:'#3b82f6', border:'#2563eb' },
  { bg:'#8b5cf6', border:'#7c3aed' },
  { bg:'#10b981', border:'#059669' },
  { bg:'#f59e0b', border:'#d97706' },
  { bg:'#ef4444', border:'#dc2626' },
  { bg:'#06b6d4', border:'#0891b2' },
  { bg:'#6366f1', border:'#4f46e5' },
];

function ganttPalette(pid) {
  if (pid === 'IDLE' || pid === null) return { bg:'#e2e8f0', border:'#cbd5e1', text:'#64748b' };
  return { ...GANTT_PALETTE[(Number(pid)||0) % GANTT_PALETTE.length], text:'#fff' };
}

function GanttBar({ gantt, total }) {
  if (!gantt || gantt.length === 0) return null;
  const totalTime = total || gantt[gantt.length - 1]?.end || 1;
  const tickInterval = totalTime <= 20 ? 2 : totalTime <= 50 ? 5 : 10;
  const ticks = [];
  for (let t = 0; t <= totalTime; t += tickInterval) ticks.push(t);
  if (ticks[ticks.length - 1] !== totalTime) ticks.push(totalTime);

  return (
    <div className="w-full space-y-1 mono select-none">
      <div className="relative w-full h-12 flex rounded-lg overflow-hidden border border-slate-200 shadow-sm">
        {gantt.map((block, i) => {
          const dur = block.end - block.start;
          const pct = (dur / totalTime) * 100;
          const col = ganttPalette(block.pid);
          const showLabel = pct > 5;
          const showTime  = pct > 8;
          return (
            <div
              key={i}
              title={`${block.name}  |  ${block.start}ms to ${block.end}ms  (${dur}ms)`}
              style={{
                width: `${Math.max(pct, 1.5)}%`,
                background: col.bg,
                borderRight: `2px solid ${col.border}`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', cursor: 'default',
                transition: 'filter 0.15s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; }}
            >
              {showLabel && (
                <span style={{ color: col.text, fontSize: 10, fontWeight: 700, lineHeight: 1.2, maxWidth: '90%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {block.name}
                </span>
              )}
              {showTime && (
                <span style={{ color: col.text, fontSize: 9, opacity: 0.75, lineHeight: 1 }}>
                  {block.start}-{block.end}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="relative w-full h-4">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: '#e2e8f0' }} />
        {ticks.map(t => {
          const pct = (t / totalTime) * 100;
          return (
            <div key={t} style={{ position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 1, height: 4, background: '#94a3b8' }} />
              <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SchedulerSimulator() {
  const [algorithm, setAlgorithm] = useState('ALL');
  const [quantum, setQuantum]     = useState(2);
  const [processes, setProcesses] = useState(DEFAULT_PROCESSES);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [view, setView]           = useState('simulate');

  useEffect(() => { runSimulation(); }, []);

  const runSimulation = async () => {
    try {
      setLoading(true); setError(null);
      setSimResult(await api.simulateScheduler(algorithm, Number(quantum), processes));
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const loadLive = async () => {
    try {
      setLoading(true);
      const data = await api.getLiveSchedulerQueue(6);
      if (data.processes && data.processes.length > 0) {
        setProcesses(data.processes);
        setSimResult(await api.simulateScheduler(algorithm, Number(quantum), data.processes));
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const change = (i, field, val) => {
    const u = [...processes];
    u[i] = { ...u[i], [field]: field === 'name' ? val : Number(val) };
    setProcesses(u);
  };

  const addProc = () => {
    const n = processes.length ? Math.max(...processes.map(p => p.pid)) + 1 : 1;
    setProcesses([...processes, { pid: n, name: `P${n}`, arrival_time: 0, burst_time: 5, priority: 2 }]);
  };

  const removeProc = (i) => {
    if (processes.length > 1) setProcesses(processes.filter((_, x) => x !== i));
  };

  const reset = () => {
    setProcesses(DEFAULT_PROCESSES);
    setAlgorithm('ALL');
    setQuantum(2);
  };

  return (
    <div className="space-y-5">

      {/* View tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('simulate')}
          className={`btn ${view === 'simulate' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Cpu className="w-3.5 h-3.5" /> Simulation
        </button>
        <button
          onClick={() => { setView('race'); if (algorithm !== 'ALL') setAlgorithm('ALL'); }}
          className="btn"
          style={view === 'race'
            ? { background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', borderColor: '#7c3aed', color: '#fff' }
            : { background: '#f1f5f9', borderColor: '#e2e8f0', color: '#475569' }
          }
        >
          <Flag className="w-3.5 h-3.5" /> ⚡ Algorithm Race
        </button>
      </div>

      {view === 'race' ? (
        <AlgorithmRace simResult={simResult} processes={processes} quantum={quantum} />
      ) : (
        <div className="space-y-5">

          {/* Config card */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="section-title flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-500" /> CPU Scheduling Engine
                </h2>
                <p className="section-subtitle">Simulate turnaround time, waiting time, and scheduling dynamics.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={loadLive} className="btn btn-secondary">
                  <Download className="w-3.5 h-3.5" /> Import Live
                </button>
                <button onClick={reset} className="btn btn-ghost">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button onClick={runSimulation} disabled={loading} className="btn btn-primary">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {loading ? 'Simulating…' : 'Run Simulation'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
              {ALGO_OPTIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAlgorithm(a.id)}
                  className={`btn text-[11px] py-1.5 px-3 ${algorithm === a.id ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {(algorithm === 'RR' || algorithm === 'ALL') && (
              <div className="flex items-center gap-3 pt-2 text-xs mono text-slate-600 border-t border-slate-100">
                <span className="font-semibold">Time Quantum:</span>
                <input
                  type="number" min="1" max="20" value={quantum}
                  onChange={e => setQuantum(e.target.value)}
                  className="input-base w-20 text-center mono text-cyan-700 font-bold"
                />
                <span className="text-slate-400">ms per slice</span>
              </div>
            )}
          </div>

          {/* Process queue */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="section-title flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" /> Process Ready Queue
              </h3>
              <button onClick={addProc} className="btn btn-secondary text-[11px] py-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Process
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PID</th><th>Name</th><th>Arrival (ms)</th>
                    <th>Burst (ms)</th><th>Priority</th><th className="text-right">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((p, i) => (
                    <tr key={i}>
                      <td className="text-cyan-600 font-bold">{p.pid}</td>
                      <td>
                        <input type="text" value={p.name}
                          onChange={e => change(i, 'name', e.target.value)}
                          className="input-base w-40" />
                      </td>
                      <td>
                        <input type="number" min="0" value={p.arrival_time}
                          onChange={e => change(i, 'arrival_time', e.target.value)}
                          className="input-base w-20 text-center mono" />
                      </td>
                      <td>
                        <input type="number" min="1" value={p.burst_time}
                          onChange={e => change(i, 'burst_time', e.target.value)}
                          className="input-base w-20 text-center mono text-cyan-700 font-bold" />
                      </td>
                      <td>
                        <input type="number" min="1" max="10" value={p.priority}
                          onChange={e => change(i, 'priority', e.target.value)}
                          className="input-base w-20 text-center mono" />
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => removeProc(i)}
                          disabled={processes.length <= 1}
                          className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {error && <div className="alert alert-danger">Simulation error: {error}</div>}

          {/* Results */}
          {simResult && (
            <div className="space-y-5">
              {algorithm === 'ALL' && simResult.comparison ? (
                <div className="space-y-5">
                  <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="section-title flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-cyan-500" /> Comparative Benchmark
                      </h3>
                      <div className="flex gap-2">
                        <span className="badge badge-emerald">Best WT: {simResult.recommendation?.lowest_waiting_time}</span>
                        <span className="badge badge-cyan">Best TAT: {simResult.recommendation?.lowest_turnaround_time}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Algorithm</th><th>Avg Waiting (ms)</th><th>Avg Turnaround (ms)</th>
                            <th>CPU Util %</th><th>Throughput</th><th>Total Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simResult.comparison.map((item, idx) => {
                            const bWT  = item.algorithm === simResult.recommendation?.lowest_waiting_time;
                            const bTAT = item.algorithm === simResult.recommendation?.lowest_turnaround_time;
                            return (
                              <tr key={idx}>
                                <td className="font-bold text-slate-900">
                                  {item.algorithm}
                                  {bWT && <span className="badge badge-emerald ml-2">BEST WT</span>}
                                </td>
                                <td className={`font-bold mono ${bWT ? 'text-emerald-600' : ''}`}>{item.avg_waiting_time}</td>
                                <td className={`font-bold mono ${bTAT ? 'text-cyan-600' : ''}`}>{item.avg_turnaround_time}</td>
                                <td className="mono">{item.cpu_utilization}%</td>
                                <td className="mono">{item.throughput}/ms</td>
                                <td className="mono text-slate-500">{item.total_execution_time}ms</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {['FCFS', 'SJF', 'SRTF', 'RR'].map(key => {
                    const run = simResult.runs?.[key];
                    if (!run) return null;
                    return (
                      <div key={key} className="card p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="section-title mono">{run.algorithm}</span>
                          <span className="text-xs text-slate-500 mono">
                            WT: {run.metrics.avg_waiting_time}ms · TAT: {run.metrics.avg_turnaround_time}ms
                          </span>
                        </div>
                        <GanttBar gantt={run.gantt} total={run.metrics.total_execution_time} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Avg Waiting',     value: simResult.metrics?.avg_waiting_time,    unit: 'ms',  color: 'text-emerald-600' },
                      { label: 'Avg Turnaround',  value: simResult.metrics?.avg_turnaround_time, unit: 'ms',  color: 'text-cyan-600'    },
                      { label: 'CPU Utilization', value: simResult.metrics?.cpu_utilization,     unit: '%',   color: 'text-slate-800'   },
                      { label: 'Throughput',      value: simResult.metrics?.throughput,          unit: '/ms', color: 'text-amber-600'   },
                    ].map(m => (
                      <div key={m.label} className="card p-4 space-y-1">
                        <span className="stat-label">{m.label}</span>
                        <div className={`stat-value ${m.color}`}>
                          {m.value}
                          <span className="text-sm text-slate-400 mono font-semibold ml-1">{m.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="section-title">Execution Gantt Chart</h3>
                      <span className="text-xs mono text-slate-500">Total: {simResult.metrics?.total_execution_time}ms</span>
                    </div>
                    <GanttBar gantt={simResult.gantt || []} total={simResult.metrics?.total_execution_time} />
                  </div>

                  <div className="card p-5 space-y-3">
                    <h3 className="section-title">Process Completion Details</h3>
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>PID</th><th>Name</th><th>Arrival</th><th>Burst</th><th>Priority</th>
                            <th>Completion</th>
                            <th className="text-cyan-600">TAT (ms)</th>
                            <th className="text-emerald-600">WT (ms)</th>
                            <th>RT (ms)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simResult.results?.map(p => (
                            <tr key={p.pid}>
                              <td className="text-cyan-600 font-bold">{p.pid}</td>
                              <td className="font-semibold text-slate-900">{p.name}</td>
                              <td className="mono">{p.arrival_time}ms</td>
                              <td className="mono font-bold text-cyan-600">{p.burst_time}ms</td>
                              <td className="mono">{p.priority}</td>
                              <td className="mono">{p.completion_time}ms</td>
                              <td className="mono font-bold text-cyan-600">{p.turnaround_time}</td>
                              <td className="mono font-bold text-emerald-600">{p.waiting_time}</td>
                              <td className="mono">{p.response_time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {simResult.events && simResult.events.length > 0 && (
                    <div className="card p-5 space-y-3">
                      <h3 className="section-title">Kernel Dispatch Log</h3>
                      <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-1">
                        {simResult.events.map((ev, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] mono text-slate-600">
                            <ChevronRight className="w-3 h-3 text-cyan-500 mt-0.5 flex-shrink-0" />
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
