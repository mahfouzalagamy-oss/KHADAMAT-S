import { useEffect, useRef } from 'react';
import { onRealtime, sendRealtime } from './realtime';

/**
 * يزامن مصفوفة حالة (طلبات/عروض/تنبيهات…) مع الخادم لحظياً بين كل الأجهزة.
 * الدمج حسب id (آخر كاتب يفوز لنفس العنصر).
 */
export function useRealtimeSync<T extends { id: string }>(
  key: string,
  value: T[],
  setValue: (v: T[]) => void
) {
  const valueRef = useRef(value);
  valueRef.current = value;
  const lastJson = useRef(JSON.stringify(value));
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const apply = (remote: T[]) => {
      const json = JSON.stringify(remote);
      if (json === JSON.stringify(valueRef.current)) return;
      if (timer.current) window.clearTimeout(timer.current);
      lastJson.current = json;
      setValue(remote);
    };
    return onRealtime((msg) => {
      if (msg.type === 'snapshot') {
        if (Array.isArray(msg.state?.[key])) apply(msg.state[key]);
        else if (valueRef.current.length > 0) {
          lastJson.current = JSON.stringify(valueRef.current);
          sendRealtime({ type: 'sync', key, value: valueRef.current });
        }
      } else if (msg.type === 'sync' && msg.key === key && Array.isArray(msg.value)) {
        apply(msg.value);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    const json = JSON.stringify(value);
    if (json === lastJson.current) return;
    lastJson.current = json;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => sendRealtime({ type: 'sync', key, value }), 250);
  }, [key, value]);
}
