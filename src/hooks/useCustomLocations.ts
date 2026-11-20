import { useCallback } from 'react';
import { LocationEntry } from '../types/khadamat';

/**
 * Hook that manages custom location entries.
 */
export function useCustomLocations({
  customLocations,
  setCustomLocations,
}: {
  customLocations: LocationEntry[];
  setCustomLocations: (val: React.SetStateAction<LocationEntry[]>) => void;
}) {
  /**
   * Create a new custom location entry.
   */
  const handleCreateCustomLocation = useCallback(
    (center: string, name: string): LocationEntry | null => {
      const entry: LocationEntry = {
        id: `loc-${Date.now()}`,
        governorate: 'الدقهلية',
        center,
        name,
        displayLabel: `${name} - ${center}`,
        lat: 0,
        lng: 0,
        isVillage: false,
        isCustom: true,
      };

      setCustomLocations((prev) => {
        if (prev.some((l) => l.displayLabel === entry.displayLabel)) return prev;
        return [entry, ...prev];
      });

      return entry;
    },
    [setCustomLocations]
  );

  return {
    customLocations,
    setCustomLocations,
    handleCreateCustomLocation,
  };
}
