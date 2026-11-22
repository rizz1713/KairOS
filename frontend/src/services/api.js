const API_BASE = '/api';

export const api = {
  async getSystemOverview() {
    const res = await fetch(`${API_BASE}/system/overview`);
    if (!res.ok) throw new Error('Failed to fetch system overview');
    return res.json();
  },

  async getProcesses({ limit = 50, sortBy = 'cpu_percent', order = 'desc', search = '' } = {}) {
    const params = new URLSearchParams({ limit, sort_by: sortBy, order });
    if (search) params.append('search', search);
    const res = await fetch(`${API_BASE}/processes?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch processes');
    return res.json();
  },

  async terminateProcess(pid) {
    const res = await fetch(`${API_BASE}/processes/${pid}/terminate`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to terminate process');
    return data;
  },

  async killProcess(pid) {
    const res = await fetch(`${API_BASE}/processes/${pid}/kill`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to kill process');
    return data;
  },

  async reniceProcess(pid, priorityLevel) {
    const res = await fetch(`${API_BASE}/processes/${pid}/priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority_level: priorityLevel })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to renice process');
    return data;
  },

  async simulateScheduler(algorithm, quantum, processes) {
    const res = await fetch(`${API_BASE}/simulation/scheduler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algorithm, quantum, processes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Scheduling simulation failed');
    return data;
  },

  async getLiveSchedulerQueue(count = 6) {
    const res = await fetch(`${API_BASE}/simulation/scheduler/live-queue?count=${count}`);
    if (!res.ok) throw new Error('Failed to load live process queue');
    return res.json();
  },

  async getBankerPresets() {
    const res = await fetch(`${API_BASE}/simulation/banker/presets`);
    if (!res.ok) throw new Error('Failed to fetch Banker presets');
    return res.json();
  },

  async runBankerSafety(payload) {
    const res = await fetch(`${API_BASE}/simulation/banker/safety`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Banker safety check failed');
    return data;
  },

  async runBankerRequest(payload) {
    const res = await fetch(`${API_BASE}/simulation/banker/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Banker request evaluation failed');
    return data;
  },

  async getLiveMLRecommendation() {
    const res = await fetch(`${API_BASE}/advisor/live`);
    if (!res.ok) throw new Error('Failed to obtain ML recommendation');
    return res.json();
  },

  async getCustomMLRecommendation(features) {
    const res = await fetch(`${API_BASE}/advisor/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to compute custom recommendation');
    return data;
  },

  async getAdvisorModelInfo() {
    const res = await fetch(`${API_BASE}/advisor/model-info`);
    if (!res.ok) throw new Error('Failed to fetch model metadata');
    return res.json();
  },

  async getHistoryMetrics(limit = 60) {
    const res = await fetch(`${API_BASE}/history/metrics?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load metrics history');
    return res.json();
  },

  async getHistoryRecommendations(limit = 20) {
    const res = await fetch(`${API_BASE}/history/recommendations?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load recommendation history');
    return res.json();
  },

  async getMemoryPresets() {
    const res = await fetch(`${API_BASE}/simulation/memory/presets`);
    if (!res.ok) throw new Error('Failed to fetch memory presets');
    return res.json();
  },

  async simulateMemoryAllocation(total_memory, blocks, algorithm) {
    const res = await fetch(`${API_BASE}/simulation/memory/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total_memory, blocks, algorithm })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Memory allocation simulation failed');
    return data;
  },

  async getPageReplacementPresets() {
    const res = await fetch(`${API_BASE}/simulation/page-replacement/presets`);
    if (!res.ok) throw new Error('Failed to fetch page replacement presets');
    return res.json();
  },

  async simulatePageReplacement(frames, reference_string, algorithm) {
    const res = await fetch(`${API_BASE}/simulation/page-replacement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames, reference_string, algorithm })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Page replacement simulation failed');
    return data;
  },

  async getProcessBurstHistory() {
    const res = await fetch(`${API_BASE}/processes/burst-history`);
    if (!res.ok) throw new Error('Failed to fetch burst history');
    return res.json();
  }
};
