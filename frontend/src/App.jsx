import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MetricCards from './components/MetricCards';
import TelemetryCharts from './components/TelemetryCharts';
import ProcessTable from './components/ProcessTable';
import SchedulerSimulator from './components/SchedulerSimulator';
import BankerSimulator from './components/BankerSimulator';
import MLAdvisor from './components/MLAdvisor';
import HistoryLog from './components/HistoryLog';
import { api } from './services/api';
import { Menu, Clock, Activity, Cpu, ListTree, ShieldAlert, BrainCircuit, History, Search, Power, Shield } from 'lucide-react';

// Force dark theme globally on mount
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.classList.add('dark');

export default function App() {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [telemetry, setTelemetry] = useState(null);
  const [chartHistory, setChartHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const wsRef = useRef(null);

  const appendChartPoint = (data) => {
    if (!data) return;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const point = {
      time: timeStr,
      cpu: data.cpu?.percent || 0,
      memory: data.memory?.percent || 0,
      diskIO: Math.round((data.disk?.read_kb_s || 0) + (data.disk?.write_kb_s || 0)),
      netIO: Math.round((data.network?.sent_kb_s || 0) + (data.network?.recv_kb_s || 0)),
    };
    setChartHistory((prev) => [...prev, point].slice(-30));
  };

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api.getSystemOverview()
      .then(data => { setTelemetry(data); appendChartPoint(data); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let reconnectTimeout;
    const connectWebSocket = () => {
      const isDev = window.location.port === '5173';
      const wsUrl = isDev
        ? 'ws://127.0.0.1:8000/ws/telemetry'
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/telemetry`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => setIsConnected(true);
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'telemetry_update' || payload.type === 'initial_state') {
            setTelemetry(payload.data);
            appendChartPoint(payload.data);
          } else if (payload.type === 'pong') {
            setLastPing(payload.time);
          }
        } catch (e) { console.error('WS parse error:', e); }
      };
      ws.onclose = () => { setIsConnected(false); reconnectTimeout = setTimeout(connectWebSocket, 3000); };
      ws.onerror = () => ws.close();
    };
    connectWebSocket();
    return () => { clearTimeout(reconnectTimeout); if (wsRef.current) wsRef.current.close(); };
  }, []);

  const tabTitles = {
    telemetry: { title: 'Real-Time Process & System Telemetry', icon: Activity },
    processes: { title: 'OS Algorithm Simulation',              icon: ListTree   },
    scheduler: { title: 'CPU Scheduling Simulator',             icon: Cpu        },
    banker:    { title: 'Deadlock & Banker Algorithm',          icon: ShieldAlert},
    advisor:   { title: 'ML Kernel Scheduling Advisor',         icon: BrainCircuit},
    history:   { title: 'System Architecture & DB',             icon: History    }
  };

  const currentModule = tabTitles[activeTab] || tabTitles.telemetry;
  const ModuleIcon = currentModule.icon;

  return (
    <div data-theme="dark"
      className="min-h-screen flex font-mono bg-[#05080f] text-[#e2eaf5]"
    >
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab} setActiveTab={setActiveTab}
        isConnected={isConnected} lastPing={lastPing}
        telemetry={telemetry}
        collapsed={collapsed} setCollapsed={setCollapsed}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 backdrop-blur-md border-b font-mono"
          style={{ background: 'rgba(7,16,29,0.92)', borderColor: '#132035' }}>

          {/* Left: mobile toggle + title */}
          <div className="flex items-center space-x-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} style={{ color: '#4a6a8a' }}
              className="lg:hidden p-2 rounded hover:bg-white/5 transition" title="Open Navigation">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div style={{ background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', color:'#00d4ff' }}
                className="p-1.5 rounded">
                <ModuleIcon className="w-4 h-4" />
              </div>
              <h1 style={{ color:'#e2eaf5', fontSize:'12px', letterSpacing:'0.06em' }}
                className="font-bold truncate uppercase">
                {currentModule.title}
              </h1>
            </div>
          </div>

          {/* Center/Right: search + uptime + freeze + status */}
          <div className="flex items-center space-x-2.5 text-[11px] font-mono">
            {/* Search command preview */}
            <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#060c18] border border-[#132035] text-[#4a6a8a]">
              <Search className="w-3.5 h-3.5 text-[#3d5a78]" />
              <span className="text-[11px]">Kernel Command...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[#0b1424] border border-[#1d3352] text-[9px] text-[#7a9ab8]">Ctrl+K</kbd>
            </div>

            {/* Uptime */}
            <div style={{ background:'#060c18', border:'1px solid #132035', color:'#7ab8d4' }}
              className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded">
              <Clock className="w-3 h-3 text-[#00d4ff]" />
              <span>UPTIME 41d 18h 22m</span>
            </div>

            {/* Freeze cluster button */}
            <button
              onClick={() => alert('Kernel cluster state frozen for diagnostic inspection.')}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-rose-950/30 hover:bg-rose-900/40 text-[#ff4466] border border-rose-500/30 text-[10px] font-bold tracking-wider uppercase transition shadow-xs"
            >
              <Power className="w-3 h-3" />
              <span>FREEZE CLUSTER</span>
            </button>

            {/* Live WS Status */}
            <div style={{
              background: isConnected ? 'rgba(0,255,136,0.07)' : 'rgba(255,50,70,0.07)',
              border: `1px solid ${isConnected ? 'rgba(0,255,136,0.22)' : 'rgba(255,50,70,0.22)'}`,
              color: isConnected ? '#00ff88' : '#ff4466'
            }} className="flex items-center space-x-2 px-2.5 py-1.5 rounded">
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background:'#00ff88' }} />
                )}
                <span className="relative inline-flex rounded-full h-2 w-2"
                  style={{ background: isConnected ? '#00ff88' : '#ff4466' }} />
              </span>
              <span className="font-bold tracking-wider hidden xs:inline">
                {isConnected ? 'LIVE ENGINE' : 'DISCONNECTED'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full px-4 sm:px-6 py-5 space-y-5">
          {activeTab === 'telemetry' && (
            <div className="space-y-5">
              <MetricCards telemetry={telemetry} />
              <TelemetryCharts historyData={chartHistory} currentTelemetry={telemetry} theme="dark" />
            </div>
          )}
          {activeTab === 'processes'  && <ProcessTable />}
          {activeTab === 'scheduler'  && <SchedulerSimulator />}
          {activeTab === 'banker'     && <BankerSimulator />}
          {activeTab === 'advisor'    && <MLAdvisor />}
          {activeTab === 'history'    && <HistoryLog />}
        </main>
      </div>
    </div>
  );
}
