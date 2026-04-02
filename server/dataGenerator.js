const { v4: uuidv4 } = require('uuid');

const droneTypes = ['Small Quadcopter', 'Fixed-Wing UAS', 'Hexacopter', 'VTOL Hybrid', 'Micro Drone', 'Commercial DJI', 'Military RQ-Series', 'Custom Build FPV'];
const manufacturers = ['DJI', 'Autel', 'Skydio', 'Unknown', 'Custom/DIY', 'Parrot', 'Unknown-MilSpec'];
const classifications = ['friendly', 'hostile', 'unknown', 'pending'];
const threatLevels = ['none', 'low', 'medium', 'high', 'critical'];
const sensorSources = ['Radar-Primary', 'RF-Scanner', 'EO/IR-Camera', 'Acoustic-Array', 'ADS-B', 'Multi-Fused'];
const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
const countermeasures = ['RF Jamming', 'GPS Spoofing', 'Kinetic Intercept', 'Net Capture', 'Laser Dazzle', 'Cyber Takeover', 'EMP Burst'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randBetween(min, max) { return min + Math.random() * (max - min); }

function generateDroneTrack(zones) {
  const zone = pick(zones);
  const classification = pick(classifications);
  const now = new Date();
  const minutesAgo = Math.floor(Math.random() * 30);
  const detected = new Date(now - minutesAgo * 60000);

  return {
    id: `TRK-${uuidv4().slice(0, 8).toUpperCase()}`,
    type: pick(droneTypes),
    manufacturer: pick(manufacturers),
    classification,
    threatLevel: classification === 'hostile' ? pick(['high', 'critical']) : classification === 'friendly' ? 'none' : pick(threatLevels),
    position: {
      lat: zone.center.lat + (Math.random() - 0.5) * 0.05,
      lng: zone.center.lng + (Math.random() - 0.5) * 0.05,
    },
    altitude: Math.round(randBetween(15, 400)),
    speed: Math.round(randBetween(5, 120)),
    heading: Math.round(Math.random() * 360),
    sensorSource: pick(sensorSources),
    signalStrength: Math.round(randBetween(20, 100)),
    zone: zone.name,
    detectedAt: detected.toISOString(),
    lastUpdate: now.toISOString(),
    status: 'active',
    identificationSignal: classification === 'friendly' ? true : Math.random() > 0.7,
    confidence: Math.round(randBetween(60, 99)),
    history: [],
  };
}

function generateIncursion(zones) {
  const zone = pick(zones);
  const severity = pick(['warning', 'critical', 'emergency']);
  const droneType = pick(droneTypes);
  const direction = pick(directions);
  const speed = Math.round(randBetween(20, 90));
  const altitude = Math.round(randBetween(30, 300));
  const confidence = Math.round(randBetween(70, 99));

  const descriptions = [
    `${droneType} detected entering ${zone.name} from the ${direction} at ${speed} km/h. Altitude ${altitude}m. No identification signal.`,
    `Unauthorized aerial vehicle in ${zone.name}. Type: ${droneType}. Approaching from ${direction}. Speed ${speed} km/h at ${altitude}m AGL.`,
    `Perimeter breach: ${droneType} crossed ${zone.name} boundary. Inbound ${direction}, ${speed} km/h, ${altitude}m. No transponder.`,
    `Multiple sensor confirmation: ${droneType} operating in restricted ${zone.name}. Direction: ${direction}. Velocity: ${speed} km/h.`,
  ];

  const recommendedActions = [
    `Activate RF jamming on bearing ${Math.round(Math.random() * 360)}°`,
    `Deploy kinetic interceptor to ${zone.name}`,
    `Initiate GPS spoofing to redirect target`,
    `Dispatch QRF and activate EO/IR tracking`,
    `Engage cyber takeover protocol`,
    `Authorize net capture drone deployment`,
  ];

  return {
    id: `INC-${uuidv4().slice(0, 8).toUpperCase()}`,
    trackId: `TRK-${uuidv4().slice(0, 8).toUpperCase()}`,
    zone: zone.name,
    severity,
    description: pick(descriptions),
    confidence,
    recommendedAction: pick(recommendedActions),
    status: 'active',
    detectedAt: new Date(Date.now() - Math.random() * 1800000).toISOString(),
    responseAction: null,
    droneType,
    altitude,
    speed,
    direction,
    sensorSources: [pick(sensorSources), pick(sensorSources)].filter((v, i, a) => a.indexOf(v) === i),
  };
}

function generateIntelEvent() {
  const categories = ['pattern_analysis', 'frequency_detection', 'behavioral_anomaly', 'network_correlation', 'historical_match', 'geospatial_trend'];
  const titles = [
    'Recurring flight pattern detected over Zone Alpha',
    'New RF signature cataloged - matches known hostile profile',
    'Coordinated multi-drone approach pattern identified',
    'Surge in drone activity correlated with local event schedule',
    'Supply chain intercept: bulk drone components shipped to region',
    'Dark web chatter spike regarding facility reconnaissance',
    'Historical pattern match: pre-attack surveillance profile detected',
    'Anomalous loitering behavior near critical infrastructure',
    'Cross-reference hit: operator linked to prior incursions',
    'Seasonal pattern analysis: activity increase predicted for next 72h',
    'SIGINT correlation: new command frequency identified',
    'Behavioral clustering: 3 tracks show coordinated movement',
  ];

  const now = new Date();
  return {
    id: `INT-${uuidv4().slice(0, 8).toUpperCase()}`,
    category: pick(categories),
    title: pick(titles),
    summary: `Automated intelligence analysis has identified a noteworthy pattern. Confidence level: ${Math.round(randBetween(65, 98))}%. Recommend further investigation and cross-referencing with regional threat database.`,
    confidence: Math.round(randBetween(60, 98)),
    priority: pick(['low', 'medium', 'high', 'critical']),
    timestamp: new Date(now - Math.random() * 86400000).toISOString(),
    source: pick(['AI Pattern Engine', 'Sensor Fusion', 'SIGINT Correlation', 'OSINT Aggregator', 'Behavioral Analytics']),
    relatedTracks: Math.random() > 0.5 ? [`TRK-${uuidv4().slice(0, 8).toUpperCase()}`] : [],
    actionable: Math.random() > 0.4,
  };
}

function generateAIFeedMessage(tracks, zones, overrideText) {
  const activeTracks = tracks.filter(t => t.status === 'active');
  const zone = pick(zones);
  const track = activeTracks.length > 0 ? pick(activeTracks) : null;

  const templates = [
    () => track ? `${track.type} detected entering ${track.zone} from the ${pick(directions)} at ${track.speed} km/h. Altitude ${track.altitude}m. ${track.identificationSignal ? 'Valid ID signal present.' : 'No identification signal.'} Confidence: ${track.confidence}% ${track.classification}. Recommend: ${pick(countermeasures)}. Awaiting your authorization.` : `All sectors nominal. ${activeTracks.length} active tracks under surveillance. No immediate threats detected.`,
    () => `Sensor fusion update: ${pick(sensorSources)} and ${pick(sensorSources)} confirming track in ${zone.name}. Signal strength stable. Classification confidence increasing.`,
    () => `Behavioral analysis: Track ${track ? track.id : 'unknown'} exhibiting ${pick(['loitering', 'high-speed transit', 'altitude changes', 'erratic movement', 'circling', 'approach'])} pattern consistent with ${pick(['reconnaissance', 'delivery', 'surveillance', 'testing', 'mapping'])} profile.`,
    () => `Zone ${zone.name} status: ${zone.activeSensors} sensors active. Threat level: ${zone.threatLevel.toUpperCase()}. ${Math.floor(Math.random() * 5)} tracks in sector. Perimeter integrity: ${Math.round(randBetween(85, 100))}%.`,
    () => `Intelligence update: Pattern analysis engine detected ${pick(['a new RF signature', 'coordinated movement', 'frequency hopping activity', 'a supply drone profile', 'thermal signature anomaly'])} in the operating area. Cross-referencing with threat database.`,
    () => track ? `Track ${track.id} reclassified: ${track.classification.toUpperCase()}. ${track.manufacturer !== 'Unknown' ? `Manufacturer identified as ${track.manufacturer}.` : 'Manufacturer unconfirmed.'} Updating threat assessment.` : `System diagnostic: All subsystems operational. Latency: ${Math.round(randBetween(12, 85))}ms. Processing ${activeTracks.length} active feeds.`,
    () => `Countermeasure readiness: ${pick(countermeasures)} system ${pick(['online', 'standing by', 'calibrating', 'locked on'])}. Coverage: ${zone.name}. Engagement window: ${Math.round(randBetween(3, 15))} seconds.`,
  ];

  const severities = ['info', 'info', 'info', 'warning', 'warning', 'critical'];
  const severity = overrideText ? (overrideText.includes('ALERT') ? 'critical' : 'warning') : pick(severities);

  return {
    id: `MSG-${uuidv4().slice(0, 8).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    severity,
    message: overrideText || pick(templates)(),
    source: pick(['Komodo AI', 'Sensor Fusion Engine', 'Threat Analyzer', 'Pattern Recognition', 'Countermeasure Controller']),
    relatedTrack: track ? track.id : null,
    actionRequired: severity === 'critical' || (overrideText && overrideText.includes('Awaiting')),
  };
}

module.exports = { generateDroneTrack, generateIncursion, generateIntelEvent, generateAIFeedMessage };
