import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  Download, 
  Plus, 
  Trash2, 
  Cpu, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  Layers, 
  Award,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_PROCESSES = [
  { pid: 1, name: 'P1 (Compiler)', arrival_time: 0, burst_time: 8, priority: 3 },
  { pid: 2, name: 'P2 (Web Server)', arrival_time: 1, burst_time: 4, priority: 1 },
  { pid: 3, name: 'P3 (DB Query)', arrival_time: 2, burst_time: 9, priority: 4 },
  { pid: 4, name: 'P4 (Terminal IO)', arrival_time: 3, burst_time: 2, priority: 2 },
  { pid: 5, name: 'P5 (Telemetry Daemon)', arrival_time: 4, burst_time: 5, priority: 2 }
];

export default function SchedulerSimulator() {
  const [algorithm, setAlgorithm] = useState('ALL');
  const [quantum, setQuantum] = useState(2);
  const [processes, setProcesses] = useState(DEFAULT_PROCESSES);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    runSimulation();
  }, []);

  const runSimulation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.simulateScheduler(algorithm, Number(quantum), processes);
      setSimResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveProcesses = async () => {
    try {
      setLoading(true);
      const data = await api.getLiveSchedulerQueue(6);
      if (data.processes && data.processes.length > 0) {
        setProcesses(data.processes);
        const res = await api.simulateScheduler(algorithm, Number(quantum), data.processes);
        setSimResult(res);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessChange = (index, field, value) => {
    const updated = [...processes];
    updated[index] = {
      ...updated[index],
      [field]: field === 'name' ? value : Number(value)
    };
    setProcesses(updated);
  };

  const addProcess = () => {
    const nextPid = processes.length > 0 ? Math.max(...processes.map(p => p.pid)) + 1 : 1;
    setProcesses([
      ...processes,
      { pid: nextPid, name: `P${nextPid}`, arrival_time: 0, burst_time: 5, priority: 2 }
    ]);
  };

  const removeProcess = (index) => {
    if (processes.length <= 1) return;
    const updated = processes.filter((_, i) => i !== index);
    setProcesses(updated);
  };

  const resetToDefault = () => {
    setProcesses(DEFAULT_PROCESSES);
    setAlgorithm('ALL');
    setQuantum(2);
  };

  const getGanttColor = (pid) => {
    if (pid === 'IDLE') return 'bg-slate-200 text-slate-600 border-slate-300';
    const colors = [
      'bg-orange-500 text-white border-orange-600',
      'bg-amber-500 text-white border-amber-600',
      'bg-indigo-600 text-white border-indigo-700',
      'bg-emerald-600 text-white border-emerald-700',
      'bg-rose-500 text-white border-rose-600',
      'bg-teal-600 text-white border-teal-700',
      'bg-cyan-600 text-white border-cyan-700',
    ];
    return colors[(Number(pid) || 0) % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="p-5 rounded-xl panel-border bg-white space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-orange-500" />
              Classical CPU Scheduling Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate turnaround time, waiting time, and CPU scheduling dynamics across classical heuristics.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <button
              onClick={loadLiveProcesses}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Import Host Workload</span>
            </button>
            <button
              onClick={resetToDefault}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={runSimulation}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold tracking-wide transition shadow-sm shadow-orange-500/25"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? 'Simulating...' : 'Execute Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Algorithm Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-slate-100 text-xs font-mono">
          {[
            { id: 'ALL', label: 'Comparative (All)' },
            { id: 'FCFS', label: 'FCFS' },
            { id: 'SJF', label: 'SJF (Non-Preempt)' },
            { id: 'SRTF', label: 'SRTF (Preempt)' },
            { id: 'RR', label: 'Round Robin' },
            { id: 'PRIORITY_NON', label: 'Priority (Non)' },
            { id: 'PRIORITY_PRE', label: 'Priority (Pre)' }
          ].map(algo => (
            <button
              key={algo.id}
              onClick={() => setAlgorithm(algo.id)}
              className={`px-2.5 py-2 rounded-lg border text-center transition ${
                algorithm === algo.id
                  ? 'bg-orange-500 border-orange-500 text-white font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-200'
              }`}
            >
              {algo.label}
            </button>
          ))}
        </div>

        {/* Quantum Input for Round Robin */}
        {(algorithm === 'RR' || algorithm === 'ALL') && (
          <div className="flex items-center space-x-3 pt-2 text-xs font-mono text-slate-700">
            <span className="font-semibold text-slate-600">Round Robin Time Quantum:</span>
            <input
              type="number"
              min="1"
              max="20"
              value={quantum}
              onChange={(e) => setQuantum(e.target.value)}
              className="w-20 bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-orange-600 font-bold focus:outline-none focus:border-orange-500"
            />
            <span className="text-slate-400 text-[11px]">(Time slice in ms allocated per process)</span>
          </div>
        )}
      </div>

      {/* Editable Process Queue */}
      <div className="p-5 rounded-xl panel-border bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900 font-mono">Process Ready Queue Definition</h3>
          </div>
          <button
            onClick={addProcess}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-mono font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Process</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">PID</th>
                <th className="py-2.5 px-3">Identifier / Name</th>
                <th className="py-2.5 px-3">Arrival Time (ms)</th>
                <th className="py-2.5 px-3">Burst Time (ms)</th>
                <th className="py-2.5 px-3">Priority (Lower = Higher)</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {processes.map((proc, index) => (
                <tr key={index} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 text-orange-600 font-bold">{proc.pid}</td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={proc.name}
                      onChange={(e) => handleProcessChange(index, 'name', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-900 w-36 sm:w-48 text-xs font-medium focus:bg-white focus:border-orange-500"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      value={proc.arrival_time}
                      onChange={(e) => handleProcessChange(index, 'arrival_time', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-900 w-20 text-xs focus:bg-white focus:border-orange-500"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="1"
                      value={proc.burst_time}
                      onChange={(e) => handleProcessChange(index, 'burst_time', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-orange-600 font-bold w-20 text-xs focus:bg-white focus:border-orange-500"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={proc.priority}
                      onChange={(e) => handleProcessChange(index, 'priority', e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-900 w-20 text-xs focus:bg-white focus:border-orange-500"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => removeProcess(index)}
                      disabled={processes.length <= 1}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 disabled:opacity-30"
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

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-medium">
          Simulation Error: {error}
        </div>
      )}

      {/* Simulation Results Section */}
      {simResult && (
        <div className="space-y-6">
          {algorithm === 'ALL' && simResult.comparison ? (
            /* Multi-Algorithm Comparative Matrix */
            <div className="space-y-6">
              <div className="p-5 rounded-xl panel-border bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                    <h3 className="text-sm font-bold text-slate-900 font-mono">
                      Comparative Performance Benchmark
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      Lowest WT: {simResult.recommendation?.lowest_waiting_time}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-semibold">
                      Lowest TAT: {simResult.recommendation?.lowest_turnaround_time}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Algorithm</th>
                        <th className="py-3 px-4">Avg Waiting Time (WT)</th>
                        <th className="py-3 px-4">Avg Turnaround Time (TAT)</th>
                        <th className="py-3 px-4">CPU Utilization</th>
                        <th className="py-3 px-4">Throughput</th>
                        <th className="py-3 px-4">Total Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {simResult.comparison.map((item, idx) => {
                        const isBestWT = item.algorithm === simResult.recommendation?.lowest_waiting_time;
                        const isBestTAT = item.algorithm === simResult.recommendation?.lowest_turnaround_time;
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <span>{item.algorithm}</span>
                              {isBestWT && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                                  BEST WT
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-4 font-bold ${isBestWT ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {item.avg_waiting_time} ms
                            </td>
                            <td className={`py-3 px-4 font-bold ${isBestTAT ? 'text-orange-600' : 'text-slate-800'}`}>
                              {item.avg_turnaround_time} ms
                            </td>
                            <td className="py-3 px-4 font-medium">{item.cpu_utilization}%</td>
                            <td className="py-3 px-4 font-medium">{item.throughput} /ms</td>
                            <td className="py-3 px-4 text-slate-500">{item.total_execution_time} ms</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Render Selected Gantt Charts from the Comparison */}
              {['FCFS', 'SJF', 'SRTF', 'RR'].map(key => {
                const run = simResult.runs[key];
                if (!run) return null;
                return (
                  <div key={key} className="p-5 rounded-xl panel-border bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 font-mono">{run.algorithm}</span>
                      <span className="text-xs text-slate-500 font-mono font-medium">
                        Avg WT: {run.metrics.avg_waiting_time}ms | Avg TAT: {run.metrics.avg_turnaround_time}ms
                      </span>
                    </div>
                    {/* Gantt Bars */}
                    <div className="space-y-1">
                      <div className="flex w-full rounded-lg overflow-hidden border border-slate-200 h-10 font-mono text-xs shadow-xs">
                        {run.gantt.map((block, bIdx) => {
                          const duration = block.end - block.start;
                          const total = run.metrics.total_execution_time || 1;
                          const pct = (duration / total) * 100;
                          return (
                            <div
                              key={bIdx}
                              className={`flex flex-col items-center justify-center border-r border-white/20 p-1 text-center transition-all ${getGanttColor(block.pid)}`}
                              style={{ width: `${Math.max(pct, 5)}%` }}
                              title={`${block.name}: ${block.start}ms -> ${block.end}ms (${duration}ms)`}
                            >
                              <span className="font-bold truncate">{block.name}</span>
                              <span className="text-[10px] opacity-90">{block.start}-{block.end}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Single Algorithm Detailed Execution View */
            <div className="space-y-6">
              {/* Metrics Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl panel-border bg-white">
                  <span className="text-xs text-slate-500 uppercase font-mono font-bold">Avg Waiting Time</span>
                  <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                    {simResult.metrics?.avg_waiting_time} <span className="text-sm text-slate-400">ms</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl panel-border bg-white">
                  <span className="text-xs text-slate-500 uppercase font-mono font-bold">Avg Turnaround</span>
                  <div className="text-2xl font-bold font-mono text-orange-600 mt-1">
                    {simResult.metrics?.avg_turnaround_time} <span className="text-sm text-slate-400">ms</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl panel-border bg-white">
                  <span className="text-xs text-slate-500 uppercase font-mono font-bold">CPU Utilization</span>
                  <div className="text-2xl font-bold font-mono text-slate-800 mt-1">
                    {simResult.metrics?.cpu_utilization} <span className="text-sm text-slate-400">%</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl panel-border bg-white">
                  <span className="text-xs text-slate-500 uppercase font-mono font-bold">Throughput</span>
                  <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
                    {simResult.metrics?.throughput} <span className="text-sm text-slate-400">/ms</span>
                  </div>
                </div>
              </div>

              {/* Gantt Chart Timeline */}
              <div className="p-5 rounded-xl panel-border bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 font-mono">Execution Gantt Chart Timeline</h3>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    Total Time: {simResult.metrics?.total_execution_time}ms
                  </span>
                </div>

                <div className="flex w-full rounded-lg overflow-hidden border border-slate-200 h-12 font-mono text-xs shadow-xs">
                  {simResult.gantt?.map((block, idx) => {
                    const duration = block.end - block.start;
                    const total = simResult.metrics?.total_execution_time || 1;
                    const pct = (duration / total) * 100;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col items-center justify-center border-r border-white/20 p-1 text-center transition-all ${getGanttColor(block.pid)}`}
                        style={{ width: `${Math.max(pct, 5)}%` }}
                        title={`${block.name}: ${block.start}ms -> ${block.end}ms (${duration}ms)`}
                      >
                        <span className="font-bold truncate">{block.name}</span>
                        <span className="text-[10px] opacity-90">{block.start} - {block.end}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per-Process Metrics Table */}
              <div className="p-5 rounded-xl panel-border bg-white space-y-3">
                <h3 className="text-sm font-bold text-slate-900 font-mono">Process Completion Calculations</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">PID</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Arrival</th>
                        <th className="py-2.5 px-3">Burst</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Completion (CT)</th>
                        <th className="py-2.5 px-3 text-orange-600">Turnaround (TAT)</th>
                        <th className="py-2.5 px-3 text-emerald-600">Waiting (WT)</th>
                        <th className="py-2.5 px-3 text-slate-700">Response (RT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {simResult.results?.map((p) => (
                        <tr key={p.pid} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-orange-600 font-bold">{p.pid}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                          <td className="py-2.5 px-3">{p.arrival_time}ms</td>
                          <td className="py-2.5 px-3 font-bold text-orange-600">{p.burst_time}ms</td>
                          <td className="py-2.5 px-3">{p.priority}</td>
                          <td className="py-2.5 px-3 font-medium">{p.completion_time}ms</td>
                          <td className="py-2.5 px-3 text-orange-600 font-bold">{p.turnaround_time}ms</td>
                          <td className="py-2.5 px-3 text-emerald-600 font-bold">{p.waiting_time}ms</td>
                          <td className="py-2.5 px-3 font-medium">{p.response_time}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Event Log */}
              {simResult.events && simResult.events.length > 0 && (
                <div className="p-5 rounded-xl panel-border bg-white space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 font-mono">Kernel Scheduler Dispatch Log</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-600">
                    {simResult.events.map((ev, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <ChevronRight className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
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
  );
}
