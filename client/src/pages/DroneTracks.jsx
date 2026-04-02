import { useState, useMemo } from 'react';
import useKomodoStore from '../stores/useKomodoStore';
import ThreatBadge from '../components/shared/ThreatBadge';
import styles from './DroneTracks.module.css';

export default function DroneTracks() {
  const tracks = useKomodoStore((s) => s.tracks);
  const [sortField, setSortField] = useState('lastUpdate');
  const [sortDir, setSortDir] = useState('desc');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = useMemo(() => {
    let result = [...tracks];
    if (filterClass !== 'all') result = result.filter((t) => t.classification === filterClass);
    if (filterStatus !== 'all') result = result.filter((t) => t.status === filterStatus);
    result.sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [tracks, sortField, sortDir, filterClass, filterStatus]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => (
    sortField === field ? <span className={styles.sortIcon}>{sortDir === 'asc' ? '▲' : '▼'}</span> : null
  );

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <select className={styles.select} value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
            <option value="all">All Classes</option>
            <option value="hostile">Hostile</option>
            <option value="friendly">Friendly</option>
            <option value="unknown">Unknown</option>
            <option value="pending">Pending</option>
          </select>
          <select className={styles.select} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <div className={styles.resultCount}>
          {filtered.length} of {tracks.length} tracks
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('id')}>ID <SortIcon field="id" /></th>
              <th onClick={() => handleSort('type')}>TYPE <SortIcon field="type" /></th>
              <th onClick={() => handleSort('classification')}>CLASS <SortIcon field="classification" /></th>
              <th onClick={() => handleSort('threatLevel')}>THREAT <SortIcon field="threatLevel" /></th>
              <th onClick={() => handleSort('zone')}>ZONE <SortIcon field="zone" /></th>
              <th onClick={() => handleSort('altitude')}>ALT (m) <SortIcon field="altitude" /></th>
              <th onClick={() => handleSort('speed')}>SPD (km/h) <SortIcon field="speed" /></th>
              <th onClick={() => handleSort('heading')}>HDG <SortIcon field="heading" /></th>
              <th>SENSOR</th>
              <th onClick={() => handleSort('confidence')}>CONF <SortIcon field="confidence" /></th>
              <th onClick={() => handleSort('status')}>STATUS <SortIcon field="status" /></th>
              <th onClick={() => handleSort('lastUpdate')}>UPDATED <SortIcon field="lastUpdate" /></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((track) => (
              <tr key={track.id} className={`${styles.row} ${track.classification === 'hostile' ? styles.hostile : ''}`}>
                <td className={styles.trackId}>{track.id}</td>
                <td>{track.type}</td>
                <td><ThreatBadge level={track.classification} small /></td>
                <td><ThreatBadge level={track.threatLevel} small /></td>
                <td>{track.zone}</td>
                <td className={styles.num}>{track.altitude}</td>
                <td className={styles.num}>{track.speed}</td>
                <td className={styles.num}>{Math.round(track.heading)}°</td>
                <td className={styles.sensor}>{track.sensorSource}</td>
                <td className={styles.num}>{track.confidence}%</td>
                <td><ThreatBadge level={track.status} small /></td>
                <td className={styles.time}>{new Date(track.lastUpdate).toLocaleTimeString('en-US', { hour12: false })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
