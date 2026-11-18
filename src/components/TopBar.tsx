import { Bell, ChevronDown, LogOut, MapPin } from 'lucide-react';
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
  const customerNav: { id: CustomerTab; label: string; count?: number }[] = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'categories', label: 'الخدمات' },
    { id: 'requests', label: 'طلباتي', count: openCustomerRequestsCount },
    { id: 'notifications', label: 'التنبيهات', count: unreadNotificationsCount },
    { id: 'profile', label: 'حسابي' },
  ];

  const techNav: { id: TechnicianTab; label: string; count?: number }[] = [
    { id: 'open_requests', label: 'الطلبات' },
    { id: 'accepted_jobs', label: 'المقبولة', count: acceptedTechJobsCount },
    { id: 'tech_stats', label: 'إحصائيات' },
    { id: 'notifications', label: 'التنبيهات', count: unreadNotificationsCount },
    { id: 'tech_profile', label: 'حسابي' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Desktop Compact Bar */}
      <div className="hidden md:flex items-center justify-between gap-4 max-w-3xl mx-auto px-4 h-14">
        <button
          type="button"
          onClick={() =>
            role === 'customer'
              ? onSelectCustomerTab('home')
              : onSelectTechTab('open_requests')
          }
          className="shrink-0 cursor-pointer"
          aria-label="خدمات"
        >
          <BrandWordmark size="sm" />
        </button>

        <nav className="flex items-center gap-5 text-xs font-medium text-slate-600 dark:text-slate-300" aria-label="التنقل الرئيسي">
          {(role === 'customer' ? customerNav : techNav).map((item) => {
            const isActive =
              role === 'customer'
                ? activeCustomerTab === item.id
                : activeTechTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  role === 'customer'
                    ? onSelectCustomerTab(item.id as CustomerTab)
                    : onSelectTechTab(item.id as TechnicianTab)
                }
                className={`relative py-2 inline-flex items-center gap-1 whitespace-nowrap cursor-pointer transition-colors ${
                  isActive
                    ? 'text-[#FF5A00] dark:text-orange-400 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF5A00] text-white text-[10px] font-bold inline-flex items-center justify-center tabular-nums">
                    {item.count}
                  </span>
                )}
                {isActive && (
                  <span
                    className="absolute inset-x-0 -bottom-[11px] h-0.5 bg-[#FF5A00] dark:bg-orange-400"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onPrimaryAction}
          className="px-3.5 py-2 text-xs font-bold text-white bg-[#FF5A00] dark:bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {role === 'customer' ? 'اطلب خدمة' : 'تبديل'}
        </button>
      </div>

      {/* Mobile Compact Bar */}
      <div className="flex md:hidden items-center justify-between gap-2 px-3 h-[48px]">
        <button
          type="button"
          onClick={() =>
            role === 'customer'
              ? onSelectCustomerTab('home')
              : onSelectTechTab('open_requests')
          }
          className="shrink-0"
          aria-label="خدمات"
        >
          <BrandWordmark size="sm" />
        </button>

        <div className="flex items-center gap-1.5 min-w-0">
          {role === 'customer' ? (
            <button
              type="button"
              onClick={onOpenLocation}
              className="flex items-center gap-1 h-8 px-2 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-[175px]"
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF5A00] shrink-0" />
              <span className="truncate">{district.replace('الدقهلية - ', '')}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSwitchAccount}
              className="inline-flex items-center gap-1 h-8 px-2.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-[170px]"
            >
              <span className="truncate">{technicianDisplayName || 'الفني'}</span>
              <LogOut className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              role === 'customer'
                ? onSelectCustomerTab('notifications')
                : onSelectTechTab('notifications')
            }
            aria-label="التنبيهات"
            className="relative w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
