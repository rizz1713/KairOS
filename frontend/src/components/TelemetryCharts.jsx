import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Activity, Cpu, ArrowUpDown } from 'lucide-react';

export default function TelemetryCharts({ historyData, currentTelemetry }) {
  const cores = currentTelemetry?.cpu?.cores || [];

  return (
    <div className="space-y-6">
      {/* Top Row: Dual Real-time Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CPU & Memory Utilization Timeline */}
        <div className="p-5 rounded-xl panel-border bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-slate-800">CPU & Memory Real-Time Load</h3>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1.5 text-orange-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                <span>CPU ({currentTelemetry?.cpu?.percent || 0}%)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span>
                <span>RAM ({currentTelemetry?.memory?.percent || 0}%)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 10 }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU %"
                  stroke="#ea580c"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cpuGrad)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  name="RAM %"
                  stroke="#64748b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#memGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disk I/O & Network Throughput Timeline */}
        <div className="p-5 rounded-xl panel-border bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-slate-800">I/O Throughput (Disk & Network)</h3>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1.5 text-orange-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                <span>Disk I/O</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
                <span>Network</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} unit=" KB/s" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Line
                  type="monotone"
                  dataKey="diskIO"
                  name="Disk I/O"
                  stroke="#ea580c"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="netIO"
                  name="Network"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Per-Core Multi-Processor Matrix */}
      <div className="p-5 rounded-xl panel-border bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-800">Logical Core Multi-Processor Distribution</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono font-medium">
            {cores.length} Processor Units Detected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {cores.map((load, idx) => {
            const isHigh = load > 80;
            const isMid = load > 50;
            return (
              <div key={idx} className="bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-1 text-xs font-mono">
                  <span className="text-slate-500 font-medium">Core {idx}</span>
                  <span className={`font-bold ${isHigh ? 'text-rose-600' : isMid ? 'text-amber-600' : 'text-orange-600'}`}>
                    {load}%
                  </span>
                </div>
                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isHigh ? 'bg-rose-500' : isMid ? 'bg-amber-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min(load, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
