import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAppStore.setState({
      session: null,
      user: { name: 'عميل خدمات', phone: '01012345678', defaultDistrict: 'المنصورة' },
      district: 'المنصورة',
      customerTab: 'home',
      techTab: 'open_requests',
      requestsInitialTab: 'open',
      addresses: [],
      customLocations: [],
      technicians: [],
      requests: [],
      recurringSchedules: [],
      quotes: [],
      messages: [],
      notifications: [],
      reviews: [],
      favoriteServiceIds: [],
      loyaltyRedemptions: [],
      theme: 'light',
      pushPrefs: {
        inAppBannerEnabled: true,
        browserPushEnabled: false,
        soundEnabled: true,
        quoteAccepted: true,
        techEnRoute: true,
        jobInProgress: true,
        jobCompleted: true,
        newQuote: true,
      },
      browserPermission: 'default',
      activePushToasts: [],
      isLocationModalOpen: false,
      isRequestModalOpen: false,
      isSmartPlannerOpen: false,
      viewingTechStatsId: null,
      requestInitialService: null,
      requestInitialCategoryId: undefined,
      requestInitialBundle: null,
      warrantyClaimTarget: null,
      initialLoyaltyVoucher: null,
      selectedCategoryId: 'all',
      catalogSearchQuery: '',
    });
  });

  it('should initialize with default state', () => {
    const state = useAppStore.getState();
    expect(state.session).toBeNull();
    expect(state.customerTab).toBe('home');
    expect(state.district).toBe('المنصورة');
    expect(state.theme).toBe('light');
  });

  it('should set session correctly', () => {
    useAppStore.setState({
      session: { role: 'customer' as const, customer: { name: 'test', phone: '123', defaultDistrict: 'القاهرة' } },
    });
    const state = useAppStore.getState();
    expect(state.session?.role).toBe('customer');
    if (state.session?.role === 'customer') {
      expect(state.session.customer.name).toBe('test');
    }
  });

  it('should toggle theme correctly', () => {
    useAppStore.setState({ theme: 'dark' });
    expect(useAppStore.getState().theme).toBe('dark');

    useAppStore.setState({ theme: 'light' });
    expect(useAppStore.getState().theme).toBe('light');
  });

  it('should add and remove favorite services', () => {
    useAppStore.setState({ favoriteServiceIds: [] });
    useAppStore.setState({ favoriteServiceIds: ['svc-1', 'svc-2'] });
    expect(useAppStore.getState().favoriteServiceIds).toEqual(['svc-1', 'svc-2']);

    useAppStore.setState({ favoriteServiceIds: ['svc-1'] });
    expect(useAppStore.getState().favoriteServiceIds).toEqual(['svc-1']);
  });

  it('should manage technician data', () => {
    const techs = [
      { id: '1', name: 'أحمد', specialty: 'تكييف', area: 'المنصورة', primaryCenter: 'المنصورة', coveredCenters: ['المنصورة'], coveredAreas: ['المنصورة'], rating: 4.5, reviewsCount: 10, completedJobs: 50, yearsExp: 5, phone: '01234567890', initials: 'أ', isCompany: false, categoryIds: ['ac'] },
    ];
    useAppStore.setState({ technicians: techs });
    expect(useAppStore.getState().technicians).toHaveLength(1);
    expect(useAppStore.getState().technicians[0].name).toBe('أحمد');
  });
});