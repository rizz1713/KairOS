import React from 'react';
import { 
  Activity, 
  Cpu, 
  ListTree, 
  ShieldAlert, 
  BrainCircuit, 
  History, 
  Wifi, 
  WifiOff, 
  Terminal
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isConnected, lastPing }) {
  const tabs = [
    { id: 'telemetry', label: 'Telemetry', icon: Activity },
    { id: 'processes', label: 'Processes', icon: ListTree },
    { id: 'scheduler', label: 'CPU Scheduler', icon: Cpu },
    { id: 'banker', label: 'Deadlock & Banker', icon: ShieldAlert },
    { id: 'advisor', label: 'ML Advisor', icon: BrainCircuit },
    { id: 'history', label: 'Telemetry Log', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/30">
              <Terminal className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-wide text-slate-900">KAIROS</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200/80 font-mono">
                  v1.0 OS ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">
                Kernel-Aware Intelligent Resource Orchestration System
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* WebSocket Status Indicator */}
          <div className="hidden lg:flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            {isConnected ? (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold font-mono text-[11px]">STREAM ACTIVE</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-600 font-bold font-mono text-[11px]">OFFLINE</span>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
