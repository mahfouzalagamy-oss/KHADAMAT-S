import { AdminDashboardScreen } from '../components/AdminDashboardScreen';
import { useLiveLocations } from '../lib/liveTracking';
import { useRealtimeStatus } from '../lib/realtime';
import { cancelRequest } from '../lib/requestActions';
import { useAppStore } from '../store/useAppStore';

export default function AdminPage() {
  const requests = useAppStore((s) => s.requests);
  const quotes = useAppStore((s) => s.quotes);
  const technicians = useAppStore((s) => s.technicians);
  const liveLocations = useLiveLocations();
  const realtimeStatus = useRealtimeStatus();
  return (
    <AdminDashboardScreen
      requests={requests}
      quotes={quotes}
      technicians={technicians}
      liveLocations={liveLocations}
      realtimeStatus={realtimeStatus}
      onCancelRequest={cancelRequest}
      onExit={() => {
        window.location.href = '/';
      }}
    />
  );
}
