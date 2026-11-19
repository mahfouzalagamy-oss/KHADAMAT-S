import {
  Bell,
  CheckCircle2,
  MessageSquare,
  Navigation,
  Repeat,
  Tag,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { AppNotification } from '../types/khadamat';
import { getNotificationVisualMeta } from '../utils/pushNotifications';

interface NotificationStatusIconProps {
  type: AppNotification['type'];
  size?: 'sm' | 'md' | 'lg';
}

export function NotificationStatusIcon({
  type,
  size = 'md',
}: NotificationStatusIconProps) {
  const meta = getNotificationVisualMeta(type);

  const boxSizeClass =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : size === 'lg'
        ? 'w-11 h-11 rounded-2xl'
        : 'w-10 h-10 rounded-xl';

  const iconSizeClass =
    size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  const renderGlyph = () => {
    switch (type) {
      case 'quote_accepted':
        return <UserCheck className={iconSizeClass} aria-hidden="true" />;
      case 'tech_en_route':
        return <Navigation className={iconSizeClass} aria-hidden="true" />;
      case 'job_in_progress':
        return <Wrench className={iconSizeClass} aria-hidden="true" />;
      case 'job_completed':
        return <CheckCircle2 className={iconSizeClass} aria-hidden="true" />;
      case 'new_quote':
        return <Tag className={iconSizeClass} aria-hidden="true" />;
      case 'recurring_generated':
        return <Repeat className={iconSizeClass} aria-hidden="true" />;
      case 'new_message':
        return <MessageSquare className={iconSizeClass} aria-hidden="true" />;
      case 'new_request':
      default:
        return <Bell className={iconSizeClass} aria-hidden="true" />;
    }
  };

  return (
    <div
      className={`${boxSizeClass} ${meta.iconBgClass} flex items-center justify-center shrink-0 transition-transform`}
    >
      {renderGlyph()}
    </div>
  );
}
