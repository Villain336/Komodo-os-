import ThreatBadge from '../shared/ThreatBadge';
import styles from './FeedMessage.module.css';

const SEVERITY_COLORS = {
  critical: 'var(--red)',
  warning: 'var(--yellow)',
  info: 'var(--blue)',
};

export default function FeedMessage({ message, compact }) {
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', { hour12: false });
  const borderColor = SEVERITY_COLORS[message.severity] || SEVERITY_COLORS.info;

  return (
    <div
      className={`${styles.message} ${compact ? styles.compact : ''}`}
      style={{ borderLeftColor: borderColor }}
    >
      <div className={styles.meta}>
        <ThreatBadge level={message.severity} small />
        <span className={styles.source}>{message.source}</span>
        <span className={styles.time}>{time}</span>
        {message.relatedTrack && (
          <span className={styles.track}>{message.relatedTrack}</span>
        )}
      </div>
      <div className={styles.text}>{message.message}</div>
      {message.actionRequired && (
        <div className={styles.action}>
          <span className={styles.actionIcon}>▸</span>
          ACTION REQUIRED — AWAITING OPERATOR AUTHORIZATION
        </div>
      )}
    </div>
  );
}
