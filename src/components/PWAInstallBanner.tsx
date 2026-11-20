import { Check, Copy, Download, Share, Smartphone, Terminal, WifiOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    const ua = window.navigator.userAgent;
    const iOS =
      /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(iOS);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    setShowBrowserGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-xs font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 rounded-xl transition-colors cursor-pointer'
            : 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 text-xs font-semibold text-orange-800 dark:text-orange-200 bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/60 rounded-xl transition-colors cursor-pointer'
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>تثبيت التطبيق على الموبايل (PWA)</span>
      </button>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                تثبيت تطبيق «خدمات» على آيفون (iOS)
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#FF5A00] dark:bg-orange-600 text-white font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  افتح الصفحة في متصفح <strong>Safari</strong> واضغط على أيقونة المشاركة{' '}
                  <Share className="inline w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 mx-0.5" />{' '}
                  في أسفل الشاشة.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#FF5A00] dark:bg-orange-600 text-white font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#FF5A00] dark:bg-orange-600 text-white font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>اضغط «إضافة» ليعمل كتطبيق مستقل على شاشة موبايلك.</span>
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full h-11 bg-[#FF5A00] text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 cursor-pointer"
            >
              فهمت
            </button>
          </div>
        </div>
      )}

      {showBrowserGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                تثبيت «خدمات» كتطبيق موبايل فوري (PWA)
              </h3>
              <button
                type="button"
                onClick={() => setShowBrowserGuide(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              لتثبيت التطبيق مباشرة على هاتفك الأندرويد بدون متجر: افتح رابط التطبيق في متصفح{' '}
              <strong>Google Chrome</strong> واضغط على قائمة المتصفح (⋮) ثم اختر{' '}
              <strong>«تثبيت التطبيق / Install App»</strong> أو{' '}
              <strong>«إضافة إلى الشاشة الرئيسية»</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowBrowserGuide(false)}
              className="w-full h-11 bg-[#FF5A00] text-white text-xs font-semibold rounded-xl hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const onOffline = () => setIsOffline(true);
    const onOnline = () => setIsOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-5 left-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold shadow-md"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
      <span>وضع عدم الاتصال — بياناتك المحلية محفوظة وتُعرض بشكل طبيعي</span>
    </div>
  );
}

const CAPACITOR_COMMANDS = `npm install
npm run apk:init
npm run apk:open`;

export function AndroidApkGuideCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CAPACITOR_COMMANDS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#FF5A00] dark:text-orange-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              تحويل التطبيق وتثبيته على الموبايل (Android APK)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              تثبيت فوري (PWA) أو توليد ملف APK عبر Capacitor بشاشة بداية برتقالية وعمل دون اتصال.
            </p>
          </div>
        </div>
        <PWAInstallButton />
      </div>

      {/* Clear 3-Step User Installation Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-1">
          <div className="font-bold text-orange-700 dark:text-orange-400">
            1. الحصول على ملف APK
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            نزّل{' '}
            <span dir="ltr" className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              app-debug.apk
            </span>{' '}
            من GitHub Actions أو ابنه عبر Android Studio.
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-1">
          <div className="font-bold text-orange-700 dark:text-orange-400">2. السماح بالتثبيت</div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            انقل الملف للهاتف واضغط عليه، ثم فعّل «السماح من هذا المصدر» عند الطلب.
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-1">
          <div className="font-bold text-orange-700 dark:text-orange-400">3. التشغيل المباشر</div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            افتح «خدمات» بشاشة البداية الكاملة وتصفح طلباتك حتى عند انقطاع الإنترنت.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-slate-950 border border-transparent dark:border-slate-800 text-slate-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Terminal className="w-4 h-4 text-orange-400" />
            <span>أوامر تجهيز وبناء Android APK عبر Capacitor (راجع ANDROID_APK_GUIDE.md):</span>
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-orange-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'تم النسخ' : 'نسخ الأوامر'}</span>
          </button>
        </div>
        <pre
          dir="ltr"
          className="text-xs font-mono text-orange-200 overflow-x-auto leading-relaxed select-all"
        >
          {CAPACITOR_COMMANDS}
        </pre>
      </div>
    </section>
  );
}
