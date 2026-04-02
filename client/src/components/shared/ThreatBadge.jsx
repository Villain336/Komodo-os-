import styles from './ThreatBadge.module.css';

const LEVEL_MAP = {
  none: { label: 'CLEAR', className: 'clear' },
  low: { label: 'LOW', className: 'low' },
  medium: { label: 'MED', className: 'medium' },
  high: { label: 'HIGH', className: 'high' },
  critical: { label: 'CRIT', className: 'critical' },
  info: { label: 'INFO', className: 'info' },
  warning: { label: 'WARN', className: 'warning' },
  emergency: { label: 'EMER', className: 'critical' },
  friendly: { label: 'FRI', className: 'clear' },
  hostile: { label: 'HOST', className: 'critical' },
  unknown: { label: 'UNK', className: 'medium' },
  pending: { label: 'PEND', className: 'low' },
  active: { label: 'ACTIVE', className: 'high' },
  neutralized: { label: 'NEUT', className: 'clear' },
  tracking: { label: 'TRACK', className: 'info' },
  monitoring: { label: 'MON', className: 'low' },
  lost: { label: 'LOST', className: 'medium' },
};

export default function ThreatBadge({ level, small }) {
  const config = LEVEL_MAP[level] || { label: level?.toUpperCase() || '—', className: 'low' };
  return (
    <span className={`${styles.badge} ${styles[config.className]} ${small ? styles.small : ''}`}>
      {config.label}
    </span>
  );
}
