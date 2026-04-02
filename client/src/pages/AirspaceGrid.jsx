import { lazy, Suspense } from 'react';
import useKomodoStore from '../stores/useKomodoStore';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import ThreatBadge from '../components/shared/ThreatBadge';
import styles from './AirspaceGrid.module.css';

const AirspaceMap = lazy(() => import('../components/map/AirspaceMap'));

export default function AirspaceGrid() {
  const zones = useKomodoStore((s) => s.zones);
  const tracks = useKomodoStore((s) => s.tracks);
  const selectedTrack = useKomodoStore((s) => s.selectedTrack);

  const activeTracks = tracks.filter((t) => t.status === 'active');

  return (
    <div className={styles.page}>
      <div className={styles.mapArea}>
        <ErrorBoundary>
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#7a8ba8', fontFamily: 'monospace' }}>Loading map...</div>}>
            <AirspaceMap />
          </Suspense>
        </ErrorBoundary>
      </div>
      <div className={styles.sidebar}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>DEFENSE ZONES</div>
          <div className={styles.zoneList}>
            {zones.map((zone) => (
              <div key={zone.id} className={styles.zoneCard}>
                <div className={styles.zoneHeader}>
                  <span className={styles.zoneName}>{zone.name}</span>
                  <ThreatBadge level={zone.threatLevel} small />
                </div>
                <div className={styles.zoneDetails}>
                  <div className={styles.zoneDetail}>
                    <span className={styles.label}>TYPE</span>
                    <span className={styles.value}>{zone.type.toUpperCase()}</span>
                  </div>
                  <div className={styles.zoneDetail}>
                    <span className={styles.label}>SENSORS</span>
                    <span className={styles.value}>{zone.activeSensors}</span>
                  </div>
                  <div className={styles.zoneDetail}>
                    <span className={styles.label}>RADIUS</span>
                    <span className={styles.value}>{(zone.radius / 1000).toFixed(1)}km</span>
                  </div>
                  <div className={styles.zoneDetail}>
                    <span className={styles.label}>STATUS</span>
                    <span className={styles.valueGreen}>{zone.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            ACTIVE TRACKS
            <span className={styles.trackCount}>{activeTracks.length}</span>
          </div>
          <div className={styles.trackList}>
            {activeTracks.slice(0, 8).map((track) => (
              <div
                key={track.id}
                className={`${styles.trackItem} ${selectedTrack?.id === track.id ? styles.trackSelected : ''}`}
              >
                <div className={styles.trackHeader}>
                  <span className={styles.trackId}>{track.id}</span>
                  <ThreatBadge level={track.classification} small />
                </div>
                <div className={styles.trackMeta}>
                  {track.type} · {track.altitude}m · {track.speed}km/h
                </div>
              </div>
            ))}
            {activeTracks.length > 8 && (
              <div className={styles.moreLink}>+{activeTracks.length - 8} more tracks</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
