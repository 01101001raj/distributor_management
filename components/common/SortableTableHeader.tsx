import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { SortConfig } from '../../hooks/useSortableData';

interface SortableTableHeaderProps<T> {
  label: string;
  sortKey: keyof T;
  requestSort: (key: keyof T) => void;
  sortConfig: SortConfig<T> | null;
  className?: string;
}

const SortableTableHeader = <T extends object>({
  label,
  sortKey,
  requestSort,
  sortConfig,
  className = '',
}: SortableTableHeaderProps<T>) => {
  const isSorted = sortConfig?.key === sortKey;
  const isAscending = sortConfig?.direction === 'ascending';

  const textAlignmentClass = className.includes('text-right') ? 'justify-end' : className.includes('text-center') ? 'justify-center' : 'justify-start';

  return (
    <th className={`p-3 font-semibold text-text-secondary ${className}`}>
      <button
        type="button"
        onClick={() => requestSort(sortKey)}
        className={`flex items-center gap-2 hover:text-text-primary transition-colors w-full ${textAlignmentClass}`}
      >
        <span>{label}</span>
        <span className="h-4 w-4">
            {isSorted && (isAscending ? <ArrowUp size={16} /> : <ArrowDown size={16} />)}
        </span>
      </button>
    </th>
  );
};

export default SortableTableHeader;