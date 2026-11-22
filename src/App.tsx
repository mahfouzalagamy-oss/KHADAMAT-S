import { lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { BrandWordmark } from './components/BrandWordmark';
import { CategoriesScreen } from './components/CategoriesScreen';
import { CustomerProfileScreen } from './components/CustomerProfileScreen';
import { HomeScreen } from './components/HomeScreen';
import { LocationModal } from './components/LocationModal';
import { NotificationsScreen } from './components/NotificationsScreen';
import { OfflineIndicator } from './components/PWAInstallBanner';
import { PushNotificationBanner } from './components/PushNotificationBanner';
import { RequestServiceModal, RoutingPreview } from './components/RequestServiceModal';
import { openWhatsApp, openPhoneCall, createAcceptQuoteMessage } from './utils/whatsapp';
import { TechnicianReviewsModal } from './components/TechnicianReviewsModal';
import { TechnicianStatsScreen } from './components/TechnicianStatsScreen';
import { TopBar } from './components/TopBar';
import {
  EGYPT_LOCATIONS,
  getLocationMeta,
  findNearestMatchingTechnicians,
} from './data/dakahliaLocations';
import {
  KHADAMAT_BONUS_POINTS_FOR_RATING,
  KHADAMAT_POINTS_PER_COMPLETED_ORDER,
  SERVICES_CATALOG,
  computeServiceMarketStats,
  computeTechnicianStats,
  getRecurrenceLabel,
  getTodayISO,
  parseWarrantyDaysFromLabel,
} from './data/khadamatData';
import {
  AppNotification,
  LocationEntry,
  LoyaltyRedemption,
  PaymentMethod,
  RatingBreakdown,
  RecurrenceFrequency,
  RecurringSchedule,
  RequestMessage,
  SavedAddress,
  ServiceItem,
  ServiceQuote,
  ServiceRequest,
  TechnicianReview,
  UserRole,
} from './types/khadamat';
import {
  getBrowserPushPermission,
  requestBrowserPushPermission,
} from './utils/pushNotifications';

import { useAppStore } from './store/useAppStore';
import { getRequestsTabForStatus } from './lib/requestFlow';
import { useLiveLocations, useTechnicianGps } from './lib/liveTracking';
import { cancelRequest } from './lib/requestActions';

// تحميل كسول للشاشات الثقيلة لتسريع أول فتح للتطبيق
const CustomerRequestsScreen = lazy(() =>
  import('./components/CustomerRequestsScreen').then((m) => ({ default: m.CustomerRequestsScreen }))
);
const SmartPlannerModal = lazy(() =>
  import('./components/SmartPlannerModal').then((m) => ({ default: m.SmartPlannerModal }))
);
const TechnicianPortalScreen = lazy(() =>
  import('./components/TechnicianPortalScreen').then((m) => ({ default: m.TechnicianPortalScreen }))
);

function App() {
  /* ======================
     ZUSTAND STORE
     ====================== */
  const {
    // Session
    session,
    setSession,
    user,
    setUser,
    district,
    setDistrict,

    // Navigation
    customerTab,
    setCustomerTab,
    techTab,
    setTechTab,
    requestsInitialTab,
    setRequestsInitialTab,

    // Data
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
    favoriteServiceIds,
    setFavoriteServiceIds,
    loyaltyRedemptions,
    setLoyaltyRedemptions,

    // UI State
    theme,
    setTheme,
    pushPrefs,
    setPushPrefs,
    browserPermission,
    setBrowserPermission,
    activePushToasts,
    setActivePushToasts,

    // Modals
    isLocationModalOpen,
    setIsLocationModalOpen,
    isRequestModalOpen,
    setIsRequestModalOpen,
    isSmartPlannerOpen,
    setIsSmartPlannerOpen,
    viewingTechStatsId,
    setViewingTechStatsId,
    requestInitialService,
    setRequestInitialService,
    requestInitialCategoryId,
    setRequestInitialCategoryId,
    requestInitialBundle,
    setRequestInitialBundle,
    warrantyClaimTarget,
    setWarrantyClaimTarget,
    initialLoyaltyVoucher,
    setInitialLoyaltyVoucher,
    selectedCategoryId,
    setSelectedCategoryId,
    catalogSearchQuery,
    setCatalogSearchQuery,

    // Computed
    activeTechnician,
    visibleNotifications,
    unreadNotificationsCount,
    openCustomerRequestsCount,
    acceptedTechJobsCount,
  } = useAppStore();

  /* ======================
     REFS
     ====================== */
  const quoteSimulationTimersRef = useRef<number[]>([]);
  const queuedPushIdsRef = useRef<Set<string>>(new Set(notifications.map((n) => n.id)));
  const requestsRef = useRef<ServiceRequest[]>(requests);
  const quotesRef = useRef<ServiceQuote[]>(quotes);

  // Keep refs in sync
  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  useEffect(() => {
    quotesRef.current = quotes;
  }, [quotes]);

  // Sync queuedPushIdsRef when notifications change
  useEffect(() => {
    queuedPushIdsRef.current = new Set(notifications.map((n) => n.id));
  }, [notifications]);

  /* ======================
     EFFECTS
     ====================== */
  // Quote simulation timers cleanup
  useEffect(() => {
    return () => {
      quoteSimulationTimersRef.current.forEach((tid) => window.clearTimeout(tid));
      quoteSimulationTimersRef.current = [];
    };
  }, []);

  // Theme sync to DOM
  useEffect(() => {
    const isDarkMode = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        isDarkMode ? '#020617' : '#ea580c'
      );
    }
  }, [theme]);

  // Initialize browser permission
  useEffect(() => {
    const perm = getBrowserPushPermission();
    setBrowserPermission(perm === 'unsupported' ? 'denied' : perm);
  }, [setBrowserPermission]);

  /* ======================
     REALTIME: GPS + LIVE LOCATIONS
     ====================== */
  const [focusRequestId, setFocusRequestId] = useState<string | null>(null);
  const liveLocations = useLiveLocations();

  const myEnRouteRequestIds = useMemo(() => {
    if (session?.role !== 'technician') return [];
    return requests
      .filter(
        (r) =>
          r.status === 'en_route' &&
          quotes.some(
            (q) => q.requestId === r.id && q.status === 'accepted' && q.technicianId === session.technicianId
          )
      )
      .map((r) => r.id);
  }, [requests, quotes, session]);
  const gpsStatus = useTechnicianGps(myEnRouteRequestIds);

  /* ======================
     HANDLERS: SESSION
     ====================== */
  const handleSwitchAccount = useCallback(() => {
    setSession(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSession]);

  /* ======================
     HANDLERS: QUOTE SUBMISSION
     ====================== */
  const handleSubmitQuote = useCallback(
    (
      requestId: string,
      priceEGP: number,
      estimatedArrival: string,
      notes: string,
      warrantyLabel?: string,
    ) => {
      const tech = activeTechnician();
      if (!tech) return;
      const request = requests.find((r) => r.id === requestId);
      if (!request) return;

      const newQuote: ServiceQuote = {
        id: `quote-${Date.now()}`,
        requestId,
        technicianId: tech.id,
        technicianName: tech.name,
        isCompany: tech.isCompany,
        technicianRating: tech.rating,
        technicianCompletedJobs: tech.completedJobs,
        technicianPhone: tech.phone,
        priceEGP,
        estimatedArrival,
        warrantyLabel,
        notes: notes || '',
        createdAt: getTodayISO(),
        status: 'pending',
      };

      setQuotes((prev) => [...prev, newQuote]);

      setNotifications((prev) => [
        ...prev,
        {
          id: `notif-${Date.now()}`,
          recipientRole: 'customer',
          type: 'new_quote',
          title: 'عرض سعر جديد',
          body: `وصلتك عرض سعر جديد لطلب "${request.serviceTitle}" من ${tech.name}`,
          requestId,
          createdAt: newQuote.createdAt,
          isRead: false,
        },
      ]);
    },
    [activeTechnician, requests, setQuotes, setNotifications]
  );

  /* ======================
     HANDLERS: WHATSAPP & PHONE
     ====================== */
  const handleWhatsApp = useCallback(
    (phone: string, technicianName: string) => {
      const targetReq = requests.find((r) => r.acceptedQuoteId);
      const requestTitle = targetReq ? targetReq.serviceTitle : 'الخدمة';
      const chosenQuote = quotes.find((q) => q.status === 'accepted');
      const priceEGP = chosenQuote?.priceEGP || 0;
      const message = createAcceptQuoteMessage(technicianName, requestTitle, priceEGP);
      openWhatsApp(phone, message);
    },
    [requests, quotes]
  );

  const handlePhoneCall = useCallback((phone: string) => {
    openPhoneCall(phone);
  }, []);

  /* ======================
     HANDLERS: DISTRICT & LOCATION
     ====================== */
  const handleDistrictChange = useCallback(
    (nextDistrict: string) => {
      setUser((prev) => ({ ...prev, defaultDistrict: nextDistrict }));
      setDistrict(nextDistrict);

      const tech = activeTechnician();
      if (tech) {
        const meta = getLocationMeta(nextDistrict, [...customLocations, ...EGYPT_LOCATIONS]);
        setTechnicians((prev) =>
          prev.map((t) => {
            if (t.id !== tech.id) return t;
            const nextCenters = Array.from(new Set([meta.center, ...t.coveredCenters]));
            const nextAreas = Array.from(new Set([nextDistrict, meta.areaName, ...t.coveredAreas]));
            return {
              ...t,
              area: `${nextDistrict}${
                t.coveredCenters.length > 1
                  ? ` · (${nextCenters.join('، ')})`
                  : ''
              }`,
              primaryCenter: meta.center,
              coveredCenters: nextCenters,
              coveredAreas: nextAreas,
            };
          })
        );
      }
    },
    [setUser, setDistrict, activeTechnician, customLocations, setTechnicians]
  );

  const handleAddCustomLocation = useCallback(
    (center: string, name: string): LocationEntry | null => {
      const entry: LocationEntry = {
        id: `loc-${Date.now()}`,
        governorate: 'الدقهلية',
        center,
        name,
        displayLabel: `${name} - ${center}`,
        lat: 0,
        lng: 0,
        isVillage: false,
        isCustom: true,
      };

      setCustomLocations((prev) => {
        if (prev.some((l) => l.displayLabel === entry.displayLabel)) return prev;
        return [entry, ...prev];
      });

      return entry;
    },
    [setCustomLocations]
  );

  const getRoutingPreview = useCallback(
    (catId: string, districtOverride?: string): RoutingPreview => {
      const routing = findNearestMatchingTechnicians(
        catId,
        districtOverride || district,
        technicians,
        [...customLocations, ...EGYPT_LOCATIONS]
      );
      return {
        matchType: routing.matchType,
        notifiedCount: routing.targets.length,
        nearestCenterName: routing.nearestCenterName,
        minDistanceKm: routing.minDistanceKm,
      };
    },
    [district, technicians, customLocations]
  );

  /* ======================
     HANDLERS: REQUEST MODAL
     ====================== */
  const handleRequestService = useCallback(
    (service?: ServiceItem, categoryId?: string) => {
      setWarrantyClaimTarget(null);
      setInitialLoyaltyVoucher(null);
      setRequestInitialBundle(null);
      setRequestInitialService(service || null);
      setRequestInitialCategoryId(categoryId || service?.categoryId);
      setIsRequestModalOpen(true);
    },
    [
      setWarrantyClaimTarget,
      setInitialLoyaltyVoucher,
      setRequestInitialBundle,
      setRequestInitialService,
      setRequestInitialCategoryId,
      setIsRequestModalOpen,
    ]
  );

  const handleRedeemPoints = useCallback(
    (reward: any) => {
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
    },
    [requests, loyaltyRedemptions, setLoyaltyRedemptions]
  );

  /* ======================
     HANDLERS: REQUEST SUBMISSION
     ====================== */
  const buildRequestDispatch = useCallback(
    (newReq: ServiceRequest, isAutoRecurring = false) => {
      const routing = findNearestMatchingTechnicians(
        newReq.categoryId,
        newReq.district,
        technicians,
        [...customLocations, ...EGYPT_LOCATIONS]
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
    [technicians, customLocations]
  );

  const scheduleIncomingQuotesForRequest = useCallback(
    (req: ServiceRequest, routingTargets: any[]) => {
      if (routingTargets.length === 0) return;

      const market = computeServiceMarketStats(
        req.serviceTitle,
        quotes,
        requests,
        reviews
      );
      const categoryBasePrices: Record<string, number> = {
        ac: 320,
        plumbing: 220,
        electrical: 210,
        cleaning: 380,
        carpentry: 260,
        painting: 450,
        appliances: 290,
        pest_control: 300,
        security_tech: 340,
        moving: 650,
        tanks_garden: 320,
        aluminum_gypsum: 280,
        carwash: 220,
        electronics: 280,
        networks: 260,
      };
      const basePrice =
        market.marketAverageEGP || categoryBasePrices[req.categoryId] || 250;

      const candidates = routingTargets.slice(0, 3);
      const offerTemplates = [
        {
          delayMs: 2200,
          factor: 0.92,
          eta: 'اليوم خلال 45 دقيقة',
          warranty: 'ضمان 30 يوماً',
          note: req.isWarrantyClaim
            ? 'فحص ضمان سريع وتحديد الحل فوراً.'
            : 'متاح قريباً من موقعك مع جميع المعدات وقطع الغيار الأصلية.',
        },
        {
          delayMs: 4800,
          factor: 1.04,
          eta: 'اليوم خلال ساعتين',
          warranty: 'ضمان 60 يوماً',
          note: 'فحص شامل قبل العمل وتسليم بنظافة تامة والتزام تام بالموعد.',
        },
        {
          delayMs: 7600,
          factor: 1.12,
          eta: 'في الموعد المحدد بالدق',
          warranty: 'ضمان 90 يوماً',
          note: 'خدمة معتمدة بفريق فني متخصص وشهادة ضمان على التركيب.',
        },
      ];

      candidates.forEach(({ technician }, idx) => {
        const tpl = offerTemplates[idx] || offerTemplates[0];
        const rawPrice = Math.round((basePrice * tpl.factor) / 10) * 10;
        const priceEGP = req.isWarrantyClaim ? 0 : Math.max(80, rawPrice);

        const timerId = window.setTimeout(() => {
          const latestReq = requestsRef.current.find((r) => r.id === req.id);
          if (!latestReq || latestReq.status !== 'open_for_quotes') return;

          const techStats = computeTechnicianStats(
            technician.id,
            reviews,
            quotes,
            requests
          );

          const simulatedQuote: ServiceQuote = {
            id: `q-auto-${Date.now()}-${technician.id}-${idx}`,
            requestId: req.id,
            technicianId: technician.id,
            technicianName: technician.name,
            isCompany: technician.isCompany,
            technicianRating: technician.rating,
            technicianCompletedJobs: technician.completedJobs,
            technicianPhone: technician.phone,
            priceEGP,
            estimatedArrival: tpl.eta,
            warrantyLabel: tpl.warranty,
            notes: tpl.note,
            createdAt: 'الآن',
            status: 'pending',
            ratingBreakdown: techStats.criteriaAverages,
          };

          const alreadyQuoted = quotesRef.current.some(
            (q) => q.requestId === req.id && q.technicianId === technician.id
          );
          if (alreadyQuoted) return;

          setQuotes((prev) => [...prev, simulatedQuote]);
        }, tpl.delayMs);

        quoteSimulationTimersRef.current.push(timerId);
      });
    },
    [
      quotes,
      requests,
      reviews,
      technicians,
      setQuotes,
      requestsRef,
      quotesRef,
    ]
  );

  const handleSubmitRequest = useCallback(
    (
      newReq: ServiceRequest,
      recurrence?: { frequency: RecurrenceFrequency; startDateISO: string }
    ) => {
      const isRecurring = recurrence !== undefined;
      const buildResult = buildRequestDispatch(newReq, isRecurring);

      setRequests((prev) => [...prev, buildResult.enrichedRequest]);
      setNotifications((prev) => [...buildResult.techAlerts, ...prev]);
      scheduleIncomingQuotesForRequest(
        buildResult.enrichedRequest,
        buildResult.routing.targets
      );

      if (isRecurring && recurrence) {
        const newSchedule: RecurringSchedule = {
          id: `rec-${Date.now()}`,
          frequency: recurrence.frequency as Exclude<RecurrenceFrequency, 'none'>,
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
          nextRunDateISO: recurrence.startDateISO,
          status: 'active',
          generatedCount: 0,
          createdAt: getTodayISO(),
        };
        setRecurringSchedules((prev) => [newSchedule, ...prev]);
      }
    },
    [
      setRequests,
      setNotifications,
      setRecurringSchedules,
      buildRequestDispatch,
      scheduleIncomingQuotesForRequest,
    ]
  );

  /* ======================
     HANDLERS: JOB STATUS
     ====================== */
  const handleUpdateJobStatus = useCallback(
    (
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
                  nextStatus === 'en_route' ? Date.now() : r.enRouteStartedAt,
                completedAtTimestamp:
                  nextStatus === 'completed'
                    ? r.completedAtTimestamp || Date.now()
                    : r.completedAtTimestamp,
                warrantyDays:
                  nextStatus === 'completed'
                    ? r.warrantyDays ||
                      parseWarrantyDaysFromLabel(
                        targetQuote?.warrantyLabel,
                        30
                      )
                    : r.warrantyDays,
                pointsAwarded:
                  nextStatus === 'completed' && !r.isWarrantyClaim
                    ? r.pointsAwarded ||
                      KHADAMAT_POINTS_PER_COMPLETED_ORDER
                    : r.pointsAwarded,
              }
            : r
        )
      );

      const tech = activeTechnician();
      if (nextStatus === 'en_route' && targetReq && tech) {
        const enRouteAlert: AppNotification = {
          id: `notif-route-${Date.now()}`,
          recipientRole: 'customer',
          type: 'tech_en_route',
          title: `الفني ${tech.name} في طريق إليك الآن (#${targetReq.referenceCode})`,
          body: `تحرك الفني نحو موقعك في ${targetReq.district} لتنفيذ خدمة «${targetReq.serviceTitle}». يمكنك متابعة مساره اللحظي الآن.`,
          requestId,
          createdAt: 'الآن',
          isRead: false,
        };
        setNotifications((prev) => [enRouteAlert, ...prev]);
        return;
      }

      if (nextStatus === 'in_progress' && targetReq && tech) {
        const inProgressAlert: AppNotification = {
          id: `notif-prog-${Date.now()}`,
          recipientRole: 'customer',
          type: 'job_in_progress',
          title: `بدأ ${tech.name} تنفيذ الخدمة (#${targetReq.referenceCode})`,
          body: `الفني وصل إلى موقعك في ${targetReq.district} وبدأ العمل على «${targetReq.serviceTitle}».`,
          requestId,
          createdAt: 'الآن',
          isRead: false,
        };
        setNotifications((prev) => [inProgressAlert, ...prev]);
        return;
      }

      if (nextStatus === 'completed' && targetReq && tech) {
        setTechnicians((prev) =>
          prev.map((t) =>
            t.id === tech.id ? { ...t, completedJobs: t.completedJobs + 1 } : t
          )
        );

        const rateAlert: AppNotification = {
          id: `notif-done-${Date.now()}`,
          recipientRole: 'customer',
          type: 'job_completed',
          title: `تم إنهاء الخدمة بواسطة ${tech.name} (#${targetReq.referenceCode})`,
          body: targetReq.isWarrantyClaim
            ? 'تم إنهاء فحص الضمان بنجاح.'
            : `أُضيفت +${KHADAMAT_POINTS_PER_COMPLETED_ORDER} نقطة لرصيدك! قيّم الفني لتحصل على +${KHADAMAT_BONUS_POINTS_FOR_RATING} نقطة إضافية.`,
          requestId,
          createdAt: 'الآن',
          isRead: false,
        };
        setNotifications((prev) => [rateAlert, ...prev]);
      }
    },
    [
      requests,
      quotes,
      setRequests,
      setNotifications,
      activeTechnician,
      setTechnicians,
    ]
  );

  /* ======================
     HANDLERS: RATING & MESSAGES
     ====================== */
  const handleRateTechnician = useCallback(
    (
      requestId: string,
      rating: number,
      review: string,
      ratingBreakdown?: RatingBreakdown
    ) => {
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
                  parseWarrantyDaysFromLabel(
                    acceptedQuote?.warrantyLabel,
                    30
                  ),
                pointsAwarded: !r.isWarrantyClaim
                  ? KHADAMAT_POINTS_PER_COMPLETED_ORDER +
                    KHADAMAT_BONUS_POINTS_FOR_RATING
                  : r.pointsAwarded,
                rating,
                ratingBreakdown,
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
          ratingBreakdown,
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

        const tech = technicians.find((t) => t.id === acceptedQuote.technicianId);
        setTechnicians((prev) =>
          prev.map((t) =>
            t.id === acceptedQuote.technicianId
              ? {
                  ...t,
                  rating: updatedStats.averageRating,
                  reviewsCount: updatedStats.totalReviews,
                  completedJobs:
                    targetReq.status === 'completed'
                      ? (tech?.completedJobs || 0) + 1
                      : tech?.completedJobs || 0,
                }
              : t
          )
        );
      }
    },
    [requests, quotes, setRequests, setReviews, reviews, setTechnicians, technicians]
  );

  const handleSendRequestMessage = useCallback(
    (
      requestId: string,
      technicianId: string,
      technicianName: string,
      senderRole: UserRole,
      text: string
    ) => {
      const clean = text.trim();
      if (!clean) return;

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
        recipientRole:
          senderRole === 'customer' ? 'technician' : 'customer',
        recipientTechId:
          senderRole === 'customer' ? technicianId : undefined,
        type: 'new_message',
        title:
          senderRole === 'customer'
            ? `رسالة جديدة من العميل (#${requestId})`
            : `رسالة من ${technicianName} (#${requestId})`,
        body: clean,
        requestId,
        createdAt: 'الآن',
        isRead: false,
      };
      setNotifications((prev) => [alert, ...prev]);
      if (alert.recipientRole === 'customer') {
        // In-app push handled by PushNotificationBanner component
      }
    },
    [setMessages, setNotifications]
  );

  /* ======================
     HANDLERS: RECURRING
     ====================== */
  const handleTriggerRecurringNow = useCallback(
    (): { referenceCode: string; notifiedCount: number } | null => {
      return null;
    },
    []
  );

  const handleToggleRecurringStatus = useCallback(
    (scheduleId: string) => {
      setRecurringSchedules((prev) =>
        prev.map((s) =>
          s.id === scheduleId
            ? { ...s, status: s.status === 'active' ? 'paused' : 'active' }
            : s
        )
      );
    },
    [setRecurringSchedules]
  );

  const handleCancelRecurringSchedule = useCallback(
    (scheduleId: string) => {
      setRecurringSchedules((prev) =>
        prev.map((s) =>
          s.id === scheduleId ? { ...s, status: 'cancelled' } : s
        )
      );
    },
    [setRecurringSchedules]
  );

  /* ======================
     HANDLERS: ADDRESSES
     ====================== */
  const handleAddAddress = useCallback(
    (address: SavedAddress) => {
      setAddresses((prev) => {
        if (address.isDefault) {
          return [...prev.map((a) => ({ ...a, isDefault: false })), address];
        }
        return [...prev, address];
      });
    },
    [setAddresses]
  );

  const handleDeleteAddress = useCallback(
    (addressId: string) => {
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
    },
    [setAddresses]
  );

  const handleSetDefaultAddress = useCallback(
    (addressId: string) => {
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === addressId,
        }))
      );
    },
    [setAddresses]
  );

  /* ======================
     HANDLERS: NOTIFICATIONS
     ====================== */
  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => {
        const tech = activeTechnician();
        if (session?.role === 'customer' && n.recipientRole === 'customer') {
          return { ...n, isRead: true };
        }
        if (
          session?.role === 'technician' &&
          n.recipientRole === 'technician' &&
          (!n.recipientTechId ||
            n.recipientTechId === (tech?.id ?? session.technicianId))
        ) {
          return { ...n, isRead: true };
        }
        return n;
      })
    );
  }, [session, setNotifications, activeTechnician]);

  const handleSelectNotification = useCallback(
    (notif: AppNotification) => {
      const targetReq = requests.find((r) => r.id === notif.requestId);

      if (session?.role === 'technician') {
        const isMyAcceptedJob =
          !!targetReq &&
          ['quote_accepted', 'en_route', 'in_progress'].includes(targetReq.status) &&
          quotes.some(
            (q) => q.requestId === targetReq.id && q.status === 'accepted' && q.technicianId === session.technicianId
          );
        setTechTab(notif.type === 'quote_accepted' || isMyAcceptedJob ? 'accepted_jobs' : 'open_requests');
      } else {
        if (notif.type === 'recurring_generated') {
          setRequestsInitialTab('recurring');
          setFocusRequestId(null);
        } else if (targetReq) {
          setRequestsInitialTab(getRequestsTabForStatus(targetReq.status));
          setFocusRequestId(targetReq.id);
        } else {
          setRequestsInitialTab('open');
          setFocusRequestId(null);
        }
        setCustomerTab('requests');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [requests, quotes, session, setTechTab, setRequestsInitialTab, setCustomerTab]
  );

  const handleRequestBrowserPermission = useCallback(async () => {
    const result = await requestBrowserPushPermission();
    setBrowserPermission(result);
  }, [setBrowserPermission]);

  /* ======================
     HANDLERS: LOYALTY
     ====================== */
  const handleUseLoyaltyVoucher = (voucher: LoyaltyRedemption) => {
    setWarrantyClaimTarget(null);
    setRequestInitialBundle(null);
    setRequestInitialService(null);
    setRequestInitialCategoryId(undefined);
    setInitialLoyaltyVoucher(voucher);
    setIsRequestModalOpen(true);
  };

  /* ======================
     HELPERS
     ====================== */
  const toggleFavoriteService = (id: string) => {
    setFavoriteServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
    );
  };

  const allLocations = useMemo(
    () => [...customLocations, ...EGYPT_LOCATIONS],
    [customLocations]
  );

  const computeCustomerPointsSummary = (
    reqs: ServiceRequest[],
    redemptions: LoyaltyRedemption[]
  ) => {
    let totalEarned = 0;
    let totalSpent = 0;

    for (const r of reqs) {
      if (r.status === 'completed' && r.pointsAwarded) {
        totalEarned += r.pointsAwarded;
      }
    }

    for (const red of redemptions) {
      if (red.isUsed) {
        totalSpent += red.pointsSpent;
      }
    }

    return {
      availablePoints: totalEarned - totalSpent,
      totalEarned,
      totalSpent,
    };
  };

  /* ======================
     RENDER
     ====================== */
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 md:pb-0 transition-colors duration-200">
      {session?.role === 'technician' && myEnRouteRequestIds.length > 0 && (
        <div
          className={`text-center text-xs font-semibold py-2 px-3 text-white ${
            gpsStatus === 'sharing' ? 'bg-emerald-600' : 'bg-amber-500'
          }`}
        >
          {gpsStatus === 'sharing'
            ? 'موقعك الحي يُشارَك الآن مع العميل'
            : gpsStatus === 'denied'
            ? 'فعّل صلاحية الموقع في المتصفح ليرى العميل مسارك'
            : gpsStatus === 'unsupported'
            ? 'جهازك لا يدعم تحديد الموقع'
            : 'جارٍ تحديد موقعك...'}
        </div>
      )}
        <TopBar
          role={session?.role ?? 'customer'}
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
            session?.role === 'customer'
              ? handleRequestService()
              : handleSwitchAccount()
          }
          onSwitchAccount={handleSwitchAccount}
          technicianDisplayName={activeTechnician()?.name}
          unreadNotificationsCount={unreadNotificationsCount()}
          openCustomerRequestsCount={openCustomerRequestsCount()}
          acceptedTechJobsCount={acceptedTechJobsCount()}
        />

        <main className="flex-1">
          {session?.role === 'customer' ? (
            <>
              {customerTab === 'home' && (
                <HomeScreen
                  district={district}
                  user={user}
                  locations={allLocations}
                  technicians={technicians}
                  reviews={reviews}
                  quotes={quotes}
                  requests={requests}
                  liveLocations={liveLocations}
                  isDark={theme === 'dark'}
                  favoriteServiceIds={favoriteServiceIds}
                  onToggleFavoriteService={toggleFavoriteService}
                  onSelectDistrict={handleDistrictChange}
                  onSelectCategory={(catId) => {
                    setSelectedCategoryId(catId);
                    setCatalogSearchQuery('');
                    setCustomerTab('categories');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onRequestService={handleRequestService}
                  onRequestBundle={(bundle) => {
                    setWarrantyClaimTarget(null);
                    setInitialLoyaltyVoucher(null);
                    setRequestInitialBundle(bundle);
                    const matchedService =
                      SERVICES_CATALOG.find((s) => s.id === bundle.serviceId) ||
                      null;
                    setRequestInitialService(matchedService);
                    setRequestInitialCategoryId(bundle.categoryId);
                    setIsRequestModalOpen(true);
                  }}
                  onRequestWarrantyCheck={(originalRequest, quote) => {
                    const matchedService =
                      SERVICES_CATALOG.find(
                        (s) => s.title === originalRequest.serviceTitle
                      ) || null;
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
                  }}
                  onOpenRequests={(targetTab = 'open', requestId) => {
                    setFocusRequestId(requestId ?? null);
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
                  onAcceptQuote={(requestId, quoteId, paymentMethod, walletProvider) => {
                    const chosenQuote = quotes.find((q) => q.id === quoteId);
                    const targetReq = requests.find((r) => r.id === requestId);
                    if (!chosenQuote || !targetReq) return;

                    const finalMethod = paymentMethod || targetReq.paymentMethod || 'cash';
                    const finalWallet =
                      finalMethod === 'wallet'
                        ? walletProvider ?? targetReq.walletProvider
                        : undefined;

                    setQuotes((prev) =>
                      prev.map((q) =>
                        q.requestId !== requestId
                          ? q
                          : { ...q, status: q.id === quoteId ? 'accepted' : 'rejected' }
                      )
                    );

                    setRequests((prev) =>
                      prev.map((r) =>
                        r.id === requestId
                          ? {
                              ...r,
                              status: 'quote_accepted',
                              acceptedQuoteId: quoteId,
                              paymentMethod: finalMethod as PaymentMethod,
                              walletProvider: finalWallet,
                            }
                          : r
                      )
                    );
                  }}
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
                  onToggleFavoriteService={toggleFavoriteService}
                  onOpenLocation={() => setIsLocationModalOpen(true)}
                  onRequestService={(service) => handleRequestService(service)}
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
                  focusRequestId={focusRequestId}
                  onFocusConsumed={() => setFocusRequestId(null)}
                  liveLocations={liveLocations}
                  isDark={theme === 'dark'}
                  onAcceptQuote={(requestId, quoteId, paymentMethod, walletProvider) => {
                    const chosenQuote = quotes.find((q) => q.id === quoteId);
                    const targetReq = requests.find((r) => r.id === requestId);
                    if (!chosenQuote || !targetReq) return;

                    const finalMethod = paymentMethod || targetReq.paymentMethod || 'cash';
                    const finalWallet =
                      finalMethod === 'wallet'
                        ? walletProvider ?? targetReq.walletProvider
                        : undefined;

                    setQuotes((prev) =>
                      prev.map((q) =>
                        q.requestId !== requestId
                          ? q
                          : { ...q, status: q.id === quoteId ? 'accepted' : 'rejected' }
                      )
                    );

                    setRequests((prev) =>
                      prev.map((r) =>
                        r.id === requestId
                          ? {
                              ...r,
                              status: 'quote_accepted',
                              acceptedQuoteId: quoteId,
                              paymentMethod: finalMethod as PaymentMethod,
                              walletProvider: finalWallet,
                            }
                          : r
                      )
                    );
                  }}
                  onCancelRequest={cancelRequest}
                  onRateTechnician={handleRateTechnician}
                  onSendMessage={handleSendRequestMessage}
                  onViewTechnicianStats={(techId) => setViewingTechStatsId(techId)}
                  onTriggerRecurringNow={handleTriggerRecurringNow}
                  onToggleRecurringStatus={handleToggleRecurringStatus}
                  onCancelRecurringSchedule={handleCancelRecurringSchedule}
                  onNewRequest={() => handleRequestService()}
                  onWhatsApp={handleWhatsApp}
                  onCall={handlePhoneCall}
                  onRequestWarrantyCheck={(originalRequest, quote) => {
                    const matchedService =
                      SERVICES_CATALOG.find(
                        (s) => s.title === originalRequest.serviceTitle
                      ) || null;
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
                  }}
                />
              )}

              {customerTab === 'notifications' && (
                <NotificationsScreen
                  role="customer"
                  notifications={visibleNotifications()}
                  pushPrefs={pushPrefs}
                  browserPermission={browserPermission}
                  onRequestBrowserPermission={handleRequestBrowserPermission}
                  onUpdatePushPrefs={setPushPrefs}
                  onSimulatePush={() => {}}
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
                  onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                  pushPrefs={pushPrefs}
                  browserPermission={browserPermission}
                  onUpdatePushPrefs={setPushPrefs}
                  onRequestBrowserPermission={handleRequestBrowserPermission}
                  requests={requests}
                  quotes={quotes}
                  reviews={reviews}
                  loyaltyRedemptions={loyaltyRedemptions}
                  onRedeemPoints={handleRedeemPoints}
                  onUseLoyaltyVoucher={handleUseLoyaltyVoucher}
                  favoriteServiceIds={favoriteServiceIds}
                  onToggleFavoriteService={toggleFavoriteService}
                  onRequestService={(service) => handleRequestService(service)}
                  onBrowseServices={() => {
                    setSelectedCategoryId('all');
                    setCatalogSearchQuery('');
                    setCustomerTab('categories');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}
            </>
          ) : (
            activeTechnician() && (
              <>
                {techTab === 'notifications' ? (
                  <NotificationsScreen
                    role="technician"
                    notifications={visibleNotifications()}
                    onMarkAllRead={handleMarkAllNotificationsRead}
                    onSelectNotification={handleSelectNotification}
                  />
                ) : techTab === 'tech_stats' ? (
                  <TechnicianStatsScreen
                    technician={activeTechnician()!}
                    reviews={reviews}
                    quotes={quotes}
                    requests={requests}
                  />
                ) : (
                  <TechnicianPortalScreen
                    activeTab={techTab}
                    technician={activeTechnician()!}
                    requests={requests}
                    quotes={quotes}
                    messages={messages}
                    isDark={theme === 'dark'}
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

        <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto transition-colors">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <BrandWordmark size="sm" />
              <span>خدمات الدقهلية والمنصورة الجديدة</span>
            </div>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleSwitchAccount}
                className="font-semibold text-orange-700 dark:text-orange-400 hover:underline cursor-pointer"
              >
                تبديل الحساب (
                {session?.role === 'customer' ? 'عميل' : 'فني / شركة'}
                )
              </button>
            </div>
          </div>
        </footer>

        <BottomNav
          role={session?.role ?? 'customer'}
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
          unreadNotificationsCount={unreadNotificationsCount()}
          openCustomerRequestsCount={openCustomerRequestsCount()}
          acceptedTechJobsCount={acceptedTechJobsCount()}
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
          locations={allLocations}
          onAddCustomLocation={handleAddCustomLocation}
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
          onGoToRequests={() => {
            setRequestsInitialTab('open');
            setCustomerTab('requests');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
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
          onRequestService={handleRequestService}
          onRequestBundle={(bundle) => {
            setWarrantyClaimTarget(null);
            setInitialLoyaltyVoucher(null);
            setRequestInitialBundle(bundle);
            const matchedService =
              SERVICES_CATALOG.find((s) => s.id === bundle.serviceId) || null;
            setRequestInitialService(matchedService);
            setRequestInitialCategoryId(bundle.categoryId);
            setIsRequestModalOpen(true);
          }}
        />

        <OfflineIndicator />

        {session?.role === 'customer' && (
          <PushNotificationBanner
            toasts={activePushToasts}
            onDismiss={(id: string) => {
              setActivePushToasts((prev) => prev.filter((n) => n.id !== id));
            }}
            onSelect={handleSelectNotification}
          />
        )}
      </div>
  );
}

export default App;
