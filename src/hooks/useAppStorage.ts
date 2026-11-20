import { useEffect, useRef, useState } from 'react';
import {
  AccountSession,
  AppNotification,
  LocationEntry,
  LoyaltyRedemption,
  PushPreferences,
  RecurringSchedule,
  RequestMessage,
  SavedAddress,
  ServiceQuote,
  ServiceRequest,
  Technician,
  TechnicianReview,
  UserProfile,
} from '../types/khadamat';

/**
 * Storage keys used across the app.
 * Centralized to avoid typos and allow renaming later.
 */
export const STORAGE_KEYS = {
  session: 'khadamat_v2_session',
  user: 'khadamat_v2_user',
  customers: 'khadamat_v2_customers',
  addresses: 'khadamat_v2_addresses',
  customLocations: 'khadamat_v2_custom_locations',
  technicians: 'khadamat_v2_technicians',
  requests: 'khadamat_v2_requests',
  recurringSchedules: 'khadamat_v2_recurring_schedules',
  quotes: 'khadamat_v2_quotes',
  messages: 'khadamat_v2_messages',
  notifications: 'khadamat_v2_notifications',
  reviews: 'khadamat_v2_reviews',
  theme: 'khadamat_v2_theme',
  favoriteServiceIds: 'khadamat_v2_favorite_services',
  loyaltyRedemptions: 'khadamat_v2_loyalty_redemptions',
  pushPrefs: 'khadamat_v2_push_prefs',
} as const;

/**
 * Generic localStorage loader with safe JSON parsing.
 */
export function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Hook that persists a state value to localStorage on change.
 * Returns [value, setValue] just like useState, but auto-syncs to storage.
 * setValue accepts both direct value or updater function (prev => newValue).
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => loadStored<T>(key, initialValue));

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage may be unavailable (e.g., private mode)
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * Hook that exposes all persisted app data as a single object,
 * plus a setter for each individual key.
 *
 * This centralizes storage logic so App.tsx stays thin.
 */
export function useAppStorage() {
  const [session, setSession] = usePersistedState<AccountSession | null>(
    STORAGE_KEYS.session,
    null
  );
  const [user, setUser] = usePersistedState<UserProfile>(STORAGE_KEYS.user, {
    name: 'عميل خدمات',
    phone: '01012345678',
    defaultDistrict: 'المنصورة',
  });
  const [addresses, setAddresses] = usePersistedState<SavedAddress[]>(STORAGE_KEYS.addresses, []);
  const [customLocations, setCustomLocations] = usePersistedState<LocationEntry[]>(
    STORAGE_KEYS.customLocations,
    []
  );
  const [technicians, setTechnicians] = usePersistedState<Technician[]>(
    STORAGE_KEYS.technicians,
    []
  );
  const [requests, setRequests] = usePersistedState<ServiceRequest[]>(STORAGE_KEYS.requests, []);
  const [recurringSchedules, setRecurringSchedules] = usePersistedState<RecurringSchedule[]>(
    STORAGE_KEYS.recurringSchedules,
    []
  );
  const [quotes, setQuotes] = usePersistedState<ServiceQuote[]>(STORAGE_KEYS.quotes, []);
  const [messages, setMessages] = usePersistedState<RequestMessage[]>(STORAGE_KEYS.messages, []);
  const [notifications, setNotifications] = usePersistedState<AppNotification[]>(
    STORAGE_KEYS.notifications,
    []
  );
  const [reviews, setReviews] = usePersistedState<TechnicianReview[]>(STORAGE_KEYS.reviews, []);
  const [theme, setTheme] = usePersistedState<'light' | 'dark'>(STORAGE_KEYS.theme, 'light');
  const [favoriteServiceIds, setFavoriteServiceIds] = usePersistedState<string[]>(
    STORAGE_KEYS.favoriteServiceIds,
    []
  );
  const [loyaltyRedemptions, setLoyaltyRedemptions] = usePersistedState<LoyaltyRedemption[]>(
    STORAGE_KEYS.loyaltyRedemptions,
    []
  );
  const [pushPrefs, setPushPrefs] = usePersistedState<PushPreferences>(STORAGE_KEYS.pushPrefs, {
    inAppBannerEnabled: true,
    browserPushEnabled: false,
    soundEnabled: true,
    quoteAccepted: true,
    techEnRoute: true,
    jobInProgress: true,
    jobCompleted: true,
    newQuote: true,
  });

  // Keep a ref for quote simulation timers to avoid stale closures
  const quotesRef = useRef<ServiceQuote[]>(quotes);
  const requestsRef = useRef<ServiceRequest[]>(requests);

  useEffect(() => {
    quotesRef.current = quotes;
  }, [quotes]);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  return {
    // State
    session,
    setSession,
    user,
    setUser,
    addresses,
    setAddresses,
    customLocations,
    setCustomLocations,
    technicians,
    setTechnicians,
    requests,
    setRequests,
    recurringSchedules,
    setRecurringSchedules,
    quotes,
    setQuotes,
    messages,
    setMessages,
    notifications,
    setNotifications,
    reviews,
    setReviews,
    theme,
    setTheme,
    favoriteServiceIds,
    setFavoriteServiceIds,
    loyaltyRedemptions,
    setLoyaltyRedemptions,
    pushPrefs,
    setPushPrefs,
    quotesRef,
    requestsRef,
    STORAGE_KEYS,
  };
}
