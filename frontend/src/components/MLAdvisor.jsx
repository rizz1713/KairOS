import React, { useState, useEffect } from 'react';
import { BrainCircuit, Sparkles, RefreshCw, Sliders, BarChart2, Zap } from 'lucide-react';
import { api } from '../services/api';

function InputSnapshot({ inputs }) {
  if (!inputs) return null;
  const items = [
    { label:'Process Count',   value:Math.round(inputs.process_count)   },
    { label:'Avg Burst Time',  value:`${inputs.avg_burst_time} ms`       },
    { label:'Burst Variance',  value:inputs.burst_variance               },
    { label:'CPU Utilization', value:`${inputs.cpu_utilization}%`        },
    { label:'Avg Priority',    value:inputs.avg_priority                 },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 border-t border-slate-100">
      {items.map(({ label, value }) => (
        <div key={label} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <div className="stat-label">{label}</div>
          <div className="text-sm font-extrabold mono text-slate-900 mt-0.5">{value}</div>
        </div>
      ))}
    </div>
  );
}

export default function MLAdvisor() {
  const [mode, setMode]               = useState('live');
  const [liveRec, setLiveRec]         = useState(null);
  const [modelInfo, setModelInfo]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [customParams, setCustomParams] = useState({ process_count:45, avg_burst_time:25, burst_variance:65, cpu_utilization:75, avg_priority:2.0 });
  const [customRec, setCustomRec]     = useState(null);

  useEffect(() => { fetchLive(); fetchModelInfo(); }, []);

  const fetchLive = async () => {
    try { setLoading(true); setLiveRec(await api.getLiveMLRecommendation()); }
    catch(err){ console.error(err); } finally { setLoading(false); }
  };
  const fetchModelInfo = async () => {
    try { setModelInfo(await api.getAdvisorModelInfo()); } catch(err){ console.error(err); }
  };
  const handleSlider = async (field, val) => {
    const u={...customParams,[field]:Number(val)}; setCustomParams(u);
    try { setCustomRec(await api.getCustomMLRecommendation(u)); } catch(err){ console.error(err); }
  };
  const switchCustom = () => {
    setMode('custom');
    if(!customRec) api.getCustomMLRecommendation(customParams).then(setCustomRec).catch(console.error);
  };

  const activeRec = mode==='live' ? liveRec : (customRec||liveRec);

  const SLIDERS = [
    { key:'process_count',   label:'Process Count',       min:2,   max:150, step:1,   fmt:v=>v         },
    { key:'avg_burst_time',  label:'Avg Burst Time',      min:2,   max:100, step:1,   fmt:v=>`${v} ms`  },
    { key:'burst_variance',  label:'Burst Variance',      min:0,   max:180, step:1,   fmt:v=>v          },
    { key:'cpu_utilization', label:'CPU Utilization',     min:1,   max:100, step:1,   fmt:v=>`${v}%`    },
    { key:'avg_priority',    label:'Avg Priority Weight', min:0.2, max:4.0, step:0.1, fmt:v=>v          },
  ];

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="section-title flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-cyan-500" /> ML Scheduling Advisor</h2>
            <p className="section-subtitle">Random Forest model recommends optimal CPU scheduling heuristics from workload metrics.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button onClick={()=>setMode('live')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${mode==='live'?'text-white shadow-sm':'text-slate-600 hover:text-slate-900'}`}
                style={mode==='live'?{background:'linear-gradient(135deg,#0891b2,#06b6d4)'}:{}}>Live</button>
              <button onClick={switchCustom} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${mode==='custom'?'text-white shadow-sm':'text-slate-600 hover:text-slate-900'}`}
                style={mode==='custom'?{background:'linear-gradient(135deg,#0891b2,#06b6d4)'}:{}}>Custom</button>
            </div>
            {mode==='live' && (
              <button onClick={fetchLive} disabled={loading} className="btn btn-secondary">
                <RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`} /> Re-evaluate
              </button>
            )}
          </div>
        </div>
        <InputSnapshot inputs={activeRec?.inputs} />
      </div>

      {activeRec && (
        <div className="card p-6 space-y-4" style={{ borderTop:'3px solid #06b6d4', background:'linear-gradient(135deg,rgba(6,182,212,0.04),white)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span className="stat-label">Recommended Algorithm</span>
              </div>
              <div className="stat-value text-4xl">{activeRec.recommended_algorithm}</div>
            </div>
            <div className="bg-white border border-cyan-200 rounded-xl px-5 py-3 text-right flex-shrink-0">
              <div className="stat-label mb-0.5">Confidence</div>
              <div className="text-3xl font-extrabold mono text-cyan-600">{activeRec.confidence_percentage}%</div>
            </div>
          </div>
          <div className="progress-track" style={{ height:8 }}>
            <div className="progress-fill" style={{ width:`${activeRec.confidence_percentage}%`, background:'linear-gradient(90deg,#0891b2,#06b6d4)' }} />
          </div>
          <div className="bg-white border border-cyan-100 rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 mono mb-1.5">Analytical Justification</div>
            <p className="text-xs text-slate-700 leading-relaxed">{activeRec.reason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5 space-y-4">
          <h3 className="section-title flex items-center gap-2"><BarChart2 className="w-4 h-4 text-cyan-500" /> Class Probability Distribution</h3>
          <div className="space-y-3">
            {activeRec?.probabilities?.map((item,i)=>{
              const isTop=item.algorithm===activeRec.recommended_algorithm;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={`mono font-bold ${isTop?'text-cyan-600':'text-slate-700'}`}>{item.algorithm}</span>
                    <span className="mono text-slate-500 font-medium">{item.percentage}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width:`${item.percentage}%`, background:isTop?'linear-gradient(90deg,#0891b2,#06b6d4)':'#cbd5e1' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card p-5 space-y-4">
          <h3 className="section-title flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-500" /> Feature Importance Weights</h3>
          <div className="space-y-3">
            {modelInfo?.feature_importances?.map((feat,i)=>(
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="mono font-bold text-slate-700">{feat.feature}</span>
                  <span className="mono font-bold text-cyan-600">{feat.percentage}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width:`${feat.percentage}%`, background:'linear-gradient(90deg,#0891b2,#06b6d4)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {mode==='custom' && (
        <div className="card p-5 space-y-4">
          <h3 className="section-title flex items-center gap-2"><Sliders className="w-4 h-4 text-cyan-500" /> Workload Parameter Simulation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SLIDERS.map(({ key, label, min, max, step, fmt })=>(
              <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600 mono">{label}</span>
                  <span className="text-xs font-bold text-cyan-600 mono">{fmt(customParams[key])}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={customParams[key]}
                  onChange={e=>handleSlider(key,e.target.value)}
                  className="w-full cursor-pointer" style={{ accentColor:'#06b6d4' }} />
                <div className="flex justify-between text-[10px] text-slate-400 mono"><span>{min}</span><span>{max}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
