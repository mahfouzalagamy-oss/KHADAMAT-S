import { useId } from 'react';

interface BrandWordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'inverted';
  showTagline?: boolean;
}

export function BrandWordmark({
  size = 'md',
  variant = 'default',
  showTagline = false,
}: BrandWordmarkProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `khadamat-brand-grad-${uid}`;
  const swoopGradId = `khadamat-swoop-grad-${uid}`;

  const iconBoxSize =
    size === 'sm'
      ? 'w-7 h-7 rounded-[10px]'
      : size === 'lg'
      ? 'w-12 h-12 rounded-[16px]'
      : 'w-9 h-9 rounded-[12px]';

  const wordmarkTextSize =
    size === 'sm'
      ? 'text-[19px]'
      : size === 'lg'
      ? 'text-[34px] sm:text-[40px]'
      : 'text-[25px]';

  const swoopClass =
    size === 'sm' ? 'w-12 h-2' : size === 'lg' ? 'w-24 sm:w-28 h-3' : 'w-16 h-2.5';

  const isInverted = variant === 'inverted';

  return (
    <span
      className="inline-flex items-center gap-2.5 select-none group"
      aria-label="خدمات"
    >
      {/* Global-grade geometric emblem: Continuous Home-Shield-Smile loop + precision spark */}
      <span
        className={`${iconBoxSize} relative flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-200 group-hover:scale-[1.04] ${
          isInverted
            ? 'bg-white shadow-md shadow-black/15 ring-1 ring-white/80'
            : 'shadow-sm shadow-[#ea580c]/30 ring-1 ring-[#ea580c]/20'
        }`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id={gradId}
              x1="4"
              y1="2"
              x2="36"
              y2="38"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#ff7426" />
              <stop offset="52%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>

          {!isInverted && (
            <>
              <rect width="40" height="40" fill={`url(#${gradId})`} />
              {/* Subtle top architectural sheen */}
              <path
                d="M0 0H40V16C30 10 14 9 0 15V0Z"
                fill="#ffffff"
                fillOpacity="0.1"
              />
            </>
          )}

          <g>
            {/* Continuous Home Gable + Shield + Warm Smile Loop */}
            <path
              d="M9.5 18.2L20 9.2L30.5 18.2V23.4C30.5 28 25.8 31.4 20 31.4C15.1 31.4 11.1 28.9 9.9 25.2"
              stroke={isInverted ? '#ea580c' : '#ffffff'}
              strokeWidth="3.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dynamic open-loop motion dot */}
            <circle
              cx="9.6"
              cy="21.7"
              r="1.75"
              fill={isInverted ? '#ea580c' : '#ffffff'}
            />
            {/* Precision 4-point craft & quality spark */}
            <path
              d="M20 15.1L21.75 18.75L25.4 20.5L21.75 22.25L20 25.9L18.25 22.25L14.6 20.5L18.25 18.75L20 15.1Z"
              fill={isInverted ? '#ea580c' : '#ffffff'}
            />
          </g>
        </svg>
      </span>

      {/* Bespoke Arabic Geometric Wordmark Lockup */}
      <span className="inline-flex flex-col items-start leading-none">
        <span className="relative inline-flex flex-col items-stretch">
          <span
            className={`font-display font-extrabold tracking-tight leading-none ${wordmarkTextSize} ${
              isInverted
                ? 'text-white drop-shadow-sm'
                : 'text-[#ea580c] dark:text-[#fb923c]'
            }`}
            style={{
              letterSpacing: '-0.025em',
              fontFeatureSettings: '"liga" 1, "calt" 1',
            }}
          >
            خدمات
          </span>

          {/* Tapered Talabat-inspired dynamic smile curve */}
          <svg
            viewBox="0 0 116 12"
            fill="none"
            className={`${swoopClass} mt-0.5`}
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={swoopGradId}
                x1="112"
                y1="4"
                x2="4"
                y2="4"
                gradientUnits="userSpaceOnUse"
              >
                <stop
                  offset="0%"
                  stopColor={isInverted ? '#ffffff' : '#ea580c'}
                />
                <stop
                  offset="100%"
                  stopColor={isInverted ? '#fed7aa' : '#fb923c'}
                />
              </linearGradient>
            </defs>
            <path
              d="M5 3.8C36 10.2 78 9.8 111 2.8"
              stroke={`url(#${swoopGradId})`}
              strokeWidth="2.9"
              strokeLinecap="round"
            />
            <circle
              cx="111.5"
              cy="2.8"
              r="2.1"
              fill={isInverted ? '#ffffff' : '#ea580c'}
            />
          </svg>
        </span>

        {showTagline && (
          <span
            className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1.5 ${
              isInverted
                ? 'text-orange-100'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <span>صيانة أسرع · الدقهلية</span>
          </span>
        )}
      </span>
    </span>
  );
}
