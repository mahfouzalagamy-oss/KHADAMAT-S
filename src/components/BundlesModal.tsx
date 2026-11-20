import { Check, CheckCircle2, Copy, Sparkles, Tag, X } from 'lucide-react';
import { useState } from 'react';
import { SEASONAL_BUNDLES, SERVICES_CATALOG } from '../data/khadamatData';
import { SeasonalBundle, ServiceItem } from '../types/khadamat';
import { ServiceImage } from './ServiceImage';

interface BundlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBundle: (bundle: SeasonalBundle, matchedService?: ServiceItem) => void;
}

export function BundlesModal({ isOpen, onClose, onSelectBundle }: BundlesModalProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bundles-modal-title"
    >
      <div className="w-full md:max-w-3xl bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl border border-orange-200 dark:border-slate-800 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="md:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 shrink-0" />

        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF5A00] dark:text-orange-400 shrink-0" />
            <h2
              id="bundles-modal-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              عروض وباقات التوفير
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق العروض والباقات"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {SEASONAL_BUNDLES.map((bundle) => {
            const matchedService = SERVICES_CATALOG.find((s) => s.id === bundle.serviceId);
            const isCopied = copiedCode === bundle.promoCode;

            return (
              <article
                key={bundle.id}
                className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/9] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <ServiceImage
                      src={matchedService?.imageUrl}
                      alt={bundle.title}
                      iconKey="ac"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-bold text-[#FF5A00] dark:text-orange-400">
                        {bundle.seasonLabel}
                      </span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {bundle.estimatedSavingsLabel}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {bundle.title}
                    </h3>

                    <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                      {bundle.includedTasks.slice(0, 2).map((task) => (
                        <li key={task} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="px-3.5 pb-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-orange-200/80 dark:border-orange-800/70 rounded-xl px-2.5 py-1.5 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <Tag className="w-3 h-3 text-[#FF5A00]" />
                      <strong
                        dir="ltr"
                        className="font-mono font-bold text-orange-700 dark:text-orange-300"
                      >
                        {bundle.promoCode}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bundle.promoCode)}
                      className="inline-flex items-center gap-1 font-bold text-orange-700 dark:text-orange-300 cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'تم' : 'نسخ'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectBundle(bundle, matchedService);
                      onClose();
                    }}
                    className="w-full min-h-[42px] px-3 py-2 bg-[#FF5A00] hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    احجز بخصم {bundle.discountPercent}%
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
