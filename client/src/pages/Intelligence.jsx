import { useState, useMemo } from 'react';
import useKomodoStore from '../stores/useKomodoStore';
import ThreatBadge from '../components/shared/ThreatBadge';
import Card from '../components/shared/Card';
import styles from './Intelligence.module.css';

const CATEGORY_LABELS = {
  pattern_analysis: 'PATTERN',
  frequency_detection: 'FREQ',
  behavioral_anomaly: 'BEHAVIORAL',
  network_correlation: 'NETWORK',
  historical_match: 'HISTORICAL',
  geospatial_trend: 'GEO',
};

const CATEGORY_COLORS = {
  pattern_analysis: 'var(--purple)',
  frequency_detection: 'var(--cyan)',
  behavioral_anomaly: 'var(--orange)',
  network_correlation: 'var(--blue)',
  historical_match: 'var(--yellow)',
  geospatial_trend: 'var(--green)',
};

export default function Intelligence() {
  const intelEvents = useKomodoStore((s) => s.intelEvents);
  const [filterCat, setFilterCat] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    let result = [...intelEvents];
    if (filterCat !== 'all') result = result.filter((e) => e.category === filterCat);
    if (filterPriority !== 'all') result = result.filter((e) => e.priority === filterPriority);
    return result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [intelEvents, filterCat, filterPriority]);

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)];
  const actionableCount = intelEvents.filter((e) => e.actionable).length;
  const critCount = intelEvents.filter((e) => e.priority === 'critical' || e.priority === 'high').length;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.title}>INTELLIGENCE ANALYTICS</span>
          <span className={styles.countBadge}>{intelEvents.length} events</span>
          <span className={styles.actionBadge}>{actionableCount} actionable</span>
          {critCount > 0 && <span className={styles.critBadge}>{critCount} high priority</span>}
        </div>
        <div className={styles.filters}>
          <select className={styles.select} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select className={styles.select} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className={styles.list}>
        {filtered.map((event) => (
          <Card
            key={event.id}
            className={styles.eventCard}
            onClick={() => setExpanded(expanded === event.id ? null : event.id)}
          >
            <div className={styles.eventHeader}>
              <span
                className={styles.categoryTag}
                style={{ color: CATEGORY_COLORS[event.category], borderColor: CATEGORY_COLORS[event.category] }}
              >
                {CATEGORY_LABELS[event.category] || event.category}
              </span>
              <ThreatBadge level={event.priority} small />
              {event.actionable && <span className={styles.actionableTag}>ACTIONABLE</span>}
              <span className={styles.time}>
                {new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false })}
              </span>
            </div>

            <div className={styles.eventTitle}>{event.title}</div>

            <div className={styles.eventMeta}>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>SOURCE</span> {event.source}
              </span>
              <span className={styles.metaItem}>
                <span className={styles.metaLabel}>CONF</span> {event.confidence}%
              </span>
              {event.relatedTracks.length > 0 && (
                <span className={styles.metaItem}>
                  <span className={styles.metaLabel}>TRACKS</span> {event.relatedTracks.join(', ')}
                </span>
              )}
            </div>

            {expanded === event.id && (
              <div className={styles.expandedContent}>
                <div className={styles.summary}>{event.summary}</div>
                <div className={styles.expandedId}>
                  <span className={styles.metaLabel}>EVENT ID</span> {event.id}
                </div>
              </div>
            )}
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className={styles.empty}>No intelligence events matching filter</div>
        )}
      </div>
    </div>
  );
}
