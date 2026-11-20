import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SetStateAction } from 'react';
import {
  CustomerTab,
  TechnicianTab,
  ServiceRequest,
  ServiceQuote,
  AppNotification,
  RequestMessage,
  RecurringSchedule,
  Technician,
  TechnicianReview,
  SavedAddress,
  LocationEntry,
  LoyaltyRedemption,
  PushPreferences,
  UserProfile,
  AccountSession,
} from '../types/khadamat';

// =========================
// TYPE DEFINITIONS
// =========================

type Setter<T> = (val: SetStateAction<T>) => void;

interface AppStore {
  // ===== Session =====
  session: AccountSession | null;
  user: UserProfile;
  district: string;
  setSession: Setter<AccountSession | null>;
  setUser: Setter<UserProfile>;
  setDistrict: Setter<string>;

  // ===== Navigation =====
  customerTab: CustomerTab;
  setCustomerTab: Setter<CustomerTab>;
  techTab: TechnicianTab;
  setTechTab: Setter<TechnicianTab>;
  requestsInitialTab: 'open' | 'active' | 'history' | 'recurring';
  setRequestsInitialTab: Setter<'open' | 'active' | 'history' | 'recurring'>;

  // ===== Data =====
  addresses: SavedAddress[];
  setAddresses: Setter<SavedAddress[]>;
  customLocations: LocationEntry[];
  setCustomLocations: Setter<LocationEntry[]>;
  technicians: Technician[];
  setTechnicians: Setter<Technician[]>;
  requests: ServiceRequest[];
  setRequests: Setter<ServiceRequest[]>;
  recurringSchedules: RecurringSchedule[];
  setRecurringSchedules: Setter<RecurringSchedule[]>;
  quotes: ServiceQuote[];
  setQuotes: Setter<ServiceQuote[]>;
  messages: RequestMessage[];
  setMessages: Setter<RequestMessage[]>;
  notifications: AppNotification[];
  setNotifications: Setter<AppNotification[]>;
  reviews: TechnicianReview[];
  setReviews: Setter<TechnicianReview[]>;
  favoriteServiceIds: string[];
  setFavoriteServiceIds: Setter<string[]>;
  loyaltyRedemptions: LoyaltyRedemption[];
  setLoyaltyRedemptions: Setter<LoyaltyRedemption[]>;

  // ===== UI State =====
  theme: 'light' | 'dark';
  setTheme: Setter<'light' | 'dark'>;
  pushPrefs: PushPreferences;
  setPushPrefs: Setter<PushPreferences>;
  browserPermission: 'default' | 'granted' | 'denied' | 'unsupported';
  setBrowserPermission: Setter<'default' | 'granted' | 'denied' | 'unsupported'>;
  activePushToasts: AppNotification[];
  setActivePushToasts: Setter<AppNotification[]>;

  // ===== Modals =====
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: Setter<boolean>;
  isRequestModalOpen: boolean;
  setIsRequestModalOpen: Setter<boolean>;
  isSmartPlannerOpen: boolean;
  setIsSmartPlannerOpen: Setter<boolean>;
  viewingTechStatsId: string | null;
  setViewingTechStatsId: Setter<string | null>;
  requestInitialService: any;
  setRequestInitialService: Setter<any>;
  requestInitialCategoryId: string | undefined;
  setRequestInitialCategoryId: Setter<string | undefined>;
  requestInitialBundle: any;
  setRequestInitialBundle: Setter<any>;
  warrantyClaimTarget: any;
  setWarrantyClaimTarget: Setter<any>;
  initialLoyaltyVoucher: LoyaltyRedemption | null;
  setInitialLoyaltyVoucher: Setter<LoyaltyRedemption | null>;
  selectedCategoryId: string;
  setSelectedCategoryId: Setter<string>;
  catalogSearchQuery: string;
  setCatalogSearchQuery: Setter<string>;

  // ===== Computed =====
  activeTechnician: () => Technician | null;
  visibleNotifications: () => AppNotification[];
  unreadNotificationsCount: () => number;
  openCustomerRequestsCount: () => number;
  acceptedTechJobsCount: () => number;
}

// =========================
// INITIAL STATE
// =========================

const initialState = {
  session: null as AccountSession | null,
  user: { name: 'عميل خدمات', phone: '01012345678', defaultDistrict: 'المنصورة' } as UserProfile,
  district: 'المنصورة' as string,
  customerTab: 'home' as CustomerTab,
  techTab: 'open_requests' as TechnicianTab,
  requestsInitialTab: 'open' as 'open' | 'active' | 'history' | 'recurring',
  addresses: [] as SavedAddress[],
  customLocations: [] as LocationEntry[],
  technicians: [] as Technician[],
  requests: [] as ServiceRequest[],
  recurringSchedules: [] as RecurringSchedule[],
  quotes: [] as ServiceQuote[],
  messages: [] as RequestMessage[],
  notifications: [] as AppNotification[],
  reviews: [] as TechnicianReview[],
  favoriteServiceIds: [] as string[],
  loyaltyRedemptions: [] as LoyaltyRedemption[],
  theme: 'light' as 'light' | 'dark',
  pushPrefs: {
    inAppBannerEnabled: true,
    browserPushEnabled: false,
    soundEnabled: true,
    quoteAccepted: true,
    techEnRoute: true,
    jobInProgress: true,
    jobCompleted: true,
    newQuote: true,
  } as PushPreferences,
  browserPermission: 'default' as 'default' | 'granted' | 'denied',
  activePushToasts: [] as AppNotification[],
  isLocationModalOpen: false,
  isRequestModalOpen: false,
  isSmartPlannerOpen: false,
  viewingTechStatsId: null as string | null,
  requestInitialService: null as any,
  requestInitialCategoryId: undefined as string | undefined,
  requestInitialBundle: null as any,
  warrantyClaimTarget: null as any,
  initialLoyaltyVoucher: null as LoyaltyRedemption | null,
  selectedCategoryId: 'all' as string,
  catalogSearchQuery: '' as string,
};

// Helper to handle SetStateAction (like React's useState)
function applySetter<T>(current: T, val: SetStateAction<T>): T {
  return typeof val === 'function' ? (val as (prev: T) => T)(current) : val;
}

// =========================
// STORE (with localStorage persist)
// =========================

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ===== Session =====
      ...initialState,

      setSession: (session) => set((state) => ({ session: applySetter(state.session, session) })),
      setUser: (user) => set((state) => ({ user: applySetter(state.user, user) })),
      setDistrict: (district) => set((state) => ({ district: applySetter(state.district, district) })),

      // ===== Navigation =====
      setCustomerTab: (customerTab) => set((state) => ({ customerTab: applySetter(state.customerTab, customerTab) })),
      setTechTab: (techTab) => set((state) => ({ techTab: applySetter(state.techTab, techTab) })),
      setRequestsInitialTab: (requestsInitialTab) =>
        set((state) => ({ requestsInitialTab: applySetter(state.requestsInitialTab, requestsInitialTab) })),

      // ===== Data =====
      setAddresses: (addresses) => set((state) => ({ addresses: applySetter(state.addresses, addresses) })),
      setCustomLocations: (customLocations) =>
        set((state) => ({ customLocations: applySetter(state.customLocations, customLocations) })),
      setTechnicians: (technicians) => set((state) => ({ technicians: applySetter(state.technicians, technicians) })),
      setRequests: (requests) => set((state) => ({ requests: applySetter(state.requests, requests) })),
      setRecurringSchedules: (recurringSchedules) =>
        set((state) => ({ recurringSchedules: applySetter(state.recurringSchedules, recurringSchedules) })),
      setQuotes: (quotes) => set((state) => ({ quotes: applySetter(state.quotes, quotes) })),
      setMessages: (messages) => set((state) => ({ messages: applySetter(state.messages, messages) })),
      setNotifications: (notifications) =>
        set((state) => ({ notifications: applySetter(state.notifications, notifications) })),
      setReviews: (reviews) => set((state) => ({ reviews: applySetter(state.reviews, reviews) })),
      setFavoriteServiceIds: (favoriteServiceIds) =>
        set((state) => ({ favoriteServiceIds: applySetter(state.favoriteServiceIds, favoriteServiceIds) })),
      setLoyaltyRedemptions: (loyaltyRedemptions) =>
        set((state) => ({ loyaltyRedemptions: applySetter(state.loyaltyRedemptions, loyaltyRedemptions) })),

      // ===== UI State =====
      setTheme: (theme) => set((state) => ({ theme: applySetter(state.theme, theme) })),
      setPushPrefs: (pushPrefs) => set((state) => ({ pushPrefs: applySetter(state.pushPrefs, pushPrefs) })),
      setBrowserPermission: (browserPermission) =>
        set((state) => ({ browserPermission: applySetter(state.browserPermission, browserPermission) })),
      setActivePushToasts: (activePushToasts) =>
        set((state) => ({ activePushToasts: applySetter(state.activePushToasts, activePushToasts) })),

      // ===== Modals =====
      setIsLocationModalOpen: (isLocationModalOpen) =>
        set((state) => ({ isLocationModalOpen: applySetter(state.isLocationModalOpen, isLocationModalOpen) })),
      setIsRequestModalOpen: (isRequestModalOpen) =>
        set((state) => ({ isRequestModalOpen: applySetter(state.isRequestModalOpen, isRequestModalOpen) })),
      setIsSmartPlannerOpen: (isSmartPlannerOpen) =>
        set((state) => ({ isSmartPlannerOpen: applySetter(state.isSmartPlannerOpen, isSmartPlannerOpen) })),
      setViewingTechStatsId: (viewingTechStatsId) =>
        set((state) => ({ viewingTechStatsId: applySetter(state.viewingTechStatsId, viewingTechStatsId) })),
      setRequestInitialService: (requestInitialService) =>
        set((state) => ({ requestInitialService: applySetter(state.requestInitialService, requestInitialService) })),
      setRequestInitialCategoryId: (requestInitialCategoryId) =>
        set((state) => ({ requestInitialCategoryId: applySetter(state.requestInitialCategoryId, requestInitialCategoryId) })),
      setRequestInitialBundle: (requestInitialBundle) =>
        set((state) => ({ requestInitialBundle: applySetter(state.requestInitialBundle, requestInitialBundle) })),
      setWarrantyClaimTarget: (warrantyClaimTarget) =>
        set((state) => ({ warrantyClaimTarget: applySetter(state.warrantyClaimTarget, warrantyClaimTarget) })),
      setInitialLoyaltyVoucher: (initialLoyaltyVoucher) =>
        set((state) => ({ initialLoyaltyVoucher: applySetter(state.initialLoyaltyVoucher, initialLoyaltyVoucher) })),
      setSelectedCategoryId: (selectedCategoryId) =>
        set((state) => ({ selectedCategoryId: applySetter(state.selectedCategoryId, selectedCategoryId) })),
      setCatalogSearchQuery: (catalogSearchQuery) =>
        set((state) => ({ catalogSearchQuery: applySetter(state.catalogSearchQuery, catalogSearchQuery) })),

      // ===== Computed =====
      activeTechnician: () => {
        const { session, technicians } = get();
        if (session?.role !== 'technician') return null;
        return technicians.find((t) => t.id === session.technicianId) || technicians[0] || null;
      },

      visibleNotifications: () => {
        const { session, notifications } = get();
        if (!session) return [];
        if (session.role === 'customer') {
          return notifications.filter((n) => n.recipientRole === 'customer');
        }
        return notifications.filter(
          (n) =>
            n.recipientRole === 'technician' &&
            (!n.recipientTechId || n.recipientTechId === session.technicianId)
        );
      },

      unreadNotificationsCount: () => {
        const { visibleNotifications } = get();
        return visibleNotifications().filter((n) => !n.isRead).length;
      },

      openCustomerRequestsCount: () => {
        const { requests } = get();
        return requests.filter(
          (r) => r.status === 'open_for_quotes' || r.status === 'quote_accepted'
        ).length;
      },

      acceptedTechJobsCount: () => {
        const { requests } = get();
        return requests.filter(
          (r) => r.status === 'in_progress' || r.status === 'completed'
        ).length;
      },
    }),
    {
      name: 'khadamat-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        district: state.district,
        addresses: state.addresses,
        customLocations: state.customLocations,
        technicians: state.technicians,
        requests: state.requests,
        recurringSchedules: state.recurringSchedules,
        quotes: state.quotes,
        messages: state.messages,
        notifications: state.notifications,
        reviews: state.reviews,
        favoriteServiceIds: state.favoriteServiceIds,
        loyaltyRedemptions: state.loyaltyRedemptions,
        theme: state.theme,
        pushPrefs: state.pushPrefs,
      }),
    }
  )
);