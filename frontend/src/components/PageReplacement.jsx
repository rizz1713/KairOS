import React, { useState, useEffect } from 'react';
import { FileStack, Play, Trophy, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const ALGO_OPTIONS = [
  { id: 'ALL',     label: 'Compare All' },
  { id: 'FIFO',    label: 'FIFO'        },
  { id: 'LRU',     label: 'LRU'         },
  { id: 'OPTIMAL', label: 'Optimal'     },
];

const ALGO_COLORS = {
  FIFO:    { bg: '#0891b2', light: '#ecfeff', text: '#0e7490'  },
  LRU:     { bg: '#7c3aed', light: '#f5f3ff', text: '#6d28d9'  },
  OPTIMAL: { bg: '#059669', light: '#ecfdf5', text: '#065f46'  },
};

function StepTable({ steps, frames }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Step</th>
            <th>Page</th>
            {Array.from({ length: frames }, (_, i) => <th key={i}>Frame {i+1}</th>)}
            <th>Evicted</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s, i) => (
            <tr key={i}>
              <td className="mono text-slate-500">{i+1}</td>
              <td className="mono font-bold text-cyan-600">{s.page}</td>
              {Array.from({ length: frames }, (_, fi) => (
                <td key={fi} className="mono text-center">
                  {s.frames[fi] !== undefined ? (
                    <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                      s.frames[fi] === s.page && s.fault ? 'bg-rose-100 text-rose-700' :
                      s.frames[fi] === s.page ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600'
                    }`}>{s.frames[fi]}</span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
              ))}
              <td className="mono text-slate-500">{s.evicted ?? '—'}</td>
              <td>
                <span className={`badge ${s.fault ? 'badge-rose' : 'badge-emerald'}`}>
                  {s.fault ? '✗ FAULT' : '✓ HIT'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FaultRateBar({ algo, faults, hits, rate, color }) {
  const total = faults + hits;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs mono">
        <span className="font-bold" style={{ color: color.bg }}>{algo}</span>
        <span className="text-slate-500">{faults} faults / {total} refs = <strong className="text-slate-800">{rate}%</strong></span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 16, background: '#f1f5f9' }}>
        <div style={{
          height: '100%', width: `${rate}%`, background: color.bg,
          borderRadius: 99, transition: 'width 0.5s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6
        }}>
          {rate > 15 && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}>{rate}%</span>}
        </div>
      </div>
    </div>
  );
}

export default function PageReplacement() {
  const [algorithm, setAlgorithm] = useState('ALL');
  const [frames, setFrames]       = useState(3);
  const [refInput, setRefInput]   = useState('7 0 1 2 0 3 0 4 2 3 0 3 2');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [presets, setPresets]     = useState(null);
  const [activeTab, setActiveTab] = useState('FIFO');

  useEffect(() => {
    api.getPageReplacementPresets().then(setPresets).catch(console.error);
    runSim();
  }, []);

  const parseRef = () => refInput.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n >= 0);

  const runSim = async () => {
    const refs = parseRef();
    if (refs.length < 3) { setError('Enter at least 3 page references.'); return; }
    try {
      setLoading(true); setError(null);
      setResult(await api.simulatePageReplacement(frames, refs, algorithm));
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const applyPreset = (p) => {
    setFrames(p.frames);
    setRefInput(p.reference_string.join(' '));
    setResult(null);
  };

  const refs = parseRef();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <FileStack className="w-4 h-4 text-cyan-500" /> Page Replacement Simulator
            </h2>
            <p className="section-subtitle">Simulate FIFO, LRU and Optimal page replacement — compare fault rates and find the best policy.</p>
          </div>
          <button onClick={runSim} disabled={loading} className="btn btn-primary">
            <Play className="w-3.5 h-3.5 fill-current" />{loading ? 'Simulating…' : 'Run Simulation'}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
          {ALGO_OPTIONS.map(a => (
            <button key={a.id} onClick={() => setAlgorithm(a.id)}
              className={`btn text-[11px] py-1.5 px-3 ${algorithm === a.id ? 'btn-primary' : 'btn-ghost'}`}>
              {a.label}
            </button>
          ))}
        </div>

        {presets && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 mono">Presets:</span>
            {Object.values(presets).map(p => (
              <button key={p.label} onClick={() => applyPreset(p)} className="btn btn-ghost text-[11px] py-1.5">{p.label}</button>
            ))}
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-semibold mono text-slate-600">Reference String (space or comma separated)</label>
            <input
              type="text" value={refInput}
              onChange={e => setRefInput(e.target.value)}
              placeholder="7 0 1 2 0 3 0 4 2 3"
              className="input-base w-full font-mono"
            />
            <div className="text-[10px] text-slate-400 mono">{refs.length} references: {refs.slice(0,12).join(' ')}{refs.length > 12 ? '…' : ''}</div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold mono text-slate-600">Number of Frames</label>
            <div className="flex items-center gap-3">
              {[1,2,3,4,5,6].map(n => (
                <button key={n} onClick={() => setFrames(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold mono transition ${frames === n ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  style={frames === n ? { background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: '#fff' } : {}}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {result.algorithm === 'ALL' ? (
            <>
              {/* Winner */}
              <div className="rounded-xl border-2 p-4 flex items-center gap-4"
                style={{ borderColor: ALGO_COLORS[result.best]?.bg, background: ALGO_COLORS[result.best]?.light }}>
                <Trophy className="w-7 h-7 flex-shrink-0" style={{ color: ALGO_COLORS[result.best]?.bg }} />
                <div>
                  <div className="text-xs font-bold mono uppercase" style={{ color: ALGO_COLORS[result.best]?.text }}>Fewest Page Faults</div>
                  <div className="text-xl font-extrabold mono" style={{ color: ALGO_COLORS[result.best]?.bg }}>{result.best}</div>
                  <div className="text-xs text-slate-500 mono">{result.results[result.best].faults} faults out of {refs.length} references</div>
                </div>
                {result.best === 'OPTIMAL' && (
                  <div className="ml-auto text-xs mono text-slate-500 max-w-xs">
                    Optimal is a theoretical benchmark — it requires future knowledge and cannot be implemented in real OS kernels.
                  </div>
                )}
              </div>

              {/* Fault rate bars */}
              <div className="card p-5 space-y-4">
                <h3 className="section-title">Fault Rate Comparison</h3>
                {Object.entries(result.results).map(([algo, r]) => (
                  <FaultRateBar key={algo} algo={algo} faults={r.faults} hits={r.hits} rate={r.fault_rate} color={ALGO_COLORS[algo]} />
                ))}
              </div>

              {/* Per-algorithm step tables with tabs */}
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="section-title">Step-by-Step Execution</h3>
                  <div className="flex gap-1.5">
                    {Object.keys(result.results).map(algo => (
                      <button key={algo} onClick={() => setActiveTab(algo)}
                        className={`btn text-[11px] py-1.5 px-3 ${activeTab === algo ? 'btn-primary' : 'btn-ghost'}`}
                        style={activeTab === algo ? { background: ALGO_COLORS[algo]?.bg, borderColor: ALGO_COLORS[algo]?.bg } : {}}>
                        {algo}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  <StepTable steps={result.results[activeTab]?.steps || []} frames={frames} />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Single algo summary */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Page Faults', value: result.faults,     color: 'text-rose-600'    },
                  { label: 'Page Hits',   value: result.hits,       color: 'text-emerald-600' },
                  { label: 'Fault Rate',  value: `${result.fault_rate}%`, color: 'text-cyan-600' },
                ].map(m => (
                  <div key={m.label} className="card p-4 text-center">
                    <div className="stat-label">{m.label}</div>
                    <div className={`stat-value ${m.color} mt-1`}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="card p-5 space-y-3">
                <h3 className="section-title">Step-by-Step Execution</h3>
                <div className="max-h-80 overflow-y-auto">
                  <StepTable steps={result.steps || []} frames={frames} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
