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

export default function TelemetryCharts({ historyData, currentTelemetry, theme = 'dark' }) {
  const cores = currentTelemetry?.cpu?.cores || [];

  const gridColor = '#132035';
  const axisColor = '#4a6a8a';
  const tooltipContentStyle = {
    backgroundColor: '#070f1e',
    borderColor: '#1d3352',
    borderRadius: '8px',
    fontSize: '11px',
    fontFamily: 'JetBrains Mono, monospace',
    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.8)',
    color: '#e2eaf5'
  };
  const tooltipItemStyle = { color: '#e2eaf5' };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Row: Dual Real-time Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CPU & Memory Utilization Timeline */}
        <div className="p-5 rounded-xl panel-border bg-[#0b1120] relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#00d4ff]" />
              <h3 className="text-xs font-bold text-[#e2eaf5] uppercase tracking-wider">
                CPU & Memory Real-Time Load
              </h3>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className="flex items-center space-x-1.5 text-[#00d4ff] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_6px_#00d4ff]"></span>
                <span>CPU ({currentTelemetry?.cpu?.percent || 0}%)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-[#00ff88] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88]"></span>
                <span>RAM ({currentTelemetry?.memory?.percent || 0}%)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff88" stopOpacity={0.30} />
                    <stop offset="95%" stopColor="#00ff88" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke={gridColor} />
                <XAxis dataKey="time" stroke={axisColor} tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke={axisColor} tick={{ fontSize: 10 }} unit="%" />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU %"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cpuGrad)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  name="RAM %"
                  stroke="#00ff88"
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
        <div className="p-5 rounded-xl panel-border bg-[#0b1120] relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4 text-[#c084fc]" />
              <h3 className="text-xs font-bold text-[#e2eaf5] uppercase tracking-wider">
                I/O Throughput (Disk & Network)
              </h3>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className="flex items-center space-x-1.5 text-[#c084fc] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#c084fc] shadow-[0_0_6px_#c084fc]"></span>
                <span>Disk I/O</span>
              </span>
              <span className="flex items-center space-x-1.5 text-[#ffaa00] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#ffaa00] shadow-[0_0_6px_#ffaa00]"></span>
                <span>Network</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke={gridColor} />
                <XAxis dataKey="time" stroke={axisColor} tick={{ fontSize: 10 }} />
                <YAxis stroke={axisColor} tick={{ fontSize: 10 }} unit=" KB/s" />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Line
                  type="monotone"
                  dataKey="diskIO"
                  name="Disk I/O"
                  stroke="#c084fc"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="netIO"
                  name="Network"
                  stroke="#ffaa00"
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
      <div className="p-5 rounded-xl panel-border bg-[#0b1120]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-[#00d4ff]" />
            <h3 className="text-xs font-bold text-[#e2eaf5] uppercase tracking-wider">
              Logical Core Multi-Processor Distribution
            </h3>
          </div>
          <span className="text-[11px] text-[#4a6a8a] font-mono">
            {cores.length} Processor Units Detected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {cores.map((load, idx) => {
            const isHigh = load > 80;
            const isMid = load > 50;
            const coreColor = isHigh ? '#ff4466' : isMid ? '#ffaa00' : '#00d4ff';
            return (
              <div key={idx} className="bg-[#070e1c] p-3 rounded-lg border border-[#132035] hover:border-[#00d4ff]/40 transition">
                <div className="flex justify-between items-center mb-1 text-[11px] font-mono">
                  <span className="text-[#4a6a8a] font-medium">Core {idx}</span>
                  <span className="font-bold" style={{ color: coreColor }}>
                    {load}%
                  </span>
                </div>
                <div className="w-full bg-[#0d1e33] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(load, 100)}%`,
                      backgroundColor: coreColor,
                      boxShadow: `0 0 6px ${coreColor}80`
                    }}
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
