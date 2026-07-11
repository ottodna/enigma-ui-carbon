// Both containers share host networking on VPS
const API = 'http://localhost:9090/api';

export async function fetchState() {
  const res = await fetch(`${API}/state`);
  return res.json();
}

export async function fetchHistory() {
  const res = await fetch(`${API}/history`);
  return res.json();
}

export async function controlAction(action: string, params?: Record<string, unknown>) {
  const res = await fetch(`${API}/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  return res.json();
}
