import { ArrowLeft, BellRing, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppNotification } from '../types/khadamat';
import { getNotificationVisualMeta } from '../utils/pushNotifications';
import { NotificationStatusIcon } from './NotificationStatusIcon';

interface PushNotificationBannerProps {
  toasts: AppNotification[];
  onDismiss: (id: string) => void;
  onSelect: (notification: AppNotification) => void;
}

interface PushToastItemProps {
  notif: AppNotification;
  onDismiss: (id: string) => void;
  onSelect: (notification: AppNotification) => void;
}

function PushToastItem({ notif, onDismiss, onSelect }: PushToastItemProps) {
  const meta = getNotificationVisualMeta(notif.type);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => {
      onDismiss(notif.id);
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [notif.id, paused, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/90 shadow-xl shadow-slate-950/15 dark:shadow-black/45 ${meta.accentBorderClass} transition-all duration-200`}
    >
      <div className="p-3.5 flex items-start gap-3">
        <NotificationStatusIcon type={notif.type} size="md" />

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border ${meta.badgeClass}`}
              >
                <BellRing className="w-2.5 h-2.5 shrink-0" />
                <span>{meta.label}</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                الآن
              </span>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(notif.id)}
              aria-label="إغلاق الإشعار"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-50 leading-snug">
            {notif.title}
          </h3>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
            {notif.body}
          </p>

          <div className="pt-1 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onSelect(notif);
                onDismiss(notif.id);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white cursor-pointer transition-opacity hover:opacity-90"
              style={{ backgroundColor: meta.colorHex }}
            >
              <span>{meta.actionLabel}</span>
              <ArrowLeft className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Subtle status color bar */}
      <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full w-full ${meta.progressBarClass} opacity-80`} />
      </div>
    </div>
  );
}

export function PushNotificationBanner({
  toasts,
  onDismiss,
  onSelect,
}: PushNotificationBannerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      dir="rtl"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md space-y-2 pointer-events-none"
    >
      {toasts.slice(0, 2).map((notif) => (
        <PushToastItem
          key={notif.id}
          notif={notif}
          onDismiss={onDismiss}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
