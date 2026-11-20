import { useState } from 'react';
import { CustomerTab } from '../types/khadamat';

/**
 * Hook that manages the customer tab navigation state.
 *
 * Tabs: home | categories | requests | notifications | profile
 *
 * Initial state from localStorage/user profile persists across sessions.
 */
export function useCustomerTab(
  initialTab?: CustomerTab
): [CustomerTab, (tab: CustomerTab) => void] {
  const [tab, setTab] = useState<CustomerTab>(initialTab || 'home');

  const switchTab = (newTab: CustomerTab) => {
    setTab(newTab);
  };

  return [tab, switchTab];
}
