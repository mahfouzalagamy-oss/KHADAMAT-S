import { useCallback } from 'react';
import { Technician } from '../types/khadamat';

/**
 * Hook that manages technician data:
 * update stats, toggle verification, etc.
 */
export function useTechnicians({
  technicians,
  setTechnicians,
}: {
  technicians: Technician[];
  setTechnicians: (val: React.SetStateAction<Technician[]>) => void;
}) {
  /**
   * Update a single technician's stats (rating, reviews count, completed jobs).
   */
  const updateTechnicianStats = useCallback(
    (technicianId: string, updates: Partial<Technician>) => {
      setTechnicians((prev) => prev.map((t) => (t.id === technicianId ? { ...t, ...updates } : t)));
    },
    [setTechnicians]
  );

  /**
   * Increment completed jobs for a technician.
   */
  const incrementCompletedJobs = useCallback(
    (technicianId: string) => {
      setTechnicians((prev) =>
        prev.map((t) => (t.id === technicianId ? { ...t, completedJobs: t.completedJobs + 1 } : t))
      );
    },
    [setTechnicians]
  );

  return {
    technicians,
    setTechnicians,
    updateTechnicianStats,
    incrementCompletedJobs,
  };
}
