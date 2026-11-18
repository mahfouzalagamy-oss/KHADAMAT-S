import {
  Bug,
  Camera,
  Car,
  Droplets,
  Hammer,
  Layers,
  MonitorSmartphone,
  Paintbrush,
  Refrigerator,
  Sparkles,
  Trees,
  Truck,
  Wifi,
  Wind,
  Zap,
} from 'lucide-react';
import { ServiceCategory } from '../types/khadamat';

interface CategoryIconProps {
  iconKey: ServiceCategory['iconKey'];
  className?: string;
}

export function CategoryIcon({ iconKey, className = 'w-5 h-5' }: CategoryIconProps) {
  switch (iconKey) {
    case 'ac':
      return <Wind className={className} aria-hidden="true" />;
    case 'plumbing':
      return <Droplets className={className} aria-hidden="true" />;
    case 'electrical':
      return <Zap className={className} aria-hidden="true" />;
    case 'cleaning':
      return <Sparkles className={className} aria-hidden="true" />;
    case 'carpentry':
      return <Hammer className={className} aria-hidden="true" />;
    case 'painting':
      return <Paintbrush className={className} aria-hidden="true" />;
    case 'appliances':
      return <Refrigerator className={className} aria-hidden="true" />;
    case 'electronics':
      return <MonitorSmartphone className={className} aria-hidden="true" />;
    case 'networks':
      return <Wifi className={className} aria-hidden="true" />;
    case 'carwash':
      return <Car className={className} aria-hidden="true" />;
    case 'pest_control':
      return <Bug className={className} aria-hidden="true" />;
    case 'security_tech':
      return <Camera className={className} aria-hidden="true" />;
    case 'moving':
      return <Truck className={className} aria-hidden="true" />;
    case 'tanks_garden':
      return <Trees className={className} aria-hidden="true" />;
    case 'aluminum_gypsum':
      return <Layers className={className} aria-hidden="true" />;
    default:
      return <Hammer className={className} aria-hidden="true" />;
  }
}
