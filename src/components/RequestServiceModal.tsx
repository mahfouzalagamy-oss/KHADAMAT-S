import {
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  Banknote,
  Bell,
  Bot,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Gift,
  ImagePlus,
  Lightbulb,
  MapPin,
  Phone,
  Play,
  Plus,
  Repeat,
  ShieldCheck,
  Sparkles,
  Square,
  SwitchCamera,
  Tag,
  Trash2,
  Undo2,
  Video,
  Wallet,
  Wrench,
  X,
  ZoomIn,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DAKAHLIA_CENTERS,
  EGYPT_LOCATIONS,
  getLocationMeta,
} from '../data/dakahliaLocations';
import {
  SERVICE_CATEGORIES,
  SERVICES_CATALOG,
  WALLET_PROVIDERS,
  addRecurrenceIntervalISO,
  computeSmartServiceHints,
  formatArabicDateLabel,
  getPaymentMethodLabel,
  getRecurrenceLabel,
  getTodayISO,
  validatePromoCode,
} from '../data/khadamatData';
import {
  FaultVideoAttachment,
  LocationEntry,
  LoyaltyRedemption,
  PaymentMethod,
  PromoCode,
  RecurrenceFrequency,
  RequestUrgency,
  SavedAddress,
  SeasonalBundle,
  ServiceItem,
  ServiceRequest,
  UserProfile,
} from '../types/khadamat';
import { CelebrationEmblem } from './OrderCompletionModal';
import { ServiceImage } from './ServiceImage';

export interface RoutingPreview {
  matchType: 'exact_area' | 'exact_center' | 'nearest_center';
  notifiedCount: number;
  nearestCenterName: string;
  minDistanceKm: number;
}

interface WarrantyClaimTarget {
  originalRequest: ServiceRequest;
  technicianName?: string;
  warrantyDays: number;
}

interface RequestServiceModalProps {
  isOpen: boolean;
  initialService?: ServiceItem | null;
  initialCategoryId?: string;
  initialBundle?: SeasonalBundle | null;
  initialPromoCode?: string;
  activeLoyaltyVouchers?: LoyaltyRedemption[];
  initialLoyaltyVoucher?: LoyaltyRedemption | null;
  warrantyClaimTarget?: WarrantyClaimTarget | null;
  district: string;
  locations?: LocationEntry[];
  onAddCustomLocation?: (center: string, name: string) => LocationEntry | null;
  user: UserProfile;
  savedAddresses: SavedAddress[];
  customerRequests?: ServiceRequest[];
  getRoutingPreview: (categoryId: string, districtOverride?: string) => RoutingPreview;
  onOpenLocation: () => void;
  onClose: () => void;
  onSubmitRequest: (
    request: ServiceRequest,
    recurrence?: {
      frequency: Exclude<RecurrenceFrequency, 'none'>;
      startDateISO: string;
    }
  ) => void;
  onGoToRequests: () => void;
}

const DATE_OPTIONS = ['اليوم', 'غداً', 'بعد غد', 'في أقرب وقت'];
const TIME_WINDOWS = [
  '10:00 ص – 12:00 م',
  '12:00 م – 03:00 م',
  '03:00 م – 06:00 م',
  '06:00 م – 09:00 م',
];

const QUICK_ISSUE_CHIPS = [
  'توقف كامل عن العمل',
  'تسريب أو تنقيط مياه',
  'صوت عالٍ أو اهتزاز',
  'ضعف أداء ويحتاج صيانة شاملة',
  'تركيب وفحص وتشغيل',
];

const SYAANH_WIZARD_STEPS: { step: 1 | 2 | 3 | 4; label: string }[] = [
  { step: 1, label: 'الخدمة' },
  { step: 2, label: 'المشكلة' },
  { step: 3, label: 'الموعد والموقع' },
  { step: 4, label: 'مراجعة وإرسال' },
];

const MAX_FAULT_PHOTOS = 4;
const MAX_FAULT_VIDEOS = 1;
const MAX_VIDEO_DURATION_SEC = 15;
const MAX_VIDEO_BYTES = 4 * 1024 * 1024;

function formatDurationBadge(seconds?: number): string {
  const safe = Math.max(0, Math.round(seconds || 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatBytesLabel(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} ك.ب`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

function pickSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }
  const candidates = [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة الملف'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function probeVideoDuration(dataUrl: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const vid = document.createElement('video');
    let settled = false;
    const finish = (val?: number) => {
      if (settled) return;
      settled = true;
      vid.removeAttribute('src');
      vid.load();
      resolve(val);
    };
    const timer = window.setTimeout(() => finish(undefined), 2000);
    vid.preload = 'metadata';
    vid.onloadedmetadata = () => {
      window.clearTimeout(timer);
      const dur = Number.isFinite(vid.duration) ? Math.round(vid.duration) : undefined;
      finish(dur && dur > 0 ? dur : undefined);
    };
    vid.onerror = () => {
      window.clearTimeout(timer);
      finish(undefined);
    };
    vid.src = dataUrl;
  });
}

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة الصورة'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('صيغة الصورة غير مدعومة'));
      img.onload = () => {
        const maxDim = 720;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function RequestServiceModal({
  isOpen,
  initialService,
  initialCategoryId,
  initialBundle,
  initialPromoCode,
  activeLoyaltyVouchers = [],
  initialLoyaltyVoucher = null,
  warrantyClaimTarget,
  district,
  locations = EGYPT_LOCATIONS,
  onAddCustomLocation,
  user,
  savedAddresses,
  customerRequests = [],
  getRoutingPreview,
  onOpenLocation,
  onClose,
  onSubmitRequest,
  onGoToRequests,
}: RequestServiceModalProps) {
  const bundleService = initialBundle
    ? SERVICES_CATALOG.find((s) => s.id === initialBundle.serviceId)
    : null;

  const defaultCatId =
    warrantyClaimTarget?.originalRequest.categoryId ||
    initialBundle?.categoryId ||
    initialService?.categoryId ||
    initialCategoryId ||
    SERVICE_CATEGORIES[0].id;

  const [categoryId, setCategoryId] = useState<string>(defaultCatId);
  const [serviceTitle, setServiceTitle] = useState<string>(
    warrantyClaimTarget
      ? `إعادة فحص ضمان: ${warrantyClaimTarget.originalRequest.serviceTitle}`
      : bundleService?.title || initialService?.title || ''
  );
  const [detailedDescription, setDetailedDescription] = useState<string>(
    warrantyClaimTarget
      ? `طلب إعادة فحص مجاني مشمول بشهادة الضمان رقم WR-${warrantyClaimTarget.originalRequest.referenceCode} (${warrantyClaimTarget.warrantyDays} يوماً)${warrantyClaimTarget.technicianName ? ` — المنفذ: ${warrantyClaimTarget.technicianName}` : ''}.\nتفاصيل الملاحظة الجديدة: `
      : initialBundle
      ? `${initialBundle.title}: ${initialBundle.includedTasks.join(' + ')}`
      : ''
  );
  const [faultPhotos, setFaultPhotos] = useState<string[]>([]);
  const [faultVideos, setFaultVideos] = useState<FaultVideoAttachment[]>([]);
  const [photoError, setPhotoError] = useState<string>('');
  const [photoFallbackAvailable, setPhotoFallbackAvailable] = useState<boolean>(false);
  const [isCompressingPhotos, setIsCompressingPhotos] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [previewMedia, setPreviewMedia] = useState<{
    kind: 'image' | 'video';
    url: string;
    label: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingSecondsRef = useRef<number>(0);
  const osCameraInputRef = useRef<HTMLInputElement | null>(null);
  const osVideoInputRef = useRef<HTMLInputElement | null>(null);

  const startingCode = initialBundle?.promoCode || initialPromoCode || '';
  const initialPromoRes = startingCode
    ? validatePromoCode(startingCode, defaultCatId)
    : null;

  const [promoInput, setPromoInput] = useState<string>(startingCode);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(
    initialPromoRes && initialPromoRes.valid ? initialPromoRes.promo : null
  );
  const [selectedLoyaltyVoucher, setSelectedLoyaltyVoucher] =
    useState<LoyaltyRedemption | null>(initialLoyaltyVoucher);
  const [promoFeedback, setPromoFeedback] = useState<string>('');

  const [isAnalyzingFault, setIsAnalyzingFault] = useState(false);
  const [aiFaultAnalysis, setAiFaultAnalysis] = useState<{
    suggestedCategoryId?: string;
    suggestedServiceTitle?: string;
    spareParts?: string[];
    advice?: string;
    analysisText?: string;
  } | null>(null);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  const handleAnalyzeFaultWithAI = async () => {
    if (!detailedDescription.trim()) {
      setAiAnalysisError('الرجاء كتابة وصف العطل أولاً لكي يتمكن الشات بوت من تحليله.');
      return;
    }
    setIsAnalyzingFault(true);
    setAiAnalysisError(null);

    try {
      const res = await fetch('/api/ai/analyze-fault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: detailedDescription.trim() }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAiFaultAnalysis(data.analysis);
      } else {
        setAiAnalysisError(data.error || 'تعذر تحليل العطل بالذكاء الاصطناعي.');
      }
    } catch (err: any) {
      setAiAnalysisError(err.message || 'حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي.');
    } finally {
      setIsAnalyzingFault(false);
    }
  };

  const [preferredDate, setPreferredDate] = useState<string>(DATE_OPTIONS[0]);
  const [preferredTime, setPreferredTime] = useState<string>(TIME_WINDOWS[2]);
  const [urgency, setUrgency] = useState<RequestUrgency>(
    warrantyClaimTarget ? 'urgent' : 'normal'
  );

  const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
  const initialSelectedDistrict =
    warrantyClaimTarget?.originalRequest.district || defaultAddr?.district || district;
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialSelectedDistrict);
  const [selectedCenter, setSelectedCenter] = useState<string>(
    () => getLocationMeta(initialSelectedDistrict, locations).center
  );
  const [showCustomAreaBox, setShowCustomAreaBox] = useState(false);
  const [customAreaInput, setCustomAreaInput] = useState('');
  const [addressText, setAddressText] = useState<string>(
    warrantyClaimTarget?.originalRequest.addressText ||
      (defaultAddr ? `${defaultAddr.streetDetails} · ${defaultAddr.buildingFloor}` : '')
  );
  const [customerPhone, setCustomerPhone] = useState<string>(user.phone);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [walletProvider, setWalletProvider] = useState<string>(WALLET_PROVIDERS[0]);
  const [recurrenceFrequency, setRecurrenceFrequency] =
    useState<RecurrenceFrequency>('none');
  const [recurrenceStartDate, setRecurrenceStartDate] = useState<string>(
    getTodayISO()
  );
  const [addedHintIds, setAddedHintIds] = useState<string[]>([]);
  const [switchedHintNotice, setSwitchedHintNotice] = useState<{
    title: string;
    prevCategoryId: string;
    prevServiceTitle: string;
  } | null>(null);
  const initialWizardStep: 1 | 2 | 3 | 4 =
    warrantyClaimTarget || initialBundle || initialService ? 2 : 1;
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(initialWizardStep);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [createdRef, setCreatedRef] = useState<string | null>(null);
  const [submittedRouting, setSubmittedRouting] = useState<RoutingPreview | null>(null);

  const prevDistrictPropRef = useRef(district);
  useEffect(() => {
    if (prevDistrictPropRef.current !== district) {
      prevDistrictPropRef.current = district;
      setSelectedDistrict(district);
      setSelectedCenter(getLocationMeta(district, locations).center);
    }
  }, [district, locations]);

  useEffect(() => {
    if (
      appliedPromo?.applicableCategoryIds &&
      !appliedPromo.applicableCategoryIds.includes(categoryId)
    ) {
      setPromoFeedback(
        `تنبيه: كود ${appliedPromo.code} مخصص لأقسام أخرى، يمكنك استخدام KHADAMAT15 لهذا القسم.`
      );
      setAppliedPromo(null);
    }
  }, [categoryId, appliedPromo]);

  const categoryServices = useMemo(
    () => SERVICES_CATALOG.filter((s) => s.categoryId === categoryId),
    [categoryId]
  );

  const centerAreaOptions = useMemo(() => {
    const matches = locations.filter((loc) => loc.center === selectedCenter);
    return matches.length > 0 ? matches : locations.slice(0, 6);
  }, [locations, selectedCenter]);

  const selectedCategory = SERVICE_CATEGORIES.find((c) => c.id === categoryId);
  const selectedServiceObj = SERVICES_CATALOG.find((s) => s.title === serviceTitle);
  const activeServiceTitle = serviceTitle || categoryServices[0]?.title || '';
  const smartHints = useMemo(
    () => computeSmartServiceHints(activeServiceTitle, categoryId, customerRequests),
    [activeServiceTitle, categoryId, customerRequests]
  );
  const routingPreview = getRoutingPreview(categoryId, selectedDistrict);

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const stopCameraStream = useCallback(() => {
    clearRecordingTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch {
        // ignore stop errors on teardown
      }
    }
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    setIsRecordingVideo(false);
    setRecordingSeconds(0);
    recordingSecondsRef.current = 0;

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [clearRecordingTimer]);

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setIsCameraOpen(false);
      setIsCameraLoading(false);
      setPreviewMedia(null);
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, stopCameraStream]);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [isCameraOpen, isCameraLoading]);

  if (!isOpen) return null;

  const canRecordLiveVideo = typeof MediaRecorder !== 'undefined';

  const handleMediaSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPhotoError('');
    setPhotoFallbackAvailable(false);

    const fileArr = Array.from(files);
    const imageFiles = fileArr.filter((f) => f.type.startsWith('image/') || (!f.type.startsWith('video/') && /\.(jpe?g|png|webp|heic)$/i.test(f.name)));
    const videoFiles = fileArr.filter((f) => f.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|3gp)$/i.test(f.name));

    const remainingPhotos = MAX_FAULT_PHOTOS - faultPhotos.length;
    const remainingVideos = MAX_FAULT_VIDEOS - faultVideos.length;

    if (imageFiles.length > 0 && remainingPhotos <= 0 && videoFiles.length === 0) {
      setPhotoError(`الحد الأقصى ${MAX_FAULT_PHOTOS} صور للعطل.`);
      return;
    }
    if (videoFiles.length > 0 && remainingVideos <= 0 && imageFiles.length === 0) {
      setPhotoError(`يمكن إرفاق فيديو قصير واحد فقط مع الطلب.`);
      return;
    }

    setIsCompressingPhotos(true);
    try {
      if (imageFiles.length > 0 && remainingPhotos > 0) {
        const pickedImages = imageFiles.slice(0, remainingPhotos);
        const compressed = await Promise.all(
          pickedImages.map((f) => compressImageToDataUrl(f))
        );
        setFaultPhotos((prev) => [...prev, ...compressed].slice(0, MAX_FAULT_PHOTOS));
      }

      if (videoFiles.length > 0 && remainingVideos > 0) {
        const pickedVideo = videoFiles[0];
        if (pickedVideo.size > MAX_VIDEO_BYTES) {
          setPhotoError('حجم الفيديو كبير جداً (الحد الأقصى 4 ميجابايت أو 15 ثانية).');
        } else {
          const dataUrl = await readBlobAsDataUrl(pickedVideo);
          const durationSec = await probeVideoDuration(dataUrl);
          setFaultVideos((prev) =>
            [
              ...prev,
              {
                url: dataUrl,
                durationSec,
                mimeType: pickedVideo.type || 'video/mp4',
                sizeLabel: formatBytesLabel(pickedVideo.size),
              },
            ].slice(0, MAX_FAULT_VIDEOS)
          );
        }
      }
    } catch {
      setPhotoError('تعذر معالجة الملف المختار، يرجى اختيار صورة أو فيديو قصير مدعوم.');
    } finally {
      setIsCompressingPhotos(false);
    }
  };

  const openLiveCamera = async (requestedFacing: 'environment' | 'user' = cameraFacingMode) => {
    if (faultPhotos.length >= MAX_FAULT_PHOTOS && faultVideos.length >= MAX_FAULT_VIDEOS) {
      setPhotoError(`وصلت إلى الحد الأقصى للمرفقات (${MAX_FAULT_PHOTOS} صور وفيديو واحد).`);
      return;
    }
    setPhotoError('');
    setPhotoFallbackAvailable(false);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      if (faultVideos.length < MAX_FAULT_VIDEOS && faultPhotos.length >= MAX_FAULT_PHOTOS) {
        osVideoInputRef.current?.click();
      } else {
        osCameraInputRef.current?.click();
      }
      return;
    }

    stopCameraStream();
    setCameraFacingMode(requestedFacing);
    setIsCameraOpen(true);
    setIsCameraLoading(true);

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: requestedFacing },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: requestedFacing },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      }
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsCameraLoading(false);
    } catch {
      stopCameraStream();
      setIsCameraOpen(false);
      setIsCameraLoading(false);
      setPhotoFallbackAvailable(true);
      setPhotoError(
        'تعذر فتح عدسة الكاميرا مباشرة في المتصفح. يمكنك التصوير بكاميرا الجهاز أو الاختيار من المعرض.'
      );
    }
  };

  const closeLiveCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setIsCameraLoading(false);
  };

  const captureFrameFromCamera = () => {
    if (faultPhotos.length >= MAX_FAULT_PHOTOS) {
      setPhotoError(`الحد الأقصى ${MAX_FAULT_PHOTOS} صور.`);
      return;
    }
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setPhotoError('انتظر لحظة حتى تجهز صورة الكاميرا ثم أعد المحاولة.');
      return;
    }

    const maxDim = 720;
    let width = video.videoWidth;
    let height = video.videoHeight;
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    setFaultPhotos((prev) => [...prev, dataUrl].slice(0, MAX_FAULT_PHOTOS));
    setPhotoError('');
    setPhotoFallbackAvailable(false);
    closeLiveCamera();
  };

  const stopVideoRecording = () => {
    clearRecordingTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        closeLiveCamera();
      }
    }
  };

  const startVideoRecording = () => {
    if (faultVideos.length >= MAX_FAULT_VIDEOS) {
      setPhotoError('يمكن إرفاق فيديو قصير واحد فقط مع الطلب.');
      return;
    }
    const stream = cameraStreamRef.current;
    if (!stream || typeof MediaRecorder === 'undefined') {
      osVideoInputRef.current?.click();
      return;
    }

    setPhotoError('');
    recordedChunksRef.current = [];
    recordingSecondsRef.current = 0;
    setRecordingSeconds(0);

    try {
      const mimeType = pickSupportedVideoMimeType();
      const options: MediaRecorderOptions = mimeType
        ? { mimeType, videoBitsPerSecond: 320000 }
        : { videoBitsPerSecond: 320000 };
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          recordedChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        clearRecordingTimer();
        const recordedDuration = Math.max(1, recordingSecondsRef.current);
        const chunks = recordedChunksRef.current;
        recordedChunksRef.current = [];
        setIsRecordingVideo(false);

        if (chunks.length === 0) {
          setPhotoError('لم يتم تسجيل أي مقطع فيديو، حاول مرة أخرى.');
          return;
        }

        const finalType = mimeType || chunks[0].type || 'video/webm';
        const blob = new Blob(chunks, { type: finalType });
        if (blob.size > MAX_VIDEO_BYTES) {
          setPhotoError('حجم الفيديو المسجل كبير، يرجى تسجيل مقطع أقصر.');
          closeLiveCamera();
          return;
        }

        setIsCompressingPhotos(true);
        void readBlobAsDataUrl(blob)
          .then((dataUrl) => {
            setFaultVideos((prev) =>
              [
                ...prev,
                {
                  url: dataUrl,
                  durationSec: recordedDuration,
                  mimeType: finalType,
                  sizeLabel: formatBytesLabel(blob.size),
                },
              ].slice(0, MAX_FAULT_VIDEOS)
            );
            closeLiveCamera();
          })
          .catch(() => {
            setPhotoError('تعذر حفظ الفيديو المسجل، حاول مرة أخرى.');
          })
          .finally(() => {
            setIsCompressingPhotos(false);
          });
      };

      recorder.start(250);
      setIsRecordingVideo(true);

      recordingTimerRef.current = window.setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingSeconds(recordingSecondsRef.current);
        if (recordingSecondsRef.current >= MAX_VIDEO_DURATION_SEC) {
          stopVideoRecording();
        }
      }, 1000);
    } catch {
      setIsRecordingVideo(false);
      setPhotoFallbackAvailable(true);
      setPhotoError('تعذر بدء تسجيل الفيديو في المتصفح، استخدم زر كاميرا الجهاز.');
    }
  };

  const handleApplyPromo = (overrideCode?: string) => {
    const codeToTry = overrideCode ?? promoInput;
    if (overrideCode !== undefined) setPromoInput(overrideCode);
    const result = validatePromoCode(codeToTry, categoryId);
    if (!result.valid) {
      setAppliedPromo(null);
      setPromoFeedback(result.error);
      return;
    }
    setAppliedPromo(result.promo);
    setPromoFeedback('');
  };

  const handleToggleHintInNotes = (hintId: string, noteAddition: string) => {
    const isAdded = addedHintIds.includes(hintId);
    if (isAdded) {
      setAddedHintIds((prev) => prev.filter((id) => id !== hintId));
      setDetailedDescription((prev) =>
        prev
          .split('\n')
          .filter((line) => line.trim() !== noteAddition.trim())
          .join('\n')
          .trim()
      );
    } else {
      setAddedHintIds((prev) => [...prev, hintId]);
      setDetailedDescription((prev) => {
        const trimmed = prev.trim();
        if (!trimmed) return noteAddition;
        if (trimmed.includes(noteAddition)) return prev;
        return `${trimmed}\n${noteAddition}`;
      });
    }
  };

  const handleRequestHintNow = (targetService: ServiceItem) => {
    setSwitchedHintNotice({
      title: targetService.title,
      prevCategoryId: categoryId,
      prevServiceTitle: activeServiceTitle,
    });
    setCategoryId(targetService.categoryId);
    setServiceTitle(targetService.title);
    setAddedHintIds([]);
  };

  const goToNextStep = () => {
    setErrorMsg('');
    if (wizardStep === 1) {
      if (!serviceTitle.trim() && categoryServices[0]?.title) {
        setServiceTitle(categoryServices[0].title);
      }
      setWizardStep(2);
      return;
    }
    if (wizardStep === 2) {
      if (detailedDescription.trim().length < 10) {
        setErrorMsg(
          'يرجى كتابة أو اختيار وصف مختصر للمشكلة (10 أحرف على الأقل) ليتمكن الفني من تسعير العرض بدقة.'
        );
        return;
      }
      setWizardStep(3);
      return;
    }
    if (wizardStep === 3) {
      if (addressText.trim().length < 5) {
        setErrorMsg('يرجى كتابة العنوان التفصيلي أو اختيار عنوان محفوظ.');
        return;
      }
      if (customerPhone.trim().length < 10) {
        setErrorMsg('يرجى إدخال رقم موبايل صحيح للتواصل بعد اختيار العرض.');
        return;
      }
      setWizardStep(4);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wizardStep < 4) {
      goToNextStep();
      return;
    }

    const finalTitle =
      serviceTitle.trim() ||
      categoryServices[0]?.title ||
      selectedCategory?.name ||
      'طلب خدمة صيانة';

    if (detailedDescription.trim().length < 10) {
      setWizardStep(2);
      setErrorMsg('يرجى كتابة تفاصيل المشكلة أو الخدمة المطلوبة (10 أحرف على الأقل).');
      return;
    }
    if (addressText.trim().length < 5) {
      setWizardStep(3);
      setErrorMsg('يرجى كتابة العنوان التفصيلي (الشارع أو علامة مميزة).');
      return;
    }
    if (customerPhone.trim().length < 10) {
      setWizardStep(3);
      setErrorMsg('يرجى إدخال رقم موبايل صحيح.');
      return;
    }

    setErrorMsg('');
    const refCode = `KH-${Math.floor(91000 + Math.random() * 8900)}`;

    const isFutureStart =
      recurrenceFrequency !== 'none' && recurrenceStartDate > getTodayISO();

    const newReq: ServiceRequest = {
      id: `req-${Date.now()}`,
      referenceCode: refCode,
      categoryId,
      categoryName: selectedCategory?.name || 'خدمات عامة',
      serviceTitle: finalTitle,
      detailedDescription: detailedDescription.trim(),
      faultPhotos: faultPhotos.length > 0 ? faultPhotos : undefined,
      faultVideos: faultVideos.length > 0 ? faultVideos : undefined,
      promoCode: appliedPromo?.code,
      discountPercent: appliedPromo?.discountPercent,
      maxDiscountEGP: appliedPromo?.maxDiscountEGP,
      loyaltyDiscountEGP: selectedLoyaltyVoucher?.discountEGP,
      loyaltyVoucherId: selectedLoyaltyVoucher?.id,
      bundleId: initialBundle?.id,
      bundleTitle: initialBundle?.title,
      district: selectedDistrict,
      addressText: addressText.trim(),
      preferredDate,
      preferredTime,
      urgency,
      customerName: user.name,
      customerPhone: customerPhone.trim(),
      status: 'open_for_quotes',
      paymentMethod,
      walletProvider: paymentMethod === 'wallet' ? walletProvider : undefined,
      recurrenceFrequency:
        recurrenceFrequency !== 'none' ? recurrenceFrequency : undefined,
      recurrenceCycleNumber:
        recurrenceFrequency !== 'none' && !isFutureStart ? 1 : undefined,
      createdAt: 'الآن',
      createdAtTimestamp: Date.now(),
      warrantyClaimForRef: warrantyClaimTarget?.originalRequest.referenceCode,
      isWarrantyClaim: Boolean(warrantyClaimTarget),
      routingInfo: {
        matchType: routingPreview.matchType,
        notifiedCount: routingPreview.notifiedCount,
        nearestCenterName: routingPreview.nearestCenterName,
        distanceKm: routingPreview.minDistanceKm,
      },
    };

    onSubmitRequest(
      newReq,
      recurrenceFrequency !== 'none'
        ? { frequency: recurrenceFrequency, startDateISO: recurrenceStartDate }
        : undefined
    );
    setSubmittedRouting(routingPreview);
    setCreatedRef(refCode);
  };

  const describeRouting = (r: RoutingPreview) => {
    if (r.matchType === 'exact_area') {
      return `تنبيه فوري لـ ${r.notifiedCount} فني/شركة في منطقتك · عروض خلال دقائق`;
    }
    if (r.matchType === 'exact_center') {
      return `تنبيه لـ ${r.notifiedCount} فني/شركة في مركز ${r.nearestCenterName}`;
    }
    return `توجيه للأقرب في ${r.nearestCenterName} (~${r.minDistanceKm} كم)`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-modal-title"
    >
      <div className="w-full md:max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="md:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 id="request-modal-title" className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
              {createdRef
                ? 'تم بث طلبك للفنيين'
                : `طلب خدمة · خطوة ${wizardStep} من 4`}
            </h2>
            {!createdRef && (
              <p className="text-[11px] md:text-xs text-orange-700 dark:text-orange-400 mt-0.5 tabular-nums font-medium">
                {describeRouting(routingPreview)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Step Syaanh Wizard Progress Bar */}
        {!createdRef && (
          <div className="px-4 md:px-6 py-2.5 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="grid grid-cols-4 gap-1.5">
              {SYAANH_WIZARD_STEPS.map((item) => {
                const isDone = item.step < wizardStep;
                const isCurrent = item.step === wizardStep;
                const canJump = item.step <= wizardStep;
                return (
                  <button
                    key={item.step}
                    type="button"
                    disabled={!canJump}
                    onClick={() => {
                      if (canJump) {
                        setErrorMsg('');
                        setWizardStep(item.step);
                      }
                    }}
                    className={`min-h-[38px] px-2 py-1.5 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold transition-colors ${
                      isCurrent
                        ? 'bg-[#FF5A00] dark:bg-orange-600 text-white'
                        : isDone
                          ? 'bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 cursor-pointer'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] tabular-nums shrink-0">
                      {isDone ? <Check className="w-3 h-3" /> : item.step}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Body */}
        {createdRef ? (
          <div className="p-5 md:p-7 text-center space-y-5 overflow-y-auto">
            <CelebrationEmblem variant="booking" />
            <div className="space-y-1.5">
              <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
                {recurrenceFrequency !== 'none' && recurrenceStartDate > getTodayISO()
                  ? `تمت جدولة طلبك الدوري بنجاح (${createdRef})`
                  : `تم إرسال طلبك للفنيين (${createdRef})`}
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {recurrenceFrequency !== 'none' && recurrenceStartDate > getTodayISO()
                  ? `سيتم إنشاء أول طلب تلقائياً في ${formatArabicDateLabel(recurrenceStartDate)}.`
                  : 'تصلك الآن عروض الأسعار ومواعيد الوصول من أقرب الفنيين — سيظهر لك تنبيه فور وصول أول عرض لتختار وتتواصل موبايل أو واتساب.'}
              </p>
            </div>

            {/* Syaanh Post-Submit Journey Preview */}
            <div className="grid grid-cols-4 gap-1.5 max-w-md mx-auto text-center">
              {[
                { num: '1', text: 'تم البث', active: true },
                { num: '2', text: 'عروض تصل الآن', active: true },
                { num: '3', text: 'اختر العرض', active: false },
                { num: '4', text: 'موبايل / واتساب', active: false },
              ].map((st) => (
                <div
                  key={st.num}
                  className={`rounded-xl border px-2 py-2 space-y-1 ${
                    st.active
                      ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="text-[11px] font-extrabold tabular-nums">{st.num}</div>
                  <div className="text-[10px] font-bold leading-tight">{st.text}</div>
                </div>
              ))}
            </div>

            <div className="animate-celebration-summary bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs text-right space-y-2 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-semibold">
                <Bell className="w-4 h-4 shrink-0" />
                <span>رقم هاتفك مخفي تماماً حتى تضغط موافق على أحد العروض</span>
              </div>
              <div className="text-slate-800 dark:text-slate-100 font-semibold">
                الخدمة: {activeServiceTitle || selectedCategory?.name}
              </div>
              <div className="text-slate-600 dark:text-slate-300">المنطقة: {selectedDistrict}</div>
              <div className="text-slate-600 dark:text-slate-300">
                الموعد المفضل: {preferredDate} · {preferredTime}
              </div>
              {(faultPhotos.length > 0 || faultVideos.length > 0) && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-slate-600 dark:text-slate-300 tabular-nums font-semibold">
                    تم إرفاق{' '}
                    {faultPhotos.length > 0 ? `${faultPhotos.length} صورة` : ''}
                    {faultPhotos.length > 0 && faultVideos.length > 0 ? ' و' : ''}
                    {faultVideos.length > 0 ? 'فيديو قصير للعطل' : ''} للفني
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {faultPhotos.map((src, idx) => (
                      <img
                        key={`confirm-photo-${idx}`}
                        src={src}
                        alt={`صورة العطل المرفقة ${idx + 1}`}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ))}
                    {faultVideos.map((vid, idx) => (
                      <div
                        key={`confirm-video-${idx}`}
                        className="relative w-16 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 flex items-center justify-center"
                      >
                        <video
                          src={vid.url}
                          muted
                          playsInline
                          className="w-full h-full object-cover opacity-80"
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-white">
                          <Play className="w-4 h-4 fill-white" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {appliedPromo && (
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    كود الخصم المطبق: {appliedPromo.code} ({appliedPromo.discountPercent}% حتى {appliedPromo.maxDiscountEGP} ج.م)
                  </span>
                </div>
              )}
              {selectedLoyaltyVoucher && (
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                  <Gift className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    قسيمة نقاط خدمات المطبقة: خصم فوري {selectedLoyaltyVoucher.discountEGP} ج.م ({selectedLoyaltyVoucher.promoCode})
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                {paymentMethod === 'wallet' ? (
                  <Wallet className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                ) : (
                  <Banknote className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                )}
                <span>
                  طريقة الدفع المختارة:{' '}
                  {getPaymentMethodLabel(
                    paymentMethod,
                    paymentMethod === 'wallet' ? walletProvider : undefined
                  )}
                </span>
              </div>
              {recurrenceFrequency !== 'none' && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-start gap-2 font-semibold text-orange-800 dark:text-orange-300">
                  <Repeat className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div>
                      تكرار الطلب: {getRecurrenceLabel(recurrenceFrequency)}
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                      الموعد التلقائي القادم:{' '}
                      {formatArabicDateLabel(
                        recurrenceStartDate > getTodayISO()
                          ? recurrenceStartDate
                          : addRecurrenceIntervalISO(
                              recurrenceStartDate,
                              recurrenceFrequency
                            )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToRequests();
                }}
                className="px-6 py-3 min-h-[46px] bg-[#FF5A00] text-white text-sm font-bold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 transition-colors cursor-pointer"
              >
                متابعة الطلب واستقبال العروض
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 min-h-[46px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1 p-4 md:p-6 space-y-4">
            {/* Active Warranty Claim Banner */}
            {warrantyClaimTarget && (
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      طلب إعادة فحص مجاني مشمول بالضمان · WR-{warrantyClaimTarget.originalRequest.referenceCode}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Seasonal Bundle Banner */}
            {initialBundle && (
              <div className="bg-orange-50/80 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-xl p-3 flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800 dark:text-orange-300">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{initialBundle.title} · كود {initialBundle.promoCode}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {initialBundle.estimatedSavingsLabel}
                  </p>
                </div>
              </div>
            )}

            {/* STEP 1: Category & Service Picker */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    1. اختر التخصص المطلوب
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {SERVICE_CATEGORIES.map((cat) => {
                      const isCatActive = cat.id === categoryId;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategoryId(cat.id);
                            const firstInCat = SERVICES_CATALOG.find((s) => s.categoryId === cat.id);
                            setServiceTitle(firstInCat?.title || '');
                          }}
                          className={`min-h-[42px] pl-3 pr-1.5 py-1 rounded-xl border text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                            isCatActive
                              ? 'bg-[#FF5A00] dark:bg-orange-600 text-white border-[#FF5A00]'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-orange-400'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700">
                            <ServiceImage
                              src={cat.imageUrl}
                              alt={cat.name}
                              iconKey={cat.iconKey}
                              className="w-full h-full"
                            />
                          </div>
                          <span>{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    2. حدد نوع الخدمة ({selectedCategory?.name})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {categoryServices.map((srv) => {
                      const isPicked = activeServiceTitle === srv.title;
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => setServiceTitle(srv.title)}
                          className={`p-2.5 rounded-xl border text-right flex items-center gap-3 transition-colors cursor-pointer ${
                            isPicked
                              ? 'border-[#FF5A00] dark:border-orange-500 bg-orange-50/75 dark:bg-orange-950/55'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 hover:border-orange-300'
                          }`}
                        >
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                            <ServiceImage
                              src={srv.imageUrl}
                              alt={srv.title}
                              iconKey={selectedCategory?.iconKey || 'carpentry'}
                              className="w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                                {srv.title}
                              </span>
                              {isPicked && (
                                <Check className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {srv.summary}
                            </p>
                            <div className="text-[10px] font-semibold text-orange-700 dark:text-orange-400 tabular-nums">
                              المدة {srv.estimatedDuration} · ضمان {srv.warrantyDays} يوم
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setServiceTitle('خدمة مخصصة أخرى في هذا القسم')}
                      className={`p-3 rounded-xl border text-right flex items-center gap-3 transition-colors cursor-pointer ${
                        serviceTitle === 'خدمة مخصصة أخرى في هذا القسم'
                          ? 'border-[#FF5A00] dark:border-orange-500 bg-orange-50/75 dark:bg-orange-950/55'
                          : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-orange-400'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Wrench className="w-5 h-5 text-[#FF5A00] dark:text-orange-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          عطل آخر في {selectedCategory?.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          اشرحه في الخطوة التالية ليصل للفنيين
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {selectedServiceObj && (
                  <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">ما يغطيه التخصص:</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                      {selectedServiceObj.included.map((item) => (
                        <span key={item} className="inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Problem Description, Media & AI Fault Analyzer */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    الخدمة المختارة: {activeServiceTitle || selectedCategory?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="text-orange-700 dark:text-orange-400 font-bold hover:underline shrink-0 cursor-pointer"
                  >
                    تغيير
                  </button>
                </div>

                {/* Quick Symptom Tags */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    اختيارات سريعة (اضغط للإضافة لوصف العطل):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ISSUE_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() =>
                          setDetailedDescription((prev) => {
                            const clean = prev.trim();
                            if (clean.includes(chip)) return prev;
                            return clean ? `${clean} — ${chip}` : `${activeServiceTitle}: ${chip}`;
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#FF5A00] text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

            {/* Smart Hints */}
            {(smartHints.length > 0 || switchedHintNotice) && (
              <div className="bg-orange-50/60 dark:bg-orange-950/35 border border-orange-200/80 dark:border-orange-800/70 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950 dark:text-orange-200">
                    <Lightbulb className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" aria-hidden="true" />
                    <span>تلميحات ذكية مقترحة لك</span>
                  </div>
                  <span className="text-[11px] text-orange-700 dark:text-orange-300">
                    حسب اختيارك وسجل طلباتك
                  </span>
                </div>

                {switchedHintNotice && (
                  <div className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      تم تجهيز الطلب لخدمة «{switchedHintNotice.title}»
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryId(switchedHintNotice.prevCategoryId);
                        setServiceTitle(switchedHintNotice.prevServiceTitle);
                        setSwitchedHintNotice(null);
                      }}
                      className="inline-flex items-center gap-1 text-orange-700 dark:text-orange-400 font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>تراجع</span>
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {smartHints.map((hint) => {
                    const isAdded = addedHintIds.includes(hint.id);
                    return (
                      <div
                        key={hint.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {hint.service.title}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                            {hint.reason}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleHintInNotes(hint.id, hint.noteAddition)
                            }
                            aria-pressed={isAdded}
                            className={`min-h-[40px] px-3 py-1.5 text-[11px] font-semibold rounded-lg border inline-flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#FF5A00] dark:hover:border-orange-500'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                <span>تمت الإضافة للملاحظات</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                <span>أضف لملاحظات الطلب</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRequestHintNow(hint.service)}
                            className="min-h-[40px] px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[#FF5A00] text-white hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 inline-flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer"
                          >
                            <span>اطلبها فوراً</span>
                            <ArrowUpLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detailed Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                وصف الخدمة المطلوبة *
              </label>
              <textarea
                rows={3}
                required
                value={detailedDescription}
                onChange={(e) => setDetailedDescription(e.target.value)}
                placeholder="اكتب تفاصيل المشكلة أو نوع الجهاز..."
                className="w-full p-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* AI Fault Analysis Chatbot Assistant (Gemini 3.5 Flash Lite) */}
            <div className="bg-gradient-to-l from-orange-50/80 via-white to-orange-50/40 dark:from-orange-950/40 dark:via-slate-900 dark:to-slate-900 border border-orange-200 dark:border-orange-800/80 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FF5A00] text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      الشات بوت الذكي لتحليل العطل وقطع الغيار (Gemini 3.5 Flash Lite)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      اكتب وصف المشكلة واضغط التحليل لاقتراح القسم وقطع الغيار وتوجيهك فوراً
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isAnalyzingFault}
                  onClick={handleAnalyzeFaultWithAI}
                  className="min-h-[40px] px-4 py-2 bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isAnalyzingFault ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري التحليل...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>تحليل العطل بالذكاء الاصطناعي</span>
                    </>
                  )}
                </button>
              </div>

              {aiAnalysisError && (
                <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold">{aiAnalysisError}</p>
              )}

              {aiFaultAnalysis && (
                <div className="bg-white dark:bg-slate-900 border border-orange-200/80 dark:border-orange-800/80 rounded-xl p-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2 text-orange-800 dark:text-orange-300 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>نتيجة تحليل الشات بوت الذكي:</span>
                    </span>
                    {aiFaultAnalysis.suggestedServiceTitle && (
                      <button
                        type="button"
                        onClick={() => {
                          setServiceTitle(aiFaultAnalysis.suggestedServiceTitle || serviceTitle);
                          if (aiFaultAnalysis.suggestedCategoryId) {
                            setCategoryId(aiFaultAnalysis.suggestedCategoryId);
                          }
                        }}
                        className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        تطبيق التوجيه السريع: {aiFaultAnalysis.suggestedServiceTitle}
                      </button>
                    )}
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {aiFaultAnalysis.analysisText}
                  </p>

                  {aiFaultAnalysis.spareParts && aiFaultAnalysis.spareParts.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        قطع الغيار المحتملة المطلوبة:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {aiFaultAnalysis.spareParts.map((part, pIdx) => (
                          <span
                            key={pIdx}
                            className="bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/70 text-orange-800 dark:text-orange-300 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                          >
                            {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiFaultAnalysis.advice && (
                    <div className="bg-slate-50 dark:bg-slate-800/70 rounded-lg p-2.5 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      <strong>نصيحة فنية تحضيرية:</strong> {aiFaultAnalysis.advice}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fault Photos & Short Video Attachment */}
            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                  <span>صور أو فيديو للعطل (اختياري)</span>
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums font-medium">
                  {faultPhotos.length}/{MAX_FAULT_PHOTOS} صور · {faultVideos.length}/{MAX_FAULT_VIDEOS} فيديو (حتى {MAX_VIDEO_DURATION_SEC}ث)
                </span>
              </div>

              {/* Hidden OS camera capture inputs for mobile lens & video */}
              <input
                ref={osCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                disabled={isCompressingPhotos}
                className="hidden"
                onChange={(e) => {
                  void handleMediaSelect(e.target.files);
                  e.currentTarget.value = '';
                }}
              />
              <input
                ref={osVideoInputRef}
                type="file"
                accept="video/*"
                capture="environment"
                disabled={isCompressingPhotos}
                className="hidden"
                onChange={(e) => {
                  void handleMediaSelect(e.target.files);
                  e.currentTarget.value = '';
                }}
              />

              {/* Attached Photos & Video Thumbnails */}
              {(faultPhotos.length > 0 || faultVideos.length > 0) && (
                <div className="flex flex-wrap items-center gap-2.5">
                  {faultVideos.map((vid, idx) => (
                    <div
                      key={`fault-vid-${idx}`}
                      className="relative w-28 h-20 rounded-xl overflow-hidden border border-orange-300 dark:border-orange-700 bg-slate-900 shrink-0 group"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewMedia({
                            kind: 'video',
                            url: vid.url,
                            label: `فيديو العطل${vid.durationSec ? ` (${formatDurationBadge(vid.durationSec)})` : ''}`,
                          })
                        }
                        aria-label="تشغيل فيديو العطل المرفق"
                        className="w-full h-full block cursor-pointer"
                      >
                        <video
                          src={vid.url}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover opacity-85"
                        />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-8 h-8 rounded-full bg-slate-950/75 text-white flex items-center justify-center">
                            <Play className="w-4 h-4 fill-white" />
                          </span>
                        </span>
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-white text-[10px] font-bold tabular-nums">
                          {vid.durationSec ? formatDurationBadge(vid.durationSec) : 'فيديو'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFaultVideos((prev) => prev.filter((_, i) => i !== idx))
                        }
                        aria-label="حذف فيديو العطل"
                        className="absolute top-1 left-1 w-7 h-7 rounded-lg bg-slate-950/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {faultPhotos.map((src, idx) => (
                    <div
                      key={`${idx}-${src.slice(0, 24)}`}
                      className="relative w-24 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 group"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewMedia({
                            kind: 'image',
                            url: src,
                            label: `صورة العطل (${idx + 1} من ${faultPhotos.length})`,
                          })
                        }
                        aria-label={`معاينة صورة العطل ${idx + 1}`}
                        className="w-full h-full block cursor-pointer"
                      >
                        <img
                          src={src}
                          alt={`صورة العطل ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 w-6 h-6 rounded-md bg-slate-950/70 text-white flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFaultPhotos((prev) => prev.filter((_, i) => i !== idx))
                        }
                        aria-label={`حذف صورة العطل ${idx + 1}`}
                        className="absolute top-1 left-1 w-7 h-7 rounded-lg bg-slate-950/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Live Camera Viewfinder (Photo + Short Video Recording) */}
              {isCameraOpen ? (
                <div className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 space-y-0">
                  <div className="relative w-full aspect-[4/3] max-h-64 bg-slate-950 flex items-center justify-center overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {isRecordingVideo && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold tabular-nums inline-flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          جاري التسجيل {formatDurationBadge(recordingSeconds)} / {formatDurationBadge(MAX_VIDEO_DURATION_SEC)}
                        </span>
                      </div>
                    )}
                    {isCameraLoading && (
                      <div className="absolute inset-0 bg-slate-950/75 flex items-center justify-center text-xs font-semibold text-white">
                        جاري تشغيل الكاميرا...
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-900 flex flex-wrap items-center justify-between gap-2">
                    {isRecordingVideo ? (
                      <button
                        type="button"
                        onClick={stopVideoRecording}
                        className="flex-1 min-h-[44px] px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-2 transition-colors cursor-pointer tabular-nums"
                      >
                        <Square className="w-4 h-4 fill-white shrink-0" />
                        <span>إيقاف وحفظ الفيديو ({formatDurationBadge(recordingSeconds)})</span>
                      </button>
                    ) : (
                      <>
                        {faultPhotos.length < MAX_FAULT_PHOTOS && (
                          <button
                            type="button"
                            disabled={isCameraLoading}
                            onClick={captureFrameFromCamera}
                            className="flex-1 min-w-[125px] min-h-[44px] px-3.5 py-2 bg-[#FF5A00] hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Camera className="w-4 h-4 shrink-0" />
                            <span>التقاط صورة</span>
                          </button>
                        )}
                        {faultVideos.length < MAX_FAULT_VIDEOS && canRecordLiveVideo && (
                          <button
                            type="button"
                            disabled={isCameraLoading}
                            onClick={startVideoRecording}
                            className="flex-1 min-w-[130px] min-h-[44px] px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Video className="w-4 h-4 shrink-0" />
                            <span>تسجيل فيديو ({MAX_VIDEO_DURATION_SEC}ث)</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isCameraLoading}
                          onClick={() =>
                            void openLiveCamera(
                              cameraFacingMode === 'environment' ? 'user' : 'environment'
                            )
                          }
                          className="min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <SwitchCamera className="w-4 h-4 shrink-0" />
                          <span>تبديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={closeLiveCamera}
                          className="min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                (faultPhotos.length < MAX_FAULT_PHOTOS || faultVideos.length < MAX_FAULT_VIDEOS) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={isCompressingPhotos}
                      onClick={() => void openLiveCamera()}
                      className="min-h-[48px] px-3 py-2 rounded-xl border border-[#FF5A00]/40 dark:border-orange-500/50 bg-orange-50/75 dark:bg-orange-950/40 hover:bg-orange-100/80 dark:hover:bg-orange-900/50 text-orange-900 dark:text-orange-200 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                    >
                      <Camera className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                      <span>تصوير بالكاميرا</span>
                    </button>

                    {faultVideos.length < MAX_FAULT_VIDEOS && (
                      <button
                        type="button"
                        disabled={isCompressingPhotos}
                        onClick={() => osVideoInputRef.current?.click()}
                        className="min-h-[48px] px-3 py-2 rounded-xl border border-rose-300/70 dark:border-rose-700/70 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 text-rose-900 dark:text-rose-200 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                      >
                        <Video className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>فيديو سريع للعطل</span>
                      </button>
                    )}

                    <label className="min-h-[48px] px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:border-[#FF5A00] dark:hover:border-orange-500 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        disabled={isCompressingPhotos}
                        className="hidden"
                        onChange={(e) => {
                          void handleMediaSelect(e.target.files);
                          e.currentTarget.value = '';
                        }}
                      />
                      <ImagePlus className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                      <span>
                        {isCompressingPhotos ? 'جاري المعالجة...' : 'رفع صورة / فيديو'}
                      </span>
                    </label>
                  </div>
                )
              )}

              {photoError && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-red-700 dark:text-red-300">{photoError}</p>
                  {photoFallbackAvailable && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => osCameraInputRef.current?.click()}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#FF5A00] hover:bg-orange-600 text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        صورة بكاميرا الجهاز
                      </button>
                      <button
                        type="button"
                        onClick={() => osVideoInputRef.current?.click()}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        فيديو بكاميرا الجهاز
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
              </div>
            )}

            {/* STEP 3: Location, Schedule, Payment & Contact */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                {/* Location & Address */}
                <div className="space-y-3">
                  <div className="bg-orange-50/60 dark:bg-orange-950/35 border border-orange-200/80 dark:border-orange-800/70 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                        <span>اختر المنطقة (لإرسال التنبيه لأقرب الفنيين)</span>
                      </label>
                      <button
                        type="button"
                        onClick={onOpenLocation}
                        className="text-[11px] font-bold text-[#FF5A00] dark:text-orange-400 hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>تحديد من الخريطة</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          المركز / المدينة
                        </label>
                        <select
                          value={selectedCenter}
                          onChange={(e) => {
                            const nextCenter = e.target.value;
                            setSelectedCenter(nextCenter);
                            const firstLoc = locations.find((l) => l.center === nextCenter);
                            if (firstLoc) {
                              setSelectedDistrict(firstLoc.displayLabel);
                            }
                          }}
                          className="w-full h-11 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                        >
                          {DAKAHLIA_CENTERS.map((c) => (
                            <option key={c} value={c}>
                              مركز {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          المنطقة / الحي / القرية
                        </label>
                        <select
                          value={
                            centerAreaOptions.some((l) => l.displayLabel === selectedDistrict)
                              ? selectedDistrict
                              : centerAreaOptions[0]?.displayLabel || selectedDistrict
                          }
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                          className="w-full h-11 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                        >
                          {centerAreaOptions.map((loc) => (
                            <option key={loc.id} value={loc.displayLabel}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                      <span className="text-[11px] font-bold text-orange-800 dark:text-orange-300 inline-flex items-center gap-1.5 tabular-nums">
                        <Bell className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                        <span>{describeRouting(routingPreview)}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setShowCustomAreaBox((prev) => !prev)}
                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-[#FF5A00] cursor-pointer inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{showCustomAreaBox ? 'إغلاق' : 'منطقة أخرى'}</span>
                      </button>
                    </div>

                    {showCustomAreaBox && (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={customAreaInput}
                          onChange={(e) => setCustomAreaInput(e.target.value)}
                          placeholder={`اكتب اسم الحي أو القرية داخل ${selectedCenter}...`}
                          className="flex-1 h-10 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:border-[#FF5A00] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const clean = customAreaInput.trim();
                            if (clean.length < 2) return;
                            const created = onAddCustomLocation?.(selectedCenter, clean);
                            if (created) {
                              setSelectedDistrict(created.displayLabel);
                            } else {
                              setSelectedDistrict(`الدقهلية · ${selectedCenter} - ${clean}`);
                            }
                            setCustomAreaInput('');
                            setShowCustomAreaBox(false);
                          }}
                          className="min-h-[40px] px-3.5 text-xs font-bold text-white bg-[#FF5A00] rounded-xl hover:bg-orange-700 cursor-pointer shrink-0"
                        >
                          تأكيد
                        </button>
                      </div>
                    )}
                  </div>

                  {savedAddresses.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                        عناوينك المحفوظة (اختر بضغطة واحدة):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {savedAddresses.map((addr) => {
                          const composed = `${addr.streetDetails}${addr.buildingFloor ? ` · ${addr.buildingFloor}` : ''}`;
                          const isCurrent = addressText.trim() === composed.trim();
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => {
                                setAddressText(composed);
                                if (addr.district) {
                                  setSelectedDistrict(addr.district);
                                  setSelectedCenter(getLocationMeta(addr.district, locations).center);
                                }
                              }}
                              className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                                isCurrent
                                  ? 'bg-[#FF5A00] text-white border-[#FF5A00]'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-orange-400'
                              }`}
                            >
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>{addr.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      العنوان التفصيلي *
                    </label>
                    <input
                      type="text"
                      value={addressText}
                      onChange={(e) => setAddressText(e.target.value)}
                      placeholder="الشارع، رقم العمارة، الدور والشقة"
                      className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Phone + Privacy */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                    <span>رقم الموبايل *</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-right tabular-nums focus:bg-white dark:focus:bg-slate-900 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-400">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      رقمك مخفي تماماً حتى توافق على أحد العروض.
                    </span>
                  </div>
                </div>

                {/* Preferred Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                      <span>اليوم المناسب</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {DATE_OPTIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setPreferredDate(d)}
                          className={`min-h-[40px] px-2.5 text-xs font-semibold rounded-xl border cursor-pointer ${
                            preferredDate === d
                              ? 'bg-[#FF5A00] text-white border-[#FF5A00] dark:bg-orange-600 dark:border-orange-600'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                      <span>الفترة المفضلة</span>
                    </label>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full h-11 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                    >
                      {TIME_WINDOWS.map((tw) => (
                        <option key={tw} value={tw}>
                          {tw}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Urgency Selection */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    أولوية تنفيذ الطلب
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setUrgency('normal')}
                      aria-pressed={urgency === 'normal'}
                      className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                        urgency === 'normal'
                          ? 'bg-[#FF5A00] text-white border-[#FF5A00] dark:bg-orange-600 dark:border-orange-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      عادي حسب الموعد
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency('urgent')}
                      aria-pressed={urgency === 'urgent'}
                      className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                        urgency === 'urgent'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      طوارئ سريعة اليوم
                    </button>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    طريقة الدفع *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      aria-pressed={paymentMethod === 'cash'}
                      className={`min-h-[54px] p-3 rounded-xl border text-right flex items-start gap-2.5 transition-colors cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'border-[#FF5A00] dark:border-orange-500 bg-orange-50/75 dark:bg-orange-950/60 text-orange-950 dark:text-orange-100'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Banknote
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          paymentMethod === 'cash' ? 'text-[#FF5A00] dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold flex items-center justify-between gap-2">
                          <span>نقد عند الاستلام</span>
                          {paymentMethod === 'cash' && (
                            <Check className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          بعد إتمام الخدمة ومعاينة الشغل
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      aria-pressed={paymentMethod === 'wallet'}
                      className={`min-h-[54px] p-3 rounded-xl border text-right flex items-start gap-2.5 transition-colors cursor-pointer ${
                        paymentMethod === 'wallet'
                          ? 'border-[#FF5A00] dark:border-orange-500 bg-orange-50/75 dark:bg-orange-950/60 text-orange-950 dark:text-orange-100'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Wallet
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          paymentMethod === 'wallet' ? 'text-[#FF5A00] dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold flex items-center justify-between gap-2">
                          <span>محفظة إلكترونية</span>
                          {paymentMethod === 'wallet' && (
                            <Check className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          فودافون كاش / إنستاباي / أورنج
                        </p>
                      </div>
                    </button>
                  </div>

                  {paymentMethod === 'wallet' && (
                    <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        اختر المحفظة:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {WALLET_PROVIDERS.map((provider) => (
                          <button
                            key={provider}
                            type="button"
                            onClick={() => setWalletProvider(provider)}
                            className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              walletProvider === provider
                                ? 'bg-[#FF5A00] text-white border-[#FF5A00] dark:bg-orange-600 dark:border-orange-600'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            {provider}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recurrence Selection */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400" />
                    <span>تكرار الطلب تلقائياً (اختياري)</span>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'none', label: 'مرة واحدة' },
                        { id: 'daily', label: 'يومياً' },
                        { id: 'weekly', label: 'أسبوعياً' },
                        { id: 'monthly', label: 'شهرياً' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRecurrenceFrequency(opt.id)}
                        aria-pressed={recurrenceFrequency === opt.id}
                        className={`min-h-[42px] px-3 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
                          recurrenceFrequency === opt.id
                            ? 'bg-[#FF5A00] text-white border-[#FF5A00] dark:bg-orange-600 dark:border-orange-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {recurrenceFrequency !== 'none' && (
                    <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            تاريخ بدء التكرار
                          </label>
                          <input
                            type="date"
                            min={getTodayISO()}
                            value={recurrenceStartDate}
                            onChange={(e) =>
                              setRecurrenceStartDate(e.target.value || getTodayISO())
                            }
                            className="w-full h-11 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl tabular-nums focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                        <div className="text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 min-h-[44px] flex flex-col justify-center">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            الموعد التلقائي التالي:
                          </span>
                          <span className="font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                            {formatArabicDateLabel(
                              recurrenceStartDate > getTodayISO()
                                ? recurrenceStartDate
                                : addRecurrenceIntervalISO(
                                    recurrenceStartDate,
                                    recurrenceFrequency
                                  )
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

            {/* Promo Code Input */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                  <span>كود خصم (اختياري)</span>
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">أكواد سريعة:</span>
                  {['KHADAMAT15', 'DAKAHLIA10'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleApplyPromo(code)}
                      className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 font-bold hover:bg-orange-100 dark:hover:bg-orange-900/60 cursor-pointer tabular-nums"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="أدخل كود الخصم (مثال: KHADAMAT15)"
                  className="flex-1 h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl font-semibold tracking-wider uppercase focus:bg-white dark:focus:bg-slate-900 focus:border-[#FF5A00] dark:focus:border-orange-500 focus:outline-none"
                />
                {appliedPromo ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedPromo(null);
                      setPromoInput('');
                      setPromoFeedback('');
                    }}
                    className="min-h-[44px] px-4 py-2 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 cursor-pointer shrink-0"
                  >
                    إزالة الكود
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyPromo()}
                    className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-orange-600 hover:bg-slate-800 dark:hover:bg-orange-500 rounded-xl cursor-pointer shrink-0"
                  >
                    تطبيق الخصم
                  </button>
                )}
              </div>

              {appliedPromo && (
                <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
                  <span>
                    تم تفعيل كود {appliedPromo.code} — خصم {appliedPromo.discountPercent}% (بحد أقصى {appliedPromo.maxDiscountEGP} ج.م)
                  </span>
                  <Check className="w-4 h-4 shrink-0" />
                </div>
              )}

              {promoFeedback && (
                <p className="text-xs text-amber-800 dark:text-amber-300">{promoFeedback}</p>
              )}

              {activeLoyaltyVouchers.length > 0 && (
                <div className="bg-orange-50/70 dark:bg-orange-950/35 border border-orange-200 dark:border-orange-800/70 rounded-xl p-3 space-y-2">
                  <div className="text-[11px] font-bold text-orange-950 dark:text-orange-200 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-[#ea580c] dark:text-orange-400 shrink-0" />
                    <span>قسائم نقاط خدمات المتاحة لديك ({activeLoyaltyVouchers.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeLoyaltyVouchers.map((voucher) => {
                      const isSelected = selectedLoyaltyVoucher?.id === voucher.id;
                      return (
                        <button
                          key={voucher.id}
                          type="button"
                          onClick={() =>
                            setSelectedLoyaltyVoucher(isSelected ? null : voucher)
                          }
                          aria-pressed={isSelected}
                          className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-700 border-emerald-700 text-white dark:bg-emerald-600'
                              : 'bg-white dark:bg-slate-900 border-orange-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-[#ea580c]'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          <span>
                            {voucher.title} ({voucher.promoCode})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
              </div>
            )}

            {/* STEP 4: Syaanh Review & Dispatch Confirmation */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="bg-orange-50/75 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-900 dark:text-orange-200">
                    <ClipboardCheck className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
                    <span>مراجعة الطلب قبل البث للفنيين ({routingPreview.notifiedCount} فني متاح)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    بمجرد الضغط على الإرسال، يصل طلبك لأقرب الفنيين المعتمدين في نطاقك، وستصلك تنبيهات بعروض الأسعار والمواعيد للاختيار بينها والتواصل بالموبايل أو الواتساب.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                  <div className="p-3.5 flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">القسم والخدمة</span>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {activeServiceTitle || selectedCategory?.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedCategory?.name}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="text-orange-700 dark:text-orange-400 font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      تعديل
                    </button>
                  </div>

                  <div className="p-3.5 flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">تفاصيل المشكلة والمرفقات</span>
                      <div className="text-slate-800 dark:text-slate-200 leading-relaxed">
                        {detailedDescription}
                      </div>
                      {(faultPhotos.length > 0 || faultVideos.length > 0) && (
                        <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          مرفق: {faultPhotos.length} صورة{faultVideos.length > 0 ? ` + ${faultVideos.length} فيديو` : ''}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="text-orange-700 dark:text-orange-400 font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      تعديل
                    </button>
                  </div>

                  <div className="p-3.5 flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">الموقع والموعد والدفع</span>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {selectedDistrict} — {addressText}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 tabular-nums">
                        {preferredDate} · {preferredTime} {urgency === 'urgent' ? '· طوارئ اليوم' : ''}
                      </div>
                      <div className="text-slate-700 dark:text-slate-200 font-semibold">
                        الدفع: {getPaymentMethodLabel(paymentMethod, paymentMethod === 'wallet' ? walletProvider : undefined)}
                        {appliedPromo ? ` · كود ${appliedPromo.code}` : ''}
                        {selectedLoyaltyVoucher ? ` · خصم نقاط ${selectedLoyaltyVoucher.discountEGP} ج.م` : ''}
                      </div>
                      <div className="text-[11px] text-orange-700 dark:text-orange-400 font-semibold inline-flex items-center gap-1 tabular-nums">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>رقم التواصل ({customerPhone}) مخفي حتى توافق على العرض</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="text-orange-700 dark:text-orange-400 font-bold hover:underline shrink-0 cursor-pointer"
                    >
                      تعديل
                    </button>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <p className="text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                {errorMsg}
              </p>
            )}
            </div>

            {/* Sticky Syaanh Wizard Navigation Footer */}
            <div className="px-4 md:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2.5 shrink-0">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setWizardStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : 1));
                  }}
                  className="min-h-[46px] px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs md:text-sm font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[46px] px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs md:text-sm font-semibold rounded-xl cursor-pointer shrink-0"
                >
                  إلغاء
                </button>
              )}

              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="flex-1 min-h-[46px] px-5 bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white text-xs md:text-sm font-bold rounded-xl inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>التالي</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 min-h-[46px] px-5 bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white text-xs md:text-sm font-bold rounded-xl inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>إرسال الطلب واستقبال العروض</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Customer Photo / Video Lightbox Preview */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {previewMedia.label}
              </span>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                aria-label="إغلاق المعاينة"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 flex items-center justify-center max-h-[70vh]">
              {previewMedia.kind === 'video' ? (
                <video
                  src={previewMedia.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.label}
                  className="max-h-[70vh] w-auto object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
