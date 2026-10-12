import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  RefreshCw, 
  Sliders, 
  HelpCircle, 
  BarChart2, 
  Zap, 
  Layers, 
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function MLAdvisor() {
  const [mode, setMode] = useState('live');
  const [liveRecommendation, setLiveRecommendation] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const [customParams, setCustomParams] = useState({
    process_count: 45,
    avg_burst_time: 25.0,
    burst_variance: 65.0,
    cpu_utilization: 75.0,
    avg_priority: 2.0
  });
  const [customRecommendation, setCustomRecommendation] = useState(null);

  useEffect(() => {
    fetchLiveRec();
    fetchModelInfo();
  }, []);

  const fetchLiveRec = async () => {
    try {
      setLoading(true);
      const data = await api.getLiveMLRecommendation();
      setLiveRecommendation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModelInfo = async () => {
    try {
      const data = await api.getAdvisorModelInfo();
      setModelInfo(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomParamChange = async (field, val) => {
    const updated = { ...customParams, [field]: Number(val) };
    setCustomParams(updated);
    try {
      const data = await api.getCustomMLRecommendation(updated);
      setCustomRecommendation(data);
    } catch (err) {
      console.error(err);
    }
  };

  const activeRec = mode === 'live' ? liveRecommendation : (customRecommendation || liveRecommendation);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl panel-border bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-orange-500" />
              Machine Learning Scheduling Advisor (Random Forest)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluates multi-dimensional workload metrics to dynamically recommend optimal CPU scheduling heuristics.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setMode('live')}
                className={`px-3 py-1.5 rounded-md transition font-semibold ${
                  mode === 'live'
                    ? 'bg-orange-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Live Workload
              </button>
              <button
                onClick={() => {
                  setMode('custom');
                  if (!customRecommendation) {
                    api.getCustomMLRecommendation(customParams).then(setCustomRecommendation);
                  }
                }}
                className={`px-3 py-1.5 rounded-md transition font-semibold ${
                  mode === 'custom'
                    ? 'bg-orange-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Simulation
              </button>
            </div>

            {mode === 'live' && (
              <button
                onClick={fetchLiveRec}
                disabled={loading}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-semibold transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-evaluate</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Input Telemetry Snapshot */}
        {activeRec && activeRec.inputs && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs font-mono">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Process Count</span>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">
                {Math.round(activeRec.inputs.process_count)}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Avg Burst Time</span>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">
                {activeRec.inputs.avg_burst_time} ms
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Burst Variance</span>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">
                {activeRec.inputs.burst_variance}
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">CPU Utilization</span>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">
                {activeRec.inputs.cpu_utilization}%
              </div>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Avg Priority Index</span>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">
                {activeRec.inputs.avg_priority}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Recommendation Output Card */}
      {activeRec && (
        <div className="p-6 rounded-2xl panel-border bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 border border-orange-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-orange-600 font-mono font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Recommended Scheduling Algorithm
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1 tracking-tight">
                {activeRec.recommended_algorithm}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-orange-200 font-mono text-right shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Classification Confidence</span>
              <div className="text-2xl font-extrabold text-orange-600">
                {activeRec.confidence_percentage}%
              </div>
            </div>
          </div>

          {/* Confidence Bar */}
          <div className="w-full bg-orange-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${activeRec.confidence_percentage}%` }}
            />
          </div>

          {/* Kernel Reasoning Engine Justification */}
          <div className="p-4 rounded-xl bg-white border border-orange-100 space-y-1 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 font-mono">
              Analytical Justification & OS Heuristic
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {activeRec.reason}
            </p>
          </div>
        </div>
      )}

      {/* Multi-Class Probability Distribution & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Probability Distribution */}
        <div className="p-5 rounded-xl panel-border bg-white space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900 font-mono">
              Random Forest Probability Breakdown
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {activeRec?.probabilities?.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-bold">{item.algorithm}</span>
                  <span className="text-slate-500 font-medium">{item.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.algorithm === activeRec.recommended_algorithm
                        ? 'bg-orange-500'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Importance */}
        <div className="p-5 rounded-xl panel-border bg-white space-y-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900 font-mono">
              Model Feature Importance Weights
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {modelInfo?.feature_importances?.map((feat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-bold">{feat.feature}</span>
                  <span className="text-orange-600 font-bold">{feat.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${feat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Custom Workload Sliders (when in Custom mode) */}
      {mode === 'custom' && (
        <div className="p-5 rounded-xl panel-border bg-white space-y-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900 font-mono">
              Simulated Workload Parameter Adjustment
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 font-mono text-xs">
            {/* Process Count */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Process Count</span>
                <span className="text-orange-600 font-bold">{customParams.process_count}</span>
              </div>
              <input
                type="range"
                min="2"
                max="150"
                value={customParams.process_count}
                onChange={(e) => handleCustomParamChange('process_count', e.target.value)}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Avg Burst Time */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Avg Burst Time</span>
                <span className="text-orange-600 font-bold">{customParams.avg_burst_time} ms</span>
              </div>
              <input
                type="range"
                min="2"
                max="100"
                value={customParams.avg_burst_time}
                onChange={(e) => handleCustomParamChange('avg_burst_time', e.target.value)}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Burst Variance */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Burst Variance</span>
                <span className="text-orange-600 font-bold">{customParams.burst_variance}</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                value={customParams.burst_variance}
                onChange={(e) => handleCustomParamChange('burst_variance', e.target.value)}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* CPU Utilization */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">CPU Utilization</span>
                <span className="text-orange-600 font-bold">{customParams.cpu_utilization}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={customParams.cpu_utilization}
                onChange={(e) => handleCustomParamChange('cpu_utilization', e.target.value)}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Priority Skew */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600 font-semibold">Average Priority Weight</span>
                <span className="text-orange-600 font-bold">{customParams.avg_priority}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="4.0"
                step="0.1"
                value={customParams.avg_priority}
                onChange={(e) => handleCustomParamChange('avg_priority', e.target.value)}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
