import { AlertTriangle, Camera, Check, Clock, ShieldCheck, Siren, X } from 'lucide-react';
import { useState } from 'react';
import { SERVICES_CATALOG } from '../data/khadamatData';
import { ServiceItem, ServiceRequest, UserProfile } from '../types/khadamat';

interface EmergencyServicesSectionProps {
  district: string;
  user: UserProfile;
  onDispatchEmergency: (req: ServiceRequest) => void;
  onOpenLocation: () => void;
}

const EMERGENCY_SCENARIOS = [
  {
    id: 'em-leak',
    title: 'تسريب مياه مفاجئ في الحمام أو المطبخ',
    subtitle: 'تدخل عاجل لمنع غرق الأرضيات وتلف الحوائط',
    categoryId: 'plumbing',
    serviceId: 'plumb-leak',
    eta: '15 – 25 دقيقة',
    tips: ['أغلق محبس المياه الرئيسي فوراً', 'افصل الأجهزة الكهربائية المجاورة لمنطقة المياه'],
  },
  {
    id: 'em-elec',
    title: 'قفلة كهربائية أو شرارة في لوحة التوزيع',
    subtitle: 'خطر حدوث ماس كهربائي لا قدر الله',
    categoryId: 'electrical',
    serviceId: 'elec-panel',
    eta: '15 – 20 دقيقة',
    tips: ['افصل القاطع الرئيسي (العمومي)', 'لا تلمس أي أسلاك مكشوفة بأيدي مبتلة'],
  },
  {
    id: 'em-ac',
    title: 'عطل تكييف طارئ في حر شديد',
    subtitle: 'توقف تام للاتصال أو خروج دخان أو أصوات حادة',
    categoryId: 'ac',
    serviceId: 'ac-freon-full',
    eta: '20 – 30 دقيقة',
    tips: ['افصل مفتاح التكييف من لوحة الحائط', 'اترك باب الغرفة مهوى حتى وصول الفني'],
  },
];

export function EmergencyServicesSection({
  district,
  user,
  onDispatchEmergency,
  onOpenLocation,
}: EmergencyServicesSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(EMERGENCY_SCENARIOS[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [faultPhoto, setFaultPhoto] = useState<string | null>(null);
  const [addressDetails, setAddressDetails] = useState('');
  const [isDispatched, setIsDispatched] = useState(false);
  const [dispatchRef, setDispatchRef] = useState('');

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const refCode = `EMG-${Math.floor(10000 + Math.random() * 89999)}`;
    const matchedService = SERVICES_CATALOG.find((s) => s.id === selectedScenario.serviceId);

    const emergencyReq: ServiceRequest = {
      id: `req-emg-${Date.now()}`,
      referenceCode: refCode,
      categoryId: selectedScenario.categoryId,
      categoryName: 'خدمات الطوارئ 24/7',
      serviceTitle: `[طوارئ 24/7] ${selectedScenario.title}`,
      detailedDescription: `${customNotes.trim() ? customNotes.trim() : selectedScenario.subtitle} — (نداء طارئ عاجل)`,
      faultPhotos: faultPhoto ? [faultPhoto] : undefined,
      district,
      addressText: addressDetails.trim() || 'العنوان الرئيسي المسجل',
      preferredDate: 'الآن فوراً (أولوية قصوى)',
      preferredTime: 'أسرع وقت متاح (خلال 20 دقيقة)',
      urgency: 'urgent',
      customerName: user.name,
      customerPhone: user.phone,
      status: 'open_for_quotes',
      paymentMethod: 'cash',
      createdAt: 'طارئ الآن',
      createdAtTimestamp: Date.now(),
      routingInfo: {
        matchType: 'exact_area',
        notifiedCount: 8,
        nearestCenterName: district,
        distanceKm: 0,
      },
    };

    onDispatchEmergency(emergencyReq);
    setDispatchRef(refCode);
    setIsDispatched(true);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="bg-gradient-to-l from-rose-600 via-rose-700 to-orange-600 text-white rounded-2xl p-6 md:p-8 shadow-lg shadow-rose-900/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 animate-pulse">
            <Siren className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold text-white">
              <Clock className="w-3.5 h-3.5" />
              <span>متاح 24 ساعة طوال أيام الأسبوع</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              خدمات الطوارئ السريعة في الدقهلية
            </h2>
            <p className="text-xs md:text-sm text-rose-100 max-w-xl leading-relaxed">
              تسريب مياه مفاجئ، قفلة كهربائية، أو عطل تكييف حرج؟ اضغط لنداء الفنيين المتاحين فوراً بأولوية قصوى ومسار لحظي.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsDispatched(false);
            setDispatchRef('');
            setCustomNotes('');
            setFaultPhoto(null);
            setIsModalOpen(true);
          }}
          className="min-h-[50px] px-6 py-3 bg-white text-rose-700 hover:bg-rose-50 text-sm font-black rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
        >
          نداء فني طوارئ الآن
        </button>
      </div>

      {/* Emergency Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 md:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full md:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="md:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 shrink-0" />

            <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-rose-50/50 dark:bg-rose-950/30">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-extrabold text-base">
                <Siren className="w-5 h-5 shrink-0" />
                <span>نداء فني طوارئ 24/7 (أولوية قصوى)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto space-y-5">
              {isDispatched ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      تم بث نداء الطوارئ بنجاح! ({dispatchRef})
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      تم تنبيه الفنيين المتاحين حالياً في {district} بصوت تنبيهي خاص، وجاري تتبع مسار الفني اللحظي على خريطة التطبيق.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full min-h-[46px] px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    متابعة الطلب على الخريطة
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDispatch} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      اختر نوع الحالة الطارئة:
                    </label>
                    <div className="space-y-2">
                      {EMERGENCY_SCENARIOS.map((sc) => {
                        const isSelected = selectedScenario.id === sc.id;
                        return (
                          <button
                            key={sc.id}
                            type="button"
                            onClick={() => setSelectedScenario(sc)}
                            className={`w-full text-right p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                              isSelected
                                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 text-rose-950 dark:text-rose-200'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300 hover:border-rose-300'
                            }`}
                          >
                            <AlertTriangle
                              className={`w-4 h-4 mt-0.5 shrink-0 ${
                                isSelected ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                              }`}
                            />
                            <div className="space-y-0.5 min-w-0">
                              <div className="text-xs font-bold">{sc.title}</div>
                              <div className="text-[11px] opacity-80">{sc.subtitle}</div>
                              <div className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 pt-0.5">
                                زمن الاستجابة المتوقع: {sc.eta}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Safety tips */}
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl p-3.5 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>إرشادات السلامة الفورية:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90">
                      {selectedScenario.tips.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Address & District */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          المنطقة في الدقهلية
                        </label>
                        <button
                          type="button"
                          onClick={onOpenLocation}
                          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          تغيير المنطقة
                        </button>
                      </div>
                      <div className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        📍 {district}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        العنوان التفصيلي ورقم الطابق *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressDetails}
                        onChange={(e) => setAddressDetails(e.target.value)}
                        placeholder="الشارع، رقم العمارة والدور والشقة"
                        className="w-full h-11 px-3.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        تفاصيل إضافية عن العطل (اختياري)
                      </label>
                      <textarea
                        rows={2}
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        placeholder="أي تفاصيل تهم الفني عند وصوله..."
                        className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full min-h-[48px] px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Siren className="w-4 h-4" />
                    <span>تأكيد نداء طوارئ فوري الآن</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
