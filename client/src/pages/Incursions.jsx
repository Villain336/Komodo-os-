import { useState } from 'react';
import useKomodoStore from '../stores/useKomodoStore';
import ThreatBadge from '../components/shared/ThreatBadge';
import ActionButton from '../components/shared/ActionButton';
import Card from '../components/shared/Card';
import styles from './Incursions.module.css';

export default function Incursions() {
  const incursions = useKomodoStore((s) => s.incursions);
  const executeAction = useKomodoStore((s) => s.executeAction);
  const [executing, setExecuting] = useState(null);
  const [filterSev, setFilterSev] = useState('all');

  const filtered = filterSev === 'all'
    ? incursions
    : incursions.filter((i) => i.severity === filterSev);

  const handleAction = async (id, action) => {
    setExecuting(`${id}-${action}`);
    await executeAction(id, action);
    setExecuting(null);
  };

  const activeCount = incursions.filter((i) => i.status === 'active').length;
  const critCount = incursions.filter((i) => i.severity === 'critical' || i.severity === 'emergency').length;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.title}>ACTIVE INCURSIONS</span>
          <span className={styles.countBadge}>{activeCount}</span>
          {critCount > 0 && <span className={styles.critBadge}>{critCount} CRITICAL</span>}
        </div>
        <div className={styles.filters}>
          {['all', 'emergency', 'critical', 'warning'].map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filterSev === f ? styles.active : ''}`}
              onClick={() => setFilterSev(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {filtered.map((inc) => (
          <Card key={inc.id} severity={inc.severity}>
            <div className={styles.cardHeader}>
              <span className={styles.incId}>{inc.id}</span>
              <ThreatBadge level={inc.severity} />
              <ThreatBadge level={inc.status} small />
            </div>

            <div className={styles.description}>{inc.description}</div>

            <div className={styles.details}>
              <div className={styles.detail}>
                <span className={styles.label}>ZONE</span>
                <span className={styles.value}>{inc.zone}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>CONFIDENCE</span>
                <span className={styles.value}>{inc.confidence}%</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>DRONE TYPE</span>
                <span className={styles.value}>{inc.droneType}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>DIRECTION</span>
                <span className={styles.value}>{inc.direction?.toUpperCase()}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>ALTITUDE</span>
                <span className={styles.value}>{inc.altitude}m AGL</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>SPEED</span>
                <span className={styles.value}>{inc.speed} km/h</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>SENSORS</span>
                <span className={styles.value}>{inc.sensorSources?.join(', ')}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>DETECTED</span>
                <span className={styles.value}>{new Date(inc.detectedAt).toLocaleTimeString('en-US', { hour12: false })}</span>
              </div>
            </div>

            <div className={styles.recommend}>
              <span className={styles.recommendLabel}>AI RECOMMENDATION</span>
              <span className={styles.recommendText}>{inc.recommendedAction}</span>
            </div>

            {inc.status === 'active' && (
              <div className={styles.actions}>
                <ActionButton action="jam" onClick={() => handleAction(inc.id, 'neutralize')} disabled={executing === `${inc.id}-neutralize`} />
                <ActionButton action="intercept" onClick={() => handleAction(inc.id, 'intercept')} disabled={executing === `${inc.id}-intercept`} />
                <ActionButton action="track" onClick={() => handleAction(inc.id, 'track')} disabled={executing === `${inc.id}-track`} />
                <ActionButton action="monitor" onClick={() => handleAction(inc.id, 'monitor')} disabled={executing === `${inc.id}-monitor`} />
              </div>
            )}

            {inc.responseAction && (
              <div className={styles.response}>
                RESPONSE: {inc.responseAction.toUpperCase()} — {inc.status.toUpperCase()}
              </div>
            )}
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className={styles.empty}>No incursions matching filter</div>
        )}
      </div>
    </div>
  );
}
