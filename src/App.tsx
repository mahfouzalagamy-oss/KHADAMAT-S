import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthLoginScreen } from './components/AuthLoginScreen';
import { BottomNav } from './components/BottomNav';
import { BrandWordmark } from './components/BrandWordmark';
import { CategoriesScreen } from './components/CategoriesScreen';
import { CustomerProfileScreen } from './components/CustomerProfileScreen';
import { CustomerRequestsScreen } from './components/CustomerRequestsScreen';
import { HomeScreen } from './components/HomeScreen';
import { LocationModal } from './components/LocationModal';
import { NotificationsScreen } from './components/NotificationsScreen';
import { OfflineIndicator } from './components/PWAInstallBanner';
import { RequestServiceModal, RoutingPreview } from './components/RequestServiceModal';
import { SmartPlannerModal } from './components/SmartPlannerModal';
import { TechnicianPortalScreen } from './components/TechnicianPortalScreen';
import { TechnicianReviewsModal } from './components/TechnicianReviewsModal';
import { TechnicianStatsScreen } from './components/TechnicianStatsScreen';
import { TopBar } from './components/TopBar';
import {
  DEFAULT_DAKAHLIA_DISTRICT,
  EGYPT_LOCATIONS,
  createCustomLocationEntry,
  findNearestMatchingTechnicians,
  getLocationMeta,
} from './data/dakahliaLocations';
import {
  INITIAL_ADDRESSES,
  INITIAL_CUSTOMERS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_QUOTES,
  INITIAL_RECURRING_SCHEDULES,
  INITIAL_REQUESTS,
  INITIAL_TECHNICIAN_REVIEWS,
  INITIAL_USER,
  KHADAMAT_BONUS_POINTS_FOR_RATING,
  KHADAMAT_POINTS_PER_COMPLETED_ORDER,
  SERVICES_CATALOG,
  VERIFIED_TECHNICIANS,
  addRecurrenceIntervalISO,
  computeCustomerPointsSummary,
  computeTechnicianStats,
  formatEGP,
  getPaymentMethodLabel,
  getRecurrenceLabel,
  getTodayISO,
  parseWarrantyDaysFromLabel,
} from './data/khadamatData';
import {
  AccountSession,
  AppNotification,
  CustomerTab,
  LocationEntry,
  LoyaltyRedemption,
  LoyaltyRewardTier,
  PaymentMethod,
  RecurrenceFrequency,
  RecurringSchedule,
  RegisteredCustomer,
  RequestMessage,
  SavedAddress,
  SeasonalBundle,
  ServiceItem,
  ServiceQuote,
  ServiceRequest,
  Technician,
  TechnicianReview,
  TechnicianTab,
  UserProfile,
  UserRole,
} from './types/khadamat';

const STORAGE_KEYS = {
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
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [session, setSession] = useState<AccountSession | null>(() =>
    loadStored<AccountSession | null>(STORAGE_KEYS.session, null)
  );
  const [user, setUser] = useState<UserProfile>(() => {
    const stored = loadStored<UserProfile>(STORAGE_KEYS.user, INITIAL_USER);
    if (!stored.defaultDistrict?.startsWith('الدقهلية')) {
      return { ...stored, defaultDistrict: DEFAULT_DAKAHLIA_DISTRICT };
    }
    return stored;
  });
  const [customers, setCustomers] = useState<RegisteredCustomer[]>(() =>
    loadStored<RegisteredCustomer[]>(STORAGE_KEYS.customers, INITIAL_CUSTOMERS)
  );
  const [customLocations, setCustomLocations] = useState<LocationEntry[]>(() =>
    loadStored<LocationEntry[]>(STORAGE_KEYS.customLocations, [])
  );
  const [district, setDistrict] = useState<string>(user.defaultDistrict);
  const [addresses, setAddresses] = useState<SavedAddress[]>(() =>
    loadStored<SavedAddress[]>(STORAGE_KEYS.addresses, INITIAL_ADDRESSES)
  );
  const [technicians, setTechnicians] = useState<Technician[]>(() => {
    const stored = loadStored<Technician[]>(
      STORAGE_KEYS.technicians,
      VERIFIED_TECHNICIANS
    );
    const hydrated = stored.map((t) => {
      const seed = VERIFIED_TECHNICIANS.find((s) => s.id === t.id);
      return {
        ...t,
        primaryCenter: t.primaryCenter || seed?.primaryCenter || 'المنصورة',
        coveredCenters: t.coveredCenters || seed?.coveredCenters || ['المنصورة'],
        coveredAreas: t.coveredAreas || seed?.coveredAreas || [t.area],
        isVerifiedDocs: t.isVerifiedDocs ?? true,
        isPhoneVerified: t.isPhoneVerified ?? true,
      };
    });
    const missingSeeds = VERIFIED_TECHNICIANS.filter(
      (seed) => !hydrated.some((t) => t.id === seed.id)
    );
    return [...hydrated, ...missingSeeds];
  });
  const [requests, setRequests] = useState<ServiceRequest[]>(() => {
    const stored = loadStored<ServiceRequest[]>(
      STORAGE_KEYS.requests,
      INITIAL_REQUESTS
    );
    return stored.map((r) => {
      const seed = INITIAL_REQUESTS.find((s) => s.id === r.id);
      return {
        ...r,
        paymentMethod: r.paymentMethod || 'cash',
        createdAtTimestamp:
          r.createdAtTimestamp ??
          (r.status === 'open_for_quotes' ? Date.now() - 12 * 60 * 1000 : undefined),
        completedAtTimestamp:
          r.completedAtTimestamp ??
          seed?.completedAtTimestamp ??
          (r.status === 'completed' ? Date.now() - 3 * 24 * 60 * 60 * 1000 : undefined),
        warrantyDays: r.warrantyDays ?? seed?.warrantyDays,
      };
    });
  });
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringSchedule[]>(
    () =>
      loadStored<RecurringSchedule[]>(
        STORAGE_KEYS.recurringSchedules,
        INITIAL_RECURRING_SCHEDULES
      )
  );
  const processedCycleKeysRef = useRef<Set<string>>(new Set());
  const [quotes, setQuotes] = useState<ServiceQuote[]>(() =>
    loadStored<ServiceQuote[]>(STORAGE_KEYS.quotes, INITIAL_QUOTES)
  );
  const [messages, setMessages] = useState<RequestMessage[]>(() =>
    loadStored<RequestMessage[]>(STORAGE_KEYS.messages, INITIAL_MESSAGES)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadStored<AppNotification[]>(STORAGE_KEYS.notifications, INITIAL_NOTIFICATIONS)
  );
  const [reviews, setReviews] = useState<TechnicianReview[]>(() =>
    loadStored<TechnicianReview[]>(STORAGE_KEYS.reviews, INITIAL_TECHNICIAN_REVIEWS)
  );

  // Navigation & Modal State
  const [customerTab, setCustomerTab] = useState<CustomerTab>('home');
  const [requestsInitialTab, setRequestsInitialTab] = useState<'open' | 'active' | 'history' | 'recurring'>('open');
  const [techTab, setTechTab] = useState<TechnicianTab>('open_requests');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [viewingTechStatsId, setViewingTechStatsId] = useState<string | null>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestInitialService, setRequestInitialService] = useState<ServiceItem | null>(
    null
  );
  const [requestInitialCategoryId, setRequestInitialCategoryId] = useState<
    string | undefined
  >(undefined);
  const [requestInitialBundle, setRequestInitialBundle] =
    useState<SeasonalBundle | null>(null);
  const [warrantyClaimTarget, setWarrantyClaimTarget] = useState<{
    originalRequest: ServiceRequest;
    technicianName?: string;
    warrantyDays: number;
  } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = loadStored<string>(STORAGE_KEYS.theme, 'light');
    return stored === 'dark' ? 'dark' : 'light';
  });
  const [favoriteServiceIds, setFavoriteServiceIds] = useState<string[]>(() =>
    loadStored<string[]>(STORAGE_KEYS.favoriteServiceIds, [])
  );
  const [loyaltyRedemptions, setLoyaltyRedemptions] = useState<LoyaltyRedemption[]>(
    () => loadStored<LoyaltyRedemption[]>(STORAGE_KEYS.loyaltyRedemptions, [])
  );
  const [initialLoyaltyVoucher, setInitialLoyaltyVoucher] =
    useState<LoyaltyRedemption | null>(null);
  const [isSmartPlannerOpen, setIsSmartPlannerOpen] = useState(false);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#020617' : '#ea580c');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme));
    } catch {}
  }, [theme]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    } catch {}
  }, [session]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    } catch {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers));
    } catch {}
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.customLocations,
        JSON.stringify(customLocations)
      );
    } catch {}
  }, [customLocations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.addresses, JSON.stringify(addresses));
    } catch {}
  }, [addresses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.technicians, JSON.stringify(technicians));
    } catch {}
  }, [technicians]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.requests, JSON.stringify(requests));
    } catch {}
  }, [requests]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.recurringSchedules,
        JSON.stringify(recurringSchedules)
      );
    } catch {}
  }, [recurringSchedules]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.quotes, JSON.stringify(quotes));
    } catch {}
  }, [quotes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
    } catch {}
  }, [reviews]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.favoriteServiceIds,
        JSON.stringify(favoriteServiceIds)
      );
    } catch {}
  }, [favoriteServiceIds]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.loyaltyRedemptions,
        JSON.stringify(loyaltyRedemptions)
      );
    } catch {}
  }, [loyaltyRedemptions]);

  const handleToggleFavoriteService = useCallback((serviceId: string) => {
    setFavoriteServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [serviceId, ...prev]
    );
  }, []);

  const allLocations = useMemo(
    () => [...customLocations, ...EGYPT_LOCATIONS],
    [customLocations]
  );

  const activeTechnician = useMemo(() => {
    if (session?.role !== 'technician') return null;
    return technicians.find((t) => t.id === session.technicianId) || technicians[0];
  }, [session, technicians]);

  const visibleNotifications = useMemo(() => {
    if (!session) return [];
    if (session.role === 'customer') {
      return notifications.filter((n) => n.recipientRole === 'customer');
    }
    return notifications.filter(
      (n) =>
        n.recipientRole === 'technician' &&
        (!n.recipientTechId || n.recipientTechId === session.technicianId)
    );
  }, [notifications, session]);

  const unreadNotificationsCount = visibleNotifications.filter((n) => !n.isRead).length;

  const openCustomerRequestsCount = requests.filter(
    (r) =>
      r.status === 'open_for_quotes' ||
      r.status === 'quote_accepted' ||
      r.status === 'en_route' ||
      r.status === 'in_progress'
  ).length;

  const acceptedTechJobsCount = useMemo(() => {
    if (!activeTechnician) return 0;
    return requests.filter((r) => {
      if (
        r.status !== 'quote_accepted' &&
        r.status !== 'en_route' &&
        r.status !== 'in_progress'
      ) {
        return false;
      }
      const accepted = quotes.find(
        (q) => q.id === r.acceptedQuoteId || (q.requestId === r.id && q.status === 'accepted')
      );
      return accepted?.technicianId === activeTechnician.id;
    }).length;
  }, [activeTechnician, requests, quotes]);

  const handleLogin = (
    nextSession: AccountSession,
    newTech?: Technician,
    newCustomer?: RegisteredCustomer
  ) => {
    if (newTech) {
      setTechnicians((prev) => [newTech, ...prev]);
    }
    if (newCustomer) {
      setCustomers((prev) => {
        const exists = prev.some((c) => c.phone === newCustomer.phone);
        return exists ? prev : [newCustomer, ...prev];
      });
    }
    if (nextSession.role === 'customer') {
      setUser(nextSession.customer);
      setDistrict(nextSession.customer.defaultDistrict);
      setCustomerTab('home');
    } else {
      setTechTab('open_requests');
    }
    setSession(nextSession);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchAccount = () => {
    setSession(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddCustomLocation = (center: string, name: string): LocationEntry | null => {
    const entry = createCustomLocationEntry(center, name);
    setCustomLocations((prev) => {
      if (prev.some((l) => l.displayLabel === entry.displayLabel)) return prev;
      return [entry, ...prev];
    });
    return entry;
  };

  const handleDistrictChange = (nextDistrict: string) => {
    setDistrict(nextDistrict);
    setUser((prev) => ({ ...prev, defaultDistrict: nextDistrict }));

    if (session?.role === 'technician' && activeTechnician) {
      const meta = getLocationMeta(nextDistrict, allLocations);
      setTechnicians((prev) =>
        prev.map((t) => {
          if (t.id !== activeTechnician.id) return t;
          const nextCenters = Array.from(new Set([meta.center, ...t.coveredCenters]));
          const nextAreas = Array.from(
            new Set([nextDistrict, meta.areaName, ...t.coveredAreas])
          );
          return {
            ...t,
            area: `${nextDistrict}${t.coveredCenters.length > 1 ? ` · (${nextCenters.join('، ')})` : ''}`,
            primaryCenter: meta.center,
            coveredCenters: nextCenters,
            coveredAreas: nextAreas,
          };
        })
      );
    }
  };

  const getRoutingPreview = useCallback(
    (catId: string): RoutingPreview => {
      const routing = findNearestMatchingTechnicians(
        catId,
        district,
        technicians,
        allLocations
      );
      return {
        matchType: routing.matchType,
        notifiedCount: routing.targets.length,
        nearestCenterName: routing.nearestCenterName,
        minDistanceKm: routing.minDistanceKm,
      };
    },
    [district, technicians, allLocations]
  );

  const handleOpenRequestModal = (service?: ServiceItem, categoryId?: string) => {
    setWarrantyClaimTarget(null);
    setInitialLoyaltyVoucher(null);
    setRequestInitialBundle(null);
    setRequestInitialService(service || null);
    setRequestInitialCategoryId(categoryId || service?.categoryId);
    setIsRequestModalOpen(true);
  };

  const handleRequestBundle = (bundle: SeasonalBundle) => {
    const matchedService =
      SERVICES_CATALOG.find((s) => s.id === bundle.serviceId) || null;
    setWarrantyClaimTarget(null);
    setInitialLoyaltyVoucher(null);
    setRequestInitialBundle(bundle);
    setRequestInitialService(matchedService);
    setRequestInitialCategoryId(bundle.categoryId);
    setIsRequestModalOpen(true);
  };

  const handleRedeemPoints = (reward: LoyaltyRewardTier) => {
    const summary = computeCustomerPointsSummary(requests, loyaltyRedemptions);
    if (summary.availablePoints < reward.pointsCost) return;

    const newRedemption: LoyaltyRedemption = {
      id: `loy-${Date.now()}`,
      rewardId: reward.id,
      title: reward.title,
      pointsSpent: reward.pointsCost,
      discountEGP: reward.discountEGP,
      promoCode: reward.promoCode,
      redeemedAt: 'الآن',
      isUsed: false,
    };
    setLoyaltyRedemptions((prev) => [newRedemption, ...prev]);
  };

  const handleUseLoyaltyVoucher = (voucher: LoyaltyRedemption) => {
    setWarrantyClaimTarget(null);
    setRequestInitialBundle(null);
    setRequestInitialService(null);
    setRequestInitialCategoryId(undefined);
    setInitialLoyaltyVoucher(voucher);
    setIsRequestModalOpen(true);
  };

  const handleRequestWarrantyCheck = (
    originalRequest: ServiceRequest,
    quote?: ServiceQuote
  ) => {
    const matchedService =
      SERVICES_CATALOG.find((s) => s.title === originalRequest.serviceTitle) || null;
    const warrantyDays =
      originalRequest.warrantyDays ||
      parseWarrantyDaysFromLabel(
        quote?.warrantyLabel,
        matchedService?.warrantyDays || 30
      );

    setRequestInitialBundle(null);
    setRequestInitialService(matchedService);
    setRequestInitialCategoryId(originalRequest.categoryId);
    setWarrantyClaimTarget({
      originalRequest,
      technicianName: quote?.technicianName,
      warrantyDays,
    });
    setIsRequestModalOpen(true);
  };

  const buildRequestDispatch = useCallback(
    (newReq: ServiceRequest, isAutoRecurring = false) => {
      const routing = findNearestMatchingTechnicians(
        newReq.categoryId,
        newReq.district,
        technicians,
        allLocations
      );

      const enrichedRequest: ServiceRequest = {
        ...newReq,
        routingInfo: {
          matchType: routing.matchType,
          notifiedCount: routing.targets.length,
          nearestCenterName: routing.nearestCenterName,
          distanceKm: routing.minDistanceKm,
        },
      };

      const techAlerts: AppNotification[] = routing.targets.map(
        ({ technician, distanceKm, matchType }, idx) => {
          const proximityLabel =
            matchType === 'exact_area'
              ? 'داخل منطقتك مباشرة'
              : matchType === 'exact_center'
                ? `ضمن مركزك (${routing.nearestCenterName})`
                : `الأقرب لنطاقك (على بُعد ~${distanceKm} كم)`;

          const freqTag =
            isAutoRecurring && newReq.recurrenceFrequency
              ? ` · دوري ${getRecurrenceLabel(newReq.recurrenceFrequency)}`
              : '';

          return {
            id: `notif-${Date.now()}-${idx}-${technician.id}`,
            recipientRole: 'technician',
            recipientTechId: technician.id,
            type: 'new_request',
            title: `طلب خدمة جديد (${proximityLabel}${freqTag}): ${newReq.serviceTitle}`,
            body: `طلب العميل ${newReq.customerName} خدمة في ${newReq.district}. راجع التفاصيل وأرسل عرض سعرك الآن.`,
            requestId: newReq.id,
            createdAt: 'الآن',
            isRead: false,
          };
        }
      );

      return { enrichedRequest, techAlerts, routing };
    },
    [technicians, allLocations]
  );

  const handleSubmitRequest = (
    newReq: ServiceRequest,
    recurrence?: {
      frequency: Exclude<RecurrenceFrequency, 'none'>;
      startDateISO: string;
    }
  ) => {
    const todayISO = getTodayISO();

    if (recurrence) {
      const isFutureStart = recurrence.startDateISO > todayISO;
      const scheduleId = `rec-${Date.now()}`;
      const nextRunDateISO = isFutureStart
        ? recurrence.startDateISO
        : addRecurrenceIntervalISO(recurrence.startDateISO, recurrence.frequency);

      const newSchedule: RecurringSchedule = {
        id: scheduleId,
        frequency: recurrence.frequency,
        categoryId: newReq.categoryId,
        categoryName: newReq.categoryName,
        serviceTitle: newReq.serviceTitle,
        detailedDescription: newReq.detailedDescription,
        district: newReq.district,
        addressText: newReq.addressText,
        preferredTime: newReq.preferredTime,
        customerName: newReq.customerName,
        customerPhone: newReq.customerPhone,
        paymentMethod: newReq.paymentMethod,
        walletProvider: newReq.walletProvider,
        startDateISO: recurrence.startDateISO,
        nextRunDateISO,
        lastRunDateISO: isFutureStart ? undefined : todayISO,
        generatedCount: isFutureStart ? 0 : 1,
        status: 'active',
        createdAt: `مُجدول ${getRecurrenceLabel(recurrence.frequency)}`,
      };

      setRecurringSchedules((prev) => [newSchedule, ...prev]);

      if (isFutureStart) {
        return;
      }

      const { enrichedRequest, techAlerts } = buildRequestDispatch(
        {
          ...newReq,
          recurrenceScheduleId: scheduleId,
          recurrenceFrequency: recurrence.frequency,
          recurrenceCycleNumber: 1,
        },
        false
      );

      setRequests((prev) => [enrichedRequest, ...prev]);
      setNotifications((prev) => [...techAlerts, ...prev]);
      return;
    }

    if (newReq.loyaltyVoucherId) {
      setLoyaltyRedemptions((prev) =>
        prev.map((v) =>
          v.id === newReq.loyaltyVoucherId
            ? { ...v, isUsed: true, usedRequestRef: newReq.referenceCode }
            : v
        )
      );
    }

    const { enrichedRequest, techAlerts } = buildRequestDispatch(newReq, false);
    setRequests((prev) => [enrichedRequest, ...prev]);
    setNotifications((prev) => [...techAlerts, ...prev]);
  };

  const executeRecurringScheduleCycle = useCallback(
    (schedule: RecurringSchedule, cycleReason: 'auto' | 'manual') => {
      const todayISO = getTodayISO();
      const refCode = `KH-${Math.floor(91000 + Math.random() * 8900)}`;
      const nextCycleNumber = schedule.generatedCount + 1;
      const reqId = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const generatedReq: ServiceRequest = {
        id: reqId,
        referenceCode: refCode,
        categoryId: schedule.categoryId,
        categoryName: schedule.categoryName,
        serviceTitle: schedule.serviceTitle,
        detailedDescription: schedule.detailedDescription,
        district: schedule.district,
        addressText: schedule.addressText,
        preferredDate: 'اليوم',
        preferredTime: schedule.preferredTime,
        customerName: schedule.customerName,
        customerPhone: schedule.customerPhone,
        status: 'open_for_quotes',
        paymentMethod: schedule.paymentMethod,
        walletProvider: schedule.walletProvider,
        recurrenceScheduleId: schedule.id,
        recurrenceFrequency: schedule.frequency,
        recurrenceCycleNumber: nextCycleNumber,
        createdAt: cycleReason === 'auto' ? 'تلقائي الآن' : 'الآن (دورة مجدولة)',
      };

      const { enrichedRequest, techAlerts, routing } = buildRequestDispatch(
        generatedReq,
        true
      );

      const customerNotice: AppNotification = {
        id: `notif-rec-${Date.now()}-${schedule.id}`,
        recipientRole: 'customer',
        type: 'recurring_generated',
        title: `تم إنشاء طلبك المتكرر تلقائياً (#${refCode})`,
        body: `دورة #${nextCycleNumber} (${getRecurrenceLabel(schedule.frequency)}) لخدمة «${schedule.serviceTitle}» — تم تنبيه ${routing.targets.length} فني/شركة مختصة في نطاقك.`,
        requestId: reqId,
        createdAt: 'الآن',
        isRead: false,
      };

      let nextDate = addRecurrenceIntervalISO(
        schedule.nextRunDateISO,
        schedule.frequency
      );
      while (nextDate <= todayISO) {
        nextDate = addRecurrenceIntervalISO(nextDate, schedule.frequency);
      }

      return {
        enrichedRequest,
        alerts: [customerNotice, ...techAlerts],
        nextDate,
        todayISO,
        nextCycleNumber,
        refCode,
        notifiedCount: routing.targets.length,
      };
    },
    [buildRequestDispatch]
  );

  // Automatic check on app load and every 60s for due recurring schedules
  useEffect(() => {
    const checkDueSchedules = () => {
      const todayISO = getTodayISO();
      const due = recurringSchedules.filter((s) => {
        if (s.status !== 'active') return false;
        if (s.nextRunDateISO > todayISO) return false;
        const cycleKey = `${s.id}:${s.nextRunDateISO}`;
        return !processedCycleKeysRef.current.has(cycleKey);
      });

      if (due.length === 0) return;

      const createdRequests: ServiceRequest[] = [];
      const createdAlerts: AppNotification[] = [];
      const scheduleUpdates = new Map<
        string,
        { nextRunDateISO: string; lastRunDateISO: string; generatedCount: number }
      >();

      for (const sched of due) {
        const cycleKey = `${sched.id}:${sched.nextRunDateISO}`;
        processedCycleKeysRef.current.add(cycleKey);
        const result = executeRecurringScheduleCycle(sched, 'auto');
        createdRequests.push(result.enrichedRequest);
        createdAlerts.push(...result.alerts);
        scheduleUpdates.set(sched.id, {
          nextRunDateISO: result.nextDate,
          lastRunDateISO: result.todayISO,
          generatedCount: result.nextCycleNumber,
        });
      }

      if (createdRequests.length > 0) {
        setRequests((prev) => [...createdRequests, ...prev]);
        setNotifications((prev) => [...createdAlerts, ...prev]);
        setRecurringSchedules((prev) =>
          prev.map((s) => {
            const upd = scheduleUpdates.get(s.id);
            return upd ? { ...s, ...upd } : s;
          })
        );
      }
    };

    checkDueSchedules();
    const timer = window.setInterval(checkDueSchedules, 60000);
    return () => window.clearInterval(timer);
  }, [recurringSchedules, executeRecurringScheduleCycle]);

  const handleTriggerRecurringNow = (
    scheduleId: string
  ): { referenceCode: string; notifiedCount: number } | null => {
    const target = recurringSchedules.find((s) => s.id === scheduleId);
    if (!target || target.status !== 'active') return null;

    const cycleKey = `${target.id}:${target.nextRunDateISO}`;
    processedCycleKeysRef.current.add(cycleKey);

    const result = executeRecurringScheduleCycle(target, 'manual');
    setRequests((prev) => [result.enrichedRequest, ...prev]);
    setNotifications((prev) => [...result.alerts, ...prev]);
    setRecurringSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              nextRunDateISO: result.nextDate,
              lastRunDateISO: result.todayISO,
              generatedCount: result.nextCycleNumber,
            }
          : s
      )
    );

    return {
      referenceCode: result.refCode,
      notifiedCount: result.notifiedCount,
    };
  };

  const handleToggleRecurringStatus = (scheduleId: string) => {
    setRecurringSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== scheduleId || s.status === 'cancelled') return s;
        return {
          ...s,
          status: s.status === 'active' ? 'paused' : 'active',
        };
      })
    );
  };

  const handleCancelRecurringSchedule = (scheduleId: string) => {
    setRecurringSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, status: 'cancelled' } : s))
    );
  };

  const handleSubmitQuote = (
    requestId: string,
    priceEGP: number,
    estimatedArrival: string,
    notes: string,
    warrantyLabel?: string
  ) => {
    if (!activeTechnician) return;
    const targetReq = requests.find((r) => r.id === requestId);
    if (!targetReq) return;

    const newQuote: ServiceQuote = {
      id: `q-${Date.now()}`,
      requestId,
      technicianId: activeTechnician.id,
      technicianName: activeTechnician.name,
      isCompany: activeTechnician.isCompany,
      technicianRating: activeTechnician.rating,
      technicianCompletedJobs: activeTechnician.completedJobs,
      technicianPhone: activeTechnician.phone,
      priceEGP,
      estimatedArrival,
      warrantyLabel: warrantyLabel || 'ضمان 30 يوماً',
      notes,
      createdAt: 'الآن',
      status: 'pending',
    };

    setQuotes((prev) => [newQuote, ...prev]);

    const customerAlert: AppNotification = {
      id: `notif-q-${Date.now()}`,
      recipientRole: 'customer',
      type: 'new_quote',
      title: `عرض سعر جديد على طلبك (#${targetReq.referenceCode})`,
      body: `قدّم ${activeTechnician.name} عرضاً بقيمة ${formatEGP(priceEGP)}. اضغط لمراجعة العرض والموافقة.`,
      requestId,
      createdAt: 'الآن',
      isRead: false,
    };

    setNotifications((prev) => [customerAlert, ...prev]);
  };

  const handleSendRequestMessage = (
    requestId: string,
    technicianId: string,
    technicianName: string,
    senderRole: UserRole,
    text: string
  ) => {
    const clean = text.trim();
    if (!clean) return;
    const targetReq = requests.find((r) => r.id === requestId);
    if (!targetReq) return;

    const newMsg: RequestMessage = {
      id: `msg-${Date.now()}`,
      requestId,
      technicianId,
      technicianName,
      senderRole,
      text: clean,
      createdAt: 'الآن',
    };
    setMessages((prev) => [...prev, newMsg]);

    const alert: AppNotification = {
      id: `notif-msg-${Date.now()}`,
      recipientRole: senderRole === 'customer' ? 'technician' : 'customer',
      recipientTechId: senderRole === 'customer' ? technicianId : undefined,
      type: 'new_message',
      title:
        senderRole === 'customer'
          ? `رسالة جديدة من العميل (#${targetReq.referenceCode})`
          : `رسالة من ${technicianName} (#${targetReq.referenceCode})`,
      body: clean,
      requestId,
      createdAt: 'الآن',
      isRead: false,
    };
    setNotifications((prev) => [alert, ...prev]);
  };

  const handleAcceptQuote = (
    requestId: string,
    quoteId: string,
    paymentMethod?: PaymentMethod,
    walletProvider?: string
  ) => {
    const chosenQuote = quotes.find((q) => q.id === quoteId);
    const targetReq = requests.find((r) => r.id === requestId);
    if (!chosenQuote || !targetReq) return;

    const finalMethod = paymentMethod || targetReq.paymentMethod || 'cash';
    const finalWallet =
      finalMethod === 'wallet' ? walletProvider ?? targetReq.walletProvider : undefined;

    setQuotes((prev) =>
      prev.map((q) => {
        if (q.requestId !== requestId) return q;
        return { ...q, status: q.id === quoteId ? 'accepted' : 'rejected' };
      })
    );

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'quote_accepted',
              acceptedQuoteId: quoteId,
              paymentMethod: finalMethod,
              walletProvider: finalWallet,
            }
          : r
      )
    );

    const paymentLabel = getPaymentMethodLabel(finalMethod, finalWallet);
    const techAlert: AppNotification = {
      id: `notif-acc-${Date.now()}`,
      recipientRole: 'technician',
      recipientTechId: chosenQuote.technicianId,
      type: 'quote_accepted',
      title: `وافق العميل على عرضك (#${targetReq.referenceCode})`,
      body: `وافق ${targetReq.customerName} على عرضك بقيمة ${formatEGP(chosenQuote.priceEGP)} (${paymentLabel}). رقم العميل (${targetReq.customerPhone}) متاح الآن للاتصال أو واتساب.`,
      requestId,
      createdAt: 'الآن',
      isRead: false,
    };

    setNotifications((prev) => [techAlert, ...prev]);
  };

  const handleUpdateJobStatus = (
    requestId: string,
    nextStatus: 'en_route' | 'in_progress' | 'completed'
  ) => {
    const targetReq = requests.find((r) => r.id === requestId);
    const targetQuote = quotes.find(
      (q) =>
        q.id === targetReq?.acceptedQuoteId ||
        (q.requestId === requestId && q.status === 'accepted')
    );

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: nextStatus,
              enRouteStartedAt:
                nextStatus === 'en_route'
                  ? Date.now()
                  : r.enRouteStartedAt,
              completedAtTimestamp:
                nextStatus === 'completed'
                  ? r.completedAtTimestamp || Date.now()
                  : r.completedAtTimestamp,
              warrantyDays:
                nextStatus === 'completed'
                  ? r.warrantyDays ||
                    parseWarrantyDaysFromLabel(targetQuote?.warrantyLabel, 30)
                  : r.warrantyDays,
              pointsAwarded:
                nextStatus === 'completed' && !r.isWarrantyClaim
                  ? r.pointsAwarded || KHADAMAT_POINTS_PER_COMPLETED_ORDER
                  : r.pointsAwarded,
            }
          : r
      )
    );

    if (nextStatus === 'en_route' && targetReq && activeTechnician) {
      const enRouteAlert: AppNotification = {
        id: `notif-route-${Date.now()}`,
        recipientRole: 'customer',
        type: 'tech_en_route',
        title: `الفني ${activeTechnician.name} في الطريق إليك الآن (#${targetReq.referenceCode})`,
        body: `تحرك الفني نحو موقعك في ${targetReq.district} لتنفيذ خدمة «${targetReq.serviceTitle}». يمكنك متابعة مساره اللحظي الآن.`,
        requestId,
        createdAt: 'الآن',
        isRead: false,
      };
      setNotifications((prev) => [enRouteAlert, ...prev]);
      return;
    }

    if (nextStatus === 'completed' && targetReq && activeTechnician) {
      setTechnicians((prev) =>
        prev.map((t) =>
          t.id === activeTechnician.id
            ? { ...t, completedJobs: t.completedJobs + 1 }
            : t
        )
      );

      const rateAlert: AppNotification = {
        id: `notif-done-${Date.now()}`,
        recipientRole: 'customer',
        type: 'job_completed',
        title: `أنهى ${activeTechnician.name} الخدمة (#${targetReq.referenceCode})`,
        body: targetReq.isWarrantyClaim
          ? 'تم إنهاء فحص الضمان بنجاح.'
          : `أُضيفت +${KHADAMAT_POINTS_PER_COMPLETED_ORDER} نقطة لرصيدك! قيّم الفني لتحصل على +${KHADAMAT_BONUS_POINTS_FOR_RATING} نقطة إضافية.`,
        requestId,
        createdAt: 'الآن',
        isRead: false,
      };
      setNotifications((prev) => [rateAlert, ...prev]);
    }
  };

  const handleRateTechnician = (requestId: string, rating: number, review: string) => {
    const targetReq = requests.find((r) => r.id === requestId);
    const acceptedQuote = quotes.find(
      (q) =>
        q.id === targetReq?.acceptedQuoteId ||
        (q.requestId === requestId && q.status === 'accepted')
    );

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'completed',
              completedAtTimestamp: r.completedAtTimestamp || Date.now(),
              warrantyDays:
                r.warrantyDays ||
                parseWarrantyDaysFromLabel(acceptedQuote?.warrantyLabel, 30),
              pointsAwarded: !r.isWarrantyClaim
                ? KHADAMAT_POINTS_PER_COMPLETED_ORDER + KHADAMAT_BONUS_POINTS_FOR_RATING
                : r.pointsAwarded,
              rating,
              review: review || undefined,
            }
          : r
      )
    );

    if (acceptedQuote && targetReq) {
      const newReviewEntry: TechnicianReview = {
        id: `trev-req-${targetReq.id}`,
        technicianId: acceptedQuote.technicianId,
        customerName: targetReq.customerName,
        area: targetReq.district,
        serviceTitle: targetReq.serviceTitle,
        rating,
        review: review || 'تقييم إيجابي للخدمة المكتملة.',
        dateLabel: 'الآن',
        priceEGP: acceptedQuote.priceEGP,
      };

      const nextReviews = [newReviewEntry, ...reviews];
      setReviews(nextReviews);

      const updatedStats = computeTechnicianStats(
        acceptedQuote.technicianId,
        nextReviews,
        quotes,
        requests
      );

      setTechnicians((prev) =>
        prev.map((t) => {
          if (t.id !== acceptedQuote.technicianId) return t;
          return {
            ...t,
            rating: updatedStats.averageRating,
            reviewsCount: updatedStats.totalReviews,
            completedJobs:
              targetReq.status === 'completed' ? t.completedJobs : t.completedJobs + 1,
          };
        })
      );
    }
  };

  const handleCancelRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'cancelled' } : r))
    );
  };

  const handleMarkAllNotificationsRead = () => {
    if (!session) return;
    setNotifications((prev) =>
      prev.map((n) => {
        if (session.role === 'customer' && n.recipientRole === 'customer') {
          return { ...n, isRead: true };
        }
        if (
          session.role === 'technician' &&
          n.recipientRole === 'technician' &&
          (!n.recipientTechId || n.recipientTechId === session.technicianId)
        ) {
          return { ...n, isRead: true };
        }
        return n;
      })
    );
  };

  const handleSelectNotification = (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    if (session?.role === 'customer') {
      setRequestsInitialTab(
        notif.type === 'tech_en_route' || notif.type === 'job_completed'
          ? notif.type === 'job_completed'
            ? 'history'
            : 'active'
          : 'open'
      );
      setCustomerTab('requests');
    } else if (session?.role === 'technician') {
      setTechTab(notif.type === 'quote_accepted' ? 'accepted_jobs' : 'open_requests');
    }
  };

  const handleAddAddress = (addr: Omit<SavedAddress, 'id'>) => {
    setAddresses((prev) => [...prev, { ...addr, id: `addr-${Date.now()}` }]);
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  // Separate Entry / Login Screen when not logged in
  if (!session) {
    return (
      <>
        <AuthLoginScreen
          customers={customers}
          technicians={technicians}
          locations={allLocations}
          notifications={notifications}
          openRequestsCount={
            requests.filter((r) => r.status === 'open_for_quotes').length
          }
          selectedDistrict={district}
          onOpenLocation={() => setIsLocationModalOpen(true)}
          onLogin={handleLogin}
        />

        <LocationModal
          isOpen={isLocationModalOpen}
          currentDistrict={district}
          locations={allLocations}
          technicians={technicians}
          isDark={theme === 'dark'}
          onSelectDistrict={handleDistrictChange}
          onAddCustomLocation={handleAddCustomLocation}
          onClose={() => setIsLocationModalOpen(false)}
        />

        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 md:pb-0 transition-colors duration-200">
      <TopBar
        role={session.role}
        activeCustomerTab={customerTab}
        activeTechTab={techTab}
        onSelectCustomerTab={(tab) => {
          setCustomerTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectTechTab={(tab) => {
          setTechTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onPrimaryAction={() =>
          session.role === 'customer'
            ? handleOpenRequestModal()
            : handleSwitchAccount()
        }
        onSwitchAccount={handleSwitchAccount}
        district={district}
        technicianDisplayName={activeTechnician?.name}
        onOpenLocation={() => setIsLocationModalOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        openCustomerRequestsCount={openCustomerRequestsCount}
        acceptedTechJobsCount={acceptedTechJobsCount}
      />

      <main className="flex-1">
        {session.role === 'customer' ? (
          <>
            {customerTab === 'home' && (
              <HomeScreen
                district={district}
                locations={allLocations}
                technicians={technicians}
                reviews={reviews}
                quotes={quotes}
                requests={requests}
                isDark={theme === 'dark'}
                favoriteServiceIds={favoriteServiceIds}
                onToggleFavoriteService={handleToggleFavoriteService}
                onOpenLocation={() => setIsLocationModalOpen(true)}
                onSelectDistrict={handleDistrictChange}
                onSelectCategory={(catId) => {
                  setSelectedCategoryId(catId);
                  setCatalogSearchQuery('');
                  setCustomerTab('categories');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onRequestService={handleOpenRequestModal}
                onRequestBundle={handleRequestBundle}
                onRequestWarrantyCheck={handleRequestWarrantyCheck}
                onOpenRequests={(targetTab = 'open') => {
                  setRequestsInitialTab(targetTab);
                  setCustomerTab('requests');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onViewTechnicianStats={(techId) => setViewingTechStatsId(techId)}
                onOpenAllServices={(initialQuery = '') => {
                  setSelectedCategoryId('all');
                  setCatalogSearchQuery(initialQuery);
                  setCustomerTab('categories');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenSmartPlanner={() => setIsSmartPlannerOpen(true)}
                onDispatchEmergency={handleSubmitRequest}
              />
            )}

            {customerTab === 'categories' && (
              <CategoriesScreen
                key={`cat-${catalogSearchQuery}`}
                selectedCategoryId={selectedCategoryId}
                onSelectCategoryId={setSelectedCategoryId}
                initialSearchQuery={catalogSearchQuery}
                district={district}
                locations={allLocations}
                technicians={technicians}
                quotes={quotes}
                requests={requests}
                reviews={reviews}
                favoriteServiceIds={favoriteServiceIds}
                onToggleFavoriteService={handleToggleFavoriteService}
                onOpenLocation={() => setIsLocationModalOpen(true)}
                onRequestService={(service) => handleOpenRequestModal(service)}
              />
            )}

            {customerTab === 'requests' && (
              <CustomerRequestsScreen
                requests={requests}
                quotes={quotes}
                messages={messages}
                reviews={reviews}
                recurringSchedules={recurringSchedules}
                technicians={technicians}
                initialTab={requestsInitialTab}
                isDark={theme === 'dark'}
                onAcceptQuote={handleAcceptQuote}
                onCancelRequest={handleCancelRequest}
                onRateTechnician={handleRateTechnician}
                onSendMessage={handleSendRequestMessage}
                onViewTechnicianStats={(techId) => setViewingTechStatsId(techId)}
                onTriggerRecurringNow={handleTriggerRecurringNow}
                onToggleRecurringStatus={handleToggleRecurringStatus}
                onCancelRecurringSchedule={handleCancelRecurringSchedule}
                onNewRequest={() => handleOpenRequestModal()}
                onRequestWarrantyCheck={handleRequestWarrantyCheck}
              />
            )}

            {customerTab === 'notifications' && (
              <NotificationsScreen
                notifications={visibleNotifications}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onSelectNotification={handleSelectNotification}
              />
            )}

            {customerTab === 'profile' && (
              <CustomerProfileScreen
                user={user}
                onUpdateUser={setUser}
                addresses={addresses}
                onAddAddress={handleAddAddress}
                onDeleteAddress={handleDeleteAddress}
                onSetDefaultAddress={handleSetDefaultAddress}
                currentDistrict={district}
                onOpenLocation={() => setIsLocationModalOpen(true)}
                onSwitchAccount={handleSwitchAccount}
                theme={theme}
                onToggleTheme={() =>
                  setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
                }
                requests={requests}
                loyaltyRedemptions={loyaltyRedemptions}
                onRedeemPoints={handleRedeemPoints}
                onUseLoyaltyVoucher={handleUseLoyaltyVoucher}
              />
            )}
          </>
        ) : (
          activeTechnician && (
            <>
              {techTab === 'notifications' ? (
                <NotificationsScreen
                  notifications={visibleNotifications}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                  onSelectNotification={handleSelectNotification}
                />
              ) : techTab === 'tech_stats' ? (
                <TechnicianStatsScreen
                  technician={activeTechnician}
                  reviews={reviews}
                  quotes={quotes}
                  requests={requests}
                />
              ) : (
                <TechnicianPortalScreen
                  activeTab={techTab}
                  technician={activeTechnician}
                  requests={requests}
                  quotes={quotes}
                  messages={messages}
                  onSubmitQuote={handleSubmitQuote}
                  onUpdateJobStatus={handleUpdateJobStatus}
                  onSendMessage={handleSendRequestMessage}
                  onOpenLocation={() => setIsLocationModalOpen(true)}
                  onSwitchAccount={handleSwitchAccount}
                />
              )}
            </>
          )
        )}
      </main>

      {/* Clean Desktop Footer */}
      <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <BrandWordmark size="sm" />
            <span>
              خدمات الدقهلية والمنصورة الجديدة
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="font-semibold text-orange-700 dark:text-orange-400 hover:underline cursor-pointer"
            >
              تبديل الحساب ({session.role === 'customer' ? 'عميل' : 'فني / شركة'})
            </button>
          </div>
        </div>
      </footer>

      <BottomNav
        role={session.role}
        activeCustomerTab={customerTab}
        activeTechTab={techTab}
        onSelectCustomerTab={(tab) => {
          setCustomerTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectTechTab={(tab) => {
          setTechTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unreadNotificationsCount={unreadNotificationsCount}
        openCustomerRequestsCount={openCustomerRequestsCount}
        acceptedTechJobsCount={acceptedTechJobsCount}
      />

      <LocationModal
        isOpen={isLocationModalOpen}
        currentDistrict={district}
        locations={allLocations}
        technicians={technicians}
        isDark={theme === 'dark'}
        onSelectDistrict={handleDistrictChange}
        onAddCustomLocation={handleAddCustomLocation}
        onClose={() => setIsLocationModalOpen(false)}
      />

      <RequestServiceModal
        key={`${requestInitialService?.id || 'custom'}-${requestInitialCategoryId || 'def'}-${requestInitialBundle?.id || 'nobundle'}-${warrantyClaimTarget?.originalRequest.id || 'nowar'}-${initialLoyaltyVoucher?.id || 'noloy'}-${isRequestModalOpen}`}
        isOpen={isRequestModalOpen}
        initialService={requestInitialService}
        initialCategoryId={requestInitialCategoryId}
        initialBundle={requestInitialBundle}
        activeLoyaltyVouchers={loyaltyRedemptions.filter((v) => !v.isUsed)}
        initialLoyaltyVoucher={initialLoyaltyVoucher}
        warrantyClaimTarget={warrantyClaimTarget}
        district={district}
        user={user}
        savedAddresses={addresses}
        customerRequests={requests}
        getRoutingPreview={getRoutingPreview}
        onOpenLocation={() => setIsLocationModalOpen(true)}
        onClose={() => {
          setIsRequestModalOpen(false);
          setRequestInitialService(null);
          setRequestInitialCategoryId(undefined);
          setRequestInitialBundle(null);
          setWarrantyClaimTarget(null);
          setInitialLoyaltyVoucher(null);
        }}
        onSubmitRequest={handleSubmitRequest}
        onGoToRequests={() => setCustomerTab('requests')}
      />

      <TechnicianReviewsModal
        technician={
          viewingTechStatsId
            ? technicians.find((t) => t.id === viewingTechStatsId) || null
            : null
        }
        reviews={reviews}
        quotes={quotes}
        requests={requests}
        onClose={() => setViewingTechStatsId(null)}
      />

      <SmartPlannerModal
        isOpen={isSmartPlannerOpen}
        district={district}
        user={user}
        onClose={() => setIsSmartPlannerOpen(false)}
        onRequestService={handleOpenRequestModal}
        onRequestBundle={handleRequestBundle}
      />

      <OfflineIndicator />
    </div>
  );
}
