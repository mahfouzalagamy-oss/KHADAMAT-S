import { useCallback } from 'react';
import { AppNotification, PushPreferences } from '../types/khadamat';
import {
  getBrowserPushPermission,
  requestBrowserPushPermission,
  playSmartNotificationChime,
  shouldTriggerPushForType,
  triggerNativeBrowserPush,
} from '../utils/pushNotifications';

/**
 * Hook that manages push notification logic:
 * browser permission, in-app toasts, native push delivery.
 */
export function usePushNotifications({
  notifications,
  _setNotifications,
  pushPrefs,
  setPushPrefs,
  _activePushToasts,
  setActivePushToasts,
  queuedPushIdsRef,
}: {
  notifications: AppNotification[];
  _setNotifications: (val: React.SetStateAction<AppNotification[]>) => void;
  pushPrefs: PushPreferences;
  setPushPrefs: (val: React.SetStateAction<PushPreferences>) => void;
  _activePushToasts: AppNotification[];
  setActivePushToasts: (val: React.SetStateAction<AppNotification[]>) => void;
  queuedPushIdsRef: { current: Set<string> };
}) {
  const browserPermission = getBrowserPushPermission();

  /**
   * Deliver a push notification to the customer (in-app toast + native push).
   */
  const deliverCustomerPush = useCallback(
    (alert: AppNotification, forceShow = false) => {
      if (alert.recipientRole !== 'customer') return;
      if (!forceShow && !shouldTriggerPushForType(alert.type, pushPrefs)) return;

      queuedPushIdsRef.current.add(alert.id);

      setActivePushToasts((prev) => {
        if (prev.some((p) => p.id === alert.id)) return prev;
        return [alert, ...prev].slice(0, 3);
      });

      if (pushPrefs.soundEnabled) {
        playSmartNotificationChime(alert.type);
      }

      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([110, 45, 110]);
        }
      } catch {}

      if (pushPrefs.browserPushEnabled) {
        triggerNativeBrowserPush(alert);
      }
    },
    [pushPrefs, queuedPushIdsRef]
  );

  /**
   * Request browser push permission and send a test notification.
   */
  const handleRequestBrowserPermission = useCallback(async () => {
    const result = await requestBrowserPushPermission();
    if (result === 'granted') {
      const sample: AppNotification = {
        id: `notif-perm-${Date.now()}`,
        recipientRole: 'customer',
        type: 'quote_accepted',
        title: 'تم تفعيل إشعارات البوش الفورية بنجاح',
        body: 'ستصلك تنبيهات ملونة عند قبول العرض وتحرك الفني إليك وإنهاء الخدمة.',
        requestId: notifications[0]?.id || 'req-101',
        createdAt: 'الآن',
        isRead: false,
      };
      void triggerNativeBrowserPush(sample);
    }
    return result;
  }, [notifications]);

  /**
   * Dismiss a push toast by id.
   */
  const handleDismissPushToast = useCallback((id: string) => {
    setActivePushToasts((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    browserPermission,
    pushPrefs,
    setPushPrefs,
    deliverCustomerPush,
    handleRequestBrowserPermission,
    handleDismissPushToast,
  };
}
