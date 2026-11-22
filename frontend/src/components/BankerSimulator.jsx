import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Play, Send, CheckCircle2, XCircle, AlertTriangle, Layers, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import DeadlockInjector from './DeadlockInjector';

export default function BankerSimulator() {
  const [presets, setPresets]               = useState(null);
  const [selectedPresetKey, setSelectedKey] = useState('textbook_safe');
  const [processes, setProcesses]           = useState(['P0','P1','P2','P3','P4']);
  const [resourceNames, setResourceNames]   = useState(['CPU','Memory','Disk']);
  const [available, setAvailable]           = useState([3,3,2]);
  const [allocation, setAllocation]         = useState([[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]]);
  const [maxMatrix, setMaxMatrix]           = useState([[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]]);
  const [safetyResult, setSafetyResult]     = useState(null);
  const [requestProcIdx, setRequestProcIdx] = useState(1);
  const [requestVector, setRequestVector]   = useState([1,0,2]);
  const [requestResult, setRequestResult]   = useState(null);
  const [loading, setLoading]               = useState(false);

  useEffect(() => { loadPresets(); }, []);

  const loadPresets = async () => {
    try { const d=await api.getBankerPresets(); setPresets(d); if(d?.textbook_safe) applyPreset(d.textbook_safe); }
    catch(err){ console.error(err); }
  };
  const applyPreset = (p) => {
    setProcesses(p.processes); setResourceNames(p.resource_names); setAvailable([...p.available]);
    setAllocation(p.allocation.map(r=>[...r])); setMaxMatrix(p.max.map(r=>[...r]));
    setRequestVector(p.resource_names.map(()=>0)); setSafetyResult(null); setRequestResult(null);
  };
  const handlePreset = (key) => { setSelectedKey(key); if(presets?.[key]) applyPreset(presets[key]); };

  const needMatrix = maxMatrix.map((row,i)=>row.map((v,j)=>Math.max(0,v-(allocation[i]?.[j]||0))));

  const runSafety = async () => {
    try { setLoading(true); setSafetyResult(await api.runBankerSafety({processes,resource_names:resourceNames,available,allocation,max:maxMatrix})); }
    catch(err){ console.error(err); } finally { setLoading(false); }
  };
  const runRequest = async () => {
    try { setLoading(true);
      const res=await api.runBankerRequest({processes,resource_names:resourceNames,available,allocation,max:maxMatrix,process_index:Number(requestProcIdx),request_vector:requestVector.map(Number)});
      setRequestResult(res); if(res.granted&&res.safety_result) setSafetyResult(res.safety_result);
    } catch(err){ console.error(err); } finally { setLoading(false); }
  };

  const setAvail = (j,v)=>{const u=[...available];u[j]=Math.max(0,Number(v));setAvailable(u);};
  const setAlloc = (i,j,v)=>{const u=allocation.map(r=>[...r]);u[i][j]=Math.max(0,Number(v));setAllocation(u);};
  const setMax   = (i,j,v)=>{const u=maxMatrix.map(r=>[...r]);u[i][j]=Math.max(0,Number(v));setMaxMatrix(u);};

  const MatrixTable = ({ title, titleColor='text-slate-700', data, onChange, highlight }) => (
    <div className="card p-4 space-y-3">
      <h4 className={`text-xs font-bold mono uppercase ${titleColor}`}>{title}</h4>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Proc</th>{resourceNames.map((r,j)=><th key={j} className="text-center">{r}</th>)}</tr></thead>
          <tbody>
            {processes.map((p,i)=>(
              <tr key={i}>
                <td className="font-bold">{p}</td>
                {resourceNames.map((_,j)=>(
                  <td key={j} className="text-center p-1">
                    {onChange
                      ? <input type="number" min="0" value={data[i]?.[j]??0} onChange={e=>onChange(i,j,e.target.value)}
                          className={`input-base w-12 text-center mono ${highlight?'text-cyan-700 font-bold bg-cyan-50':''}`} />
                      : <span className={`font-bold mono ${highlight?'text-emerald-700':'text-slate-800'}`}>{data[i]?.[j]??0}</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="section-title flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-cyan-500" /> Banker's Algorithm — Deadlock Avoidance</h2>
            <p className="section-subtitle">Evaluates resource allocation states and guarantees deadlock-free execution.</p>
          </div>
          <button onClick={runSafety} disabled={loading} className="btn btn-primary">
            <Play className="w-3.5 h-3.5 fill-current" />{loading?'Evaluating…':'Evaluate Safety'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mono mr-1">Presets:</span>
          {presets && Object.keys(presets).map(key=>(
            <button key={key} onClick={()=>handlePreset(key)}
              className={`btn text-[11px] py-1.5 px-3 ${selectedPresetKey===key?'btn-primary':'btn-ghost'}`}>
              {presets[key].name}
            </button>
          ))}
        </div>
      </div>

      {safetyResult && (
        <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${safetyResult.is_safe?'bg-emerald-50 border-emerald-200':'bg-rose-50 border-rose-200'}`}>
          <div className="flex items-start sm:items-center gap-3">
            {safetyResult.is_safe ? <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold mono">SYSTEM STATE: {safetyResult.status}</span>
                <span className={`badge ${safetyResult.is_safe?'badge-emerald':'badge-rose'}`}>{safetyResult.is_safe?'NO DEADLOCK RISK':'DEADLOCK SUSCEPTIBLE'}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{safetyResult.message}</p>
            </div>
          </div>
          {safetyResult.is_safe && safetyResult.safe_sequence_string && (
            <div className="bg-white rounded-lg border border-emerald-200 px-4 py-2 flex-shrink-0">
              <div className="text-[10px] font-bold text-slate-500 mono mb-0.5">SAFE SEQUENCE</div>
              <div className="text-sm font-extrabold mono text-emerald-700">{safetyResult.safe_sequence_string}</div>
            </div>
          )}
        </div>
      )}

      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold mono uppercase text-slate-700 flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-500" /> Available Resource Vector</h4>
          <span className="text-[11px] text-slate-400 mono">Free unallocated instances</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {resourceNames.map((name,j)=>(
            <div key={j} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="text-xs font-bold mono text-slate-600">{name}</span>
              <input type="number" min="0" value={available[j]} onChange={e=>setAvail(j,e.target.value)}
                className="input-base w-14 text-center mono text-cyan-700 font-bold" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MatrixTable title="Allocation (Current)" data={allocation} onChange={setAlloc} />
        <MatrixTable title="Max Demand Claim"      data={maxMatrix}  onChange={setMax}   highlight />
        <MatrixTable title="Need = Max − Allocation" titleColor="text-emerald-700" data={needMatrix} onChange={null} />
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <h3 className="section-title flex items-center gap-2"><Send className="w-4 h-4 text-cyan-500" /> Resource-Request Simulation</h3>
          <p className="section-subtitle">Test whether granting a new request keeps the system in a safe state.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs mono">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Requesting:</span>
            <select value={requestProcIdx} onChange={e=>setRequestProcIdx(Number(e.target.value))} className="input-base text-cyan-700 font-bold">
              {processes.map((p,i)=><option key={i} value={i}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Request:</span>
            {resourceNames.map((rName,j)=>(
              <div key={j} className="flex items-center gap-1">
                <span className="text-slate-400">{rName}:</span>
                <input type="number" min="0" value={requestVector[j]||0}
                  onChange={e=>{const u=[...requestVector];u[j]=Math.max(0,Number(e.target.value));setRequestVector(u);}}
                  className="input-base w-14 text-center mono font-bold" />
              </div>
            ))}
          </div>
          <button onClick={runRequest} disabled={loading} className="btn btn-primary"><Send className="w-3.5 h-3.5" /> Test Request</button>
        </div>
        {requestResult && (
          <div className={`alert ${requestResult.granted?'alert-success':'alert-danger'} justify-between`}>
            <span className="flex items-center gap-2">
              {requestResult.granted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {requestResult.reason}
            </span>
            <span className="badge badge-slate mono ml-4 flex-shrink-0">{requestResult.status}</span>
          </div>
        )}
      </div>

      {safetyResult?.steps && (
        <div className="card p-5 space-y-3">
          <h3 className="section-title">Safety Algorithm Trace</h3>
          <div className="space-y-1.5">
            {safetyResult.steps.map((st,i)=>(
              <div key={i} className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs mono">
                <ChevronRight className="w-3.5 h-3.5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <div><span className="text-cyan-700 font-bold">Step {st.step}: </span><span className="text-slate-700">{st.description}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DeadlockInjector
        processes={processes}
        resourceNames={resourceNames}
        available={available}
        allocation={allocation}
        maxMatrix={maxMatrix}
      />
    </div>
  );
}
