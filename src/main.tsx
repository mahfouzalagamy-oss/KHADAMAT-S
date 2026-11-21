import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initNativeCapacitorShell } from './utils/nativeCapacitor.ts';

createRoot(document.getElementById('root')!).render(
  <Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm" dir="rtl">
        جارٍ التحميل...
      </div>
    }
  >
    <App />
  </Suspense>
);
void initNativeCapacitorShell();
