import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, ArcLayer, ColumnLayer, PolygonLayer, TextLayer } from '@deck.gl/layers';
import useKomodoStore from '../../stores/useKomodoStore';
import styles from './AirspaceMap.module.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const COLORS = {
  hostile: [239, 68, 68],
  friendly: [16, 185, 129],
  unknown: [245, 158, 11],
  pending: [59, 130, 246],
};

const THREAT_COLORS = {
  low: [59, 130, 246, 80],
  medium: [245, 158, 11, 80],
  high: [249, 115, 22, 100],
  critical: [239, 68, 68, 120],
};

const ZONE_FILL = {
  restricted: [239, 68, 68, 25],
  monitored: [245, 158, 11, 20],
  buffer: [59, 130, 246, 15],
};

const ZONE_LINE = {
  restricted: [239, 68, 68, 140],
  monitored: [245, 158, 11, 110],
  buffer: [59, 130, 246, 80],
};

function makeCirclePolygon(center, radiusM, segments = 72) {
  const coords = [];
  const degPerM = 1 / 111320;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    coords.push([
      center.lng + degPerM * radiusM * Math.cos(angle),
      center.lat + degPerM * radiusM * Math.sin(angle) * 0.85,
    ]);
  }
  return coords;
}

export default function AirspaceMap() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [hoveredTrack, setHoveredTrack] = useState(null);

  const zones = useKomodoStore((s) => s.zones);
  const tracks = useKomodoStore((s) => s.tracks);
  const setSelectedTrack = useKomodoStore((s) => s.setSelectedTrack);

  const hasToken = Boolean(mapboxgl.accessToken);

  // Initialize map with 3D terrain
  useEffect(() => {
    if (!hasToken || mapRef.current || !mapContainer.current) return;

    let map;
    try {
      map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-106.74, 32.38],
        zoom: 12.5,
        pitch: 55,
        bearing: -30,
        antialias: true,
        maxPitch: 75,
      });
    } catch (err) {
      setMapError(err.message);
      return;
    }

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');

    map.on('load', () => {
      // Enable 3D terrain
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.8 });

      // Sky atmosphere
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 5,
          'sky-atmosphere-color': '#060a13',
        },
      });

      // 3D buildings
      const layers = map.getStyle().layers;
      const labelLayerId = layers.find((l) => l.type === 'symbol' && l.layout['text-field'])?.id;

      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 12,
          paint: {
            'fill-extrusion-color': '#0a1628',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.7,
          },
        },
        labelLayerId
      );

      // Initialize deck.gl overlay
      const overlay = new MapboxOverlay({ layers: [] });
      map.addControl(overlay);
      overlayRef.current = overlay;

      setMapLoaded(true);
    });

    map.on('error', (e) => {
      console.error('[KOMODO] Map error:', e.error?.message || e);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, [hasToken]);

  // Update deck.gl layers when data changes
  useEffect(() => {
    if (!overlayRef.current || !mapLoaded) return;

    const activeTracks = tracks.filter((t) => t.status === 'active');
    const now = Date.now();

    // --- Zone polygons (3D extruded) ---
    const zonePolygonLayer = new PolygonLayer({
      id: 'zone-polygons',
      data: zones,
      getPolygon: (z) => makeCirclePolygon(z.center, z.radius),
      getFillColor: (z) => ZONE_FILL[z.type] || ZONE_FILL.buffer,
      getLineColor: (z) => ZONE_LINE[z.type] || ZONE_LINE.buffer,
      getLineWidth: 2,
      lineWidthUnits: 'pixels',
      extruded: true,
      getElevation: (z) => {
        if (z.type === 'restricted') return 200;
        if (z.type === 'monitored') return 120;
        return 60;
      },
      elevationScale: 1,
      wireframe: true,
      pickable: true,
    });

    // Zone labels
    const zoneLabelLayer = new TextLayer({
      id: 'zone-labels',
      data: zones,
      getPosition: (z) => [z.center.lng, z.center.lat, z.type === 'restricted' ? 250 : 150],
      getText: (z) => `${z.name}\n${z.type.toUpperCase()}`,
      getColor: [226, 232, 240, 180],
      getSize: 13,
      fontFamily: 'JetBrains Mono, monospace',
      fontWeight: 700,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'center',
      billboard: true,
      sizeUnits: 'pixels',
    });

    // --- Track columns (altitude pillars from ground to drone altitude) ---
    const trackColumnLayer = new ColumnLayer({
      id: 'track-columns',
      data: activeTracks,
      diskResolution: 24,
      radius: 20,
      extruded: true,
      getPosition: (t) => [t.position.lng, t.position.lat],
      getElevation: (t) => Math.max(t.altitude, 30),
      getFillColor: (t) => {
        const c = COLORS[t.classification] || COLORS.unknown;
        return [...c, t.classification === 'hostile' ? 200 : 120];
      },
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 80],
      onClick: ({ object }) => object && setSelectedTrack(object),
      onHover: ({ object }) => setHoveredTrack(object || null),
      updateTriggers: {
        getPosition: now,
        getElevation: now,
      },
    });

    // --- Track dots (at altitude, glowing scatterplot) ---
    const trackDotLayer = new ScatterplotLayer({
      id: 'track-dots',
      data: activeTracks,
      getPosition: (t) => [t.position.lng, t.position.lat, t.altitude],
      getRadius: (t) => t.classification === 'hostile' ? 60 : 40,
      getFillColor: (t) => {
        const c = COLORS[t.classification] || COLORS.unknown;
        return [...c, 230];
      },
      radiusUnits: 'meters',
      filled: true,
      stroked: true,
      getLineColor: (t) => {
        const c = COLORS[t.classification] || COLORS.unknown;
        return [...c, 100];
      },
      getLineWidth: 3,
      lineWidthUnits: 'pixels',
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 120],
      onClick: ({ object }) => object && setSelectedTrack(object),
      updateTriggers: {
        getPosition: now,
      },
    });

    // --- Hostile pulse rings ---
    const hostileTracks = activeTracks.filter((t) => t.classification === 'hostile');
    const pulsePhase = (now % 2000) / 2000;
    const pulseLayer = new ScatterplotLayer({
      id: 'hostile-pulse',
      data: hostileTracks,
      getPosition: (t) => [t.position.lng, t.position.lat, t.altitude],
      getRadius: () => 80 + pulsePhase * 120,
      getFillColor: [239, 68, 68, Math.floor((1 - pulsePhase) * 80)],
      radiusUnits: 'meters',
      filled: true,
      updateTriggers: {
        getRadius: now,
        getFillColor: now,
      },
    });

    // --- Flight path arcs (connect hostile tracks to nearest zone center) ---
    const arcData = hostileTracks.map((t) => {
      const nearestZone = zones.reduce((best, z) => {
        const d = Math.hypot(t.position.lat - z.center.lat, t.position.lng - z.center.lng);
        return !best || d < best.dist ? { zone: z, dist: d } : best;
      }, null);
      return nearestZone ? { track: t, zone: nearestZone.zone } : null;
    }).filter(Boolean);

    const threatArcLayer = new ArcLayer({
      id: 'threat-arcs',
      data: arcData,
      getSourcePosition: (d) => [d.track.position.lng, d.track.position.lat, d.track.altitude],
      getTargetPosition: (d) => [d.zone.center.lng, d.zone.center.lat, 50],
      getSourceColor: [239, 68, 68, 200],
      getTargetColor: [239, 68, 68, 40],
      getWidth: 2,
      greatCircle: false,
      getHeight: 0.3,
      updateTriggers: {
        getSourcePosition: now,
      },
    });

    // --- Track ID labels ---
    const trackLabelLayer = new TextLayer({
      id: 'track-labels',
      data: activeTracks,
      getPosition: (t) => [t.position.lng, t.position.lat, t.altitude + 30],
      getText: (t) => `${t.id}\n${t.altitude}m  ${t.speed}km/h`,
      getColor: (t) => {
        const c = COLORS[t.classification] || COLORS.unknown;
        return [...c, 220];
      },
      getSize: 11,
      fontFamily: 'JetBrains Mono, monospace',
      fontWeight: 600,
      getTextAnchor: 'start',
      getAlignmentBaseline: 'bottom',
      getPixelOffset: [12, -8],
      billboard: true,
      sizeUnits: 'pixels',
      updateTriggers: {
        getPosition: now,
        getText: now,
      },
    });

    overlayRef.current.setProps({
      layers: [
        zonePolygonLayer,
        zoneLabelLayer,
        trackColumnLayer,
        pulseLayer,
        trackDotLayer,
        threatArcLayer,
        trackLabelLayer,
      ],
    });
  }, [tracks, zones, mapLoaded, setSelectedTrack]);

  // Animate pulse
  useEffect(() => {
    if (!mapLoaded) return;
    const id = setInterval(() => {
      // Force a re-render for pulse animation
      setHoveredTrack((prev) => prev);
    }, 100);
    return () => clearInterval(id);
  }, [mapLoaded]);

  if (!hasToken) {
    return (
      <div className={styles.mapContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#7a8ba8', fontFamily: 'monospace', fontSize: '0.8rem' }}>
        <div style={{ color: '#f59e0b', fontWeight: 700, letterSpacing: '0.1em' }}>MAPBOX TOKEN REQUIRED</div>
        <div>Set VITE_MAPBOX_TOKEN in client/.env and rebuild</div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={styles.mapContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#7a8ba8', fontFamily: 'monospace', fontSize: '0.8rem' }}>
        <div style={{ color: '#ef4444', fontWeight: 700, letterSpacing: '0.1em' }}>MAP ERROR</div>
        <div>{mapError}</div>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <div ref={mapContainer} className={styles.map} />
      {hoveredTrack && (
        <div className={styles.hoverCard}>
          <div className={styles.hoverHeader} style={{ color: `rgb(${(COLORS[hoveredTrack.classification] || COLORS.unknown).join(',')})` }}>
            {hoveredTrack.id}
          </div>
          <div className={styles.hoverMeta}>{hoveredTrack.type} // {hoveredTrack.manufacturer}</div>
          <div className={styles.hoverGrid}>
            <span>CLASS</span><span style={{ color: `rgb(${(COLORS[hoveredTrack.classification] || COLORS.unknown).join(',')})` }}>{hoveredTrack.classification.toUpperCase()}</span>
            <span>ALT</span><span>{hoveredTrack.altitude}m</span>
            <span>SPD</span><span>{hoveredTrack.speed} km/h</span>
            <span>HDG</span><span>{Math.round(hoveredTrack.heading)}°</span>
            <span>ZONE</span><span>{hoveredTrack.zone}</span>
            <span>CONF</span><span>{hoveredTrack.confidence}%</span>
          </div>
        </div>
      )}
      <MapLegend />
    </div>
  );
}

function MapLegend() {
  return (
    <div className={styles.legend}>
      <div className={styles.legendTitle}>3D AIRSPACE VIEW</div>
      <div className={styles.legendItems}>
        <LegendItem color="#ef4444" label="Hostile — threat arcs" />
        <LegendItem color="#f59e0b" label="Unknown" />
        <LegendItem color="#3b82f6" label="Pending ID" />
        <LegendItem color="#10b981" label="Friendly" />
      </div>
      <div className={styles.legendTitle} style={{ marginTop: 8 }}>EXTRUDED ZONES</div>
      <div className={styles.legendItems}>
        <LegendItem color="#ef4444" label="Restricted (200m)" hollow />
        <LegendItem color="#f59e0b" label="Monitored (120m)" hollow />
        <LegendItem color="#3b82f6" label="Buffer (60m)" hollow />
      </div>
      <div className={styles.legendHint}>Columns show altitude • Click to inspect</div>
    </div>
  );
}

function LegendItem({ color, label, hollow }) {
  return (
    <div className={styles.legendItem}>
      <span
        className={styles.legendDot}
        style={hollow
          ? { border: `2px solid ${color}`, background: 'transparent' }
          : { background: color, boxShadow: `0 0 6px ${color}80` }
        }
      />
      <span>{label}</span>
    </div>
  );
}
