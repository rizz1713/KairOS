import React from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, ArrowUpDown, Cpu } from 'lucide-react';

const TT = {
  contentStyle: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'11px', boxShadow:'0 4px 12px rgba(0,0,0,0.08)', padding:'8px 12px' },
  itemStyle:    { color:'#334155', fontWeight:600 },
  labelStyle:   { color:'#94a3b8', fontWeight:500, marginBottom:2 },
};

function SectionHeader({ icon: Icon, title, right }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-500" />
        <h3 className="section-title">{title}</h3>
      </div>
      {right}
    </div>
  );
}

function Legend({ items }) {
  return (
    <div className="flex items-center gap-4">
      {items.map(({ color, label }) => (
        <span key={label} className="flex items-center gap-1.5 text-[11px] font-semibold mono" style={{ color }}>
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

export default function TelemetryCharts({ historyData, currentTelemetry }) {
  const cores = currentTelemetry?.cpu?.cores || [];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CPU & Memory */}
        <div className="card p-5">
          <SectionHeader icon={Activity} title="CPU & Memory Load"
            right={<Legend items={[
              { color:'#06b6d4', label:`CPU ${currentTelemetry?.cpu?.percent||0}%` },
              { color:'#3b82f6', label:`RAM ${currentTelemetry?.memory?.percent||0}%` },
            ]} />}
          />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top:4, right:4, left:-24, bottom:0 }}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#cbd5e1" tick={{ fontSize:10, fill:'#94a3b8' }} />
                <YAxis domain={[0,100]} stroke="#cbd5e1" tick={{ fontSize:10, fill:'#94a3b8' }} unit="%" />
                <Tooltip {...TT} />
                <Area type="monotone" dataKey="cpu"    name="CPU %" stroke="#06b6d4" strokeWidth={2} fill="url(#cpuGrad)" isAnimationActive={false} />
                <Area type="monotone" dataKey="memory" name="RAM %" stroke="#3b82f6" strokeWidth={2} fill="url(#memGrad)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* I/O */}
        <div className="card p-5">
          <SectionHeader icon={ArrowUpDown} title="I/O Throughput"
            right={<Legend items={[
              { color:'#f59e0b', label:'Disk I/O' },
              { color:'#94a3b8', label:'Network' },
            ]} />}
          />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top:4, right:4, left:-14, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#cbd5e1" tick={{ fontSize:10, fill:'#94a3b8' }} />
                <YAxis stroke="#cbd5e1" tick={{ fontSize:10, fill:'#94a3b8' }} unit=" KB/s" />
                <Tooltip {...TT} />
                <Line type="monotone" dataKey="diskIO" name="Disk I/O" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="netIO"  name="Network"  stroke="#94a3b8" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-core */}
      <div className="card p-5">
        <SectionHeader icon={Cpu} title="Per-Core Distribution"
          right={<span className="badge badge-slate">{cores.length} Cores Detected</span>}
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {cores.map((load, idx) => {
            const isHigh = load > 80, isMid = load > 50;
            const color = isHigh ? '#ef4444' : isMid ? '#f59e0b' : '#06b6d4';
            const bg    = isHigh ? 'bg-rose-50 border-rose-200' : isMid ? 'bg-amber-50 border-amber-200' : 'bg-cyan-50 border-cyan-100';
            return (
              <div key={idx} className={`${bg} border rounded-lg p-2.5`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-slate-500 mono font-semibold">C{idx}</span>
                  <span className="text-[11px] font-bold mono" style={{ color }}>{load}%</span>
                </div>
                <div className="progress-track" style={{ height:4 }}>
                  <div className="progress-fill" style={{ width:`${Math.min(load,100)}%`, background:color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
