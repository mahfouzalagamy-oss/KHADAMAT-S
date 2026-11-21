import { useEffect, useState } from 'react';

export type RealtimeStatus = 'offline' | 'connecting' | 'online';
type Listener = (msg: any) => void;

let socket: WebSocket | null = null;
let status: RealtimeStatus = 'offline';
let retry = 0;
let started = false;
const listeners = new Set<Listener>();
const statusListeners = new Set<(s: RealtimeStatus) => void>();

function setStatus(next: RealtimeStatus) {
  status = next;
  statusListeners.forEach((fn) => fn(next));
}

function resolveUrl(): string | null {
  const custom = (import.meta as any).env?.VITE_REALTIME_URL as string | undefined;
  if (custom) return custom;
  // GitHub Pages / ملفات محلية: لا يوجد خادم WebSocket
  if (location.protocol === 'file:' || location.hostname.endsWith('github.io')) return null;
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
}

function open() {
  const url = resolveUrl();
  if (!url) return;
  setStatus('connecting');
  try {
    socket = new WebSocket(url);
  } catch {
    return;
  }
  socket.onopen = () => {
    retry = 0;
    setStatus('online');
  };
  socket.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      listeners.forEach((fn) => fn(msg));
    } catch {
      /* رسالة غير صالحة */
    }
  };
  socket.onclose = () => {
    setStatus('offline');
    socket = null;
    retry += 1;
    window.setTimeout(open, Math.min(15000, 1000 * 2 ** Math.min(retry, 4)));
  };
  socket.onerror = () => socket?.close();
}

export function connectRealtime() {
  if (started) return;
  started = true;
  open();
}

export function sendRealtime(msg: unknown): boolean {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msg));
    return true;
  }
  return false;
}

export function onRealtime(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useRealtimeStatus(): RealtimeStatus {
  const [s, setS] = useState<RealtimeStatus>(status);
  useEffect(() => {
    statusListeners.add(setS);
    setS(status);
    return () => {
      statusListeners.delete(setS);
    };
  }, []);
  return s;
}
