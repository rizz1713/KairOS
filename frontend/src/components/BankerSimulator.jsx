import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export default function BankerSimulator() {
  const [presets, setPresets] = useState(null);
  const [selectedPresetKey, setSelectedPresetKey] = useState('textbook_safe');
  
  const [processes, setProcesses] = useState(['P0', 'P1', 'P2', 'P3', 'P4']);
  const [resourceNames, setResourceNames] = useState(['CPU', 'Memory', 'Disk']);
  const [available, setAvailable] = useState([3, 3, 2]);
  const [allocation, setAllocation] = useState([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2]
  ]);
  const [maxMatrix, setMaxMatrix] = useState([
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3]
  ]);

  const [safetyResult, setSafetyResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [requestProcIdx, setRequestProcIdx] = useState(1);
  const [requestVector, setRequestVector] = useState([1, 0, 2]);
  const [requestResult, setRequestResult] = useState(null);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const data = await api.getBankerPresets();
      setPresets(data);
      if (data && data.textbook_safe) {
        applyPreset(data.textbook_safe);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const applyPreset = (preset) => {
    setProcesses(preset.processes);
    setResourceNames(preset.resource_names);
    setAvailable([...preset.available]);
    setAllocation(preset.allocation.map(row => [...row]));
    setMaxMatrix(preset.max.map(row => [...row]));
    setRequestVector(preset.resource_names.map(() => 0));
    setSafetyResult(null);
    setRequestResult(null);
  };

  const handlePresetChange = (key) => {
    setSelectedPresetKey(key);
    if (presets && presets[key]) {
      applyPreset(presets[key]);
    }
  };

  const needMatrix = maxMatrix.map((row, i) =>
    row.map((maxVal, j) => Math.max(0, maxVal - (allocation[i] ? allocation[i][j] : 0)))
  );

  const handleAvailableChange = (j, val) => {
    const updated = [...available];
    updated[j] = Math.max(0, Number(val));
    setAvailable(updated);
  };

  const handleAllocationChange = (i, j, val) => {
    const updated = allocation.map(r => [...r]);
    updated[i][j] = Math.max(0, Number(val));
    setAllocation(updated);
  };

  const handleMaxChange = (i, j, val) => {
    const updated = maxMatrix.map(r => [...r]);
    updated[i][j] = Math.max(0, Number(val));
    setMaxMatrix(updated);
  };

  const runSafetyCheck = async () => {
    try {
      setLoading(true);
      const res = await api.runBankerSafety({
        processes,
        resource_names: resourceNames,
        available,
        allocation,
        max: maxMatrix
      });
      setSafetyResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runRequestCheck = async () => {
    try {
      setLoading(true);
      const res = await api.runBankerRequest({
        processes,
        resource_names: resourceNames,
        available,
        allocation,
        max: maxMatrix,
        process_index: Number(requestProcIdx),
        request_vector: requestVector.map(Number)
      });
      setRequestResult(res);
      if (res.granted && res.safety_result) {
        setSafetyResult(res.safety_result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Preset Configuration */}
      <div className="p-5 rounded-xl panel-border bg-white space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              Deadlock Avoidance & Banker's Algorithm Framework
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluates resource allocation states, calculates dynamic need matrices, and guarantees deadlock avoidance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <button
              onClick={runSafetyCheck}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold tracking-wide transition shadow-sm shadow-orange-500/25"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? 'Evaluating...' : 'Evaluate System Safety'}</span>
            </button>
          </div>
        </div>

        {/* Preset Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-mono">
          <span className="text-slate-500 font-semibold">Workload Presets:</span>
          {presets && Object.keys(presets).map(key => (
            <button
              key={key}
              onClick={() => handlePresetChange(key)}
              className={`px-3 py-1.5 rounded-lg border transition ${
                selectedPresetKey === key
                  ? 'bg-orange-500 border-orange-500 text-white font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-200'
              }`}
            >
              {presets[key].name}
            </button>
          ))}
        </div>
      </div>

      {/* Safety Status Banner */}
      {safetyResult && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono ${
            safetyResult.is_safe
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start sm:items-center space-x-3">
            {safetyResult.is_safe ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm">
                  SYSTEM STATE: {safetyResult.status}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    safetyResult.is_safe
                      ? 'bg-emerald-200/80 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-200/80 text-rose-900 border border-rose-300'
                  }`}
                >
                  {safetyResult.is_safe ? 'NO DEADLOCK RISK' : 'DEADLOCK SUSCEPTIBLE'}
                </span>
              </div>
              <p className="mt-1 text-slate-700">{safetyResult.message}</p>
            </div>
          </div>

          {safetyResult.is_safe && safetyResult.safe_sequence_string && (
            <div className="bg-white px-4 py-2 rounded-lg border border-emerald-300 shadow-xs flex items-center space-x-2">
              <span className="text-slate-500 text-[11px] font-semibold">SAFE SEQUENCE:</span>
              <span className="text-emerald-700 font-extrabold text-sm tracking-wide">
                {safetyResult.safe_sequence_string}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Available Vector */}
      <div className="p-4 rounded-xl panel-border bg-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-800 font-mono flex items-center gap-1.5 uppercase">
            <Layers className="w-4 h-4 text-orange-500" />
            Available Resource Vector
          </span>
          <span className="text-[11px] text-slate-400 font-mono font-medium">Unallocated instances currently free</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          {resourceNames.map((resName, j) => (
            <div key={j} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600 font-bold">{resName}:</span>
              <input
                type="number"
                min="0"
                value={available[j]}
                onChange={(e) => handleAvailableChange(j, e.target.value)}
                className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-right text-orange-600 font-bold focus:outline-none focus:border-orange-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Allocation, Max, and Need Matrices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation Matrix */}
        <div className="p-4 rounded-xl panel-border bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 font-mono uppercase">
              Allocation Matrix (Current)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2">Proc</th>
                  {resourceNames.map((r, idx) => (
                    <th key={idx} className="p-2 text-center">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {processes.map((p, i) => (
                  <tr key={i}>
                    <td className="p-2 text-slate-900 font-bold">{p}</td>
                    {resourceNames.map((_, j) => (
                      <td key={j} className="p-1 text-center">
                        <input
                          type="number"
                          min="0"
                          value={allocation[i]?.[j] ?? 0}
                          onChange={(e) => handleAllocationChange(i, j, e.target.value)}
                          className="w-12 bg-slate-50 border border-slate-200 rounded p-1 text-center text-slate-900 font-medium focus:bg-white focus:border-orange-500 text-xs"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Max Matrix */}
        <div className="p-4 rounded-xl panel-border bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 font-mono uppercase">
              Max Matrix (Demand Claim)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2">Proc</th>
                  {resourceNames.map((r, idx) => (
                    <th key={idx} className="p-2 text-center">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {processes.map((p, i) => (
                  <tr key={i}>
                    <td className="p-2 text-slate-900 font-bold">{p}</td>
                    {resourceNames.map((_, j) => (
                      <td key={j} className="p-1 text-center">
                        <input
                          type="number"
                          min="0"
                          value={maxMatrix[i]?.[j] ?? 0}
                          onChange={(e) => handleMaxChange(i, j, e.target.value)}
                          className="w-12 bg-orange-50/60 border border-orange-200 rounded p-1 text-center text-orange-700 font-bold focus:bg-white focus:border-orange-500 text-xs"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Need Matrix (Computed) */}
        <div className="p-4 rounded-xl panel-border bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 font-mono uppercase">
              Need Matrix (Max - Allocation)
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-medium">Dynamic</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2">Proc</th>
                  {resourceNames.map((r, idx) => (
                    <th key={idx} className="p-2 text-center">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {processes.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2 text-emerald-700 font-bold">{p}</td>
                    {resourceNames.map((_, j) => (
                      <td key={j} className="p-2 text-center font-bold text-slate-900">
                        {needMatrix[i]?.[j] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dynamic Resource Request Simulation Panel */}
      <div className="p-5 rounded-xl panel-border bg-white space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
            <Send className="w-4 h-4 text-orange-500" />
            Resource-Request Algorithm Evaluation
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tests whether dynamically allocating new resources to a process maintains safety or triggers deadlock prevention.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-600 font-semibold">Requesting Process:</span>
            <select
              value={requestProcIdx}
              onChange={(e) => setRequestProcIdx(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-orange-600 font-bold focus:outline-none focus:border-orange-500"
            >
              {processes.map((p, idx) => (
                <option key={idx} value={idx}>{p}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-600 font-semibold">Request Vector:</span>
            {resourceNames.map((rName, j) => (
              <div key={j} className="flex items-center space-x-1">
                <span className="text-[11px] text-slate-500">{rName}:</span>
                <input
                  type="number"
                  min="0"
                  value={requestVector[j] || 0}
                  onChange={(e) => {
                    const up = [...requestVector];
                    up[j] = Math.max(0, Number(e.target.value));
                    setRequestVector(up);
                  }}
                  className="w-14 bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-center text-slate-900 font-bold"
                />
              </div>
            ))}
          </div>

          <button
            onClick={runRequestCheck}
            disabled={loading}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Request</span>
          </button>
        </div>

        {/* Request Result */}
        {requestResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
              requestResult.granted
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              {requestResult.granted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600" />
              )}
              <span className="font-medium">{requestResult.reason}</span>
            </div>
            <span className="px-2.5 py-1 rounded font-bold text-[10px] bg-white border border-slate-200 shadow-xs">
              {requestResult.status}
            </span>
          </div>
        )}
      </div>

      {/* Step-by-Step Safety Trace */}
      {safetyResult && safetyResult.steps && (
        <div className="p-5 rounded-xl panel-border bg-white space-y-3">
          <h3 className="text-sm font-bold text-slate-900 font-mono">
            Safety Algorithm Execution Steps
          </h3>
          <div className="space-y-2 font-mono text-xs">
            {safetyResult.steps.map((st, sIdx) => (
              <div key={sIdx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-2">
                <ChevronRight className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-orange-700 font-bold">Step {st.step}: </span>
                  <span className="text-slate-700">{st.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
