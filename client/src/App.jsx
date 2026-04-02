import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useKomodoStore from './stores/useKomodoStore';
import useWebSocket from './hooks/useWebSocket';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import AirspaceGrid from './pages/AirspaceGrid';
import LiveFeed from './pages/LiveFeed';
import DroneTracks from './pages/DroneTracks';
import Incursions from './pages/Incursions';
import Intelligence from './pages/Intelligence';
import styles from './App.module.css';

export default function App() {
  const fetchInitialData = useKomodoStore((s) => s.fetchInitialData);

  useWebSocket();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <BrowserRouter>
      <div className={styles.app}>
        <Sidebar />
        <div className={styles.main}>
          <TopBar />
          <div className={styles.content}>
            <Routes>
              <Route path="/" element={<AirspaceGrid />} />
              <Route path="/feed" element={<LiveFeed />} />
              <Route path="/tracks" element={<DroneTracks />} />
              <Route path="/incursions" element={<Incursions />} />
              <Route path="/intel" element={<Intelligence />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
