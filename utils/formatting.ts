/**
 * Formats a number into the Indian currency format (₹1,00,000).
 * @param num The number to format.
 * @param options Intl.NumberFormatOptions to override defaults.
 * @returns The formatted currency string.
 */
export const formatIndianCurrency = (num: number | null | undefined, options?: Intl.NumberFormatOptions): string => {
  if (num === null || num === undefined) {
    // Default to ₹0 but allow overriding for cases like invoice where fractions are needed
    return (0).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: options?.minimumFractionDigits ?? 0,
        maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    });
  }
  
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  };

  return num.toLocaleString('en-IN', { ...defaultOptions, ...options });
};

/**
 * Formats a number into the Indian numbering system (1,00,000).
 * @param num The number to format.
 * @returns The formatted number string.
 */
export const formatIndianNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) {
        return '0';
    }
    return num.toLocaleString('en-IN');
};

/**
 * Formats a large number into a compact Indian notation (e.g., ₹1.5L, ₹2.3Cr).
 * @param num The number to format.
 * @returns The compact string representation with Rupee symbol.
 */
export const formatIndianCurrencyShort = (num: number): string => {
    if (num >= 10000000) {
        return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
        return `₹${(num / 100000).toFixed(2)} L`;
    }
    if (num >= 1000) {
        return `₹${(num / 1000).toFixed(1)} k`;
    }
    return `₹${num}`;
};
