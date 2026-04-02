import styles from './ActionButton.module.css';

const VARIANTS = {
  jam: { label: 'RF JAM', icon: '⚡', className: 'danger' },
  intercept: { label: 'INTERCEPT', icon: '◎', className: 'danger' },
  track: { label: 'TRACK', icon: '◉', className: 'warning' },
  monitor: { label: 'MONITOR', icon: '◈', className: 'info' },
  neutralize: { label: 'NEUTRALIZE', icon: '✕', className: 'danger' },
  authorize: { label: 'AUTHORIZE', icon: '✓', className: 'success' },
  dismiss: { label: 'DISMISS', icon: '—', className: 'muted' },
};

export default function ActionButton({ action, onClick, disabled, small }) {
  const config = VARIANTS[action] || { label: action?.toUpperCase(), icon: '•', className: 'info' };
  return (
    <button
      className={`${styles.btn} ${styles[config.className]} ${small ? styles.small : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.icon}>{config.icon}</span>
      {config.label}
    </button>
  );
}
