import React from 'react';
import { Cpu, Database, HardDrive, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="p-5 space-y-3">
        <div className="h-3 w-24 bg-slate-100 rounded" />
        <div className="h-8 w-20 bg-slate-100 rounded" />
        <div className="h-1.5 w-full bg-slate-100 rounded-full" />
        <div className="h-3 w-32 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

function MetricCard({ accentClass, icon: Icon, iconColor, label, badge, value, unit, subLeft, subRight, barPct, barColor }) {
  return (
    <div className={`card card-hover ${accentClass} overflow-hidden`}>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <span className="stat-label">{label}</span>
          </div>
          <span className="badge badge-cyan">{badge}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="stat-value">{value}</span>
          {unit && <span className="text-sm text-slate-400 mono font-semibold">{unit}</span>}
        </div>
        <div className="progress-track">
          <div className={`progress-fill ${barColor}`} style={{ width: `${Math.min(barPct, 100)}%` }} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-500 mono">{subLeft}</span>
          <span className="text-[11px] text-slate-500 mono">{subRight}</span>
        </div>
      </div>
    </div>
  );
}

export default function MetricCards({ telemetry }) {
  if (!telemetry) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const { cpu, memory, disk, network, process_count } = telemetry;
  const cpuBar = cpu.percent > 85 ? 'bg-rose-500' : cpu.percent > 65 ? 'bg-amber-500' : 'bg-cyan-500';
  const memBar = memory.percent > 85 ? 'bg-rose-500' : memory.percent > 70 ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCard
        accentClass="card-accent-top"
        icon={Cpu} iconColor="text-cyan-500"
        label="CPU Utilization"
        badge={cpu.frequency?.current ? `${cpu.frequency.current} MHz` : 'ACTIVE'}
        value={`${cpu.percent}`} unit="%"
        barPct={cpu.percent} barColor={cpuBar}
        subLeft={`${cpu.physical_cores}P / ${cpu.logical_cores}L Cores`}
        subRight={`IRQs ${cpu.interrupts ? (cpu.interrupts/1000).toFixed(0)+'k' : 'N/A'}`}
      />
      <MetricCard
        accentClass="card-accent-blue"
        icon={Database} iconColor="text-blue-500"
        label="Physical Memory"
        badge={`${memory.used_gb} / ${memory.total_gb} GB`}
        value={`${memory.percent}`} unit="%"
        barPct={memory.percent} barColor={memBar}
        subLeft={`Avail: ${memory.available_gb} GB`}
        subRight={`Swap: ${memory.swap_percent}%`}
      />
      <MetricCard
        accentClass="card-accent-amber"
        icon={HardDrive} iconColor="text-amber-500"
        label="Disk & Storage"
        badge={`${disk.free_gb} GB Free`}
        value={`${disk.percent}`} unit="%"
        barPct={disk.percent} barColor="bg-amber-500"
        subLeft={<span className="flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3 text-amber-500 inline" /> R: {disk.read_kb_s} KB/s</span>}
        subRight={<span className="flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3 text-amber-500 inline" /> W: {disk.write_kb_s} KB/s</span>}
      />
      <MetricCard
        accentClass="card-accent-emerald"
        icon={Layers} iconColor="text-emerald-500"
        label="Workload & Tasks"
        badge={`${process_count} PROCS`}
        value={process_count} unit=""
        barPct={Math.min((process_count/300)*100, 100)} barColor="bg-emerald-500"
        subLeft={<span className="flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3 text-emerald-500 inline" /> In: {network?.recv_kb_s||0} KB/s</span>}
        subRight={<span className="flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3 text-emerald-500 inline" /> Out: {network?.sent_kb_s||0} KB/s</span>}
      />
    </div>
  );
}
