const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { generateDroneTrack, generateIncursion, generateIntelEvent, generateAIFeedMessage } = require('./dataGenerator');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

// In-memory state
const state = {
  tracks: [],
  incursions: [],
  intelEvents: [],
  aiFeed: [],
  zones: generateZones(),
};

function generateZones() {
  const zoneNames = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'];
  return zoneNames.map((name, i) => ({
    id: `zone-${i + 1}`,
    name: `Zone ${name}`,
    type: i < 2 ? 'restricted' : i < 4 ? 'monitored' : 'buffer',
    center: { lat: 32.38 + (Math.random() - 0.5) * 0.1, lng: -106.74 + (Math.random() - 0.5) * 0.1 },
    radius: 1500 + Math.random() * 3000,
    threatLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
    activeSensors: Math.floor(Math.random() * 8) + 2,
    status: 'active',
  }));
}

// Seed initial data
for (let i = 0; i < 12; i++) state.tracks.push(generateDroneTrack(state.zones));
for (let i = 0; i < 5; i++) state.incursions.push(generateIncursion(state.zones));
for (let i = 0; i < 20; i++) state.intelEvents.push(generateIntelEvent());
for (let i = 0; i < 15; i++) state.aiFeed.push(generateAIFeedMessage(state.tracks, state.zones));

// REST endpoints
app.get('/api/health', (req, res) => res.json({ status: 'operational', uptime: process.uptime() }));
app.get('/api/zones', (req, res) => res.json(state.zones));
app.get('/api/tracks', (req, res) => res.json(state.tracks));
app.get('/api/incursions', (req, res) => res.json(state.incursions));
app.get('/api/intel', (req, res) => res.json(state.intelEvents));
app.get('/api/feed', (req, res) => res.json(state.aiFeed));

app.get('/api/stats', (req, res) => {
  const activeTracks = state.tracks.filter(t => t.status === 'active').length;
  const activeIncursions = state.incursions.filter(i => i.status === 'active').length;
  const criticalZones = state.zones.filter(z => z.threatLevel === 'critical').length;
  res.json({
    activeTracks,
    activeIncursions,
    criticalZones,
    totalSensors: state.zones.reduce((sum, z) => sum + z.activeSensors, 0),
    systemStatus: 'operational',
    uptime: process.uptime(),
  });
});

app.post('/api/incursions/:id/action', (req, res) => {
  const { action } = req.body;
  const incursion = state.incursions.find(i => i.id === req.params.id);
  if (!incursion) return res.status(404).json({ error: 'Incursion not found' });
  incursion.responseAction = action;
  incursion.status = action === 'neutralize' ? 'neutralized' : action === 'track' ? 'tracking' : 'monitoring';
  const msg = generateAIFeedMessage(state.tracks, state.zones, `Operator authorized: ${action.toUpperCase()} on target ${incursion.trackId}. Executing countermeasure.`);
  state.aiFeed.unshift(msg);
  broadcast({ type: 'feed', data: msg });
  broadcast({ type: 'incursion_update', data: incursion });
  res.json(incursion);
});

// WebSocket
function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'init', data: { tracks: state.tracks, zones: state.zones, stats: { activeTracks: state.tracks.filter(t => t.status === 'active').length } } }));
});

// Simulation loop - update tracks & generate events
setInterval(() => {
  // Update existing tracks
  state.tracks.forEach(track => {
    if (track.status !== 'active') return;
    track.position.lat += (Math.random() - 0.5) * 0.002;
    track.position.lng += (Math.random() - 0.5) * 0.002;
    track.altitude += (Math.random() - 0.5) * 10;
    track.speed += (Math.random() - 0.5) * 5;
    track.heading = (track.heading + (Math.random() - 0.5) * 20 + 360) % 360;
    track.lastUpdate = new Date().toISOString();
    // Occasionally lose a track
    if (Math.random() < 0.01) track.status = 'lost';
  });
  broadcast({ type: 'tracks_update', data: state.tracks.filter(t => t.status === 'active') });
}, 2000);

setInterval(() => {
  // New AI feed message
  const msg = generateAIFeedMessage(state.tracks, state.zones);
  state.aiFeed.unshift(msg);
  if (state.aiFeed.length > 100) state.aiFeed.pop();
  broadcast({ type: 'feed', data: msg });
}, 4000);

setInterval(() => {
  // Occasionally spawn new tracks or incursions
  if (Math.random() < 0.3) {
    const track = generateDroneTrack(state.zones);
    state.tracks.push(track);
    broadcast({ type: 'new_track', data: track });
  }
  if (Math.random() < 0.1) {
    const incursion = generateIncursion(state.zones);
    state.incursions.unshift(incursion);
    broadcast({ type: 'new_incursion', data: incursion });
    const msg = generateAIFeedMessage(state.tracks, state.zones, `ALERT: New airspace incursion detected in ${incursion.zone}. ${incursion.description} Confidence: ${incursion.confidence}% hostile. Recommend: ${incursion.recommendedAction}. Awaiting authorization.`);
    state.aiFeed.unshift(msg);
    broadcast({ type: 'feed', data: msg });
  }
}, 8000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[KOMODO] Airspace Defense Server operational on port ${PORT}`);
  console.log(`[KOMODO] WebSocket feed active at ws://localhost:${PORT}/ws`);
  console.log(`[KOMODO] ${state.tracks.length} tracks | ${state.zones.length} zones | ${state.incursions.length} incursions loaded`);
});
