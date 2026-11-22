import React, { useState, useEffect } from 'react';
import { HardDrive, Play, RotateCcw, Plus, Trash2, Trophy } from 'lucide-react';
import { api } from '../services/api';

const ALGO_OPTIONS = [
  { id: 'ALL',       label: 'Compare All' },
  { id: 'FIRST_FIT', label: 'First Fit'   },
  { id: 'BEST_FIT',  label: 'Best Fit'    },
  { id: 'WORST_FIT', label: 'Worst Fit'   },
];

const ALGO_COLORS = {
  FIRST_FIT: { bg: '#0891b2', light: '#ecfeff', text: '#0e7490' },
  BEST_FIT:  { bg: '#7c3aed', light: '#f5f3ff', text: '#6d28d9' },
  WORST_FIT: { bg: '#dc2626', light: '#fff1f2', text: '#9f1239' },
};

const PROCESS_COLORS = [
  '#0891b2','#7c3aed','#059669','#d97706','#dc2626','#2563eb','#db2777','#0d9488',
];

function MemoryMap({ partitions, totalMemory, label, color }) {
  if (!partitions) return null;
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-bold mono uppercase" style={{ color: color?.text || '#64748b' }}>{label}</div>
      <div className="relative w-full h-10 rounded-lg overflow-hidden border border-slate-200 flex">
        {partitions.map((p, i) => {
          const pct = (p.size / totalMemory) * 100;
          const isAlloc = !!p.allocated;
          const pidColor = isAlloc ? PROCESS_COLORS[(p.block_id - 1) % PROCESS_COLORS.length] : '#e2e8f0';
          return (
            <div
              key={i}
              title={isAlloc
                ? `Partition ${p.id}: ${p.size}KB — Block P${p.block_id} (${p.size - (p.wasted||0)}KB used, ${p.wasted||0}KB wasted)`
                : `Partition ${p.id}: ${p.size}KB — FREE`}
              style={{
                width: `${pct}%`, background: pidColor,
                borderRight: '1px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
                transition: 'opacity 0.2s',
                opacity: isAlloc ? 1 : 0.35,
              }}
            >
              {pct > 6 && (
                <span style={{ fontSize: 9, fontWeight: 700, color: isAlloc ? '#fff' : '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {isAlloc ? `P${p.block_id}` : 'FREE'}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* Size ruler */}
      <div className="flex justify-between text-[9px] mono text-slate-400">
        <span>0 KB</span><span>{totalMemory} KB</span>
      </div>
    </div>
  );
}

export default function MemorySimulator() {
  const [algorithm, setAlgorithm] = useState('ALL');
  const [totalMemory, setTotalMemory] = useState(1024);
  const [blocks, setBlocks] = useState([
    { id:1, size:150 }, { id:2, size:80 }, { id:3, size:300 },
    { id:4, size:60  }, { id:5, size:200 },
  ]);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [presets, setPresets] = useState(null);

  useEffect(() => {
    api.getMemoryPresets().then(setPresets).catch(console.error);
    runSim();
  }, []);

  const runSim = async () => {
    try {
      setLoading(true); setError(null);
      setResult(await api.simulateMemoryAllocation(totalMemory, blocks, algorithm));
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const applyPreset = (p) => {
    setTotalMemory(p.total_memory);
    setBlocks(p.blocks);
    setResult(null);
  };

  const addBlock = () => {
    const n = blocks.length ? Math.max(...blocks.map(b => b.id)) + 1 : 1;
    setBlocks([...blocks, { id: n, size: 50 }]);
  };

  const removeBlock = (i) => blocks.length > 1 && setBlocks(blocks.filter((_, x) => x !== i));
  const changeBlock = (i, field, val) => { const u=[...blocks]; u[i]={...u[i],[field]:Number(val)}; setBlocks(u); };

  const renderAllocationTable = (allocations, algoLabel) => (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr><th>Block</th><th>Size (KB)</th><th>Partition</th><th>Partition Size</th><th>Wasted (KB)</th><th>Status</th></tr>
        </thead>
        <tbody>
          {allocations.map((a, i) => (
            <tr key={i}>
              <td><span className="font-bold mono" style={{ color: PROCESS_COLORS[(a.block_id-1)%PROCESS_COLORS.length] }}>P{a.block_id}</span></td>
              <td className="mono font-semibold">{a.block_size} KB</td>
              <td className="mono">{a.partition_id ?? '—'}</td>
              <td className="mono">{a.partition_size ?? '—'} {a.partition_size ? 'KB' : ''}</td>
              <td className={`mono font-bold ${a.wasted > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{a.wasted ?? 0} KB</td>
              <td>
                <span className={`badge ${a.status === 'ALLOCATED' ? 'badge-cyan' : 'badge-rose'}`}>{a.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-500" /> Memory Allocation Simulator
            </h2>
            <p className="section-subtitle">Simulate First Fit, Best Fit and Worst Fit contiguous memory allocation with fragmentation analysis.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={runSim} disabled={loading} className="btn btn-primary">
              <Play className="w-3.5 h-3.5 fill-current" />{loading ? 'Allocating…' : 'Run Allocation'}
            </button>
          </div>
        </div>

        {/* Algorithm selector */}
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
          {ALGO_OPTIONS.map(a => (
            <button key={a.id} onClick={() => setAlgorithm(a.id)}
              className={`btn text-[11px] py-1.5 px-3 ${algorithm === a.id ? 'btn-primary' : 'btn-ghost'}`}>
              {a.label}
            </button>
          ))}
        </div>

        {/* Presets */}
        {presets && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 mono">Presets:</span>
            {Object.values(presets).map(p => (
              <button key={p.label} onClick={() => applyPreset(p)} className="btn btn-ghost text-[11px] py-1.5">{p.label}</button>
            ))}
          </div>
        )}

        {/* Total memory */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs mono text-slate-600">
          <span className="font-semibold">Total Memory:</span>
          <input type="number" min="128" max="4096" step="64" value={totalMemory}
            onChange={e => setTotalMemory(Number(e.target.value))}
            className="input-base w-24 text-center mono text-cyan-700 font-bold" />
          <span className="text-slate-400">KB</span>
        </div>
      </div>

      {/* Process blocks */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Process Memory Requests</h3>
          <button onClick={addBlock} className="btn btn-secondary text-[11px] py-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Process
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Process</th><th>Memory Required (KB)</th><th className="text-right">Remove</th></tr></thead>
            <tbody>
              {blocks.map((b, i) => (
                <tr key={i}>
                  <td><span className="font-bold mono" style={{ color: PROCESS_COLORS[(b.id-1)%PROCESS_COLORS.length] }}>P{b.id}</span></td>
                  <td>
                    <input type="number" min="1" max="1024" value={b.size}
                      onChange={e => changeBlock(i, 'size', e.target.value)}
                      className="input-base w-28 text-center mono text-cyan-700 font-bold" />
                  </td>
                  <td className="text-right">
                    <button onClick={() => removeBlock(i)} disabled={blocks.length <= 1}
                      className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {result.algorithm === 'ALL' ? (
            <>
              {/* Best algorithm banner */}
              <div className="rounded-xl border-2 p-4 flex items-center gap-4"
                style={{ borderColor: ALGO_COLORS[result.best]?.bg, background: ALGO_COLORS[result.best]?.light }}>
                <Trophy className="w-7 h-7 flex-shrink-0" style={{ color: ALGO_COLORS[result.best]?.bg }} />
                <div>
                  <div className="text-xs font-bold mono uppercase" style={{ color: ALGO_COLORS[result.best]?.text }}>
                    Best Algorithm — Lowest Fragmentation
                  </div>
                  <div className="text-xl font-extrabold mono" style={{ color: ALGO_COLORS[result.best]?.bg }}>
                    {result.best.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Side-by-side memory maps */}
              <div className="card p-5 space-y-5">
                <h3 className="section-title">Memory Layout Comparison</h3>
                {Object.entries(result.results).map(([algo, r]) => (
                  <div key={algo} className="space-y-2 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold mono" style={{ color: ALGO_COLORS[algo]?.bg }}>{algo.replace('_', ' ')}</span>
                      <div className="flex gap-3 text-[11px] mono text-slate-500">
                        <span>Allocated: <strong className="text-slate-800">{r.allocated_count}/{r.total_blocks}</strong></span>
                        <span>Fragmentation: <strong className="text-amber-600">{r.total_fragmentation_kb} KB</strong></span>
                        <span>Efficiency: <strong className="text-cyan-600">{r.memory_efficiency}%</strong></span>
                      </div>
                    </div>
                    <MemoryMap partitions={r.partitions} totalMemory={totalMemory} color={ALGO_COLORS[algo]} />
                  </div>
                ))}
              </div>

              {/* Comparison stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(result.results).map(([algo, r]) => (
                  <div key={algo} className="card p-4 space-y-3" style={{ borderTop: `3px solid ${ALGO_COLORS[algo]?.bg}` }}>
                    <div className="text-xs font-bold mono" style={{ color: ALGO_COLORS[algo]?.bg }}>{algo.replace('_', ' ')}</div>
                    <div className="space-y-1 text-xs mono">
                      <div className="flex justify-between"><span className="text-slate-500">Allocated</span><span className="font-bold">{r.allocated_count}/{r.total_blocks}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Fragmentation</span><span className="font-bold text-amber-600">{r.total_fragmentation_kb} KB</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Efficiency</span><span className="font-bold text-cyan-600">{r.memory_efficiency}%</span></div>
                    </div>
                    <div className="progress-track" style={{ height: 6 }}>
                      <div className="progress-fill" style={{ width: `${r.memory_efficiency}%`, background: ALGO_COLORS[algo]?.bg }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="section-title">{algorithm.replace('_', ' ')} — Memory Layout</h3>
                  <div className="flex gap-3 text-xs mono text-slate-500">
                    <span>Allocated: <strong className="text-slate-800">{result.allocated_count}/{result.total_blocks}</strong></span>
                    <span>Fragmentation: <strong className="text-amber-600">{result.total_fragmentation_kb} KB</strong></span>
                    <span>Efficiency: <strong className="text-cyan-600">{result.memory_efficiency}%</strong></span>
                  </div>
                </div>
                <MemoryMap partitions={result.partitions} totalMemory={totalMemory} />
              </div>
              <div className="card p-5 space-y-3">
                <h3 className="section-title">Allocation Details</h3>
                {renderAllocationTable(result.allocations, algorithm)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
