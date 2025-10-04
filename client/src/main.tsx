import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

// Development: forward browser console logs to backend so they appear in server terminal
// @ts-ignore declare minimal shape for Vite import.meta.env in this file
const __env: any = (import.meta as any).env || {};
if (__env.DEV) {
  const orig: Record<string, any> = {};
  const levels: Array<keyof Console> = ['log','info','warn','error','debug'];
  const clientId = localStorage.getItem('client_log_id') || (()=>{ const id = Math.random().toString(36).slice(2); localStorage.setItem('client_log_id', id); return id; })();
  levels.forEach(l => {
    orig[l] = (console as any)[l];
    (console as any)[l] = (...args: any[]) => {
      try {
        fetch('http://localhost:8080/api/dev/client-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: l, messages: args.map(a => serialize(a)), ts: Date.now(), clientId })
        }).catch(()=>{});
      } catch {}
      orig[l](...args);
    };
  });
  function serialize(v: any) {
    if (v instanceof Error) return { error: v.message, stack: v.stack };
    try { return typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v; } catch { return String(v); }
  }
}
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);