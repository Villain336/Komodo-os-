import { useEffect, useRef } from 'react';
import useKomodoStore from '../../stores/useKomodoStore';
import FeedMessage from './FeedMessage';
import styles from './AIFeed.module.css';

export default function AIFeed({ compact }) {
  const aiFeed = useKomodoStore((s) => s.aiFeed);
  const feedFilter = useKomodoStore((s) => s.feedFilter);
  const setFeedFilter = useKomodoStore((s) => s.setFeedFilter);
  const feedRef = useRef(null);
  const autoScroll = useRef(true);

  const filtered = feedFilter === 'all'
    ? aiFeed
    : aiFeed.filter((m) => m.severity === feedFilter);

  useEffect(() => {
    if (autoScroll.current && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [aiFeed]);

  const filters = ['all', 'critical', 'warning', 'info'];

  return (
    <div className={`${styles.feed} ${compact ? styles.compact : ''}`}>
      {!compact && (
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>◉</span>
            <span className={styles.headerTitle}>AGENTIC AI FEED</span>
            <span className={styles.headerCount}>{aiFeed.length} messages</span>
          </div>
          <div className={styles.filters}>
            {filters.map((f) => (
              <button
                key={f}
                className={`${styles.filterBtn} ${feedFilter === f ? styles.filterActive : ''} ${f !== 'all' ? styles[`filter_${f}`] : ''}`}
                onClick={() => setFeedFilter(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
      <div
        className={styles.messages}
        ref={feedRef}
        onScroll={(e) => {
          autoScroll.current = e.target.scrollTop < 10;
        }}
      >
        {filtered.length === 0 ? (
          <div className={styles.empty}>No messages matching filter</div>
        ) : (
          filtered.map((msg) => (
            <FeedMessage key={msg.id} message={msg} compact={compact} />
          ))
        )}
      </div>
    </div>
  );
}
