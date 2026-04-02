import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import useKomodoStore from '../../stores/useKomodoStore';
import styles from './AirspaceMap.module.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const CLASSIFICATION_COLORS = {
  hostile: '#ef4444',
  friendly: '#10b981',
  unknown: '#f59e0b',
  pending: '#3b82f6',
};

const THREAT_COLORS = {
  low: '#3b82f6',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const ZONE_TYPE_COLORS = {
  restricted: 'rgba(239, 68, 68, 0.12)',
  monitored: 'rgba(245, 158, 11, 0.10)',
  buffer: 'rgba(59, 130, 246, 0.08)',
};

const ZONE_BORDER_COLORS = {
  restricted: 'rgba(239, 68, 68, 0.5)',
  monitored: 'rgba(245, 158, 11, 0.4)',
  buffer: 'rgba(59, 130, 246, 0.3)',
};

export default function AirspaceMap() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const popupRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  const zones = useKomodoStore((s) => s.zones);
  const tracks = useKomodoStore((s) => s.tracks);
  const setSelectedTrack = useKomodoStore((s) => s.setSelectedTrack);

  const hasToken = Boolean(mapboxgl.accessToken);

  // Initialize map
  useEffect(() => {
    if (!hasToken) return;
    if (mapRef.current || !mapContainer.current) return;

    let map;
    try {
      map = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-106.74, 32.38],
        zoom: 11,
        pitch: 30,
        bearing: -15,
        antialias: true,
      });
    } catch (err) {
      setMapError(err.message);
      return;
    }

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);
    });

    map.on('error', (e) => {
      console.error('[KOMODO] Map error:', e.error?.message || e);
    });

    mapRef.current = map;

    return () => {
      Object.values(markersRef.current).forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw zone overlays
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || zones.length === 0) return;

    zones.forEach((zone) => {
      const sourceId = `zone-${zone.id}`;
      const fillId = `zone-fill-${zone.id}`;
      const lineId = `zone-line-${zone.id}`;
      const labelId = `zone-label-${zone.id}`;

      if (map.getSource(sourceId)) return;

      // Create circle polygon
      const points = 64;
      const coords = [];
      const radiusDeg = zone.radius / 111320;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        coords.push([
          zone.center.lng + radiusDeg * Math.cos(angle),
          zone.center.lat + radiusDeg * Math.sin(angle) * 0.85,
        ]);
      }

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [coords] },
          properties: { name: zone.name, type: zone.type, threatLevel: zone.threatLevel },
        },
      });

      map.addLayer({
        id: fillId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': ZONE_TYPE_COLORS[zone.type] || ZONE_TYPE_COLORS.buffer,
          'fill-opacity': 0.6,
        },
      });

      map.addLayer({
        id: lineId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': ZONE_BORDER_COLORS[zone.type] || ZONE_BORDER_COLORS.buffer,
          'line-width': 1.5,
          'line-dasharray': zone.type === 'restricted' ? [4, 2] : [1],
        },
      });

      // Zone label
      map.addSource(`${sourceId}-label`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [zone.center.lng, zone.center.lat] },
          properties: { name: zone.name },
        },
      });

      map.addLayer({
        id: labelId,
        type: 'symbol',
        source: `${sourceId}-label`,
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': 'rgba(226, 232, 240, 0.7)',
          'text-halo-color': 'rgba(6, 10, 19, 0.8)',
          'text-halo-width': 1,
        },
      });
    });
  }, [zones, mapLoaded]);

  // Update track markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const activeTracks = tracks.filter((t) => t.status === 'active');
    const activeIds = new Set(activeTracks.map((t) => t.id));

    // Remove stale markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!activeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Update or create markers
    activeTracks.forEach((track) => {
      const color = CLASSIFICATION_COLORS[track.classification] || CLASSIFICATION_COLORS.unknown;

      if (markersRef.current[track.id]) {
        markersRef.current[track.id].setLngLat([track.position.lng, track.position.lat]);
      } else {
        const el = document.createElement('div');
        el.className = styles.trackMarker;
        el.style.cssText = `
          width: 14px; height: 14px;
          background: ${color};
          border: 2px solid ${color};
          border-radius: 50%;
          box-shadow: 0 0 10px ${color}80, 0 0 20px ${color}40;
          cursor: pointer;
          position: relative;
        `;

        // Heading indicator
        const arrow = document.createElement('div');
        arrow.style.cssText = `
          position: absolute; top: -8px; left: 50%; transform: translateX(-50%) rotate(${track.heading}deg);
          width: 0; height: 0;
          border-left: 3px solid transparent; border-right: 3px solid transparent;
          border-bottom: 6px solid ${color};
        `;
        el.appendChild(arrow);

        // Pulse ring for hostile
        if (track.classification === 'hostile') {
          const pulse = document.createElement('div');
          pulse.style.cssText = `
            position: absolute; top: -6px; left: -6px;
            width: 22px; height: 22px;
            border: 1px solid ${color}60;
            border-radius: 50%;
            animation: pulse-glow 2s ease-in-out infinite;
          `;
          el.appendChild(pulse);
        }

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([track.position.lng, track.position.lat])
          .addTo(map);

        el.addEventListener('click', () => {
          setSelectedTrack(track);
          if (popupRef.current) popupRef.current.remove();

          const popup = new mapboxgl.Popup({ offset: 20, closeButton: true })
            .setLngLat([track.position.lng, track.position.lat])
            .setHTML(`
              <div style="min-width:180px">
                <div style="font-weight:700;margin-bottom:6px;color:${color}">${track.id}</div>
                <div style="font-size:0.7rem;margin-bottom:8px;color:#7a8ba8">${track.type} // ${track.manufacturer}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:0.65rem">
                  <span style="color:#7a8ba8">CLASS</span><span style="color:${color};font-weight:600">${track.classification.toUpperCase()}</span>
                  <span style="color:#7a8ba8">THREAT</span><span style="font-weight:600">${track.threatLevel.toUpperCase()}</span>
                  <span style="color:#7a8ba8">ALT</span><span>${track.altitude}m AGL</span>
                  <span style="color:#7a8ba8">SPD</span><span>${track.speed} km/h</span>
                  <span style="color:#7a8ba8">HDG</span><span>${Math.round(track.heading)}°</span>
                  <span style="color:#7a8ba8">SENSOR</span><span>${track.sensorSource}</span>
                  <span style="color:#7a8ba8">ZONE</span><span>${track.zone}</span>
                  <span style="color:#7a8ba8">CONF</span><span>${track.confidence}%</span>
                </div>
              </div>
            `)
            .addTo(map);

          popupRef.current = popup;
        });

        markersRef.current[track.id] = marker;
      }
    });
  }, [tracks, mapLoaded, setSelectedTrack]);

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
      <MapLegend />
    </div>
  );
}

function MapLegend() {
  return (
    <div className={styles.legend}>
      <div className={styles.legendTitle}>TRACK CLASSIFICATION</div>
      <div className={styles.legendItems}>
        <LegendItem color="#ef4444" label="Hostile" />
        <LegendItem color="#f59e0b" label="Unknown" />
        <LegendItem color="#3b82f6" label="Pending" />
        <LegendItem color="#10b981" label="Friendly" />
      </div>
      <div className={styles.legendTitle} style={{ marginTop: 8 }}>ZONE TYPE</div>
      <div className={styles.legendItems}>
        <LegendItem color="#ef4444" label="Restricted" hollow />
        <LegendItem color="#f59e0b" label="Monitored" hollow />
        <LegendItem color="#3b82f6" label="Buffer" hollow />
      </div>
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
