import { useState, useCallback } from 'react';

/**
 * Reusable hook to manage accordion expansion state.
 * Maintains state as a record using a unique string ID.
 */
export function useAccordion(initialState: Record<string, boolean> = {}) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(initialState);

  const toggleItem = useCallback((id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const expandItem = useCallback((id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: true }));
  }, []);

  const collapseItem = useCallback((id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: false }));
  }, []);

  const isExpanded = useCallback(
    (id: string) => !!expandedItems[id],
    [expandedItems]
  );

  return {
    expandedItems,
    toggleItem,
    expandItem,
    collapseItem,
    isExpanded,
  };
}
