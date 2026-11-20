import { useCallback } from 'react';
import { SavedAddress } from '../types/khadamat';

/**
 * Hook that manages saved addresses:
 * add, delete, set default.
 */
export function useAddresses({
  addresses,
  setAddresses,
}: {
  addresses: SavedAddress[];
  setAddresses: (val: React.SetStateAction<SavedAddress[]>) => void;
}) {
  /**
   * Add a new address.
   */
  const handleAddAddress = useCallback(
    (address: SavedAddress) => {
      setAddresses((prev) => {
        if (address.isDefault) {
          return [...prev.map((a) => ({ ...a, isDefault: false })), address];
        }
        return [...prev, address];
      });
    },
    [setAddresses]
  );

  /**
   * Delete an address by id.
   */
  const handleDeleteAddress = useCallback(
    (addressId: string) => {
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
    },
    [setAddresses]
  );

  /**
   * Set an address as default (unset others).
   */
  const handleSetDefaultAddress = useCallback(
    (addressId: string) => {
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === addressId,
        }))
      );
    },
    [setAddresses]
  );

  return {
    addresses,
    setAddresses,
    handleAddAddress,
    handleDeleteAddress,
    handleSetDefaultAddress,
  };
}
