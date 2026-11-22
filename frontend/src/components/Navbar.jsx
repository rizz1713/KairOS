import React, { useState } from 'react';
import {
  Activity, Cpu, ListTree, ShieldAlert, BrainCircuit, History,
  Wifi, WifiOff, Terminal, Menu, X, ChevronRight,
  PanelLeftClose, PanelLeftOpen, HardDrive, FileStack, GitBranch, TrendingUp
} from 'lucide-react';

const tabs = [
  { id: 'telemetry', label: 'System Vitals',      icon: Activity     },
  { id: 'processes', label: 'Kernel Processes',   icon: ListTree     },
  { id: 'scheduler', label: 'Scheduling Engine',  icon: Cpu          },
  { id: 'memory',    label: 'Memory Allocator',   icon: HardDrive    },
  { id: 'pagerep',   label: 'Page Replacement',   icon: FileStack    },
  { id: 'statediag', label: 'Process States',     icon: GitBranch    },
  { id: 'burst',     label: 'Burst Predictor',    icon: TrendingUp   },
  { id: 'banker',    label: 'Deadlock Avoidance', icon: ShieldAlert  },
  { id: 'advisor',   label: 'Smart Insights',     icon: BrainCircuit },
  { id: 'history',   label: 'Audit Log',          icon: History      },
];

export default function Navbar({ activeTab, setActiveTab, isConnected, collapsed, setCollapsed }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTab = (id) => { setActiveTab(id); setMobileOpen(false); };

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────── */}
      <aside
        className="sidebar hidden lg:flex"
        style={{
          width: collapsed ? '64px' : '220px',
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
        }}
      >
        {/* Brand */}
        <div
          className="border-b border-cyan-900/40 flex items-center flex-shrink-0"
          style={{ padding: collapsed ? '16px 0' : '16px 20px', justifyContent: collapsed ? 'center' : 'flex-start', minHeight: 68 }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', boxShadow: '0 0 14px rgba(6,182,212,0.4)' }}
          >
            <Terminal className="w-4 h-4 text-white stroke-[2.2]" />
          </div>
          {!collapsed && (
            <div className="ml-3 min-w-0">
              <div className="font-extrabold text-base tracking-wide leading-tight whitespace-nowrap"
                style={{ backgroundImage: 'linear-gradient(135deg,#06b6d4,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                KAIROS
              </div>
              <div className="text-[10px] text-slate-500 mono leading-tight">OS Engine v1.0</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden" style={{ padding: collapsed ? '16px 8px' : '16px 12px' }}>
          {!collapsed && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-2 whitespace-nowrap">Modules</p>
          )}
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTab(tab.id)}
                title={collapsed ? `${tab.label} — ${tab.sub}` : ''}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                style={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px 0' : '9px 16px',
                  borderRadius: 8,
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && (
                  <span className="flex-1 text-left font-bold text-[13px] leading-tight truncate">{tab.label}</span>
                )}
                {!collapsed && isActive && <ChevronRight className="w-3 h-3 opacity-60 flex-shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Connection status */}
        <div
          className="border-t border-cyan-900/30 flex-shrink-0"
          style={{ padding: collapsed ? '12px 8px' : '12px 16px' }}
        >
          <div
            className={`flex items-center rounded-lg ${isConnected ? 'bg-cyan-950/60' : 'bg-rose-950/60'}`}
            style={{ gap: collapsed ? 0 : 10, padding: collapsed ? '8px 0' : '8px 12px', justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                {!collapsed && <><Wifi className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 ml-1.5" /><span className="text-cyan-400 text-[11px] font-bold mono ml-1 whitespace-nowrap">LIVE</span></>}
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0" />
                {!collapsed && <><WifiOff className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 ml-1.5" /><span className="text-rose-400 text-[11px] font-bold mono ml-1 whitespace-nowrap">OFFLINE</span></>}
              </>
            )}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="mt-2 w-full flex items-center justify-center rounded-lg py-2 text-slate-500 hover:text-cyan-400 hover:bg-white/5 transition-colors"
          >
            {collapsed
              ? <PanelLeftOpen  className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />
            }
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────── */}
      <header
        className="lg:hidden sticky top-0 z-50 h-14 flex items-center justify-between px-4 border-b border-cyan-900/30"
        style={{ background: '#0a0f1e' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)' }}>
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-wide"
            style={{ backgroundImage: 'linear-gradient(135deg,#06b6d4,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            KAIROS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-cyan-400' : 'bg-rose-500'}`} />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-300 hover:text-white p-1">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile slide-down menu ────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-14" style={{ background: 'rgba(10,15,30,0.97)' }}>
          <nav className="px-4 py-4 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => handleTab(tab.id)}
                  className={`sidebar-nav-item text-sm py-3 ${isActive ? 'active' : ''}`}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-bold">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
