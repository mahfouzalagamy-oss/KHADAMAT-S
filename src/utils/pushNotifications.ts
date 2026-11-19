import { AppNotification, PushPreferences } from '../types/khadamat';

export const DEFAULT_PUSH_PREFERENCES: PushPreferences = {
  inAppBannerEnabled: true,
  browserPushEnabled: true,
  soundEnabled: true,
  quoteAccepted: true,
  techEnRoute: true,
  jobInProgress: true,
  jobCompleted: true,
  newQuote: true,
};

export interface NotificationVisualMeta {
  label: string;
  actionLabel: string;
  colorHex: string;
  iconBgClass: string;
  softBgClass: string;
  badgeClass: string;
  accentBorderClass: string;
  dotClass: string;
  progressBarClass: string;
  svgPath: string;
}

export function getNotificationVisualMeta(
  type: AppNotification['type']
): NotificationVisualMeta {
  switch (type) {
    case 'quote_accepted':
      return {
        label: 'الفني قبل العرض',
        actionLabel: 'عرض الطلب',
        colorHex: '#2563EB',
        iconBgClass: 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm shadow-blue-600/25',
        softBgClass: 'bg-blue-50/60 dark:bg-blue-950/35 hover:bg-blue-50/90 dark:hover:bg-blue-950/55',
        badgeClass:
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
        accentBorderClass: 'border-r-4 border-r-blue-600 dark:border-r-blue-500',
        dotClass: 'bg-blue-600 dark:bg-blue-400',
        progressBarClass: 'bg-blue-600 dark:bg-blue-400',
        svgPath:
          'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M16 11l2 2 4-4',
      };

    case 'tech_en_route':
      return {
        label: 'الفني في الطريق',
        actionLabel: 'تتبع المسار',
        colorHex: '#7C3AED',
        iconBgClass: 'bg-violet-600 dark:bg-violet-500 text-white shadow-sm shadow-violet-600/25',
        softBgClass:
          'bg-violet-50/60 dark:bg-violet-950/35 hover:bg-violet-50/90 dark:hover:bg-violet-950/55',
        badgeClass:
          'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/70 dark:text-violet-300 dark:border-violet-800',
        accentBorderClass: 'border-r-4 border-r-violet-600 dark:border-r-violet-500',
        dotClass: 'bg-violet-600 dark:bg-violet-400',
        progressBarClass: 'bg-violet-600 dark:bg-violet-400',
        svgPath: 'M3 11l19-9-9 19-2-8-8-2z',
      };

    case 'job_in_progress':
      return {
        label: 'جاري التنفيذ',
        actionLabel: 'متابعة العمل',
        colorHex: '#D97706',
        iconBgClass: 'bg-amber-500 dark:bg-amber-500 text-white shadow-sm shadow-amber-500/25',
        softBgClass:
          'bg-amber-50/60 dark:bg-amber-950/35 hover:bg-amber-50/90 dark:hover:bg-amber-950/55',
        badgeClass:
          'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
        accentBorderClass: 'border-r-4 border-r-amber-500 dark:border-r-amber-400',
        dotClass: 'bg-amber-500 dark:bg-amber-400',
        progressBarClass: 'bg-amber-500 dark:bg-amber-400',
        svgPath:
          'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
      };

    case 'job_completed':
      return {
        label: 'تم إنهاء الخدمة',
        actionLabel: 'تقييم الخدمة',
        colorHex: '#059669',
        iconBgClass: 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm shadow-emerald-600/25',
        softBgClass:
          'bg-emerald-50/60 dark:bg-emerald-950/35 hover:bg-emerald-50/90 dark:hover:bg-emerald-950/55',
        badgeClass:
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
        accentBorderClass: 'border-r-4 border-r-emerald-600 dark:border-r-emerald-500',
        dotClass: 'bg-emerald-600 dark:bg-emerald-400',
        progressBarClass: 'bg-emerald-600 dark:bg-emerald-400',
        svgPath:
          'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3',
      };

    case 'new_quote':
      return {
        label: 'عرض سعر جديد',
        actionLabel: 'مراجعة العرض',
        colorHex: '#FF5A00',
        iconBgClass: 'bg-[#FF5A00] dark:bg-orange-500 text-white shadow-sm shadow-orange-600/25',
        softBgClass:
          'bg-orange-50/55 dark:bg-orange-950/35 hover:bg-orange-50/90 dark:hover:bg-orange-950/55',
        badgeClass:
          'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800',
        accentBorderClass: 'border-r-4 border-r-[#FF5A00] dark:border-r-orange-500',
        dotClass: 'bg-[#FF5A00] dark:bg-orange-400',
        progressBarClass: 'bg-[#FF5A00] dark:bg-orange-400',
        svgPath:
          'M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z M7 7h.01',
      };

    case 'recurring_generated':
      return {
        label: 'طلب دوري مجدول',
        actionLabel: 'متابعة الجدولة',
        colorHex: '#0D9488',
        iconBgClass: 'bg-teal-600 dark:bg-teal-500 text-white shadow-sm shadow-teal-600/25',
        softBgClass:
          'bg-teal-50/55 dark:bg-teal-950/35 hover:bg-teal-50/90 dark:hover:bg-teal-950/55',
        badgeClass:
          'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800',
        accentBorderClass: 'border-r-4 border-r-teal-600 dark:border-r-teal-500',
        dotClass: 'bg-teal-600 dark:bg-teal-400',
        progressBarClass: 'bg-teal-600 dark:bg-teal-400',
        svgPath: 'M17 2l4 4-4 4 M3 11v-1a4 4 0 0 1 4-4h14 M7 22l-4-4 4-4 M21 13v1a4 4 0 0 1-4 4H3',
      };

    case 'new_message':
      return {
        label: 'رسالة جديدة',
        actionLabel: 'فتح المحادثة',
        colorHex: '#DB2777',
        iconBgClass: 'bg-pink-600 dark:bg-pink-500 text-white shadow-sm shadow-pink-600/25',
        softBgClass:
          'bg-pink-50/55 dark:bg-pink-950/35 hover:bg-pink-50/90 dark:hover:bg-pink-950/55',
        badgeClass:
          'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/70 dark:text-pink-300 dark:border-pink-800',
        accentBorderClass: 'border-r-4 border-r-pink-600 dark:border-r-pink-500',
        dotClass: 'bg-pink-600 dark:bg-pink-400',
        progressBarClass: 'bg-pink-600 dark:bg-pink-400',
        svgPath: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
      };

    case 'new_request':
    default:
      return {
        label: 'طلب خدمة جديد',
        actionLabel: 'تقديم عرض',
        colorHex: '#EA580C',
        iconBgClass: 'bg-orange-600 dark:bg-orange-500 text-white shadow-sm shadow-orange-600/25',
        softBgClass:
          'bg-orange-50/55 dark:bg-orange-950/35 hover:bg-orange-50/90 dark:hover:bg-orange-950/55',
        badgeClass:
          'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800',
        accentBorderClass: 'border-r-4 border-r-orange-600 dark:border-r-orange-500',
        dotClass: 'bg-orange-600 dark:bg-orange-400',
        progressBarClass: 'bg-orange-600 dark:bg-orange-400',
        svgPath: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
      };
  }
}

export function buildColoredPushIconSvgUrl(type: AppNotification['type']): string {
  const meta = getNotificationVisualMeta(type);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><rect width="192" height="192" rx="44" fill="${meta.colorHex}"/><g transform="translate(48,48) scale(4)" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${meta.svgPath}"/></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export type BrowserPushPermissionState =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported';

export function getBrowserPushPermission(): BrowserPushPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserPushPermission(): Promise<BrowserPushPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return Notification.permission || 'default';
  }
}

export function shouldTriggerPushForType(
  type: AppNotification['type'],
  prefs: PushPreferences
): boolean {
  switch (type) {
    case 'quote_accepted':
      return prefs.quoteAccepted;
    case 'tech_en_route':
      return prefs.techEnRoute;
    case 'job_in_progress':
      return prefs.jobInProgress;
    case 'job_completed':
      return prefs.jobCompleted;
    case 'new_quote':
      return prefs.newQuote;
    default:
      return true;
  }
}

export function playSmartNotificationChime(type: AppNotification['type']): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const freqPairs: Record<AppNotification['type'], [number, number]> = {
      quote_accepted: [587.33, 880],
      tech_en_route: [659.25, 987.77],
      job_in_progress: [523.25, 783.99],
      job_completed: [659.25, 1046.5],
      new_quote: [523.25, 659.25],
      recurring_generated: [493.88, 739.99],
      new_message: [698.46, 880],
      new_request: [523.25, 698.46],
    };

    const [f1, f2] = freqPairs[type] || [587.33, 880];

    const playNote = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.06, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    playNote(f1, 0, 0.14);
    playNote(f2, 0.11, 0.22);

    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 600);
  } catch {
    // Ignore audio context autoplay blocks
  }
}

export async function triggerNativeBrowserPush(
  notif: AppNotification,
  onNotificationClick?: () => void
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  const iconUrl = buildColoredPushIconSvgUrl(notif.type);
  const meta = getNotificationVisualMeta(notif.type);
  const tag = `khadamat-${notif.requestId}-${notif.type}`;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 500)),
      ]);
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(notif.title, {
          body: notif.body,
          icon: iconUrl,
          badge: '/pwa-192x192.png',
          tag,
          dir: 'rtl',
          lang: 'ar',
          data: {
            requestId: notif.requestId,
            type: notif.type,
            statusLabel: meta.label,
          },
        });
        return true;
      }
    }
  } catch {
    // Fallback to Notification constructor below
  }

  try {
    const n = new Notification(notif.title, {
      body: notif.body,
      icon: iconUrl,
      tag,
      dir: 'rtl',
      lang: 'ar',
    });
    n.onclick = () => {
      try {
        window.focus();
      } catch {}
      onNotificationClick?.();
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}
