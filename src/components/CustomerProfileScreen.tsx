import {
  Award,
  BellRing,
  Check,
  ChevronDown,
  Gift,
  Heart,
  LogOut,
  MapPin,
  Moon,
  Plus,
  Sparkles,
  Star,
  Sun,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  KHADAMAT_BONUS_POINTS_FOR_RATING,
  KHADAMAT_POINTS_PER_COMPLETED_ORDER,
  LOYALTY_REWARDS,
  SERVICE_CATEGORIES,
  SERVICES_CATALOG,
  computeCustomerPointsSummary,
  computeServiceMarketStats,
  formatEGP,
} from '../data/khadamatData';
import {
  LoyaltyRedemption,
  LoyaltyRewardTier,
  PushPreferences,
  SavedAddress,
  ServiceItem,
  ServiceQuote,
  ServiceRequest,
  TechnicianReview,
  UserProfile,
} from '../types/khadamat';
import { BrowserPushPermissionState } from '../utils/pushNotifications';
import { AndroidApkGuideCard } from './PWAInstallBanner';
import { ServiceImage } from './ServiceImage';

interface CustomerProfileScreenProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  addresses: SavedAddress[];
  onAddAddress: (addr: Omit<SavedAddress, 'id'>) => void;
  onDeleteAddress: (id: string) => void;
  onSetDefaultAddress: (id: string) => void;
  currentDistrict: string;
  onOpenLocation: () => void;
  onSwitchAccount: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  pushPrefs?: PushPreferences;
  browserPermission?: BrowserPushPermissionState;
  onUpdatePushPrefs?: (next: PushPreferences) => void;
  onRequestBrowserPermission?: () => Promise<void> | void;
  requests?: ServiceRequest[];
  quotes?: ServiceQuote[];
  reviews?: TechnicianReview[];
  loyaltyRedemptions?: LoyaltyRedemption[];
  onRedeemPoints?: (reward: LoyaltyRewardTier) => void;
  onUseLoyaltyVoucher?: (voucher: LoyaltyRedemption) => void;
  favoriteServiceIds?: string[];
  onToggleFavoriteService?: (serviceId: string) => void;
  onRequestService?: (service: ServiceItem) => void;
  onBrowseServices?: () => void;
}

const FAQS = [
  {
    q: 'كيف يتحدد السعر؟',
    a: 'يرسل لك الفنيون عروضهم لتختار الأنسب.',
  },
  {
    q: 'متى يظهر رقم موبايلي؟',
    a: 'يظهر فقط للفني الذي توافق على عرضه.',
  },
  {
    q: 'هل يمكن إضافة منطقة؟',
    a: 'نعم، من نافذة اختيار المنطقة.',
  },
];

export function CustomerProfileScreen({
  user,
  onUpdateUser,
  addresses,
  onAddAddress,
  onDeleteAddress,
  onSetDefaultAddress,
  currentDistrict,
  onOpenLocation,
  onSwitchAccount,
  theme,
  onToggleTheme,
  pushPrefs,
  browserPermission = 'default',
  onUpdatePushPrefs,
  onRequestBrowserPermission,
  requests = [],
  quotes = [],
  reviews = [],
  loyaltyRedemptions = [],
  onRedeemPoints,
  onUseLoyaltyVoucher,
  favoriteServiceIds = [],
  onToggleFavoriteService,
  onRequestService,
  onBrowseServices,
}: CustomerProfileScreenProps) {
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [savedMsg, setSavedMsg] = useState(false);
  const [redeemedNotice, setRedeemedNotice] = useState<string>('');

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('المنزل');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrBuilding, setAddrBuilding] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const isDark = theme === 'dark';
  const pointsSummary = computeCustomerPointsSummary(requests, loyaltyRedemptions);
  const activeVouchers = loyaltyRedemptions.filter((v) => !v.isUsed);

  const favoriteServices = useMemo(
    () =>
      favoriteServiceIds
        .map((id) => SERVICES_CATALOG.find((s) => s.id === id))
        .filter((s): s is ServiceItem => Boolean(s)),
    [favoriteServiceIds]
  );

  const handleRedeem = (reward: LoyaltyRewardTier) => {
    if (!onRedeemPoints || pointsSummary.availablePoints < reward.pointsCost) return;
    onRedeemPoints(reward);
    setRedeemedNotice(`تم استبدال ${reward.pointsCost} نقطة (${reward.title})`);
    window.setTimeout(() => setRedeemedNotice(''), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) return;
    onUpdateUser({ ...user, name: editName.trim(), phone: editPhone.trim() });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet.trim()) return;
    onAddAddress({
      label: addrLabel.trim() || 'عنوان جديد',
      district: currentDistrict,
      streetDetails: addrStreet.trim(),
      buildingFloor: addrBuilding.trim() || 'الدور الأول',
      isDefault: addresses.length === 0,
    });
    setAddrStreet('');
    setAddrBuilding('');
    setShowAddAddress(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 md:px-6 py-4 md:py-6 space-y-4 pb-12">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">حسابي</h1>

        <button
          type="button"
          onClick={onSwitchAccount}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>تبديل الحساب</span>
        </button>
      </div>

      {/* Loyalty Points */}
      <section className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-800 rounded-2xl p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff7426] to-[#c2410c] text-white flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-50 truncate">
                نقاط خدمات · {pointsSummary.tierName}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                +{KHADAMAT_POINTS_PER_COMPLETED_ORDER} نقطة/طلب و+{KHADAMAT_BONUS_POINTS_FOR_RATING}{' '}
                للتقييم (100 نقطة = 10 ج.م ولا تنتهي)
              </p>
            </div>
          </div>

          <div className="text-left shrink-0">
            <div className="text-xl font-black text-[#ea580c] dark:text-orange-400 tabular-nums leading-none">
              {pointsSummary.availablePoints}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">نقطة متاحة</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200">
              <Sparkles className="w-3 h-3 text-[#ea580c]" />
              {pointsSummary.nextMilestoneLabel}
            </span>
            <span className="text-[#ea580c] tabular-nums">{pointsSummary.progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-l from-[#ea580c] to-amber-500 transition-all"
              style={{ width: `${Math.max(4, pointsSummary.progressPercent)}%` }}
            />
          </div>
        </div>

        {redeemedNotice && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <Check className="w-4 h-4 shrink-0" />
            <span>{redeemedNotice}</span>
          </div>
        )}

        {activeVouchers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeVouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="bg-emerald-50/75 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-2.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                    {voucher.title}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 tabular-nums">
                    <Tag className="w-3 h-3 inline ml-1" />
                    {voucher.promoCode}
                  </div>
                </div>
                {onUseLoyaltyVoucher && (
                  <button
                    type="button"
                    onClick={() => onUseLoyaltyVoucher(voucher)}
                    className="min-h-[36px] px-3 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    استخدم
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {LOYALTY_REWARDS.map((reward) => {
            const canRedeem = pointsSummary.availablePoints >= reward.pointsCost;
            return (
              <button
                key={reward.id}
                type="button"
                disabled={!canRedeem || !onRedeemPoints}
                onClick={() => handleRedeem(reward)}
                className={`p-2.5 rounded-xl border text-right transition-colors tabular-nums ${
                  canRedeem
                    ? 'border-orange-200 bg-orange-50/60 dark:border-orange-800 dark:bg-orange-950/30 hover:bg-orange-100 cursor-pointer'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 opacity-75 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-900 dark:text-slate-100">
                  <Gift className="w-3 h-3 text-[#ea580c] shrink-0" />
                  <span className="truncate">{formatEGP(reward.discountEGP)}</span>
                </div>
                <div className="text-[10px] font-bold text-[#ea580c] dark:text-orange-400 mt-0.5">
                  {reward.pointsCost} نقطة
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Dark Mode Switch */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 flex items-center justify-center shrink-0">
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-50">الوضع الداكن</div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label="تبديل الوضع الداكن"
          onClick={onToggleTheme}
          className="min-h-[40px] flex items-center cursor-pointer shrink-0"
        >
          <span
            dir="ltr"
            className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
              isDark ? 'bg-orange-600 border-orange-500' : 'bg-slate-200 border-slate-300'
            }`}
          >
            <span
              className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </span>
        </button>
      </section>

      {/* Smart Push Notifications Toggle */}
      {pushPrefs && onUpdatePushPrefs && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                إشعارات البوش الذكية
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                تنبيه ملون عند قبول العرض وتحرك الفني والإنهاء
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {browserPermission === 'default' && onRequestBrowserPermission && (
              <button
                type="button"
                onClick={() => void onRequestBrowserPermission()}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer"
              >
                تفعيل إشعارات الجهاز
              </button>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={pushPrefs.inAppBannerEnabled}
              aria-label="تفعيل إشعارات البوش الذكية"
              onClick={() =>
                onUpdatePushPrefs({
                  ...pushPrefs,
                  inAppBannerEnabled: !pushPrefs.inAppBannerEnabled,
                })
              }
              className="min-h-[40px] flex items-center cursor-pointer"
            >
              <span
                dir="ltr"
                className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
                  pushPrefs.inAppBannerEnabled
                    ? 'bg-orange-600 border-orange-500'
                    : 'bg-slate-200 border-slate-300'
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
                    pushPrefs.inAppBannerEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </div>
        </section>
      )}

      {/* User Info */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">بيانات العميل</h2>
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="الاسم"
            className="w-full h-10 px-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:border-[#FF5A00] focus:outline-none"
          />
          <input
            type="tel"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder="الموبايل"
            className="w-full h-10 px-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-right tabular-nums focus:border-[#FF5A00] focus:outline-none"
          />
          <div className="sm:col-span-2 flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              {savedMsg ? 'تم الحفظ' : ''}
            </span>
            <button
              type="submit"
              className="px-4 py-2 min-h-[40px] bg-[#FF5A00] dark:bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 cursor-pointer"
            >
              حفظ
            </button>
          </div>
        </form>
      </section>

      {/* Saved Addresses */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">العناوين المحفوظة</h2>
          <button
            type="button"
            onClick={() => setShowAddAddress(true)}
            className="inline-flex items-center gap-1 min-h-[38px] px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                addr.isDefault
                  ? 'border-[#FF5A00] dark:border-orange-500 bg-orange-50/45 dark:bg-orange-950/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5A00] shrink-0" />
                  <span>{addr.label}</span>
                  <span className="text-[11px] font-normal text-slate-500 truncate">
                    · {addr.district}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                  {addr.streetDetails} · {addr.buildingFloor}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => onSetDefaultAddress(addr.id)}
                    className="text-[11px] font-bold text-orange-700 dark:text-orange-400 px-2 py-1 cursor-pointer"
                  >
                    افتراضي
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteAddress(addr.id)}
                  aria-label={`حذف ${addr.label}`}
                  className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Compact FAQ */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">الأسئلة الشائعة</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {FAQS.map((faq, idx) => {
            const open = openFaqIndex === idx;
            return (
              <div key={faq.q} className="py-1.5">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(open ? null : idx)}
                  className="w-full flex items-center justify-between gap-3 text-right min-h-[38px] cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 pb-1.5">{faq.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <AndroidApkGuideCard />

      {/* Customer-Only Favorite Services Section at Bottom of Profile («خدماتي المفضلة») */}
      <section
        id="favorite-services"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              الخدمات المفضلة ({favoriteServices.length})
            </h2>
          </div>
          {onBrowseServices && (
            <button
              type="button"
              onClick={onBrowseServices}
              className="text-xs font-bold text-[#FF5A00] dark:text-orange-400 hover:underline cursor-pointer"
            >
              تصفح الخدمات
            </button>
          )}
        </div>

        {favoriteServices.length === 0 ? (
          <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-400">
            <span>اضغط على أيقونة القلب في أي خدمة لحفظها هنا.</span>
            {onBrowseServices && (
              <button
                type="button"
                onClick={onBrowseServices}
                className="px-3 py-1.5 bg-[#FF5A00] text-white text-[11px] font-bold rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                الخدمات
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {favoriteServices.map((service) => {
              const cat = SERVICE_CATEGORIES.find((c) => c.id === service.categoryId);
              const marketStats = computeServiceMarketStats(
                service.title,
                quotes,
                requests,
                reviews
              );

              return (
                <article
                  key={`profile-fav-${service.id}`}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div>
                    <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <ServiceImage
                        src={service.imageUrl}
                        alt={service.title}
                        iconKey={cat?.iconKey || 'carpentry'}
                        className="w-full h-full"
                      />
                      {onToggleFavoriteService && (
                        <button
                          type="button"
                          onClick={() => onToggleFavoriteService(service.id)}
                          aria-label={`إزالة ${service.title} من المفضلة`}
                          className="absolute top-1.5 left-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-rose-50/95 dark:bg-rose-950/90 text-rose-600 cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        </button>
                      )}
                    </div>
                    <div className="p-2.5 space-y-0.5">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 tabular-nums">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{service.rating}</span>
                        <span>·</span>
                        <span className="truncate">{cat?.name}</span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {service.title}
                      </h3>
                    </div>
                  </div>

                  <div className="px-2.5 pb-2.5 flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 tabular-nums truncate">
                      {marketStats.lowestOfferEGP !== null
                        ? `من ${formatEGP(marketStats.lowestOfferEGP)}`
                        : service.estimatedDuration}
                    </span>
                    {onRequestService && (
                      <button
                        type="button"
                        onClick={() => onRequestService(service)}
                        className="min-h-[32px] px-2.5 py-1 bg-[#FF5A00] text-white text-[11px] font-bold rounded-lg shrink-0 cursor-pointer"
                      >
                        اطلب
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Address Modal */}
      {showAddAddress && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 md:p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveAddress}
            className="w-full md:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">إضافة عنوان</h3>
              <button
                type="button"
                onClick={() => setShowAddAddress(false)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
                placeholder="التسمية (المنزل، العمل...)"
                className="w-full h-10 px-3 text-xs md:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
              />
              <button
                type="button"
                onClick={onOpenLocation}
                className="w-full min-h-[40px] px-3 text-xs md:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl flex items-center justify-between gap-2 text-right cursor-pointer"
              >
                <span className="truncate">{currentDistrict}</span>
                <span className="text-xs font-semibold text-[#FF5A00] shrink-0">تغيير</span>
              </button>
              <input
                type="text"
                required
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                placeholder="اسم الشارع ورقم المنزل"
                className="w-full h-10 px-3 text-xs md:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
              />
              <input
                type="text"
                value={addrBuilding}
                onChange={(e) => setAddrBuilding(e.target.value)}
                placeholder="الدور والشقة"
                className="w-full h-10 px-3 text-xs md:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-[#FF5A00] dark:bg-orange-600 text-white text-sm font-bold rounded-xl cursor-pointer"
            >
              حفظ العنوان
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
