import { useState, useMemo } from 'react';

type SortDirection = 'ascending' | 'descending';

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export const useSortableData = <T extends object>(
  items: T[],
  initialConfig: SortConfig<T> | null = null
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(initialConfig);

  const sortedItems = useMemo(() => {
    if (!items) {
      return [];
    }
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        // Handle date strings
        const isDateA = typeof valA === 'string' && !isNaN(new Date(valA).getTime());
        const isDateB = typeof valB === 'string' && !isNaN(new Date(valB).getTime());

        if (isDateA && isDateB) {
            const dateA = new Date(valA as string).getTime();
            const dateB = new Date(valB as string).getTime();
            return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
        }

        // Handle numbers
        if (typeof valA === 'number' && typeof valB === 'number') {
           return sortConfig.direction === 'ascending'
            ? valA - valB
            : valB - valA;
        }
        
        // Handle strings
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending'
            ? valA.localeCompare(valB, undefined, { numeric: true })
            : valB.localeCompare(valA, undefined, { numeric: true });
        }
        
        // Fallback for other types or nulls
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: SortDirection = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};
