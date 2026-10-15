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
    <header className="sticky top-0 z-50 bg-[#070e1c]/95 backdrop-blur-md border-b border-[#132035] shadow-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#009ec0] flex items-center justify-center text-[#05080f] shadow-sm shadow-[#00d4ff]/30">
              <Terminal className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-wide text-[#e2eaf5]">KAIROS</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30 font-mono">
                  v4.0.0T
                </span>
              </div>
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
                      ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                      : 'text-[#7a9ab8] hover:text-[#e2eaf5] hover:bg-[#132035]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00d4ff]' : 'text-[#4a6a8a]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* WebSocket Status Indicator */}
          <div className="hidden lg:flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-[#070e1c] border border-[#132035] text-xs">
            {isConnected ? (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
                </span>
                <Wifi className="w-3.5 h-3.5 text-[#00ff88]" />
                <span className="text-[#00ff88] font-bold font-mono text-[11px]">STREAM ACTIVE</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-400 font-bold font-mono text-[11px]">OFFLINE</span>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
