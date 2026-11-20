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
      ? 'w-9 h-9 rounded-[11px]'
      : size === 'lg'
        ? 'w-14 h-14 rounded-[18px]'
        : 'w-11 h-11 rounded-[14px]';

  const wordmarkTextSize =
    size === 'sm' ? 'text-[24px]' : size === 'lg' ? 'text-[40px] sm:text-[46px]' : 'text-[30px]';

  const swoopClass =
    size === 'sm'
      ? 'w-[66px] h-2'
      : size === 'lg'
        ? 'w-[116px] sm:w-[132px] h-3.5'
        : 'w-[84px] h-2.5';

  const lockupGap = size === 'lg' ? 'gap-3.5' : 'gap-2.5';
  const isInverted = variant === 'inverted';
  const markStroke = isInverted ? '#ea580c' : '#ffffff';

  return (
    <span className={`inline-flex items-center ${lockupGap} select-none group`} aria-label="خدمات">
      {/* Signature Home + Precision Maintenance Emblem */}
      <span
        className={`${iconBoxSize} relative flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-200 group-hover:scale-[1.04] ${
          isInverted
            ? 'bg-white shadow-md shadow-black/15 ring-1 ring-white/85'
            : 'shadow-md shadow-[#ea580c]/25 ring-1 ring-[#ea580c]/25'
        }`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id={gradId}
              x1="4"
              y1="2"
              x2="44"
              y2="46"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#ff7b2e" />
              <stop offset="52%" stopColor="#ff5a00" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>

          {!isInverted && (
            <>
              <rect width="48" height="48" fill={`url(#${gradId})`} />
              <path d="M0 0H48V18C35 11 16 10 0 17V0Z" fill="#ffffff" fillOpacity="0.14" />
            </>
          )}

          {/* Crisp Home Roof & Shield Frame */}
          <path
            d="M11 21.8L24 10.8L37 21.8V31.5C37 34.8 34.4 37.2 31.2 37.2H16.8C13.6 37.2 11 34.8 11 31.5V21.8Z"
            stroke={markStroke}
            strokeWidth="3.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Integrated Maintenance Wrench Silhouette */}
          <path
            d="M27.3 19.6C25.5 18.8 23.3 19.2 22 20.6C21 21.7 20.6 23.2 21 24.6L16.8 28.8C16.2 29.4 16.2 30.4 16.8 31C17.4 31.6 18.4 31.6 19 31L23.2 26.8C24.6 27.2 26.1 26.8 27.2 25.8C28.6 24.5 29 22.3 28.2 20.5L26 22.7L24.5 21.2L27.3 19.6Z"
            fill={markStroke}
          />

          {/* Smart Response Spark */}
          <path
            d="M32.5 12.2L33.5 14.3L35.6 15.3L33.5 16.3L32.5 18.4L31.5 16.3L29.4 15.3L31.5 14.3L32.5 12.2Z"
            fill={markStroke}
          />
        </svg>
      </span>

      {/* Bold Balanced Arabic Display Wordmark */}
      <span className="inline-flex flex-col items-start leading-none">
        <span className="relative inline-flex flex-col items-stretch">
          <span
            className={`font-display font-extrabold tracking-tight leading-[1.06] ${wordmarkTextSize} ${
              isInverted ? 'text-white drop-shadow-sm' : 'text-[#ea580c] dark:text-[#fb923c]'
            }`}
            style={{
              letterSpacing: '-0.02em',
              fontFeatureSettings: '"liga" 1, "calt" 1',
            }}
          >
            خدمات
          </span>

          {/* Balanced Kinetic Swoop Accent */}
          <svg
            viewBox="0 0 120 12"
            fill="none"
            className={`${swoopClass} mt-0.5`}
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={swoopGradId}
                x1="114"
                y1="4"
                x2="4"
                y2="4"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={isInverted ? '#ffffff' : '#ff5a00'} />
                <stop offset="100%" stopColor={isInverted ? '#fed7aa' : '#fb923c'} />
              </linearGradient>
            </defs>
            <path
              d="M5 3.6C37 10.2 82 9.8 113.5 2.7"
              stroke={`url(#${swoopGradId})`}
              strokeWidth="3.1"
              strokeLinecap="round"
            />
            <circle cx="114.5" cy="2.7" r="2.2" fill={isInverted ? '#ffffff' : '#ff5a00'} />
          </svg>
        </span>

        {showTagline && (
          <span
            className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1.5 ${
              isInverted ? 'text-orange-100' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <span>صيانة المنزل الذكية · الدقهلية</span>
          </span>
        )}
      </span>
    </span>
  );
}
