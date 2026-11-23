import { normalizeEgyptianMobile, sendPhoneOtp, verifyPhoneOtp } from '../lib/phoneAuth';
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileText,
  KeyRound,
  MapPin,
  ShieldCheck,
  Star,
  Upload,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLocationMeta } from '../data/dakahliaLocations';
import { SERVICE_CATEGORIES } from '../data/khadamatData';
import {
  AccountSession,
  AppNotification,
  LocationEntry,
  OfficialDocument,
  RegisteredCustomer,
  Technician,
} from '../types/khadamat';
import { BrandWordmark } from './BrandWordmark';
import { PWAInstallButton } from './PWAInstallBanner';

interface AuthLoginScreenProps {
  customers: RegisteredCustomer[];
  technicians: Technician[];
  locations: LocationEntry[];
  notifications: AppNotification[];
  openRequestsCount: number;
  selectedDistrict: string;
  onOpenLocation: () => void;
  onLogin: (
    session: AccountSession,
    newTech?: Technician,
    newCustomer?: RegisteredCustomer
  ) => void;
}

interface FloatingOtpAlert {
  code: string;
  phone: string;
  targetRole: 'customer' | 'technician';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AuthLoginScreen({
  customers,
  technicians,
  locations,
  notifications,
  openRequestsCount,
  selectedDistrict,
  onOpenLocation,
  onLogin,
}: AuthLoginScreenProps) {
  const [roleTab, setRoleTab] = useState<'customer' | 'technician'>('customer');

  // Floating simulation alert shown at the top of the viewport when 'إرسال الرمز' is clicked
  const [floatingAlert, setFloatingAlert] = useState<FloatingOtpAlert | null>(null);

  // --- Customer Auth + OTP State ---
  const [custMode, setCustMode] = useState<'register' | 'login'>('register');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedExistingCustId, setSelectedExistingCustId] = useState(customers[0]?.id || '');
  const [custOtpSent, setCustOtpSent] = useState(false);
  const [custOtpTargetPhone, setCustOtpTargetPhone] = useState('');
  const [custOtpInput, setCustOtpInput] = useState('');
  const [custCooldown, setCustCooldown] = useState(0);
  const [customerError, setCustomerError] = useState('');

  // --- Technician / Company Auth + Docs + OTP State ---
  const [techMode, setTechMode] = useState<'existing' | 'register'>('existing');
  const [selectedTechId, setSelectedTechId] = useState<string>(technicians[0]?.id || '');

  const [newTechName, setNewTechName] = useState('');
  const [newTechIsCompany, setNewTechIsCompany] = useState(false);
  const [newTechPhone, setNewTechPhone] = useState('');
  const [newTechCategoryId, setNewTechCategoryId] = useState('ac');

  // Official Documents Upload State
  const [idFrontDoc, setIdFrontDoc] = useState<OfficialDocument | null>(null);
  const [idBackDoc, setIdBackDoc] = useState<OfficialDocument | null>(null);
  const [commercialRegDoc, setCommercialRegDoc] = useState<OfficialDocument | null>(null);
  const [taxCardDoc, setTaxCardDoc] = useState<OfficialDocument | null>(null);

  const [techOtpSent, setTechOtpSent] = useState(false);
  const [techOtpTargetPhone, setTechOtpTargetPhone] = useState('');
  const [techOtpInput, setTechOtpInput] = useState('');
  const [techCooldown, setTechCooldown] = useState(0);
  const [techError, setTechError] = useState('');

  // Resend cooldown timers
  useEffect(() => {
    if (custCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCustCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [custCooldown]);

  useEffect(() => {
    if (techCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setTechCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [techCooldown]);

  const resetCustomerOtp = () => {
    setCustOtpSent(false);
    setCustOtpTargetPhone('');
    setCustOtpInput('');
    setCustCooldown(0);
  };

  const resetTechOtp = () => {
    setTechOtpSent(false);
    setTechOtpTargetPhone('');
    setTechOtpInput('');
    setTechCooldown(0);
  };

  const handleFileUpload = (
    file: File | undefined,
    docType: OfficialDocument['type'],
    label: string,
    setter: (doc: OfficialDocument | null) => void
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const isImage = file.type.startsWith('image/');
      setter({
        type: docType,
        label,
        fileName: file.name,
        fileSizeLabel: formatBytes(file.size),
        previewDataUrl: isImage ? String(reader.result) : undefined,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFillSampleDocs = () => {
    if (newTechIsCompany) {
      setCommercialRegDoc({
        type: 'commercial_register',
        label: 'صورة السجل التجاري',
        fileName: 'سجل-تجاري-معتمد.pdf',
        fileSizeLabel: '420 KB',
      });
      setTaxCardDoc({
        type: 'tax_card',
        label: 'صورة البطاقة الضريبية',
        fileName: 'بطاقة-ضريبية-سارية.pdf',
        fileSizeLabel: '310 KB',
      });
    } else {
      setIdFrontDoc({
        type: 'national_id_front',
        label: 'البطاقة الشخصية (الوجه الأمامي)',
        fileName: 'national-id-front.jpg',
        fileSizeLabel: '285 KB',
      });
      setIdBackDoc({
        type: 'national_id_back',
        label: 'البطاقة الشخصية (الظهر)',
        fileName: 'national-id-back.jpg',
        fileSizeLabel: '260 KB',
      });
    }
    setTechError('');
  };

  // Customer: Send OTP via server (real SMS)
  const handleSendCustomerOtp = async () => {
    let targetPhone = '';
    if (custMode === 'register') {
      if (customerName.trim().length < 2) {
        setCustomerError('يرجى إدخال اسم العميل بالكامل قبل إرسال الرمز.');
        return;
      }
      if (customerPhone.trim().length < 10) {
        setCustomerError('يرجى إدخال رقم موبايل مصري صحيح (11 رقم) لإرسال الرمز.');
        return;
      }
      targetPhone = customerPhone.trim();
    } else {
      const targetCust = customers.find((c) => c.id === selectedExistingCustId);
      if (!targetCust) {
        setCustomerError('يرجى اختيار حساب العميل المسجل أولاً.');
        return;
      }
      targetPhone = targetCust.phone;
    }

    setCustomerError('');
    try {
      await sendPhoneOtp(targetPhone);
      setCustOtpSent(true);
      setCustOtpTargetPhone(targetPhone);
      setCustOtpInput('');
      setCustCooldown(30);
    } catch (error) {
      setCustomerError(error instanceof Error ? error.message : 'تعذّر التحقق. حاول لاحقًا.');
    }
  };

  // Customer: Verify OTP & Create/Enter Account
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (custMode === 'register') {
      if (customerName.trim().length < 2) {
        setCustomerError('يرجى إدخال اسم العميل بالكامل.');
        return;
      }
      if (customerPhone.trim().length < 10) {
        setCustomerError('يرجى إدخال رقم موبايل مصري صحيح (11 رقم).');
        return;
      }
    }

    if (!custOtpSent) {
      setCustomerError('يرجى الضغط على زر «إرسال الرمز» أولاً لإصدار رمز التحقق OTP.');
      return;
    }

    setCustomerError('');
    try {
      const currentPhone = custMode === 'register' ? customerPhone : customers.find((c) => c.id === selectedExistingCustId)?.phone;
      if (!currentPhone || normalizeEgyptianMobile(currentPhone) !== normalizeEgyptianMobile(custOtpTargetPhone)) {
        throw new Error('تغيّر رقم الهاتف. أرسل رمزًا جديدًا لهذا الرقم.');
      }
      await verifyPhoneOtp(custOtpTargetPhone, custOtpInput.trim());
    } catch (error) {
      setCustomerError(error instanceof Error ? error.message : 'تعذّر التحقق. حاول لاحقًا.');
      return;
    }

    if (custMode === 'login') {
      const existing = customers.find((c) => c.id === selectedExistingCustId);
      if (existing) {
        onLogin({
          role: 'customer',
          customer: {
            name: existing.name,
            phone: existing.phone,
            defaultDistrict: existing.district,
          },
        });
        return;
      }
    }

    const newCustomer: RegisteredCustomer = {
      id: `cust-${Date.now()}`,
      name: customerName.trim() || 'عميل الدقهلية',
      phone: customerPhone.trim(),
      district: selectedDistrict,
      isPhoneVerified: true,
      createdAt: 'الآن',
    };

    onLogin(
      {
        role: 'customer',
        customer: {
          name: newCustomer.name,
          phone: newCustomer.phone,
          defaultDistrict: newCustomer.district,
        },
      },
      undefined,
      newCustomer
    );
  };

  // Technician / Company: Send OTP via server (real SMS)
  const handleSendTechOtp = async () => {
    let targetPhone = '';
    if (techMode === 'register') {
      if (newTechName.trim().length < 3 || newTechPhone.trim().length < 10) {
        setTechError('يرجى إدخال اسم الفني/الشركة ورقم الموبايل قبل إرسال الرمز.');
        return;
      }
      if (!newTechIsCompany && !idFrontDoc) {
        setTechError('يرجى إرفاق صورة البطاقة الشخصية للتحقق من الهوية قبل إرسال الرمز.');
        return;
      }
      if (newTechIsCompany && (!commercialRegDoc || !taxCardDoc)) {
        setTechError('يرجى إرفاق صورة السجل التجاري والبطاقة الضريبية للشركة قبل إرسال الرمز.');
        return;
      }
      targetPhone = newTechPhone.trim();
    } else {
      const targetTech = technicians.find((t) => t.id === selectedTechId);
      if (!targetTech) {
        setTechError('يرجى اختيار حساب فني أو شركة مسجل أولاً.');
        return;
      }
      targetPhone = targetTech.phone;
    }

    setTechError('');
    try {
      await sendPhoneOtp(targetPhone);
      setTechOtpSent(true);
      setTechOtpTargetPhone(targetPhone);
      setTechOtpInput('');
      setTechCooldown(30);
    } catch (error) {
      setTechError(error instanceof Error ? error.message : 'تعذّر التحقق. حاول لاحقًا.');
    }
  };

  // Technician / Company: Verify OTP & Create/Enter Account
  const handleTechnicianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (techMode === 'register') {
      if (newTechName.trim().length < 3 || newTechPhone.trim().length < 10) {
        setTechError('يرجى إدخال الاسم ورقم الموبايل بشكل صحيح.');
        return;
      }
      if (!newTechIsCompany && !idFrontDoc) {
        setTechError('يرجى إرفاق صورة البطاقة الشخصية للتحقق من الهوية.');
        return;
      }
      if (newTechIsCompany && (!commercialRegDoc || !taxCardDoc)) {
        setTechError('يرجى إرفاق صورة السجل التجاري والبطاقة الضريبية للشركة.');
        return;
      }
    }

    if (!techOtpSent) {
      setTechError('يرجى الضغط على زر «إرسال الرمز» أولاً لإصدار رمز التحقق OTP.');
      return;
    }

    setTechError('');
    try {
      const currentPhone = techMode === 'register' ? newTechPhone : technicians.find((t) => t.id === selectedTechId)?.phone;
      if (!currentPhone || normalizeEgyptianMobile(currentPhone) !== normalizeEgyptianMobile(techOtpTargetPhone)) {
        throw new Error('تغيّر رقم الهاتف. أرسل رمزًا جديدًا لهذا الرقم.');
      }
      await verifyPhoneOtp(techOtpTargetPhone, techOtpInput.trim());
    } catch (error) {
      setTechError(error instanceof Error ? error.message : 'تعذّر التحقق. حاول لاحقًا.');
      return;
    }

    if (techMode === 'existing') {
      if (!selectedTechId) return;
      onLogin({ role: 'technician', technicianId: selectedTechId });
      return;
    }

    const cat = SERVICE_CATEGORIES.find((c) => c.id === newTechCategoryId);
    const locMeta = getLocationMeta(selectedDistrict, locations);
    const uploadedDocs = newTechIsCompany
      ? ([commercialRegDoc, taxCardDoc].filter(Boolean) as OfficialDocument[])
      : ([idFrontDoc, idBackDoc].filter(Boolean) as OfficialDocument[]);

    const created: Technician = {
      id: `tech-${Date.now()}`,
      name: newTechName.trim(),
      isCompany: newTechIsCompany,
      specialty: `${newTechIsCompany ? 'شركة قيد المراجعة' : 'فني قيد المراجعة'} في ${cat?.name || 'الصيانة'}`,
      categoryIds: [newTechCategoryId],
      area: selectedDistrict,
      primaryCenter: locMeta.center,
      coveredCenters: [locMeta.center],
      coveredAreas: [selectedDistrict, locMeta.areaName],
      documents: uploadedDocs,
      isVerifiedDocs: false,
      isPhoneVerified: true,
      rating: 5.0,
      reviewsCount: 0,
      completedJobs: 0,
      yearsExp: 3,
      phone: newTechPhone.trim(),
      initials: newTechName.trim().slice(0, 2),
    };
    onLogin({ role: 'technician', technicianId: created.id }, created);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-6 md:py-10 px-4 md:px-6 transition-colors duration-200">
      {/* Floating Top Simulation Alert Banner */}
      {floatingAlert && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg bg-slate-900 text-white border border-orange-500/70 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FF5A00] text-white flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-orange-300">
                رسالة تنبيه محاكاة OTP إلى {floatingAlert.phone}
              </div>
              <div className="text-sm text-white mt-0.5 flex items-center gap-2 flex-wrap">
                <span>رمز التحقق الخاص بك هو:</span>
                <span className="font-bold text-lg text-amber-300 tracking-widest tabular-nums bg-slate-800 px-2.5 py-0.5 rounded-lg">
                  {floatingAlert.code}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (floatingAlert.targetRole === 'customer') {
                  setRoleTab('customer');
                  setCustOtpInput(floatingAlert.code);
                  setCustomerError('');
                } else {
                  setRoleTab('technician');
                  setTechOtpInput(floatingAlert.code);
                  setTechError('');
                }
              }}
              className="px-3 min-h-[38px] bg-[#FF5A00] hover:bg-orange-500 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              تعبئة الرمز
            </button>
            <button
              type="button"
              onClick={() => setFloatingAlert(null)}
              aria-label="إغلاق التنبيه"
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl w-full mx-auto space-y-3">
        {/* Top Install Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            منصة خدمات · الدقهلية
          </div>
          <PWAInstallButton compact />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Editorial Intro Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#FF5A00] via-orange-600 to-orange-700 dark:from-orange-700 dark:via-orange-800 dark:to-slate-900 text-white rounded-2xl p-4 md:p-7 flex flex-col justify-between gap-4 shadow-md border border-orange-500/30">
            <div className="space-y-2">
              <BrandWordmark size="md" variant="inverted" />
              <h1 className="text-lg md:text-2xl font-bold leading-snug text-balance">
                اطلب فني في الدقهلية بأفضل سعر
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-white/20 text-[11px] text-orange-50">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                توجيه لأقرب فني
              </span>
              <span className="inline-flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                تحقق OTP
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums font-semibold">
                <Bell className="w-3.5 h-3.5 shrink-0" />
                {openRequestsCount} طلب مفتوح
              </span>
            </div>
          </div>

          {/* Role Login & Registration Card */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  تسجيل الدخول والتحقق (OTP)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  اضغط «إرسال الرمز» لاستلام رمز التأكيد (6 أرقام)
                </p>
              </div>

              {/* Role Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setRoleTab('customer');
                    setCustomerError('');
                    setFloatingAlert(null);
                  }}
                  className={`min-h-[46px] px-4 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    roleTab === 'customer'
                      ? 'bg-white text-orange-700 shadow-sm dark:bg-slate-900 dark:text-orange-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>حساب عميل</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRoleTab('technician');
                    setTechError('');
                    setFloatingAlert(null);
                  }}
                  className={`min-h-[46px] px-4 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    roleTab === 'technician'
                      ? 'bg-white text-orange-700 shadow-sm dark:bg-slate-900 dark:text-orange-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>حساب فني أو شركة</span>
                </button>
              </div>

              {roleTab === 'customer' ? (
                <form onSubmit={handleCustomerSubmit} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {custMode === 'register'
                        ? 'إنشاء حساب عميل جديد:'
                        : 'تسجيل الدخول لحساب عميل مسجل:'}
                    </span>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setCustMode('register');
                          resetCustomerOtp();
                          setCustomerError('');
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          custMode === 'register'
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        حساب جديد
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustMode('login');
                          resetCustomerOtp();
                          setCustomerError('');
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          custMode === 'login'
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        حساب مسجل
                      </button>
                    </div>
                  </div>

                  {custMode === 'register' ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          الاسم الكامل للعميل *
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="مثال: أحمد محمد السيد"
                          className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          رقم الموبايل المصري *
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => {
                            setCustomerPhone(e.target.value);
                            if (custOtpSent) resetCustomerOtp();
                          }}
                          placeholder="01012345678"
                          className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-right tabular-nums focus:bg-white dark:focus:bg-slate-900 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          المنطقة في الدقهلية *
                        </label>
                        <button
                          type="button"
                          onClick={onOpenLocation}
                          className="w-full min-h-[46px] px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 text-right hover:border-[#FF5A00] dark:hover:border-orange-500 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 truncate">
                            <MapPin className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                            <span className="truncate">{selectedDistrict}</span>
                          </span>
                          <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2.5">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                        اختر حساب العميل المسجل:
                      </label>
                      {customers.map((cust) => {
                        const active = selectedExistingCustId === cust.id;
                        return (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => {
                              setSelectedExistingCustId(cust.id);
                              resetCustomerOtp();
                              setCustomerError('');
                            }}
                            className={`w-full p-3.5 rounded-xl border text-right flex items-center justify-between gap-3 cursor-pointer ${
                              active
                                ? 'bg-orange-50/75 dark:bg-orange-950/60 border-[#FF5A00] dark:border-orange-500'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{cust.name}</span>
                                <ShieldCheck className="w-4 h-4 text-[#FF5A00] dark:text-orange-400" />
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                                {cust.phone} · {cust.district}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Always-Visible OTP Field + Send Code Button */}
                  <OtpVerificationSection
                    otpSent={custOtpSent}
                    targetPhone={custOtpTargetPhone}
                    otpInput={custOtpInput}
                    cooldown={custCooldown}
                    onOtpInputChange={setCustOtpInput}
                    onSendOtp={handleSendCustomerOtp}
                  />

                  {customerError && (
                    <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-2.5">
                      {customerError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full h-12 bg-[#FF5A00] text-white text-sm font-semibold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 transition-colors cursor-pointer shadow-sm shadow-orange-600/15"
                  >
                    {custMode === 'register'
                      ? 'تأكيد الرمز وإنشاء حساب العميل'
                      : 'تأكيد الرمز والدخول لحساب العميل'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleTechnicianSubmit} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {techMode === 'existing'
                        ? 'تسجيل الدخول لحساب فني/شركة:'
                        : 'تسجيل فني أو شركة جديدة بأوراق رسمية:'}
                    </span>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setTechMode('existing');
                          resetTechOtp();
                          setTechError('');
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          techMode === 'existing'
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        حساب مسجل
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTechMode('register');
                          resetTechOtp();
                          setTechError('');
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                          techMode === 'register'
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        تسجيل جديد
                      </button>
                    </div>
                  </div>

                  {techMode === 'existing' ? (
                    <div className="space-y-2 max-h-[245px] overflow-y-auto pr-0.5">
                      {technicians.map((tech) => {
                        const active = selectedTechId === tech.id;
                        const unreadAlerts = notifications.filter(
                          (n) =>
                            n.recipientRole === 'technician' &&
                            n.recipientTechId === tech.id &&
                            !n.isRead
                        ).length;

                        return (
                          <button
                            key={tech.id}
                            type="button"
                            onClick={() => {
                              setSelectedTechId(tech.id);
                              resetTechOtp();
                              setTechError('');
                            }}
                            className={`w-full p-3.5 rounded-xl border text-right flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                              active
                                ? 'bg-orange-50/75 dark:bg-orange-950/60 border-[#FF5A00] dark:border-orange-500'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-[#FF5A00] dark:bg-orange-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {tech.isCompany ? <Building2 className="w-5 h-5" /> : tech.initials}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                                  <span className="truncate">{tech.name}</span>
                                  {tech.isVerifiedDocs && (
                                    <ShieldCheck
                                      className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0"
                                      aria-label="أوراق موثقة"
                                    />
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {tech.specialty} · مركز {tech.primaryCenter}
                                </div>
                              </div>
                            </div>

                            <div className="text-left shrink-0 space-y-1">
                              <div className="text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center justify-end gap-1 tabular-nums">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                {tech.rating}
                              </div>
                              {unreadAlerts > 0 && (
                                <div className="text-[11px] font-semibold text-orange-700 dark:text-orange-400 tabular-nums">
                                  {unreadAlerts} تنبيه جديد
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewTechIsCompany(false);
                            resetTechOtp();
                          }}
                          className={`min-h-[42px] text-xs font-semibold rounded-xl border cursor-pointer ${
                            !newTechIsCompany
                              ? 'bg-[#FF5A00] text-white border-[#FF5A00] dark:bg-orange-600 dark:border-orange-600'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          فني مستقل (بطاقة شخصية)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewTechIsCompany(true);
                            resetTechOtp();
                          }}
                          className={`min-h-[42px] text-xs font-semibold rounded-xl border cursor-pointer ${
                            newTechIsCompany
                              ? 'bg-[#FF5A00] text-white border-[#FF5A00] dark:bg-orange-600 dark:border-orange-600'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          شركة (سجل تجاري وضريبية)
                        </button>
                      </div>

                      <input
                        type="text"
                        value={newTechName}
                        onChange={(e) => setNewTechName(e.target.value)}
                        placeholder={
                          newTechIsCompany
                            ? 'الاسم التجاري للشركة (مثال: شركة المنصورة للتكييف)'
                            : 'الاسم الكامل كما في البطاقة الشخصية'
                        }
                        className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="tel"
                          value={newTechPhone}
                          onChange={(e) => {
                            setNewTechPhone(e.target.value);
                            if (techOtpSent) resetTechOtp();
                          }}
                          placeholder="رقم الموبايل / الواتساب (11 رقم)"
                          className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-right tabular-nums focus:bg-white dark:focus:bg-slate-900 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                        />
                        <select
                          value={newTechCategoryId}
                          onChange={(e) => setNewTechCategoryId(e.target.value)}
                          className="w-full h-11 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                        >
                          {SERVICE_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              تخصص: {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={onOpenLocation}
                          className="w-full min-h-[44px] px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-2 text-right hover:border-[#FF5A00] dark:hover:border-orange-500 cursor-pointer"
                        >
                          <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 truncate">
                            <MapPin className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                            <span className="truncate">منطقة العمل: {selectedDistrict}</span>
                          </span>
                          <span className="text-orange-700 dark:text-orange-400 font-semibold shrink-0">
                            تغيير / إضافة منطقة
                          </span>
                        </button>
                      </div>

                      {/* Official Documents Upload Section */}
                      <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-[#FF5A00] dark:text-orange-400" />
                            <span>
                              {newTechIsCompany
                                ? 'الأوراق الرسمية للشركة (مطلوب)'
                                : 'إثبات الشخصية للفني (مطلوب)'}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={handleFillSampleDocs}
                            className="text-[11px] font-semibold text-orange-700 dark:text-orange-400 hover:underline cursor-pointer"
                          >
                            إرفاق نماذج للتجربة
                          </button>
                        </div>

                        {!newTechIsCompany ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <DocumentUploadTile
                              label="صورة البطاقة (وجه) *"
                              doc={idFrontDoc}
                              onSelectFile={(f) =>
                                handleFileUpload(
                                  f,
                                  'national_id_front',
                                  'البطاقة الشخصية (وجه)',
                                  setIdFrontDoc
                                )
                              }
                            />
                            <DocumentUploadTile
                              label="صورة البطاقة (خلف)"
                              doc={idBackDoc}
                              onSelectFile={(f) =>
                                handleFileUpload(
                                  f,
                                  'national_id_back',
                                  'البطاقة الشخصية (خلف)',
                                  setIdBackDoc
                                )
                              }
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <DocumentUploadTile
                              label="صورة السجل التجاري *"
                              doc={commercialRegDoc}
                              onSelectFile={(f) =>
                                handleFileUpload(
                                  f,
                                  'commercial_register',
                                  'السجل التجاري',
                                  setCommercialRegDoc
                                )
                              }
                            />
                            <DocumentUploadTile
                              label="صورة البطاقة الضريبية *"
                              doc={taxCardDoc}
                              onSelectFile={(f) =>
                                handleFileUpload(f, 'tax_card', 'البطاقة الضريبية', setTaxCardDoc)
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Always-Visible OTP Field + Send Code Button */}
                  <OtpVerificationSection
                    otpSent={techOtpSent}
                    targetPhone={techOtpTargetPhone}
                    otpInput={techOtpInput}
                    cooldown={techCooldown}
                    onOtpInputChange={setTechOtpInput}
                    onSendOtp={handleSendTechOtp}
                  />

                  {techError && (
                    <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-2.5">
                      {techError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full h-12 bg-[#FF5A00] text-white text-sm font-semibold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 transition-colors cursor-pointer shadow-sm shadow-orange-600/15"
                  >
                    {techMode === 'register'
                      ? 'تأكيد الرمز وإنشاء حساب الفني / الشركة'
                      : 'تأكيد الرمز والدخول لبوابة الفنيين'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OtpVerificationSection({
    otpSent,
    targetPhone,
  otpInput,
  cooldown,
  onOtpInputChange,
  onSendOtp,
}: {
  otpSent: boolean;
    targetPhone: string;
  otpInput: string;
  cooldown: number;
  onOtpInputChange: (val: string) => void;
  onSendOtp: () => void;
}) {
  const isMatched = false;

  return (
    <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <KeyRound className="w-4 h-4 text-[#FF5A00] dark:text-orange-400" />
          <span>رمز التحقق من الهاتف (OTP) *</span>
        </label>
        {isMatched && (
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>الرمز مطابق</span>
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otpInput}
          onChange={(e) => onOtpInputChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="أدخل رمز OTP (6 أرقام)"
          aria-label="رمز التحقق OTP المكون من 6 أرقام"
          className="flex-1 h-11 px-3.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-center font-bold tracking-[0.35em] tabular-nums focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
        />

        <button
          type="button"
          onClick={onSendOtp}
          disabled={cooldown > 0}
          className="min-h-[44px] px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-600 dark:disabled:text-slate-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
        >
          {cooldown > 0
            ? `إعادة الإرسال (${cooldown} ث)`
            : otpSent
              ? 'إعادة إرسال الرمز'
              : 'إرسال الرمز'}
        </button>
      </div>

      {otpSent ? (
        <div className="bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 rounded-xl px-3.5 py-2.5 text-xs text-orange-900 dark:text-orange-200">
          تم إرسال رمز التحقق إلى <strong className="tabular-nums">{targetPhone}</strong>. أدخل الرمز (6 أرقام) من رسالة SMS.
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          اضغط «إرسال الرمز» لإرسال رمز التحقق (6 أرقام) عبر SMS.
        </p>
      )}
    </div>
  );
}

function DocumentUploadTile({
  label,
  doc,
  onSelectFile,
}: {
  label: string;
  doc: OfficialDocument | null;
  onSelectFile: (file: File | undefined) => void;
}) {
  return (
    <label
      className={`block border rounded-xl p-3 cursor-pointer transition-colors ${
        doc
          ? 'bg-orange-50/60 dark:bg-orange-950/50 border-orange-300 dark:border-orange-700'
          : 'bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500'
      }`}
    >
      <input
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => onSelectFile(e.target.files?.[0])}
      />
      <div className="flex items-center gap-2.5">
        {doc?.previewDataUrl ? (
          <img
            src={doc.previewDataUrl}
            alt={label}
            className="w-9 h-9 rounded-lg object-cover border border-orange-200 dark:border-orange-700 shrink-0"
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              doc
                ? 'bg-[#FF5A00] dark:bg-orange-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {doc ? <CheckCircle2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
            {label}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {doc ? `${doc.fileName} · ${doc.fileSizeLabel}` : 'اضغط لرفع صورة أو PDF'}
          </div>
        </div>
      </div>
    </label>
  );
}
