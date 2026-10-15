import React from 'react';
import {
  Activity, Cpu, ListTree, ShieldAlert, BrainCircuit, History,
  Terminal, ChevronLeft, ChevronRight, X
} from 'lucide-react';

export default function Sidebar({
  activeTab, setActiveTab, isConnected, lastPing,
  telemetry, collapsed, setCollapsed, mobileOpen, setMobileOpen
}) {
  const tabs = [
    { id: 'telemetry', label: 'Live Telemetry', icon: Activity, badge: 'LIVE' },
    { id: 'processes', label: 'OS Algorithms', icon: ListTree, badge: telemetry?.process_count ? `${telemetry.process_count}` : null },
    { id: 'scheduler', label: 'CPU Scheduler', icon: Cpu, badge: 'SIM' },
    { id: 'banker', label: 'Deadlock Matrix', icon: ShieldAlert, badge: 'SIM' },
    { id: 'advisor', label: 'ML Advisor', icon: BrainCircuit, badge: 'AI' },
    { id: 'history', label: 'Architecture & DB', icon: History, badge: 'SQL' },
  ];

  const badgeClass = { LIVE: 'badge-live', SIM: 'badge-sim', AI: 'badge-ai', SQL: 'badge-sql' };

  const cpuPct = telemetry?.cpu?.percent ?? 0;
  const memPct = telemetry?.memory?.percent ?? 0;

  return (
    <>
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden" />
      )}

      <aside style={{ background: '#07101d', borderRight: '1px solid #132035', color: '#e2eaf5' }}
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 font-mono
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'} w-64 h-screen`}
      >
        {/* ── Logo ── */}
        <div style={{ borderBottom: '1px solid #132035', background: '#05090f' }}
          className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden min-w-0">
            <div style={{ background: 'linear-gradient(135deg,#00d4ff,#009ec0)', boxShadow: '0 0 14px rgba(0,212,255,0.35)' }}
              className="w-9 h-9 min-w-9 rounded-lg flex items-center justify-center text-[#05080f] flex-shrink-0">
              <Terminal className="w-4 h-4 stroke-[2.5]" />
            </div>
            {!collapsed && (
              <div className="flex items-center space-x-2 min-w-0 overflow-hidden">
                <span style={{ color: '#e2eaf5', letterSpacing: '0.12em', fontSize: '15px' }}
                  className="font-extrabold truncate">KAIROS</span>

              </div>
            )}
          </div>
          <div className="flex items-center shrink-0">
            <button onClick={() => setMobileOpen(false)} style={{ color: '#2d4a66' }}
              className="lg:hidden p-1.5 rounded hover:bg-white/5 transition">
              <X className="w-4 h-4" />
            </button>
            <button onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}
              style={{ color: '#2d4a66' }}
              className="hidden lg:flex p-1.5 rounded hover:bg-white/5 transition">
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>


        {/* ── Nav Items ── */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5 custom-scrollbar">
          {!collapsed && (
            <div style={{ color: '#2d4a66', fontSize: '9px', letterSpacing: '0.12em' }}
              className="uppercase px-2 pb-2 pt-1 font-bold">Core Subsystems</div>
          )}
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const bc = badgeClass[tab.badge] || 'badge-sim';
            return (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMobileOpen(false); }}
                title={collapsed ? tab.label : undefined}
                style={{
                  background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(0,212,255,0.28)' : 'transparent'}`,
                  color: isActive ? '#00d4ff' : '#4a6a8a',
                }}
                className={`w-full flex items-center rounded-lg transition-all duration-150 relative
                  ${collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2 text-[11px] font-semibold'}`}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(13,30,55,0.8)'; e.currentTarget.style.color = '#e2eaf5'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a6a8a'; } }}
              >
                {isActive && (
                  <span style={{ background: '#00d4ff', boxShadow: '0 0 8px #00d4ff60' }}
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full" />
                )}
                <div className={`flex items-center ${collapsed ? '' : 'space-x-3'}`}>
                  <Icon className="w-4 h-4 flex-shrink-0"
                    style={{ color: isActive ? '#00d4ff' : '#4a6a8a' }} />
                  {!collapsed && <span className="truncate tracking-wide">{tab.label}</span>}
                </div>
                {!collapsed && tab.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${bc}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Live Hardware Gauge ── */}
        {!collapsed && telemetry && (
          <div style={{ borderTop: '1px solid #132035', background: '#060c18' }} className="px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: '#2d4a66', fontSize: '9px', letterSpacing: '0.1em' }} className="uppercase font-bold">
                Live Hardware Load
              </span>
              <span style={{ color: '#00d4ff', fontSize: '9px' }} className="font-bold">
                {telemetry.cpu?.frequency?.current ? `${Math.round(telemetry.cpu.frequency.current)} MHz` : 'ONLINE'}
              </span>
            </div>
            <div className="space-y-1 mb-2">
              <div className="flex justify-between" style={{ fontSize: '10px' }}>
                <span style={{ color: '#4a6a8a' }}>CPU</span>
                <span style={{ color: cpuPct > 85 ? '#ff4466' : cpuPct > 65 ? '#ffaa00' : '#00d4ff' }} className="font-bold">{cpuPct}%</span>
              </div>
              <div style={{ background: '#0d1e33' }} className="h-1 rounded-full overflow-hidden">
                <div style={{
                  width: `${Math.min(cpuPct, 100)}%`,
                  background: cpuPct > 85 ? '#ff4466' : cpuPct > 65 ? '#ffaa00' : '#00d4ff',
                  boxShadow: `0 0 6px ${cpuPct > 85 ? '#ff446660' : '#00d4ff60'}`,
                }} className="h-full rounded-full transition-all duration-300" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between" style={{ fontSize: '10px' }}>
                <span style={{ color: '#4a6a8a' }}>MEM</span>
                <span style={{ color: '#00ff88' }} className="font-bold">{memPct}%</span>
              </div>
              <div style={{ background: '#0d1e33' }} className="h-1 rounded-full overflow-hidden">
                <div style={{ width: `${Math.min(memPct, 100)}%`, background: '#00ff88', boxShadow: '0 0 6px #00ff8860' }}
                  className="h-full rounded-full transition-all duration-300" />
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ borderTop: '1px solid #132035', background: '#05090f' }} className="px-3 py-2.5">
          {collapsed ? (
            <div className="flex justify-center">
              <span style={{ color: '#2d4a66', fontSize: '8px', letterSpacing: '0.06em' }} className="uppercase">KRS</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span style={{ color: '#1a3050', fontSize: '8px', letterSpacing: '0.08em' }} className="uppercase">
                eBPF TRACER &bull; NODE TOPOLOGY
              </span>
              <span style={{ color: '#2d4a66', fontSize: '8px', letterSpacing: '0.08em' }} className="uppercase">
                KAIROS ENGINE
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
