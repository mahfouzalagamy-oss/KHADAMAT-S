import { useEffect, useRef, useState } from 'react';
import type { AppNotification } from '../types/khadamat';

/** إشعارات المتصفح + اهتزاز + توست داخل التطبيق عند وصول تنبيه جديد. */
export function useSystemNotifications(items: AppNotification[]) {
  const seen = useRef<Set<string> | null>(null);
  const [toast, setToast] = useState<AppNotification | null>(null);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    const ask = () => void Notification.requestPermission();
    window.addEventListener('pointerdown', ask, { once: true });
    return () => window.removeEventListener('pointerdown', ask);
  }, []);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(items.map((n) => n.id));
      return;
    }
    const fresh = items.filter((n) => !n.isRead && !seen.current!.has(n.id));
    items.forEach((n) => seen.current!.add(n.id));
    if (fresh.length === 0) return;
    const latest = fresh[0];
    setToast(latest);
    navigator.vibrate?.(200);
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      try {
        new Notification(latest.title, { body: latest.body, tag: latest.id, dir: 'rtl', lang: 'ar' });
      } catch {
        /* بعض المتصفحات تتطلب service worker */
      }
    }
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [items]);

  return { toast, dismissToast: () => setToast(null) };
}
