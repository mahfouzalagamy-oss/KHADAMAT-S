import { ArrowLeft, Check, MapPin, MessageCircle, Phone, Siren, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  DAKAHLIA_CENTERS,
  EGYPT_LOCATIONS,
  findNearestMatchingTechnicians,
  getLocationMeta,
} from '../data/dakahliaLocations';
import {
  VERIFIED_TECHNICIANS,
  buildWhatsAppLink,
  computeTechnicianStats,
  formatEGP,
} from '../data/khadamatData';
import {
  LocationEntry,
  ServiceQuote,
  ServiceRequest,
  Technician,
  TechnicianReview,
  UserProfile,
} from '../types/khadamat';

interface EmergencyServicesSectionProps {
  district: string;
  locations?: LocationEntry[];
  technicians?: Technician[];
  user: UserProfile;
  requests: ServiceRequest[];
  quotes?: ServiceQuote[];
  reviews?: TechnicianReview[];
  onDispatchEmergency: (req: ServiceRequest) => void;
  onAcceptQuote?: (requestId: string, quoteId: string) => void;
  onOpenRequests?: (targetTab?: 'open' | 'active' | 'history') => void;
  compactTile?: boolean;
}

const QUICK_EMERGENCIES = [
  { id: 'em-leak', title: 'تسريب مياه', categoryId: 'plumbing' },
  { id: 'em-elec', title: 'عطل كهرباء', categoryId: 'electrical' },
  { id: 'em-ac', title: 'عطل تكييف', categoryId: 'ac' },
  { id: 'em-gas', title: 'سخان / غاز', categoryId: 'plumbing' },
];

export function EmergencyServicesSection({
  district,
  locations = EGYPT_LOCATIONS,
  technicians = VERIFIED_TECHNICIANS,
  user,
  requests,
  quotes = [],
  reviews = [],
  onDispatchEmergency,
  onAcceptQuote,
  onOpenRequests,
  compactTile = false,
}: EmergencyServicesSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeEmergencyReqId, setActiveEmergencyReqId] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(district);
  const [selectedCenter, setSelectedCenter] = useState<string>(
    () => getLocationMeta(district, locations).center
  );

  const centerLocations = useMemo(() => {
    const matches = locations.filter((l) => l.center === selectedCenter);
    return matches.length > 0 ? matches : locations.slice(0, 6);
  }, [locations, selectedCenter]);

  const emergencyProximity = useMemo(
    () => findNearestMatchingTechnicians('plumbing', selectedDistrict, technicians, locations),
    [selectedDistrict, technicians, locations]
  );

  const activeEmergency = requests.find(
    (r) =>
      (activeEmergencyReqId ? r.id === activeEmergencyReqId : r.urgency === 'urgent') &&
      r.status !== 'completed' &&
      r.status !== 'cancelled'
  );

  const emergencyQuotes = activeEmergency
    ? quotes.filter((q) => q.requestId === activeEmergency.id)
    : [];

  const handleCenterChange = (nextCenter: string) => {
    setSelectedCenter(nextCenter);
    const firstArea = locations.find((l) => l.center === nextCenter);
    if (firstArea) {
      setSelectedDistrict(firstArea.displayLabel);
    }
  };

  const handleQuickDispatch = (item: (typeof QUICK_EMERGENCIES)[0]) => {
    const refCode = `EMG-${Math.floor(10000 + Math.random() * 89999)}`;
    const routing = findNearestMatchingTechnicians(
      item.categoryId,
      selectedDistrict,
      technicians,
      locations
    );
    const emergencyReq: ServiceRequest = {
      id: `req-emg-${Date.now()}`,
      referenceCode: refCode,
      categoryId: item.categoryId,
      categoryName: 'طوارئ',
      serviceTitle: `[طوارئ] ${item.title}`,
      detailedDescription: `طلب طوارئ سريع: ${item.title}`,
      district: selectedDistrict,
      addressText: 'العنوان المسجل بالطلب',
      preferredDate: 'الآن فوراً',
      preferredTime: 'أسرع وقت',
      urgency: 'urgent',
      customerName: user.name,
      customerPhone: user.phone,
      status: 'open_for_quotes',
      paymentMethod: 'cash',
      createdAt: 'الآن',
      createdAtTimestamp: Date.now(),
      routingInfo: {
        matchType: routing.matchType,
        notifiedCount: routing.targets.length,
        nearestCenterName: routing.nearestCenterName,
        distanceKm: routing.minDistanceKm,
      },
    };

    onDispatchEmergency(emergencyReq);
    setActiveEmergencyReqId(emergencyReq.id);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={
          compactTile
            ? 'w-full min-h-[54px] px-3 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 flex items-center justify-center gap-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap'
            : 'min-h-[38px] px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap'
        }
      >
        <Siren
          className={`w-4 h-4 shrink-0 ${compactTile ? 'text-rose-600 dark:text-rose-400' : ''}`}
        />
        <span>خدمة طوارئ</span>
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 md:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-modal-title"
        >
          <div className="w-full md:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl border border-rose-200 dark:border-rose-900 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="md:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 shrink-0" />

            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-rose-50/60 dark:bg-rose-950/30">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                <Siren className="w-4 h-4 shrink-0" />
                <span id="emergency-modal-title">خدمة طوارئ سريعة</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="إغلاق"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 overflow-y-auto">
              {/* Customer Area Picker Inside Emergency Flow */}
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FF5A00] shrink-0" />
                    <span>حدد منطقتك لإرسال التنبيه لأقرب الفنيين</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    aria-label="المركز في الدقهلية"
                    value={selectedCenter}
                    onChange={(e) => handleCenterChange(e.target.value)}
                    className="w-full h-10 px-2.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:border-[#FF5A00] focus:outline-none"
                  >
                    {DAKAHLIA_CENTERS.map((c) => (
                      <option key={c} value={c}>
                        مركز {c}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="المنطقة أو الحي"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full h-10 px-2.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:border-[#FF5A00] focus:outline-none"
                  >
                    {centerLocations.map((loc) => (
                      <option key={loc.id} value={loc.displayLabel}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] font-semibold text-orange-700 dark:text-orange-400 tabular-nums">
                  {emergencyProximity.matchType === 'nearest_center'
                    ? `سيصل التنبيه لأقرب ${emergencyProximity.targets.length} فنيين في ${emergencyProximity.nearestCenterName} (~${emergencyProximity.minDistanceKm} كم)`
                    : `سيصل التنبيه فوراً إلى ${emergencyProximity.targets.length} فني/شركة قريبة في ${selectedCenter}`}
                </p>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                اختر نوع العطل لتنبيه أقرب الفنيين فوراً بدون كتابة:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {QUICK_EMERGENCIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleQuickDispatch(item)}
                    className="min-h-[46px] px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-right font-bold text-xs text-rose-950 dark:text-rose-200 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Siren className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </button>
                ))}
              </div>

              {activeEmergency && (
                <div className="bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      تم تنبيه الفنيين (#{activeEmergency.referenceCode})
                    </span>
                    {onOpenRequests && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          onOpenRequests(
                            activeEmergency.status === 'open_for_quotes' ? 'open' : 'active'
                          );
                        }}
                        className="inline-flex items-center gap-1 font-bold text-[#FF5A00] dark:text-orange-400 cursor-pointer"
                      >
                        <span>طلباتي</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {emergencyQuotes.length === 0 ? (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      بانتظار وصول عروض الأسعار من أقرب الفنيين لـ {activeEmergency.district}.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {emergencyQuotes.map((quote) => {
                        const isAccepted = quote.status === 'accepted';
                        const techStats = computeTechnicianStats(
                          quote.technicianId,
                          reviews,
                          quotes,
                          requests
                        );
                        return (
                          <div
                            key={quote.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {quote.technicianName}
                              </div>
                              <div className="text-[11px] font-bold text-[#FF5A00] dark:text-orange-400 tabular-nums">
                                {formatEGP(quote.priceEGP)} · {quote.estimatedArrival}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                                <span>
                                  الموعد {techStats.criteriaAverages.punctuality.toFixed(1)}
                                </span>
                                <span>
                                  النظافة {techStats.criteriaAverages.cleanliness.toFixed(1)}
                                </span>
                                <span>
                                  الاحترافية {techStats.criteriaAverages.professionalism.toFixed(1)}
                                </span>
                              </div>
                            </div>

                            {isAccepted ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={`tel:${quote.technicianPhone}`}
                                  className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold inline-flex items-center gap-1"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>اتصال</span>
                                </a>
                                <a
                                  href={buildWhatsAppLink(
                                    quote.technicianPhone,
                                    `مرحباً ${quote.technicianName}، بخصوص طلب الطوارئ #${activeEmergency.referenceCode}`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center gap-1"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>واتساب</span>
                                </a>
                              </div>
                            ) : (
                              onAcceptQuote && (
                                <button
                                  type="button"
                                  onClick={() => onAcceptQuote(activeEmergency.id, quote.id)}
                                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#FF5A00] hover:bg-orange-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>موافق</span>
                                </button>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
