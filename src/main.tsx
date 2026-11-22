import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './index.css';
import { initNativeCapacitorShell } from './utils/nativeCapacitor.ts';
import { startStoreSync } from './lib/storeSync';

// مزامنة لحظية مع الخادم (تتجاهل نفسها تلقائياً إن لم يوجد خادم)
startStoreSync();

// Tier 1 Google Maps Platform quota & auth failure listener
(window as { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

createRoot(document.getElementById('root')!).render(
  <Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm" dir="rtl">
        جارٍ التحميل...
      </div>
    }
  >
    <RouterProvider router={router} />
  </Suspense>
);
void initNativeCapacitorShell();
