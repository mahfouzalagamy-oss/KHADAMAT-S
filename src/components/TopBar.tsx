import { ChevronDown, LogOut, MapPin } from 'lucide-react';
import { CustomerTab, TechnicianTab, UserRole } from '../types/khadamat';
import { BrandWordmark } from './BrandWordmark';

interface TopBarProps {
  role: UserRole;
  activeCustomerTab: CustomerTab;
  activeTechTab: TechnicianTab;
  onSelectCustomerTab: (tab: CustomerTab) => void;
  onSelectTechTab: (tab: TechnicianTab) => void;
  onPrimaryAction: () => void;
  onSwitchAccount: () => void;
  district: string;
  technicianDisplayName?: string;
  onOpenLocation: () => void;
  unreadNotificationsCount: number;
  openCustomerRequestsCount: number;
  acceptedTechJobsCount: number;
}

export function TopBar({
  role,
  activeCustomerTab,
  activeTechTab,
  onSelectCustomerTab,
  onSelectTechTab,
  onPrimaryAction,
  onSwitchAccount,
  district,
  technicianDisplayName,
  onOpenLocation,
  unreadNotificationsCount,
  openCustomerRequestsCount,
  acceptedTechJobsCount,
}: TopBarProps) {
  const customerNav: { id: CustomerTab; label: string }[] = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'categories', label: 'الأقسام' },
    {
      id: 'requests',
      label:
        openCustomerRequestsCount > 0
          ? `طلباتي والعروض (${openCustomerRequestsCount})`
          : 'طلباتي والعروض',
    },
    {
      id: 'notifications',
      label:
        unreadNotificationsCount > 0
          ? `التنبيهات (${unreadNotificationsCount})`
          : 'التنبيهات',
    },
    { id: 'profile', label: 'حسابي' },
  ];

  const techNav: { id: TechnicianTab; label: string }[] = [
    { id: 'open_requests', label: 'الطلبات الجديدة' },
    {
      id: 'accepted_jobs',
      label:
        acceptedTechJobsCount > 0
          ? `طلبات مقبولة (${acceptedTechJobsCount})`
          : 'طلبات مقبولة',
    },
    { id: 'tech_stats', label: 'الإحصائيات' },
    {
      id: 'notifications',
      label:
        unreadNotificationsCount > 0
          ? `التنبيهات (${unreadNotificationsCount})`
          : 'التنبيهات',
    },
    { id: 'tech_profile', label: 'حسابي' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Desktop 3-Zone Top Bar */}
      <div className="hidden md:flex items-center justify-between gap-8 max-w-7xl mx-auto px-6 h-16">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() =>
            role === 'customer'
              ? onSelectCustomerTab('home')
              : onSelectTechTab('open_requests')
          }
          className="whitespace-nowrap shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
          aria-label="خدمات"
        >
          <BrandWordmark size="md" />
        </button>

        {/* Zone 2: Single-line Nav Links */}
        <nav className="flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300" aria-label="التنقل الرئيسي">
          {role === 'customer'
            ? customerNav.map((item) => {
                const isActive = activeCustomerTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectCustomerTab(item.id)}
                    className={`relative py-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      isActive
                        ? 'text-orange-700 dark:text-orange-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-[#FF5A00] dark:bg-orange-400"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })
            : techNav.map((item) => {
                const isActive = activeTechTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTechTab(item.id)}
                    className={`relative py-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      isActive
                        ? 'text-orange-700 dark:text-orange-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-[#FF5A00] dark:bg-orange-400"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#FF5A00] dark:bg-orange-600 rounded-xl hover:bg-orange-700 dark:hover:bg-orange-500 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-orange-600/15"
          >
            {role === 'customer' ? 'اطلب خدمة' : 'تبديل الحساب'}
          </button>
        </div>
      </div>

      {/* Mobile Compact Top Bar (< md, 52px height) */}
      <div className="flex md:hidden items-center justify-between gap-3 px-4 h-[52px]">
        <button
          type="button"
          onClick={() =>
            role === 'customer'
              ? onSelectCustomerTab('home')
              : onSelectTechTab('open_requests')
          }
          className="whitespace-nowrap shrink-0"
          aria-label="خدمات"
        >
          <BrandWordmark size="sm" />
        </button>

        {role === 'customer' ? (
          <button
            type="button"
            onClick={onOpenLocation}
            className="flex items-center gap-1.5 min-h-[40px] px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-[220px] hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-[#FF5A00] dark:text-orange-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{district}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSwitchAccount}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-[220px]"
          >
            <span className="truncate">{technicianDisplayName || 'بوابة الفني'}</span>
            <LogOut className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          </button>
        )}
      </div>
    </header>
  );
}
