import { useEffect, useRef, useCallback, useState } from 'react';
import type { SSEMessage, Decision, EnigmaState } from './types';
import { API } from './config';

const SSE_URL = `${API}/stream`;
const HISTORY_URL = `${API}/all-decisions`;
const CACHE_KEY = 'enigma-decisions';
const MAX_CACHE = 200;

function loadCache(): Decision[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCache(decisions: Decision[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(decisions.slice(-MAX_CACHE)));
  } catch { /* quota */ }
}

export function useSSE() {
  const [state, setState] = useState<EnigmaState | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>(loadCache);
  const esRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const loadedHistory = useRef(false);

  // Load full history from log file on first mount
  const loadHistory = useCallback(async () => {
    if (loadedHistory.current) return;
    loadedHistory.current = true;
    try {
      const res = await fetch(HISTORY_URL);
      if (!res.ok) return;
      const history: Decision[] = await res.json();
      if (history.length) {
        // Only take exits with P&L for the feed, plus system events
        const relevant = history.filter(d => {
          const dt = d.decision_type?.toUpperCase() ?? '';
          const exitTypes = new Set([
            'TARGET_HIT', 'STOP_LOSS', 'TRAILING_SL', 'TIME_EXIT', 'EXIT',
            'MARKET_CLOSE', 'MANUAL_SQUARE_OFF', 'REJECTION', 'MIS_SQUARE_OFF',
            'SYSTEM_START', 'SYSTEM_STOP', 'PAUSE', 'ENTRY', 'PARAM_ADJUST'
          ]);
          return exitTypes.has(dt) || d.net_pnl != null;
        });
        setDecisions(relevant.slice(-MAX_CACHE));
        saveCache(relevant.slice(-MAX_CACHE));
      }
    } catch { /* network error — SSE will catch up */ }
  }, []);

  const connect = useCallback(() => {
    esRef.current?.close();
    const es = new EventSource(SSE_URL);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data: SSEMessage = JSON.parse(e.data);
        setState(data.state);
        if (data.decisions?.length) {
          setDecisions(prev => {
            const keys = new Set(prev.map(d => d.timestamp + d.decision_type));
            const merged = [...prev];
            for (const d of data.decisions) {
              if (!keys.has(d.timestamp + d.decision_type)) merged.push(d);
            }
            const capped = merged.slice(-MAX_CACHE);
            saveCache(capped);
            return capped;
          });
        }
      } catch { /* ignore */ }
    };

    es.onerror = () => {
      es.close();
      timerRef.current = setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    loadHistory();
    connect();
    return () => {
      esRef.current?.close();
      clearTimeout(timerRef.current);
    };
  }, [connect, loadHistory]);

  return { state, decisions };
}
