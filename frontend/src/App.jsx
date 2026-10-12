import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import MetricCards from './components/MetricCards';
import TelemetryCharts from './components/TelemetryCharts';
import ProcessTable from './components/ProcessTable';
import SchedulerSimulator from './components/SchedulerSimulator';
import BankerSimulator from './components/BankerSimulator';
import MLAdvisor from './components/MLAdvisor';
import HistoryLog from './components/HistoryLog';
import { api } from './services/api';
import { Activity, Terminal, Shield, Cpu, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [telemetry, setTelemetry] = useState(null);
  const [chartHistory, setChartHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPing, setLastPing] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    api.getSystemOverview()
      .then(data => {
        setTelemetry(data);
        appendChartPoint(data);
      })
      .catch(console.error);
  }, []);

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

    setChartHistory((prev) => {
      const next = [...prev, point];
      return next.slice(-30);
    });
  };

  useEffect(() => {
    let reconnectTimeout;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'telemetry_update' || payload.type === 'initial_state') {
            setTelemetry(payload.data);
            appendChartPoint(payload.data);
          } else if (payload.type === 'pong') {
            setLastPing(payload.time);
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        lastPing={lastPing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <MetricCards telemetry={telemetry} />
            <TelemetryCharts
              historyData={chartHistory}
              currentTelemetry={telemetry}
            />
          </div>
        )}

        {activeTab === 'processes' && (
          <div className="space-y-6">
            <ProcessTable />
          </div>
        )}

        {activeTab === 'scheduler' && (
          <div className="space-y-6">
            <SchedulerSimulator />
          </div>
        )}

        {activeTab === 'banker' && (
          <div className="space-y-6">
            <BankerSimulator />
          </div>
        )}

        {activeTab === 'advisor' && (
          <div className="space-y-6">
            <MLAdvisor />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <HistoryLog />
          </div>
        )}
      </main>

      {/* Technical Enterprise Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs font-mono text-slate-500 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span className="text-slate-900 font-bold">KAIROS OS Engine</span>
            <span className="text-slate-400">|</span>
            <span>Kernel Analytics & Advisory Platform</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-500 font-medium">
            <span>FastAPI + WebSockets</span>
            <span>SQLite + SQLAlchemy</span>
            <span>Scikit-Learn Random Forest</span>
            <span>React + Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
