import React from 'react';
import { Cpu, HardDrive, Database, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

export default function MetricCards({ telemetry }) {
  if (!telemetry) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1,2,3,4].map((i) => (
          <div key={i} className="h-32 rounded-xl border"
            style={{ background: '#0b1120', borderColor: '#132035' }} />
        ))}
      </div>
    );
  }

  const { cpu, memory, disk, network, process_count } = telemetry;

  const Card = ({ icon: Icon, iconColor, label, badge, badgeBg, badgeBorder, badgeColor, value, sub, barColor, barGlow, barPct, footer }) => (
    <div className="p-4 rounded-xl panel-border panel-hover relative overflow-hidden font-mono"
      style={{ background: '#0b1120' }}>
      {/* subtle top-edge accent line */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background: `linear-gradient(90deg, ${iconColor}40, transparent)` }} />

      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 uppercase tracking-widest font-bold"
          style={{ fontSize:'9px', color:'#4a6a8a' }}>
          <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
          {label}
        </span>
        <span className="font-bold rounded px-1.5 py-0.5"
          style={{ fontSize:'9px', background: badgeBg, border:`1px solid ${badgeBorder}`, color: badgeColor }}>
          {badge}
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div className="font-extrabold tracking-tight" style={{ fontSize:'28px', color:'#e2eaf5' }}>
          {value}
        </div>
        <div style={{ fontSize:'10px', color:'#4a6a8a' }} className="text-right">{sub}</div>
      </div>

      <div style={{ background:'#0d1e33' }} className="h-1.5 rounded-full overflow-hidden mb-3">
        <div style={{
          width:`${Math.min(barPct,100)}%`,
          background: barColor,
          boxShadow:`0 0 6px ${barGlow}`,
        }} className="h-full rounded-full transition-all duration-500" />
      </div>

      <div className="flex justify-between items-center" style={{ fontSize:'10px', color:'#4a6a8a' }}>
        {footer}
      </div>
    </div>
  );

  const cpuPct = cpu.percent;
  const cpuColor = cpuPct > 85 ? '#ff4466' : cpuPct > 65 ? '#ffaa00' : '#00d4ff';

  const memPct = memory.percent;
  const memColor = memPct > 85 ? '#ff4466' : memPct > 70 ? '#ffaa00' : '#00ff88';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        icon={Cpu} iconColor="#00d4ff"
        label={`SYS_CPU_SMP // ${cpu.logical_cores} CORES`}
        badge={cpuPct < 80 ? '● NOMINAL' : '● HIGH LOAD'}
        badgeBg="rgba(0,255,136,0.08)" badgeBorder="rgba(0,255,136,0.25)" badgeColor="#00ff88"
        value={`${cpuPct}%`}
        sub={`${cpu.physical_cores}P / ${cpu.logical_cores}L Cores`}
        barColor={cpuColor} barGlow={cpuColor + '80'} barPct={cpuPct}
        footer={<><span>Switches: {cpu.ctx_switches ? (cpu.ctx_switches/1000).toFixed(0)+'k' : 'N/A'}</span><span>IRQs: {cpu.interrupts ? (cpu.interrupts/1000).toFixed(0)+'k' : 'N/A'}</span></>}
      />
      <Card
        icon={Database} iconColor="#00ff88"
        label="SYS_MEM_PAGE_CACHE"
        badge={`● ${memory.used_gb} / ${memory.total_gb} GB`}
        badgeBg="rgba(0,212,255,0.08)" badgeBorder="rgba(0,212,255,0.25)" badgeColor="#00d4ff"
        value={`${memPct}%`}
        sub={`Avail: ${memory.available_gb} GB`}
        barColor={memColor} barGlow={memColor + '80'} barPct={memPct}
        footer={<><span>Swap: {memory.swap_percent}%</span><span>Used: {memory.swap_used_gb} GB</span></>}
      />
      <Card
        icon={HardDrive} iconColor="#c084fc"
        label="NVME_IOPS_ARRAY_0"
        badge={`${disk.free_gb} GB Free`}
        badgeBg="rgba(192,132,252,0.08)" badgeBorder="rgba(192,132,252,0.25)" badgeColor="#c084fc"
        value={`${disk.percent}%`}
        sub={`Total: ${disk.total_gb} GB`}
        barColor="#c084fc" barGlow="#c084fc80" barPct={disk.percent}
        footer={
          <>
            <span className="flex items-center gap-0.5">
              <ArrowDownRight className="w-3 h-3" style={{color:'#c084fc'}} /> R: {disk.read_kb_s} KB/s
            </span>
            <span className="flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" style={{color:'#c084fc'}} /> W: {disk.write_kb_s} KB/s
            </span>
          </>
        }
      />
      <Card
        icon={Layers} iconColor="#ffaa00"
        label="TASK_SCHEDULER_CFS"
        badge={`${process_count} TASKS`}
        badgeBg="rgba(255,170,0,0.08)" badgeBorder="rgba(255,170,0,0.25)" badgeColor="#ffaa00"
        value={`${process_count}`}
        sub="Active Tasks"
        barColor="#ffaa00" barGlow="#ffaa0080" barPct={Math.min((process_count/300)*100,100)}
        footer={
          <>
            <span className="flex items-center gap-0.5">
              <ArrowDownRight className="w-3 h-3" style={{color:'#ffaa00'}} /> In: {network?.recv_kb_s || 0} KB/s
            </span>
            <span className="flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" style={{color:'#ffaa00'}} /> Out: {network?.sent_kb_s || 0} KB/s
            </span>
          </>
        }
      />
    </div>
  );
}
