import {
  Award,
  Check,
  ChevronDown,
  Gift,
  LogOut,
  MapPin,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  KHADAMAT_BONUS_POINTS_FOR_RATING,
  KHADAMAT_POINTS_PER_COMPLETED_ORDER,
  LOYALTY_REWARDS,
  computeCustomerPointsSummary,
  formatEGP,
} from '../data/khadamatData';
import {
  LoyaltyRedemption,
  LoyaltyRewardTier,
  SavedAddress,
  ServiceRequest,
  UserProfile,
} from '../types/khadamat';
import { AndroidApkGuideCard } from './PWAInstallBanner';

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
  requests?: ServiceRequest[];
  loyaltyRedemptions?: LoyaltyRedemption[];
  onRedeemPoints?: (reward: LoyaltyRewardTier) => void;
  onUseLoyaltyVoucher?: (voucher: LoyaltyRedemption) => void;
}

const FAQS = [
  {
    q: 'كيف يتم تحديد السعر؟',
    a: 'تصف الخدمة ويقدم لك الفنيون عروضهم بالجنيه لتختار الأنسب.',
  },
  {
    q: 'كيف يتم إرسال الطلبات؟',
    a: 'تصل لفنيي منطقتك أولاً أو الأقرب فالأقرب داخل الدقهلية.',
  },
  {
    q: 'متى يظهر رقم موبايلي؟',
    a: 'يظل مخفياً ولا يظهر إلا للفني الذي توافق على عرضه.',
  },
  {
    q: 'هل يمكنني إضافة منطقة جديدة؟',
    a: 'نعم، من نافذة اختيار المنطقة اختر «إضافة منطقة جديدة» وأدخل اسمها.',
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
  requests = [],
  loyaltyRedemptions = [],
  onRedeemPoints,
  onUseLoyaltyVoucher,
}: CustomerProfileScreenProps) {
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [savedMsg, setSavedMsg] = useState(false);
  const [redeemedNotice, setRedeemedNotice] = useState<string>('');

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('المنزل');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrBuilding, setAddrBuilding] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const isDark = theme === 'dark';
  const pointsSummary = computeCustomerPointsSummary(requests, loyaltyRedemptions);
  const activeVouchers = loyaltyRedemptions.filter((v) => !v.isUsed);

  const handleRedeem = (reward: LoyaltyRewardTier) => {
    if (!onRedeemPoints || pointsSummary.availablePoints < reward.pointsCost) return;
    onRedeemPoints(reward);
    setRedeemedNotice(`تم استبدال ${reward.pointsCost} نقطة والحصول على ${reward.title}!`);
    window.setTimeout(() => setRedeemedNotice(''), 3500);
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
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 pb-14">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
            حسابي وعناويني
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            بيانات التواصل، المظهر الليلي، والعناوين المحفوظة
          </p>
        </div>

        <button
          type="button"
          onClick={onSwitchAccount}
          className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>تبديل الحساب (عميل / فني)</span>
        </button>
      </div>

      {/* Khadamat Loyalty Points Progress & Instant Discount Redemption */}
      <section className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff7426] via-[#ea580c] to-[#c2410c] text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-600/20">
              <Award className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">
                  نقاط خدمات للولاء والمكافآت
                </h2>
                <span className="text-xs font-bold text-[#ea580c] dark:text-orange-400">
                  · {pointsSummary.tierName}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed tabular-nums">
                تكسب +{KHADAMAT_POINTS_PER_COMPLETED_ORDER} نقطة مع كل طلب مكتمل و+{KHADAMAT_BONUS_POINTS_FOR_RATING} نقطة عند التقييم (كل 100 نقطة = خصم 10 ج.م فوري).
              </p>
            </div>
          </div>

          <div className="bg-orange-50/80 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/80 rounded-2xl px-4 py-3 text-right sm:text-left shrink-0">
            <div className="text-[11px] font-semibold text-orange-800 dark:text-orange-300">
              رصيدك المتاح للاستبدال
            </div>
            <div className="text-2xl font-black text-[#ea580c] dark:text-orange-400 tabular-nums">
              {pointsSummary.availablePoints} <span className="text-sm font-bold">نقطة</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {pointsSummary.completedOrdersCount} طلب مكتمل · إجمالي {pointsSummary.earnedPoints} نقطة
            </div>
          </div>
        </div>

        {/* Points Progress Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ea580c] dark:text-orange-400 shrink-0" />
              <span>التقدم نحو المكافأة القادمة: {pointsSummary.nextMilestoneLabel}</span>
            </span>
            <span className="font-extrabold text-[#ea580c] dark:text-orange-400 tabular-nums">
              {pointsSummary.pointsToNextMilestone > 0
                ? `متبقي ${pointsSummary.pointsToNextMilestone} نقطة (${pointsSummary.progressPercent}%)`
                : 'جاهز لأعلى مكافأة (100%)'}
            </span>
          </div>

          <div
            className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
            role="progressbar"
            aria-valuenow={pointsSummary.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="شريط تقدم نقاط خدمات"
          >
            <div
              className="h-full rounded-full bg-gradient-to-l from-[#ea580c] via-orange-500 to-amber-500 transition-all duration-500"
              style={{ width: `${Math.max(4, pointsSummary.progressPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            <span>0 نقطة</span>
            <span className={pointsSummary.availablePoints >= 100 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}>
              100 نقطة (10 ج.م)
            </span>
            <span className={pointsSummary.availablePoints >= 200 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}>
              200 نقطة (20 ج.م)
            </span>
            <span className={pointsSummary.availablePoints >= 400 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''}>
              400 نقطة (40 ج.م)
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
            <span>💡 متى يتجدد الرصيد؟ النقاط لا تنتهي صلاحيتها أبداً وتبقى في حسابك الدائم حتى تستبدلها.</span>
          </div>
        </div>

        {redeemedNotice && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{redeemedNotice}</span>
          </div>
        )}

        {/* Active Redeemed Vouchers */}
        {activeVouchers.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>قسائم الخصم المستبدلة والجاهزة للاستخدام ({activeVouchers.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="bg-emerald-50/75 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                      {voucher.title}
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 tabular-nums">
                      كود {voucher.promoCode} · استُبدل بـ {voucher.pointsSpent} نقطة
                    </div>
                  </div>
                  {onUseLoyaltyVoucher && (
                    <button
                      type="button"
                      onClick={() => onUseLoyaltyVoucher(voucher)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      استخدم في طلب الآن
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Redeemable Discount Tiers */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-[#ea580c] dark:text-orange-400" />
            <span>استبدال النقاط بخصومات فورية</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LOYALTY_REWARDS.map((reward) => {
              const canRedeem = pointsSummary.availablePoints >= reward.pointsCost;
              const missingPoints = Math.max(
                0,
                reward.pointsCost - pointsSummary.availablePoints
              );
              return (
                <div
                  key={reward.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                    canRedeem
                      ? 'border-orange-200 dark:border-orange-800/80 bg-orange-50/40 dark:bg-orange-950/25'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {reward.title}
                      </span>
                      <span className="text-xs font-bold text-[#ea580c] dark:text-orange-400 tabular-nums shrink-0">
                        {reward.pointsCost} نقطة
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {reward.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!canRedeem || !onRedeemPoints}
                    onClick={() => handleRedeem(reward)}
                    className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold transition-colors tabular-nums ${
                      canRedeem
                        ? 'bg-[#ea580c] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white cursor-pointer'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {canRedeem
                      ? `استبدال بخصم ${formatEGP(reward.discountEGP)}`
                      : `ينقصك ${missingPoints} نقطة`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Appearance & Dark Mode Toggle Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isDark
                  ? 'bg-orange-950/80 text-orange-300 border border-orange-800/70'
                  : 'bg-orange-50 text-orange-700 border border-orange-200/70'
              }`}
            >
              {isDark ? (
                <Moon className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Sun className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  الوضع الداكن (Dark Mode)
                </h2>
                <span
                  className={`text-[11px] font-bold ${
                    isDark ? 'text-orange-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isDark ? 'مُفعّل' : 'الوضع الفاتح'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                تبديل ألوان كافة شاشات التطبيق إلى درجات داكنة هادئة لراحة العين في الاستخدام الليلي.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="تبديل الوضع الداكن"
            onClick={onToggleTheme}
            className="min-h-[44px] min-w-[64px] flex items-center justify-center px-1 rounded-2xl cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            <span
              dir="ltr"
              className={`relative inline-flex h-8 w-14 items-center rounded-full border transition-colors duration-200 ${
                isDark
                  ? 'bg-orange-600 border-orange-500'
                  : 'bg-slate-200 border-slate-300'
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  isDark ? 'translate-x-7' : 'translate-x-1'
                }`}
              >
                {isDark ? (
                  <Moon className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                )}
              </span>
            </span>
          </button>
        </div>
      </section>

      {/* User Info */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">بيانات العميل</h2>
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              الاسم
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              رقم الموبايل
            </label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-right tabular-nums focus:bg-white dark:focus:bg-slate-800 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between pt-1">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              {savedMsg ? 'تم حفظ البيانات بنجاح.' : ''}
            </span>
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] bg-[#FF5A00] dark:bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:hover:bg-orange-500 transition-colors cursor-pointer"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </section>

      {/* Saved Addresses */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
              العناوين المحفوظة
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              لتعبئة العنوان سريعاً عند الطلب
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddAddress(true)}
            className="inline-flex items-center gap-1.5 min-h-[42px] px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عنوان</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                addr.isDefault
                  ? 'border-[#FF5A00] dark:border-orange-500 bg-orange-50/45 dark:bg-orange-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <MapPin className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                    {addr.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                    {addr.district}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 pt-1">
                  {addr.streetDetails}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{addr.buildingFloor}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                {addr.isDefault ? (
                  <span className="font-semibold text-orange-700 dark:text-orange-400">
                    العنوان الافتراضي
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetDefaultAddress(addr.id)}
                    className="font-semibold text-slate-700 dark:text-slate-300 hover:text-[#FF5A00] dark:hover:text-orange-400 cursor-pointer"
                  >
                    تعيين كافتراضي
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteAddress(addr.id)}
                  aria-label={`حذف عنوان ${addr.label}`}
                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">الأسئلة الشائعة</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {FAQS.map((faq, idx) => {
            const open = openFaqIndex === idx;
            return (
              <div key={faq.q} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(open ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 text-right min-h-[44px] cursor-pointer"
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {open && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1 pb-2">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <AndroidApkGuideCard />

      {/* Add Address Modal */}
      {showAddAddress && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveAddress}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                إضافة عنوان جديد
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAddress(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  التسمية
                </label>
                <input
                  type="text"
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  placeholder="مثال: المنزل، العمل، بيت العائلة"
                  className="w-full h-11 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  المدينة أو القرية
                </label>
                <button
                  type="button"
                  onClick={onOpenLocation}
                  className="w-full min-h-[44px] px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl flex items-center justify-between gap-2 text-right cursor-pointer"
                >
                  <span className="truncate">{currentDistrict}</span>
                  <span className="text-xs font-semibold text-[#FF5A00] dark:text-orange-400 shrink-0">
                    تغيير
                  </span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  اسم الشارع ورقم المنزل
                </label>
                <input
                  type="text"
                  required
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder="مثال: شارع الجمهورية، بجوار المحكمة"
                  className="w-full h-11 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  الدور ورقم الشقة
                </label>
                <input
                  type="text"
                  value={addrBuilding}
                  onChange={(e) => setAddrBuilding(e.target.value)}
                  placeholder="مثال: الدور الثالث · شقة 5"
                  className="w-full h-11 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-[#FF5A00] dark:bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 dark:hover:bg-orange-500 transition-colors cursor-pointer"
            >
              حفظ العنوان
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
