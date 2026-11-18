import { useState } from 'react';
import { ServiceCategory } from '../types/khadamat';
import { CategoryIcon } from './CategoryIcon';

interface ServiceImageProps {
  src?: string;
  alt: string;
  iconKey: ServiceCategory['iconKey'];
  className?: string;
}

export function resolveBaseAssetUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${path.replace(/^\/+/, '')}`;
}

export function ServiceImage({ src, alt, iconKey, className = '' }: ServiceImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = resolveBaseAssetUrl(src);

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-orange-50/80 dark:from-slate-800 dark:via-slate-900 dark:to-orange-950/50 text-orange-700 dark:text-orange-300 ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center mb-2">
          <CategoryIcon iconKey={iconKey} className="w-6 h-6 text-[#FF5A00] dark:text-orange-400" />
        </div>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 px-4 text-center line-clamp-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
}
