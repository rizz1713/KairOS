import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Download,
  Plus,
  Trash2,
  Cpu,
  BarChart3,
  Layers,
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
    if (pid === 'IDLE') return 'bg-[#132035] text-[#7a9ab8] border-[#1d3352]';
    const colors = [
      'bg-[#00d4ff]/25 text-[#00d4ff] border-[#00d4ff]/40',
      'bg-[#00ff88]/25 text-[#00ff88] border-[#00ff88]/40',
      'bg-[#c084fc]/25 text-[#c084fc] border-[#c084fc]/40',
      'bg-[#ffaa00]/25 text-[#ffaa00] border-[#ffaa00]/40',
      'bg-[#ff4466]/25 text-[#ff4466] border-[#ff4466]/40',
    ];
    return colors[(Number(pid) || 0) % colors.length];
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Configuration Header */}
      <div className="p-5 rounded-xl panel-border bg-[#0b1120] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#e2eaf5] flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#00d4ff]" />
              Classical CPU Scheduling Engine
            </h2>
            <p className="text-xs text-[#4a6a8a] mt-0.5">

            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={loadLiveProcesses}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#070e1c] hover:bg-[#132035] text-[#7a9ab8] hover:text-[#e2eaf5] border border-[#132035] font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Import Host Workload</span>
            </button>
            <button
              onClick={resetToDefault}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-[#070e1c] hover:bg-[#132035] text-[#7a9ab8] border border-[#132035] font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={runSimulation}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#00d4ff]/15 hover:bg-[#00d4ff]/25 text-[#00d4ff] border border-[#00d4ff]/40 font-semibold transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? 'Simulating...' : 'Execute Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Algorithm Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-[#132035] text-xs">
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
              className={`px-2.5 py-2 rounded-lg border text-center transition ${algorithm === algo.id
                ? 'bg-[#00d4ff]/15 border-[#00d4ff]/40 text-[#00d4ff] font-bold shadow-xs'
                : 'bg-[#070e1c] border-[#132035] text-[#7a9ab8] hover:bg-[#132035] hover:text-[#e2eaf5]'
                }`}
            >
              {algo.label}
            </button>
          ))}
        </div>

        {/* Quantum Input for RR */}
        {['ALL', 'RR'].includes(algorithm) && (
          <div className="flex items-center space-x-3 pt-2 text-xs text-[#9ab8d4]">
            <span className="font-semibold text-[#7a9ab8]">Round Robin Time Quantum:</span>
            <input
              type="number"
              min="1"
              max="20"
              value={quantum}
              onChange={(e) => setQuantum(e.target.value)}
              className="w-20 bg-[#070e1c] border border-[#132035] rounded px-2.5 py-1 text-[#00d4ff] font-bold focus:outline-none focus:border-[#00d4ff]"
            />
            <span className="text-[#4a6a8a] text-[11px]">(Time slice in ms allocated per process)</span>
          </div>
        )}
      </div>

      {/* Editable Process Queue */}
      <div className="p-5 rounded-xl panel-border bg-[#0b1120] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#00d4ff]" />
            <h3 className="text-xs font-bold text-[#e2eaf5] uppercase tracking-wider">Process Ready Queue Definition</h3>
          </div>
          <button
            onClick={addProcess}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Process</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e1c] text-[#7a9ab8] uppercase text-[10px] font-bold border-b border-[#132035]">
              <tr>
                <th className="py-2.5 px-3">PID</th>
                <th className="py-2.5 px-3">Identifier / Name</th>
                <th className="py-2.5 px-3">Arrival Time (ms)</th>
                <th className="py-2.5 px-3">Burst Time (ms)</th>
                <th className="py-2.5 px-3">Priority (Lower = Higher)</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#132035] text-[#c8d8e8]">
              {processes.map((proc, index) => (
                <tr key={index} className="hover:bg-[#070e1c]/60">
                  <td className="py-2.5 px-3 text-[#00d4ff] font-bold">{proc.pid}</td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={proc.name}
                      onChange={(e) => handleProcessChange(index, 'name', e.target.value)}
                      className="bg-[#070e1c] border border-[#132035] rounded px-2.5 py-1 text-[#e2eaf5] w-36 sm:w-48 text-xs font-medium focus:border-[#00d4ff] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      value={proc.arrival_time}
                      onChange={(e) => handleProcessChange(index, 'arrival_time', e.target.value)}
                      className="bg-[#070e1c] border border-[#132035] rounded px-2.5 py-1 text-[#e2eaf5] w-20 text-xs focus:border-[#00d4ff] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="1"
                      value={proc.burst_time}
                      onChange={(e) => handleProcessChange(index, 'burst_time', e.target.value)}
                      className="bg-[#070e1c] border border-[#132035] rounded px-2.5 py-1 text-[#00ff88] font-bold w-20 text-xs focus:border-[#00d4ff] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={proc.priority}
                      onChange={(e) => handleProcessChange(index, 'priority', e.target.value)}
                      className="bg-[#070e1c] border border-[#132035] rounded px-2.5 py-1 text-[#e2eaf5] w-20 text-xs focus:border-[#00d4ff] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => removeProcess(index)}
                      disabled={processes.length <= 1}
                      className="p-1 rounded text-[#4a6a8a] hover:text-[#ff4466] disabled:opacity-30 transition"
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
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-medium">
          Simulation Error: {error}
        </div>
      )}

      {/* Simulation Results Section */}
      {simResult && (
        <div className="space-y-6">
          {algorithm === 'ALL' && simResult.comparison ? (
            /* Multi-Algorithm Comparative Matrix */
            <div className="space-y-6">
              <div className="p-5 rounded-xl panel-border bg-[#0b1120] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-[#00d4ff]" />
                    <h3 className="text-xs font-bold text-[#e2eaf5] uppercase tracking-wider">
                      Comparative Performance Benchmark
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950/40 text-[#00ff88] border border-emerald-500/30 font-semibold text-[10px]">
                      Lowest WT: {simResult.recommendation?.lowest_waiting_time}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-cyan-950/40 text-[#00d4ff] border border-cyan-500/30 font-semibold text-[10px]">
                      Lowest TAT: {simResult.recommendation?.lowest_turnaround_time}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#070e1c] text-[#7a9ab8] uppercase text-[10px] font-bold border-b border-[#132035]">
                      <tr>
                        <th className="py-3 px-4">Algorithm</th>
                        <th className="py-3 px-4">Avg Waiting Time (WT)</th>
                        <th className="py-3 px-4">Avg Turnaround Time (TAT)</th>
                        <th className="py-3 px-4">CPU Utilization</th>
                        <th className="py-3 px-4">Throughput</th>
                        <th className="py-3 px-4">Total Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#132035] text-[#9ab8d4]">
                      {simResult.comparison.map((item, idx) => {
                        const isBestWT = item.algorithm === simResult.recommendation?.lowest_waiting_time;
                        const isBestTAT = item.algorithm === simResult.recommendation?.lowest_turnaround_time;
                        return (
                          <tr key={idx} className="hover:bg-[#070e1c]">
                            <td className="py-3 px-4 font-bold text-[#e2eaf5] flex items-center gap-2">
                              <span>{item.algorithm}</span>
                              {isBestWT && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/50 text-[#00ff88] font-bold border border-emerald-500/40">
                                  BEST WT
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-4 font-bold ${isBestWT ? 'text-[#00ff88]' : 'text-[#c8d8e8]'}`}>
                              {item.avg_waiting_time} ms
                            </td>
                            <td className={`py-3 px-4 font-bold ${isBestTAT ? 'text-[#00d4ff]' : 'text-[#c8d8e8]'}`}>
                              {item.avg_turnaround_time} ms
                            </td>
                            <td className="py-3 px-4 font-medium">{item.cpu_utilization}%</td>
                            <td className="py-3 px-4 font-medium">{item.throughput} /ms</td>
                            <td className="py-3 px-4 text-[#4a6a8a]">{item.total_execution_time} ms</td>
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
                  <div key={key} className="p-5 rounded-xl panel-border bg-[#0b1120] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#e2eaf5] uppercase">{run.algorithm}</span>
                      <span className="text-[11px] text-[#4a6a8a] font-medium">
                        Avg WT: {run.metrics.avg_waiting_time}ms | Avg TAT: {run.metrics.avg_turnaround_time}ms
                      </span>
                    </div>
                    {/* Gantt Bars */}
                    <div className="space-y-1">
                      <div className="flex w-full rounded-lg overflow-hidden border border-[#132035] h-10 text-xs shadow-xs">
                        {run.gantt.map((block, bIdx) => {
                          const duration = block.end - block.start;
                          const total = run.metrics.total_execution_time || 1;
                          const pct = (duration / total) * 100;
                          return (
                            <div
                              key={bIdx}
                              className={`flex flex-col items-center justify-center border-r border-[#132035] p-1 text-center transition-all ${getGanttColor(block.pid)}`}
                              style={{ width: `${Math.max(pct, 5)}%` }}
                              title={`${block.name}: ${block.start}ms -> ${block.end}ms (${duration}ms)`}
                            >
                              <span className="font-bold truncate text-[11px]">{block.name}</span>
                              <span className="text-[9px] opacity-80">{block.start}-{block.end}</span>
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
                <div className="p-4 rounded-xl panel-border bg-[#0b1120]">
                  <span className="text-[10px] text-[#4a6a8a] uppercase font-bold">Avg Waiting Time</span>
                  <div className="text-2xl font-bold text-[#00ff88] mt-1">
                    {simResult.metrics?.avg_waiting_time} <span className="text-xs text-[#4a6a8a]">ms</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl panel-border bg-[#0b1120]">
                  <span className="text-[10px] text-[#4a6a8a] uppercase font-bold">Avg Turnaround</span>
                  <div className="text-2xl font-bold text-[#00d4ff] mt-1">
                    {simResult.metrics?.avg_turnaround_time} <span className="text-xs text-[#4a6a8a]">ms</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl panel-border bg-[#0b1120]">
                  <span className="text-[10px] text-[#4a6a8a] uppercase font-bold">CPU Utilization</span>
                  <div className="text-2xl font-bold text-[#e2eaf5] mt-1">
                    {simResult.metrics?.cpu_utilization} <span className="text-xs text-[#4a6a8a]">%</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl panel-border bg-[#0b1120]">
                  <span className="text-[10px] text-[#4a6a8a] uppercase font-bold">Throughput</span>
                  <div className="text-2xl font-bold text-[#ffaa00] mt-1">
                    {simResult.metrics?.throughput} <span className="text-xs text-[#4a6a8a]">/ms</span>
                  </div>
                </div>
              </div>

              {/* Gantt Chart Timeline */}
              <div className="p-5 rounded-xl panel-border bg-[#0b1120] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#e2eaf5] uppercase">Execution Gantt Chart Timeline</h3>
                  <span className="text-[11px] text-[#4a6a8a] font-medium">
                    Total Time: {simResult.metrics?.total_execution_time}ms
                  </span>
                </div>

                <div className="flex w-full rounded-lg overflow-hidden border border-[#132035] h-12 text-xs shadow-xs">
                  {simResult.gantt?.map((block, idx) => {
                    const duration = block.end - block.start;
                    const total = simResult.metrics?.total_execution_time || 1;
                    const pct = (duration / total) * 100;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col items-center justify-center border-r border-[#132035] p-1 text-center transition-all ${getGanttColor(block.pid)}`}
                        style={{ width: `${Math.max(pct, 5)}%` }}
                        title={`${block.name}: ${block.start}ms -> ${block.end}ms (${duration}ms)`}
                      >
                        <span className="font-bold truncate text-[11px]">{block.name}</span>
                        <span className="text-[9px] opacity-80">{block.start} - {block.end}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per-Process Metrics Table */}
              <div className="p-5 rounded-xl panel-border bg-[#0b1120] space-y-3">
                <h3 className="text-xs font-bold text-[#e2eaf5] uppercase">Process Completion Calculations</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#070e1c] text-[#7a9ab8] uppercase text-[10px] font-bold border-b border-[#132035]">
                      <tr>
                        <th className="py-2.5 px-3">PID</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Arrival</th>
                        <th className="py-2.5 px-3">Burst</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Completion (CT)</th>
                        <th className="py-2.5 px-3 text-[#00d4ff]">Turnaround (TAT)</th>
                        <th className="py-2.5 px-3 text-[#00ff88]">Waiting (WT)</th>
                        <th className="py-2.5 px-3 text-[#7a9ab8]">Response (RT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#132035] text-[#c8d8e8]">
                      {simResult.results?.map((p) => (
                        <tr key={p.pid} className="hover:bg-[#070e1c]">
                          <td className="py-2.5 px-3 text-[#00d4ff] font-bold">{p.pid}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#e2eaf5]">{p.name}</td>
                          <td className="py-2.5 px-3">{p.arrival_time}ms</td>
                          <td className="py-2.5 px-3 font-bold text-[#00ff88]">{p.burst_time}ms</td>
                          <td className="py-2.5 px-3">{p.priority}</td>
                          <td className="py-2.5 px-3 font-medium">{p.completion_time}ms</td>
                          <td className="py-2.5 px-3 text-[#00d4ff] font-bold">{p.turnaround_time}ms</td>
                          <td className="py-2.5 px-3 text-[#00ff88] font-bold">{p.waiting_time}ms</td>
                          <td className="py-2.5 px-3 font-medium text-[#7a9ab8]">{p.response_time}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Event Log */}
              {simResult.events && simResult.events.length > 0 && (
                <div className="p-5 rounded-xl panel-border bg-[#0b1120] space-y-2">
                  <h3 className="text-xs font-bold text-[#e2eaf5] uppercase">Kernel Scheduler Dispatch Log</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-[#070e1c] p-3 rounded-lg border border-[#132035] text-[11px] text-[#7a9ab8]">
                    {simResult.events.map((ev, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <ChevronRight className="w-3 h-3 text-[#00d4ff] mt-0.5 flex-shrink-0" />
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
