import { useAppStore } from '../store/useAppStore';
import { connectRealtime, onRealtime, sendRealtime } from './realtime';

const KEYS = ['requests', 'quotes', 'messages', 'notifications', 'technicians', 'reviews'] as const;
type SyncKey = (typeof KEYS)[number];

let started = false;

/**
 * يربط مخزن Zustand بخادم WebSocket: أي تغيير محلي يُرسل لكل الأجهزة، وأي تغيير بعيد يُطبَّق محلياً.
 * عند الاتصال تُطبَّق نسخة الخادم (الأحدث)، وإن لم يكن لديه بيانات يرفع الجهاز نسخته.
 */
export function startStoreSync() {
  if (started) return;
  started = true;
  connectRealtime();

  const last: Partial<Record<SyncKey, string>> = {};
  const timers: Partial<Record<SyncKey, number>> = {};

  const apply = (key: SyncKey, remote: unknown[]) => {
    const json = JSON.stringify(remote);
    last[key] = json;
    if (json === JSON.stringify(useAppStore.getState()[key])) return;
    window.clearTimeout(timers[key]);
    useAppStore.setState({ [key]: remote } as never);
  };

  onRealtime((msg) => {
    if (msg.type === 'snapshot') {
      KEYS.forEach((key) => {
        const remote = msg.state?.[key];
        if (Array.isArray(remote)) apply(key, remote);
        else {
          const local = useAppStore.getState()[key];
          if (local.length > 0) {
            last[key] = JSON.stringify(local);
            sendRealtime({ type: 'sync', key, value: local });
          }
        }
      });
    } else if (msg.type === 'sync' && (KEYS as readonly string[]).includes(msg.key) && Array.isArray(msg.value)) {
      apply(msg.key, msg.value);
    }
  });

  useAppStore.subscribe((state, prev) => {
    KEYS.forEach((key) => {
      if (state[key] === prev[key]) return;
      const json = JSON.stringify(state[key]);
      if (json === last[key]) return;
      last[key] = json;
      window.clearTimeout(timers[key]);
      timers[key] = window.setTimeout(
        () => sendRealtime({ type: 'sync', key, value: useAppStore.getState()[key] }),
        250
      );
    });
  });
}
