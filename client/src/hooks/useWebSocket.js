import { useEffect, useRef } from 'react';
import useKomodoStore from '../stores/useKomodoStore';

const WS_URL = `ws://${window.location.hostname}:4000/ws`;
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

export default function useWebSocket() {
  const wsRef = useRef(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef(null);

  const {
    setConnectionStatus,
    setTracks,
    setZones,
    updateTracks,
    addTrack,
    addFeedMessage,
    addIncursion,
    updateIncursion,
  } = useKomodoStore.getState();

  useEffect(() => {
    function connect() {
      const setStatus = useKomodoStore.getState().setConnectionStatus;
      setStatus('connecting');

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempt.current = 0;
        useKomodoStore.getState().setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);
          const store = useKomodoStore.getState();

          switch (type) {
            case 'init':
              store.setTracks(data.tracks);
              store.setZones(data.zones);
              break;
            case 'tracks_update':
              store.updateTracks(data);
              break;
            case 'new_track':
              store.addTrack(data);
              break;
            case 'feed':
              store.addFeedMessage(data);
              break;
            case 'new_incursion':
              store.addIncursion(data);
              break;
            case 'incursion_update':
              store.updateIncursion(data);
              break;
          }
        } catch (err) {
          console.error('[KOMODO] WS parse error:', err);
        }
      };

      ws.onclose = () => {
        useKomodoStore.getState().setConnectionStatus('disconnected');
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    function scheduleReconnect() {
      const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)];
      reconnectAttempt.current++;
      reconnectTimer.current = setTimeout(connect, delay);
    }

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);
}
