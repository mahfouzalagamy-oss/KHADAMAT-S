import {
  BarChart3,
  Bell,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Home,
  LayoutGrid,
  User,
} from 'lucide-react';
import { CustomerTab, TechnicianTab, UserRole } from '../types/khadamat';

interface BottomNavProps {
  role: UserRole;
  activeCustomerTab: CustomerTab;
  activeTechTab: TechnicianTab;
  onSelectCustomerTab: (tab: CustomerTab) => void;
  onSelectTechTab: (tab: TechnicianTab) => void;
  unreadNotificationsCount: number;
  openCustomerRequestsCount: number;
  acceptedTechJobsCount: number;
}

export function BottomNav({
  role,
  activeCustomerTab,
  activeTechTab,
  onSelectCustomerTab,
  onSelectTechTab,
  unreadNotificationsCount,
  openCustomerRequestsCount,
  acceptedTechJobsCount,
}: BottomNavProps) {
  const customerItems: {
    id: CustomerTab;
    label: string;
    icon: typeof Home;
    badge?: number;
  }[] = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'categories', label: 'الخدمات', icon: LayoutGrid },
    {
      id: 'requests',
      label: 'طلباتي',
      icon: ClipboardList,
      badge: openCustomerRequestsCount > 0 ? openCustomerRequestsCount : undefined,
    },
    {
      id: 'notifications',
      label: 'التنبيهات',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    { id: 'profile', label: 'حسابي', icon: User },
  ];

  const techItems: {
    id: TechnicianTab;
    label: string;
    icon: typeof Home;
    badge?: number;
  }[] = [
    { id: 'open_requests', label: 'الطلبات', icon: Briefcase },
    {
      id: 'accepted_jobs',
      label: 'المقبولة',
      icon: CheckCircle2,
      badge: acceptedTechJobsCount > 0 ? acceptedTechJobsCount : undefined,
    },
    { id: 'tech_stats', label: 'الإحصائيات', icon: BarChart3 },
    {
      id: 'notifications',
      label: 'التنبيهات',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    { id: 'tech_profile', label: 'حسابي', icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors"
      aria-label="التنقل السفلي"
    >
      <div className="grid grid-cols-5 items-center h-[60px] px-1">
        {role === 'customer'
          ? customerItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeCustomerTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectCustomerTab(item.id)}
                  className={`relative flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl transition-colors ${
                    isActive
                      ? 'text-[#FF5A00] dark:text-orange-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-[21px] h-[21px]" strokeWidth={isActive ? 2.3 : 1.8} />
                    {item.badge !== undefined && (
                      <span className="absolute -top-1.5 -left-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FF5A00] dark:bg-orange-500 text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] leading-tight mt-0.5 whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            })
          : techItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTechTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTechTab(item.id)}
                  className={`relative flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl transition-colors ${
                    isActive
                      ? 'text-[#FF5A00] dark:text-orange-400 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-[21px] h-[21px]" strokeWidth={isActive ? 2.3 : 1.8} />
                    {item.badge !== undefined && (
                      <span className="absolute -top-1.5 -left-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FF5A00] dark:bg-orange-500 text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] leading-tight mt-0.5 whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            })}
      </div>
    </nav>
  );
}
