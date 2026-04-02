import { NavLink } from 'react-router-dom';
import useKomodoStore from '../../stores/useKomodoStore';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { path: '/', label: 'Airspace Grid', icon: '◈', shortcut: 'F1' },
  { path: '/feed', label: 'Live AI Feed', icon: '◉', shortcut: 'F2' },
  { path: '/tracks', label: 'Drone Tracks', icon: '◎', shortcut: 'F3' },
  { path: '/incursions', label: 'Incursions', icon: '⚡', shortcut: 'F4' },
  { path: '/intel', label: 'Intelligence', icon: '◇', shortcut: 'F5' },
];

export default function Sidebar() {
  const connectionStatus = useKomodoStore((s) => s.connectionStatus);
  const tracks = useKomodoStore((s) => s.tracks);
  const incursions = useKomodoStore((s) => s.incursions);

  const activeTracks = tracks.filter((t) => t.status === 'active').length;
  const activeIncursions = incursions.filter((i) => i.status === 'active').length;

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>K</div>
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>KOMODO</span>
          <span className={styles.logoSub}>AIRSPACE DEFENSE</span>
        </div>
      </div>

      <div className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {item.path === '/tracks' && activeTracks > 0 && (
              <span className={styles.count}>{activeTracks}</span>
            )}
            {item.path === '/incursions' && activeIncursions > 0 && (
              <span className={`${styles.count} ${styles.countRed}`}>{activeIncursions}</span>
            )}
          </NavLink>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.status}>
          <div className={`${styles.dot} ${styles[connectionStatus]}`} />
          <span>{connectionStatus === 'connected' ? 'SYSTEM ONLINE' : connectionStatus === 'connecting' ? 'CONNECTING...' : 'OFFLINE'}</span>
        </div>
        <div className={styles.version}>v1.0.0 // UNCLASSIFIED</div>
      </div>
    </nav>
  );
}
