import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import MetricCards from './components/MetricCards';
import TelemetryCharts from './components/TelemetryCharts';
import ProcessTable from './components/ProcessTable';
import SchedulerSimulator from './components/SchedulerSimulator';
import BankerSimulator from './components/BankerSimulator';
import MLAdvisor from './components/MLAdvisor';
import HistoryLog from './components/HistoryLog';
import LaunchPage from './components/LaunchPage';
import MemorySimulator from './components/MemorySimulator';
import PageReplacement from './components/PageReplacement';
import ProcessStateDiagram from './components/ProcessStateDiagram';
import BurstPredictor from './components/BurstPredictor';
import { api } from './services/api';

const PAGE_TITLES = {
  telemetry:  { title: 'System Vitals',          sub: 'Real-time CPU, memory, disk and network metrics via WebSocket' },
  processes:  { title: 'Kernel Processes',        sub: 'Inspect running processes — renice priority or send signals' },
  scheduler:  { title: 'Scheduling Engine',       sub: 'Simulate FCFS, SJF, SRTF, Round Robin and Priority algorithms' },
  memory:     { title: 'Memory Allocator',        sub: 'First Fit, Best Fit and Worst Fit contiguous memory allocation with fragmentation analysis' },
  pagerep:    { title: 'Page Replacement',        sub: 'FIFO, LRU and Optimal page replacement — compare fault rates' },
  statediag:  { title: 'Process State Diagram',   sub: 'Live animated view of New → Ready → Running → Waiting → Terminated transitions' },
  burst:      { title: 'CPU Burst Predictor',     sub: 'Predict next CPU burst using SMA-3 — the heuristic behind real SJF scheduling' },
  banker:     { title: 'Deadlock Avoidance',      sub: "Banker's Algorithm — safety checks and resource-request simulation" },
  advisor:    { title: 'Smart Insights',          sub: 'Random Forest model classifies optimal scheduling heuristics from workload metrics' },
  history:    { title: 'Audit Log',               sub: 'Persisted SQLite snapshots of telemetry samples and ML recommendations' },
};

export default function App() {
  const [launched, setLaunched]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab]     = useState('telemetry');
  const [telemetry, setTelemetry]     = useState(null);
  const [chartHistory, setChartHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  /* ── initial REST fetch ── */
  useEffect(() => {
    api.getSystemOverview()
      .then(data => { setTelemetry(data); appendChartPoint(data); })
      .catch(console.error);
  }, []);

  const appendChartPoint = (data) => {
    if (!data) return;
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const point = {
      time: timeStr,
      cpu:    data.cpu?.percent || 0,
      memory: data.memory?.percent || 0,
      diskIO: Math.round((data.disk?.read_kb_s || 0) + (data.disk?.write_kb_s || 0)),
      netIO:  Math.round((data.network?.sent_kb_s || 0) + (data.network?.recv_kb_s || 0)),
    };
    setChartHistory(prev => [...prev, point].slice(-30));
  };

  /* ── WebSocket ── */
  useEffect(() => {
    let reconnectTimeout;
    const connect = () => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws/telemetry`);
      wsRef.current = ws;

      ws.onopen  = () => setIsConnected(true);
      ws.onclose = () => { setIsConnected(false); reconnectTimeout = setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'telemetry_update' || payload.type === 'initial_state') {
            setTelemetry(payload.data);
            appendChartPoint(payload.data);
          }
        } catch { /* ignore */ }
      };
    };
    connect();
    return () => { clearTimeout(reconnectTimeout); wsRef.current?.close(); };
  }, []);

  const { title, sub } = PAGE_TITLES[activeTab];

  /* ── Show launch page until user clicks through ── */
  if (!launched) return <LaunchPage onLaunch={() => setLaunched(true)} />;

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex">
      {/* Sidebar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main content — margin tracks sidebar width smoothly */}
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{
          marginLeft: sidebarCollapsed ? '64px' : '220px',
          transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
      >

        {/* Mobile top bar rendered inside Navbar, but we need the spacer */}
        <div className="lg:hidden h-14" />

        {/* Page header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 lg:top-0 z-30">
          <h1 className="text-base font-bold text-slate-900 leading-tight">{title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
        </div>

        {/* Content area */}
        <main className="flex-1 p-5 space-y-5 max-w-[1400px] w-full mx-auto fade-up">
          {activeTab === 'telemetry' && (
            <>
              <MetricCards telemetry={telemetry} />
              <TelemetryCharts historyData={chartHistory} currentTelemetry={telemetry} />
            </>
          )}
          {activeTab === 'processes' && <ProcessTable />}
          {activeTab === 'scheduler' && <SchedulerSimulator />}
          {activeTab === 'memory'    && <MemorySimulator />}
          {activeTab === 'pagerep'   && <PageReplacement />}
          {activeTab === 'statediag' && <ProcessStateDiagram />}
          {activeTab === 'burst'     && <BurstPredictor />}
          {activeTab === 'banker'    && <BankerSimulator />}
          {activeTab === 'advisor'   && <MLAdvisor />}
          {activeTab === 'history'   && <HistoryLog />}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-3 px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-400 max-w-[1400px] mx-auto">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
              <span className="font-semibold text-slate-600">KAIROS OS Engine</span>
              <span className="hidden sm:inline">— Kernel-Aware Intelligent Resource Orchestration System</span>
            </span>
            <span className="flex items-center gap-3 text-slate-400">
              <span>FastAPI + WebSockets</span>
              <span className="text-slate-300">·</span>
              <span>SQLite + SQLAlchemy</span>
              <span className="text-slate-300">·</span>
              <span>Scikit-Learn RF</span>
              <span className="text-slate-300">·</span>
              <span>React + Tailwind</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
