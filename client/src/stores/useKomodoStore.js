import { create } from 'zustand';

const API_BASE = '/api';

const useKomodoStore = create((set, get) => ({
  // Connection
  connectionStatus: 'disconnected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  // Data
  zones: [],
  tracks: [],
  incursions: [],
  intelEvents: [],
  aiFeed: [],
  stats: {
    activeTracks: 0,
    activeIncursions: 0,
    criticalZones: 0,
    totalSensors: 0,
    systemStatus: 'initializing',
    uptime: 0,
  },

  // Selected items
  selectedTrack: null,
  selectedZone: null,
  setSelectedTrack: (track) => set({ selectedTrack: track }),
  setSelectedZone: (zone) => set({ selectedZone: zone }),

  // Filters
  feedFilter: 'all',
  setFeedFilter: (filter) => set({ feedFilter: filter }),

  // Actions - bulk set
  setZones: (zones) => set({ zones }),
  setTracks: (tracks) => set({ tracks }),
  setIncursions: (incursions) => set({ incursions }),
  setIntelEvents: (intelEvents) => set({ intelEvents }),
  setAiFeed: (aiFeed) => set({ aiFeed }),
  setStats: (stats) => set({ stats }),

  // Actions - incremental updates
  updateTracks: (tracks) => set({ tracks }),

  addTrack: (track) => set((state) => ({
    tracks: [...state.tracks, track],
  })),

  addFeedMessage: (msg) => set((state) => ({
    aiFeed: [msg, ...state.aiFeed].slice(0, 100),
  })),

  addIncursion: (inc) => set((state) => ({
    incursions: [inc, ...state.incursions],
  })),

  updateIncursion: (updated) => set((state) => ({
    incursions: state.incursions.map((inc) =>
      inc.id === updated.id ? updated : inc
    ),
  })),

  // Fetch initial data from REST
  fetchInitialData: async () => {
    try {
      const [zones, tracks, incursions, intel, feed, stats] = await Promise.all([
        fetch(`${API_BASE}/zones`).then((r) => r.json()),
        fetch(`${API_BASE}/tracks`).then((r) => r.json()),
        fetch(`${API_BASE}/incursions`).then((r) => r.json()),
        fetch(`${API_BASE}/intel`).then((r) => r.json()),
        fetch(`${API_BASE}/feed`).then((r) => r.json()),
        fetch(`${API_BASE}/stats`).then((r) => r.json()),
      ]);
      set({ zones, tracks, incursions, intelEvents: intel, aiFeed: feed, stats });
    } catch (err) {
      console.error('[KOMODO] Failed to fetch initial data:', err);
    }
  },

  // Incursion action
  executeAction: async (incursionId, action) => {
    try {
      const res = await fetch(`${API_BASE}/incursions/${incursionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const updated = await res.json();
      get().updateIncursion(updated);
      return updated;
    } catch (err) {
      console.error('[KOMODO] Action failed:', err);
    }
  },

  // Computed
  getActiveTracks: () => get().tracks.filter((t) => t.status === 'active'),
  getActiveIncursions: () => get().incursions.filter((i) => i.status === 'active'),
  getCriticalFeed: () => get().aiFeed.filter((m) => m.severity === 'critical'),
}));

export default useKomodoStore;
