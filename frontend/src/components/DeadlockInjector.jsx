import React, { useState, useEffect, useRef } from 'react';
import { Skull, Zap, RotateCcw, AlertTriangle } from 'lucide-react';

// ── Banker safety check (pure JS, no API needed) ──────────────────────
function checkSafetyLocal(processes, available, allocation, maxMatrix) {
  const n = processes.length;
  const r = available.length;
  const need = maxMatrix.map((row, i) => row.map((v, j) => Math.max(0, v - (allocation[i]?.[j] || 0))));
  const work = [...available];
  const finish = new Array(n).fill(false);
  const seq = [];

  let found = true;
  while (found) {
    found = false;
    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;
      if (need[i].every((v, j) => v <= work[j])) {
        allocation[i].forEach((v, j) => { work[j] += v; });
        finish[i] = true;
        seq.push(processes[i]);
        found = true;
      }
    }
  }
  return { safe: finish.every(Boolean), sequence: seq };
}

// ── Build circular wait graph from an unsafe state ────────────────────
// Returns edges: [{ from: 'P0', to: 'R0', type: 'request' | 'holds' }]
function buildWaitGraph(processes, resourceNames, allocation, need) {
  const edges = [];
  // P holds R if allocation[p][r] > 0
  processes.forEach((p, i) => {
    resourceNames.forEach((r, j) => {
      if ((allocation[i]?.[j] || 0) > 0) edges.push({ from: r, to: p, type: 'holds', pid: i, rid: j });
    });
  });
  // P requests R if need[p][r] > 0 and resource is fully allocated (available[r] == 0)
  const totalAlloc = resourceNames.map((_, j) => processes.reduce((s, _, i) => s + (allocation[i]?.[j] || 0), 0));
  processes.forEach((p, i) => {
    resourceNames.forEach((r, j) => {
      if ((need[i]?.[j] || 0) > 0 && totalAlloc[j] > 0)
        edges.push({ from: p, to: r, type: 'request', pid: i, rid: j });
    });
  });
  return edges;
}

// ── SVG Circular Wait Graph ───────────────────────────────────────────
function WaitGraph({ processes, resourceNames, allocation, maxMatrix, animating }) {
  const need = maxMatrix.map((row, i) => row.map((v, j) => Math.max(0, v - (allocation[i]?.[j] || 0))));
  const edges = buildWaitGraph(processes, resourceNames, allocation, need);

  const W = 480, H = 340, CX = W / 2, CY = H / 2;
  const nodes = [];

  // Place process nodes on a circle
  const pCount = processes.length;
  processes.forEach((p, i) => {
    const angle = (2 * Math.PI * i) / pCount - Math.PI / 2;
    const radius = Math.min(W, H) * 0.33;
    nodes.push({ id: p, x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle), type: 'process', idx: i });
  });

  // Place resource nodes between process nodes
  const rCount = resourceNames.length;
  resourceNames.forEach((r, j) => {
    const angle = (2 * Math.PI * j) / rCount - Math.PI / 2 + Math.PI / rCount;
    const radius = Math.min(W, H) * 0.17;
    nodes.push({ id: r, x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle), type: 'resource', idx: j });
  });

  const getNode = (id) => nodes.find(n => n.id === id);

  // Arrow marker
  const arrowId = 'arrow-deadlock';
  const arrowReqId = 'arrow-req';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block', margin: '0 auto' }}>
      <defs>
        <marker id={arrowId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#ef4444" />
        </marker>
        <marker id={arrowReqId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#f59e0b" />
        </marker>
        {animating && (
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>

      {/* Edges */}
      {edges.map((e, i) => {
        const from = getNode(e.from);
        const to   = getNode(e.to);
        if (!from || !to) return null;
        const isHold = e.type === 'holds';
        const color  = isHold ? '#ef4444' : '#f59e0b';
        const marker = isHold ? `url(#${arrowId})` : `url(#${arrowReqId})`;
        // shorten line so arrow doesn't overlap node circle
        const dx = to.x - from.x, dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const r1 = from.type === 'process' ? 22 : 14;
        const r2 = to.type   === 'process' ? 22 : 14;
        const x1 = from.x + (dx / dist) * r1;
        const y1 = from.y + (dy / dist) * r1;
        const x2 = to.x   - (dx / dist) * (r2 + 2);
        const y2 = to.y   - (dy / dist) * (r2 + 2);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={color} strokeWidth={animating ? 2.5 : 1.8}
              strokeDasharray={isHold ? 'none' : '5,3'}
              markerEnd={marker}
              filter={animating ? 'url(#glow)' : ''}
              opacity={animating ? 1 : 0.7}
            />
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map(node => {
        const isProc = node.type === 'process';
        const fill   = isProc ? (animating ? '#ef4444' : '#0891b2') : '#1e293b';
        const stroke = isProc ? (animating ? '#fca5a5' : '#67e8f9') : '#475569';
        const r      = isProc ? 22 : 14;
        const label  = node.id;
        return (
          <g key={node.id}>
            {isProc ? (
              <circle cx={node.x} cy={node.y} r={r}
                fill={fill} stroke={stroke} strokeWidth={2}
                filter={animating ? 'url(#glow)' : ''}
              />
            ) : (
              <rect x={node.x - r} y={node.y - r} width={r * 2} height={r * 2} rx={4}
                fill={fill} stroke={stroke} strokeWidth={2}
              />
            )}
            <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
              fill="#fff" fontSize={isProc ? 11 : 9} fontWeight="bold" fontFamily="monospace">
              {label}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform="translate(8, 8)">
        <line x1="0" y1="8" x2="20" y2="8" stroke="#ef4444" strokeWidth="2" markerEnd={`url(#${arrowId})`} />
        <text x="24" y="12" fill="#64748b" fontSize="9" fontFamily="monospace">Resource → Process (holds)</text>
        <line x1="0" y1="22" x2="20" y2="22" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,2" markerEnd={`url(#${arrowReqId})`} />
        <text x="24" y="26" fill="#64748b" fontSize="9" fontFamily="monospace">Process → Resource (waiting)</text>
      </g>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function DeadlockInjector({ processes, resourceNames, available, allocation, maxMatrix, onMatrixChange }) {
  const [injecting, setInjecting]       = useState(false);
  const [injectedAlloc, setInjectedAlloc] = useState(null);
  const [injectedAvail, setInjectedAvail] = useState(null);
  const [deadlockInfo, setDeadlockInfo] = useState(null);
  const [animating, setAnimating]       = useState(false);
  const [step, setStep]                 = useState(0);
  const [log, setLog]                   = useState([]);
  const intervalRef                     = useRef(null);

  const reset = () => {
    clearInterval(intervalRef.current);
    setInjecting(false);
    setInjectedAlloc(null);
    setInjectedAvail(null);
    setDeadlockInfo(null);
    setAnimating(false);
    setStep(0);
    setLog([]);
  };

  // Mutation strategy: increase allocation until available runs dry → deadlock
  const injectDeadlock = () => {
    reset();
    setInjecting(true);
    const newLog = [];

    // Deep copy matrices
    let alloc = allocation.map(r => [...r]);
    let avail = [...available];
    const need = maxMatrix.map((row, i) => row.map((v, j) => Math.max(0, v - (alloc[i]?.[j] || 0))));

    // Strategy: for each resource, give each process 1 more unit until available = 0
    let mutationSteps = [];
    const rCount = resourceNames.length;
    const pCount  = processes.length;

    for (let j = 0; j < rCount; j++) {
      for (let i = 0; i < pCount; i++) {
        if (avail[j] > 0 && need[i]?.[j] > 0) {
          // give this process 1 more unit of resource j
          avail[j] = Math.max(0, avail[j] - 1);
          alloc[i][j] += 1;
          mutationSteps.push({
            alloc: alloc.map(r => [...r]),
            avail: [...avail],
            msg: `Allocated 1 unit of ${resourceNames[j]} to ${processes[i]} → available[${resourceNames[j]}] now ${avail[j]}`,
          });
          // check if already unsafe
          const { safe } = checkSafetyLocal([...processes], [...avail], alloc.map(r => [...r]), maxMatrix.map(r => [...r]));
          if (!safe) {
            mutationSteps.push({
              alloc: alloc.map(r => [...r]),
              avail: [...avail],
              msg: `⚠️ System entered UNSAFE state — deadlock conditions met!`,
              deadlock: true,
            });
            break;
          }
        }
      }
      const lastStep = mutationSteps[mutationSteps.length - 1];
      if (lastStep?.deadlock) break;
    }

    if (!mutationSteps.some(s => s.deadlock)) {
      // Force unsafe by zeroing available entirely
      avail = avail.map(() => 0);
      mutationSteps.push({
        alloc: alloc.map(r => [...r]),
        avail: [...avail],
        msg: `🔴 Drained all available resources — system is now in deadlock!`,
        deadlock: true,
      });
    }

    // Now animate through steps
    let s = 0;
    intervalRef.current = setInterval(() => {
      if (s >= mutationSteps.length) {
        clearInterval(intervalRef.current);
        setInjecting(false);
        setAnimating(true);
        return;
      }
      const st = mutationSteps[s];
      setInjectedAlloc(st.alloc);
      setInjectedAvail(st.avail);
      setLog(prev => [...prev, st.msg]);
      setStep(s + 1);
      if (st.deadlock) {
        // Find the blocked processes (circular wait)
        const blocked = processes.filter((_, i) => {
          const n = maxMatrix[i].map((v, j) => Math.max(0, v - (st.alloc[i]?.[j] || 0)));
          return n.some((v, j) => v > st.avail[j]);
        });
        setDeadlockInfo({ blocked, avail: st.avail, alloc: st.alloc });
        clearInterval(intervalRef.current);
        setInjecting(false);
        setAnimating(true);
      }
      s++;
    }, 600);
  };

  const displayAlloc = injectedAlloc || allocation;
  const displayAvail = injectedAvail || available;
  const need         = maxMatrix.map((row, i) => row.map((v, j) => Math.max(0, v - (displayAlloc[i]?.[j] || 0))));

  return (
    <div className="card p-5 space-y-5" style={{ borderTop: '3px solid #ef4444' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="section-title flex items-center gap-2">
            <Skull className="w-4 h-4 text-rose-500" /> Deadlock Injection Simulator
          </h3>
          <p className="section-subtitle">Mutates the resource matrix step-by-step until a deadlock state is reached, then renders the circular wait graph.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="btn btn-ghost"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          <button
            onClick={injectDeadlock}
            disabled={injecting}
            className="btn"
            style={{ background: injecting ? '#fca5a5' : 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', borderColor: '#ef4444' }}
          >
            <Zap className="w-3.5 h-3.5" />
            {injecting ? `Injecting… step ${step}` : '💉 Inject Deadlock'}
          </button>
        </div>
      </div>

      {/* Mutation log */}
      {log.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-3 max-h-36 overflow-y-auto space-y-1">
          {log.map((msg, i) => (
            <div key={i} className="text-[11px] mono flex items-start gap-2"
              style={{ color: msg.includes('⚠️') || msg.includes('🔴') ? '#fca5a5' : '#94a3b8' }}>
              <span className="text-slate-600 flex-shrink-0">[{String(i + 1).padStart(2, '0')}]</span>
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Deadlock state banner */}
      {deadlockInfo && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold mono text-rose-800">DEADLOCK DETECTED</div>
              <div className="text-xs text-rose-700 mt-0.5">
                Blocked processes: <span className="font-bold">{deadlockInfo.blocked.join(' → ') || 'All'}</span>
              </div>
              <div className="text-xs text-rose-600 mono mt-0.5">
                Available: [{deadlockInfo.avail.join(', ')}] — insufficient for any process to proceed
              </div>
            </div>
          </div>
          <span className="badge badge-rose text-[11px]">CIRCULAR WAIT</span>
        </div>
      )}

      {/* Circular Wait Graph */}
      {animating && deadlockInfo && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="section-title text-rose-700">Circular Wait Graph</h4>
            <span className="text-[11px] mono text-slate-400">Circles = Processes · Squares = Resources</span>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
            <WaitGraph
              processes={processes}
              resourceNames={resourceNames}
              allocation={displayAlloc}
              maxMatrix={maxMatrix}
              animating={animating}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs mono">
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
              <div className="text-[10px] text-rose-500 font-bold uppercase mb-1">Mutual Exclusion</div>
              <div className="text-rose-700 font-bold">✓ Resources held exclusively</div>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
              <div className="text-[10px] text-rose-500 font-bold uppercase mb-1">Hold & Wait</div>
              <div className="text-rose-700 font-bold">✓ Processes hold while waiting</div>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
              <div className="text-[10px] text-rose-500 font-bold uppercase mb-1">Circular Wait</div>
              <div className="text-rose-700 font-bold">✓ {deadlockInfo.blocked.join(' → ')} → ...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
