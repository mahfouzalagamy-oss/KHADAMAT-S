import {
  ArrowLeft,
  Bell,
  BellRing,
  CheckCheck,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppNotification, PushPreferences, UserRole } from '../types/khadamat';
import { BrowserPushPermissionState, getNotificationVisualMeta } from '../utils/pushNotifications';
import { NotificationStatusIcon } from './NotificationStatusIcon';

type NotificationFilter =
  'all' | 'quote_accepted' | 'tech_en_route' | 'job_in_progress' | 'job_completed' | 'new_quote';

interface NotificationsScreenProps {
  role?: UserRole;
  notifications: AppNotification[];
  pushPrefs?: PushPreferences;
  browserPermission?: BrowserPushPermissionState;
  onRequestBrowserPermission?: () => Promise<void> | void;
  onUpdatePushPrefs?: (next: PushPreferences) => void;
  onSimulatePush?: (statusType: 'quote_accepted' | 'tech_en_route' | 'job_completed') => void;
  onMarkAllRead: () => void;
  onSelectNotification: (notification: AppNotification) => void;
}

const CUSTOMER_FILTERS: {
  id: NotificationFilter;
  label: string;
  dotClass?: string;
}[] = [
  { id: 'all', label: 'الكل' },
  { id: 'quote_accepted', label: 'قبول العرض', dotClass: 'bg-blue-600' },
  { id: 'tech_en_route', label: 'في الطريق', dotClass: 'bg-violet-600' },
  { id: 'job_in_progress', label: 'التنفيذ', dotClass: 'bg-amber-500' },
  { id: 'job_completed', label: 'تم الإنهاء', dotClass: 'bg-emerald-600' },
  { id: 'new_quote', label: 'العروض', dotClass: 'bg-[#FF5A00]' },
];

export function NotificationsScreen({
  role = 'customer',
  notifications,
  pushPrefs,
  browserPermission = 'default',
  onRequestBrowserPermission,
  onUpdatePushPrefs,
  onSimulatePush,
  onMarkAllRead,
  onSelectNotification,
}: NotificationsScreenProps) {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [showSettings, setShowSettings] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const togglePref = (key: keyof PushPreferences) => {
    if (!pushPrefs || !onUpdatePushPrefs) return;
    onUpdatePushPrefs({
      ...pushPrefs,
      [key]: !pushPrefs[key],
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 md:px-6 py-4 md:py-6 space-y-4 pb-10">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 truncate">
            التنبيهات
          </h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-bold bg-[#FF5A00] text-white rounded-lg tabular-nums">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {role === 'customer' && pushPrefs && onUpdatePushPrefs && (
            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              aria-expanded={showSettings}
              className={`inline-flex items-center gap-1 min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                showSettings
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>إعدادات البوش</span>
            </button>
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1 min-h-[38px] px-3 py-1.5 text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 border border-orange-200/70 dark:border-orange-800/60 rounded-xl cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>قراءة الكل</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Smart Push Control Card */}
      {role === 'customer' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/70 text-[#FF5A00] dark:text-orange-400 flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">
                  إشعارات البوش الفورية للطلبات
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {browserPermission === 'granted'
                    ? 'إشعارات النظام مفعّلة مع أيقونة ملونة لكل حالة'
                    : browserPermission === 'denied'
                      ? 'إشعارات المتصفح محجوبة — ستصلك داخل التطبيق فوراً'
                      : 'فعّل إشعارات الموبايل لمتابعة تحرك الفني لحظياً'}
                </div>
              </div>
            </div>

            {browserPermission === 'default' && onRequestBrowserPermission && (
              <button
                type="button"
                onClick={() => void onRequestBrowserPermission()}
                className="min-h-[36px] px-3 py-1.5 bg-[#FF5A00] hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
              >
                تفعيل البوش
              </button>
            )}

            {browserPermission === 'granted' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                مفعّل
              </span>
            )}
          </div>

          {/* Expandable Smart Push Settings */}
          {showSettings && pushPrefs && onUpdatePushPrefs && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <label className="inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushPrefs.inAppBannerEnabled}
                    onChange={() => togglePref('inAppBannerEnabled')}
                    className="accent-[#FF5A00] w-4 h-4 rounded"
                  />
                  <span>ظهور نافذة البوش المنبثقة</span>
                </label>

                <button
                  type="button"
                  onClick={() => togglePref('soundEnabled')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {pushPrefs.soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-[#FF5A00]" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{pushPrefs.soundEnabled ? 'النغمة مفعّلة' : 'صامت'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                {[
                  { key: 'quoteAccepted' as const, label: 'قبول العرض', dot: 'bg-blue-600' },
                  { key: 'techEnRoute' as const, label: 'في الطريق', dot: 'bg-violet-600' },
                  { key: 'jobInProgress' as const, label: 'بدء التنفيذ', dot: 'bg-amber-500' },
                  { key: 'jobCompleted' as const, label: 'إنهاء الخدمة', dot: 'bg-emerald-600' },
                  { key: 'newQuote' as const, label: 'عرض سعر', dot: 'bg-[#FF5A00]' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border cursor-pointer transition-colors ${
                      pushPrefs[item.key]
                        ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(pushPrefs[item.key])}
                      onChange={() => togglePref(item.key)}
                      className="accent-[#FF5A00] w-3.5 h-3.5 rounded shrink-0"
                    />
                    <span className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />
                    <span className="truncate">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Quick Live Push Preview Strip */}
          {onSimulatePush && (
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">
                <Sparkles className="w-3 h-3 text-[#FF5A00]" />
                <span>تجربة إشعار فوري:</span>
              </span>
              <button
                type="button"
                onClick={() => onSimulatePush('quote_accepted')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>الفني قبل العرض</span>
              </button>
              <button
                type="button"
                onClick={() => onSimulatePush('tech_en_route')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-violet-600" />
                <span>الفني في الطريق</span>
              </button>
              <button
                type="button"
                onClick={() => onSimulatePush('job_completed')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>تم إنهاء الخدمة</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* Colored Status Filter Chips */}
      {role === 'customer' && notifications.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {CUSTOMER_FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.dotClass && (
                  <span className={`w-2 h-2 rounded-full ${item.dotClass} shrink-0`} />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {filter === 'all' ? 'لا توجد تنبيهات' : 'لا توجد تنبيهات لهذه الحالة'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {filteredNotifications.map((notif) => {
            const meta = getNotificationVisualMeta(notif.type);
            return (
              <button
                key={notif.id}
                type="button"
                onClick={() => onSelectNotification(notif)}
                className={`w-full p-3.5 md:p-4 text-right flex items-start gap-3 transition-colors cursor-pointer ${
                  notif.isRead
                    ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                    : `${meta.softBgClass} ${meta.accentBorderClass}`
                }`}
              >
                <NotificationStatusIcon type={notif.type} size="md" />

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md border shrink-0 ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                      {!notif.isRead && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF5A00] dark:text-orange-400 shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                          جديد
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{notif.createdAt}</span>
                  </div>

                  <h2 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {notif.title}
                  </h2>

                  <div className="flex items-end justify-between gap-2">
                    <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {notif.body}
                    </p>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                      <span>{meta.actionLabel}</span>
                      <ArrowLeft className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
