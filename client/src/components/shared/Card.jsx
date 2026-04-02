import styles from './Card.module.css';

export default function Card({ children, className, severity, onClick, noPad }) {
  return (
    <div
      className={`${styles.card} ${severity ? styles[severity] : ''} ${onClick ? styles.clickable : ''} ${noPad ? styles.noPad : ''} ${className || ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
