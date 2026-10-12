import React from 'react';
import { Cpu, HardDrive, Database, ArrowUpRight, ArrowDownRight, Layers, Zap } from 'lucide-react';

export default function MetricCards({ telemetry }) {
  if (!telemetry) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl border border-slate-200"></div>
        ))}
      </div>
    );
  }

  const { cpu, memory, disk, network, process_count } = telemetry;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CPU Card */}
      <div className="p-5 rounded-xl panel-border panel-hover relative overflow-hidden bg-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-orange-500" />
            CPU Utilization
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-orange-50 text-orange-700 border border-orange-200/80">
            {cpu.frequency?.current ? `${cpu.frequency.current} MHz` : 'ACTIVE'}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-900">
            {cpu.percent}%
          </div>
          <div className="text-xs text-slate-500 font-mono text-right font-medium">
            <span>{cpu.physical_cores} P / {cpu.logical_cores} L Cores</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              cpu.percent > 85 ? 'bg-rose-500' : cpu.percent > 65 ? 'bg-amber-500' : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min(cpu.percent, 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
          <span>Switches: {cpu.ctx_switches ? (cpu.ctx_switches / 1000).toFixed(0) + 'k' : 'N/A'}</span>
          <span>IRQs: {cpu.interrupts ? (cpu.interrupts / 1000).toFixed(0) + 'k' : 'N/A'}</span>
        </div>
      </div>

      {/* Memory Card */}
      <div className="p-5 rounded-xl panel-border panel-hover relative overflow-hidden bg-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
            <Database className="w-4 h-4 text-orange-500" />
            Physical Memory
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-orange-50 text-orange-700 border border-orange-200/80">
            {memory.used_gb} / {memory.total_gb} GB
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-900">
            {memory.percent}%
          </div>
          <div className="text-xs text-slate-500 font-mono text-right font-medium">
            <span>Avail: {memory.available_gb} GB</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              memory.percent > 85 ? 'bg-rose-500' : memory.percent > 70 ? 'bg-amber-500' : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min(memory.percent, 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
          <span>Swap: {memory.swap_percent}%</span>
          <span>Used: {memory.swap_used_gb} GB</span>
        </div>
      </div>

      {/* Disk Storage Card */}
      <div className="p-5 rounded-xl panel-border panel-hover relative overflow-hidden bg-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-orange-500" />
            Disk & Storage
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-orange-50 text-orange-700 border border-orange-200/80">
            {disk.free_gb} GB Free
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-900">
            {disk.percent}%
          </div>
          <div className="text-xs text-slate-500 font-mono text-right font-medium">
            <span>Total: {disk.total_gb} GB</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${Math.min(disk.percent, 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-0.5 text-slate-700 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5 text-orange-600" /> R: {disk.read_kb_s} KB/s
          </span>
          <span className="flex items-center gap-0.5 text-slate-700 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-orange-600" /> W: {disk.write_kb_s} KB/s
          </span>
        </div>
      </div>

      {/* Network & Processes Card */}
      <div className="p-5 rounded-xl panel-border panel-hover relative overflow-hidden bg-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-orange-500" />
            Workload & Tasks
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-orange-50 text-orange-700 border border-orange-200/80">
            {process_count} PROCS
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-900">
            {process_count}
          </div>
          <div className="text-xs text-slate-500 font-mono text-right font-medium">
            <span>Active Tasks</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${Math.min((process_count / 300) * 100, 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-0.5 text-slate-700 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5 text-orange-600" /> In: {network?.recv_kb_s || 0} KB/s
          </span>
          <span className="flex items-center gap-0.5 text-slate-700 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-orange-600" /> Out: {network?.sent_kb_s || 0} KB/s
          </span>
        </div>
      </div>
    </div>
  );
}
