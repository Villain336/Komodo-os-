import AIFeed from '../components/feed/AIFeed';
import useKomodoStore from '../stores/useKomodoStore';
import styles from './LiveFeed.module.css';

export default function LiveFeed() {
  const aiFeed = useKomodoStore((s) => s.aiFeed);

  const critCount = aiFeed.filter((m) => m.severity === 'critical').length;
  const warnCount = aiFeed.filter((m) => m.severity === 'warning').length;
  const actionCount = aiFeed.filter((m) => m.actionRequired).length;

  return (
    <div className={styles.page}>
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: 'var(--text-bright)' }}>{aiFeed.length}</span>
          <span className={styles.statLabel}>TOTAL</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: 'var(--red)' }}>{critCount}</span>
          <span className={styles.statLabel}>CRITICAL</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: 'var(--yellow)' }}>{warnCount}</span>
          <span className={styles.statLabel}>WARNING</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: 'var(--orange)' }}>{actionCount}</span>
          <span className={styles.statLabel}>PENDING ACTION</span>
        </div>
      </div>
      <div className={styles.feedArea}>
        <AIFeed />
      </div>
    </div>
  );
}
