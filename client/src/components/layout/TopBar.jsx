import useKomodoStore from '../../stores/useKomodoStore';
import styles from './TopBar.module.css';

export default function TopBar() {
  const tracks = useKomodoStore((s) => s.tracks);
  const incursions = useKomodoStore((s) => s.incursions);
  const zones = useKomodoStore((s) => s.zones);
  const connectionStatus = useKomodoStore((s) => s.connectionStatus);

  const activeTracks = tracks.filter((t) => t.status === 'active').length;
  const hostileTracks = tracks.filter((t) => t.classification === 'hostile' && t.status === 'active').length;
  const activeIncursions = incursions.filter((i) => i.status === 'active').length;
  const criticalZones = zones.filter((z) => z.threatLevel === 'critical').length;
  const totalSensors = zones.reduce((sum, z) => sum + z.activeSensors, 0);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();

  return (
    <header className={styles.topbar}>
      <div className={styles.stats}>
        <Stat label="ACTIVE TRACKS" value={activeTracks} color="blue" />
        <Stat label="HOSTILE" value={hostileTracks} color={hostileTracks > 0 ? 'red' : 'green'} />
        <Stat label="INCURSIONS" value={activeIncursions} color={activeIncursions > 0 ? 'orange' : 'green'} />
        <Stat label="CRIT ZONES" value={criticalZones} color={criticalZones > 0 ? 'red' : 'green'} />
        <Stat label="SENSORS" value={totalSensors} color="cyan" />
      </div>
      <div className={styles.right}>
        <div className={`${styles.sysStatus} ${connectionStatus === 'connected' ? styles.online : styles.offline}`}>
          {connectionStatus === 'connected' ? 'ALL SYSTEMS NOMINAL' : 'CONNECTION LOST'}
        </div>
        <div className={styles.clock}>
          <span className={styles.time}>{timeStr}</span>
          <span className={styles.date}>{dateStr}</span>
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue} style={{ color: `var(--${color})` }}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
