import { useEffect, useRef, useCallback, useState } from 'react';
import type { SSEMessage, Decision, EnigmaState } from './types';

const SSE_URL = 'http://localhost:9090/api/stream';
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
    connect();
    return () => {
      esRef.current?.close();
      clearTimeout(timerRef.current);
    };
  }, [connect]);

  return { state, decisions };
}
