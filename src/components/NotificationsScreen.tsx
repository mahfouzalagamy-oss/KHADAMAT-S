import { Bell, CheckCheck } from 'lucide-react';
import { AppNotification } from '../types/khadamat';

interface NotificationsScreenProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onSelectNotification: (notification: AppNotification) => void;
}

export function NotificationsScreen({
  notifications,
  onMarkAllRead,
  onSelectNotification,
}: NotificationsScreenProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 md:py-7 space-y-4 pb-14">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">
          التنبيهات
        </h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 rounded-xl transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>قراءة الكل</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
          <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            لا توجد تنبيهات
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              type="button"
              onClick={() => onSelectNotification(notif)}
              className={`w-full px-4 py-3.5 text-right flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                notif.isRead
                  ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                  : 'bg-orange-50/45 dark:bg-orange-950/35 hover:bg-orange-50/80 dark:hover:bg-orange-950/55'
              }`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {notif.title}
                  </h2>
                  {!notif.isRead && (
                    <span className="shrink-0 w-2 h-2 rounded-full bg-[#FF5A00]" aria-label="جديد" />
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-1">
                  {notif.body}
                </p>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                {notif.createdAt}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
