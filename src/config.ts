// API base URL for Flask backend
// In development (Vite dev server): proxied via vite.config.ts → localhost:9090
// In production (Docker container): must reach Flask on the VPS
// Both containers use host networking, so localhost works server-side
// But browser-side, use the VPS Tailscale IP to reach Flask

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Dev: use relative path (proxied by Vite)
// Prod: use the VPS IP — browser needs to reach Flask on the VPS, not local machine
const VPS_IP = '100.113.216.52';
export const API = isDev ? '/api' : `http://${VPS_IP}:9090/api`;
