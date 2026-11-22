import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, Zap, Clock } from 'lucide-react';

const ALGOS = ['FCFS', 'SJF', 'SRTF', 'RR', 'PRIORITY_NON', 'PRIORITY_PRE'];

const ALGO_COLORS = {
  FCFS:         { bg: '#0891b2', light: '#ecfeff', text: '#0e7490' },
  SJF:          { bg: '#7c3aed', light: '#f5f3ff', text: '#6d28d9' },
  SRTF:         { bg: '#059669', light: '#ecfdf5', text: '#065f46' },
  RR:           { bg: '#d97706', light: '#fffbeb', text: '#92400e' },
  PRIORITY_NON: { bg: '#dc2626', light: '#fff1f2', text: '#9f1239' },
  PRIORITY_PRE: { bg: '#2563eb', light: '#eff6ff', text: '#1e3a8a' },
};

const ALGO_LABELS = {
  FCFS:         'FCFS',
  SJF:          'SJF',
  SRTF:         'SRTF (Preemptive)',
  RR:           'Round Robin',
  PRIORITY_NON: 'Priority (Non-Pre)',
  PRIORITY_PRE: 'Priority (Pre)',
};

// Build a frame-by-frame tick array from gantt blocks
// Returns: array of { time, activeProc, completedPids }
function buildTimeline(gantt, results, totalTime) {
  const timeline = [];
  const completedPids = new Set();
  // map completion_time -> pid
  const completionMap = {};
  if (results) results.forEach(r => { completionMap[r.completion_time] = r.pid; });

  for (let t = 0; t <= totalTime; t++) {
    // find which block is active at time t
    const block = gantt.find(b => b.start <= t && t < b.end);
    // any process that completed at or before t
    if (results) results.forEach(r => { if (r.completion_time <= t) completedPids.add(r.pid); });
    timeline.push({
      time: t,
      activePid: block ? block.pid : null,
      activeName: block ? block.name : 'IDLE',
      completedCount: completedPids.size,
    });
  }
  return timeline;
}

export default function AlgorithmRace({ simResult, processes, quantum }) {
  const [racing, setRacing]       = useState(false);
  const [finished, setFinished]   = useState(false);
  const [tick, setTick]           = useState(0);
  const [speed, setSpeed]         = useState(120); // ms per tick
  const intervalRef               = useRef(null);

  // Build timelines for all algorithms from simResult.runs
  const runs = simResult?.runs || {};
  const timelines = {};
  let maxTime = 0;
  ALGOS.forEach(key => {
    const run = runs[key];
    if (run) {
      const total = run.metrics?.total_execution_time || 1;
      if (total > maxTime) maxTime = total;
      timelines[key] = buildTimeline(run.gantt, run.results, total);
    }
  });

  // Rankings at current tick — sorted by completedCount desc, then by which finished first
  const getRankings = (t) => {
    return ALGOS
      .filter(k => timelines[k])
      .map(k => {
        const tl = timelines[k];
        const frame = tl[Math.min(t, tl.length - 1)];
        const run = runs[k];
        const totalTime = run?.metrics?.total_execution_time || 1;
        const progress = Math.min((t / totalTime) * 100, 100);
        return {
          key: k,
          label: ALGO_LABELS[k],
          color: ALGO_COLORS[k],
          progress,
          done: t >= totalTime,
          finishTime: totalTime,
          activeName: frame?.activeName || 'IDLE',
          completedCount: frame?.completedCount || 0,
          avgWT: run?.metrics?.avg_waiting_time,
          avgTAT: run?.metrics?.avg_turnaround_time,
        };
      })
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? -1 : 1;
        if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
        return a.finishTime - b.finishTime;
      });
  };

  const start = () => {
    if (racing) return;
    setTick(0);
    setFinished(false);
    setRacing(true);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRacing(false);
    setFinished(false);
    setTick(0);
  };

  useEffect(() => {
    if (!racing) return;
    intervalRef.current = setInterval(() => {
      setTick(prev => {
        const next = prev + 1;
        if (next > maxTime) {
          clearInterval(intervalRef.current);
          setRacing(false);
          setFinished(true);
          return prev;
        }
        return next;
      });
    }, speed);
    return () => clearInterval(intervalRef.current);
  }, [racing, speed, maxTime]);

  if (!simResult?.runs || Object.keys(simResult.runs).length === 0) {
    return (
      <div className="card p-8 text-center text-slate-400 text-sm">
        Run <span className="font-bold text-cyan-600">Compare All</span> first to unlock the Race Visualizer.
      </div>
    );
  }

  const rankings = getRankings(tick);
  const winner = finished ? rankings[0] : null;

  return (
    <div className="space-y-5">
      {/* Header controls */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-500" /> Algorithm Race Visualizer
            </h2>
            <p className="section-subtitle">Watch all 6 algorithms race in real time — see which finishes your workload first.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs mono text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Speed:</span>
              <select value={speed} onChange={e => setSpeed(Number(e.target.value))}
                className="input-base text-xs py-1 w-24">
                <option value={200}>Slow</option>
                <option value={120}>Normal</option>
                <option value={50}>Fast</option>
                <option value={16}>Turbo</option>
              </select>
            </div>
            <button onClick={reset} className="btn btn-ghost"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            <button
              onClick={start}
              disabled={racing}
              className="btn btn-primary"
              style={{ minWidth: 110 }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {racing ? `t = ${tick}ms` : finished ? 'Race Again' : 'Start Race'}
            </button>
          </div>
        </div>

        {/* Time progress */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex justify-between text-[11px] mono text-slate-400 mb-1">
            <span>Simulation Clock</span>
            <span>{tick}ms / {maxTime}ms</span>
          </div>
          <div className="progress-track" style={{ height: 6 }}>
            <div className="progress-fill" style={{
              width: `${(tick / maxTime) * 100}%`,
              background: 'linear-gradient(90deg, #0891b2, #06b6d4)',
              transition: 'width 0.1s linear',
            }} />
          </div>
        </div>
      </div>

      {/* Winner banner */}
      {winner && (
        <div className="rounded-xl border-2 p-4 flex items-center gap-4 fade-up"
          style={{ borderColor: winner.color.bg, background: winner.color.light }}>
          <Trophy className="w-8 h-8 flex-shrink-0" style={{ color: winner.color.bg }} />
          <div>
            <div className="text-xs font-bold mono uppercase" style={{ color: winner.color.text }}>🏆 Winner — Fastest Completion</div>
            <div className="text-xl font-extrabold mono" style={{ color: winner.color.bg }}>{winner.label}</div>
            <div className="text-xs text-slate-500 mono">
              Finished at {winner.finishTime}ms · Avg WT: {winner.avgWT}ms · Avg TAT: {winner.avgTAT}ms
            </div>
          </div>
        </div>
      )}

      {/* Race bars */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="section-title">Live Race Progress</h3>
          {racing && <span className="badge badge-cyan animate-pulse">RACING</span>}
          {finished && <span className="badge badge-emerald">FINISHED</span>}
        </div>

        <div className="space-y-3">
          {rankings.map((algo, rank) => (
            <div key={algo.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 mono font-bold" style={{ color: algo.color.bg }}>
                  {/* Rank medal */}
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                    style={{ background: rank === 0 ? '#f59e0b' : rank === 1 ? '#94a3b8' : rank === 2 ? '#b45309' : '#e2e8f0', color: rank < 3 ? '#fff' : '#64748b' }}>
                    {rank + 1}
                  </span>
                  {algo.label}
                  {algo.done && <span className="badge badge-emerald text-[10px] py-0">DONE</span>}
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  {!algo.done && racing && (
                    <span className="text-[11px]">
                      ▶ <span style={{ color: algo.color.bg }}>{algo.activeName}</span>
                    </span>
                  )}
                  <span className="font-semibold">{algo.progress.toFixed(0)}%</span>
                  <span>WT: {algo.avgWT}ms</span>
                </div>
              </div>

              {/* Race bar */}
              <div className="w-full rounded-full overflow-hidden" style={{ height: 20, background: '#f1f5f9', position: 'relative' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${algo.progress}%`,
                    background: `linear-gradient(90deg, ${algo.color.bg}cc, ${algo.color.bg})`,
                    borderRadius: 99,
                    transition: `width ${speed < 60 ? 0.03 : 0.1}s linear`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: 6,
                  }}
                >
                  {algo.progress > 12 && (
                    <span style={{ color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {algo.completedCount}/{processes.length} done
                    </span>
                  )}
                </div>
                {/* Finish line */}
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, background: '#94a3b8', opacity: 0.4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats table after race */}
      {finished && (
        <div className="card p-5 space-y-3 fade-up">
          <h3 className="section-title">Final Standings</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Algorithm</th>
                  <th>Finish Time</th>
                  <th>Avg Waiting</th>
                  <th>Avg Turnaround</th>
                  <th>CPU Util</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((algo, rank) => {
                  const run = runs[algo.key];
                  return (
                    <tr key={algo.key}>
                      <td>
                        <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-black text-white"
                          style={{ background: rank === 0 ? '#f59e0b' : rank === 1 ? '#94a3b8' : rank === 2 ? '#b45309' : '#e2e8f0', color: rank < 3 ? '#fff' : '#64748b' }}>
                          {rank + 1}
                        </span>
                      </td>
                      <td className="font-bold mono" style={{ color: algo.color.bg }}>{algo.label}</td>
                      <td className="mono font-bold">{algo.finishTime}ms</td>
                      <td className="mono font-bold text-emerald-600">{algo.avgWT}ms</td>
                      <td className="mono font-bold text-cyan-600">{algo.avgTAT}ms</td>
                      <td className="mono">{run?.metrics?.cpu_utilization}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
