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

const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    let result = '';
    if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' hundred';
        n %= 100;
        if (n > 0) result += ' ';
    }
    if (n >= 20) {
        result += tens[Math.floor(n / 10)];
        n %= 10;
         if (n > 0) result += ' ';
    }
    if (n >= 10) {
        return result + teens[n - 10];
    }
    if (n > 0) {
        result += ones[n];
    }
    return result.trim();
}

/**
 * Converts a number into its word representation in Indian numbering system for currency.
 * @param num The number to convert.
 * @returns The word representation (e.g., 'One lakh twenty thousand Rupees Only').
 */
export const numberToWordsInRupees = (num: number): string => {
    if (num === 0) return 'Zero Rupees Only';

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const rest = Math.floor(num % 1000);

    let res = '';
    if (crore > 0) res += convertLessThanThousand(crore) + ' crore ';
    if (lakh > 0) res += convertLessThanThousand(lakh) + ' lakh ';
    if (thousand > 0) res += convertLessThanThousand(thousand) + ' thousand ';
    if (rest > 0) res += convertLessThanThousand(rest);
    
    const finalString = res.trim().replace(/\s+/g, ' ') + ' Rupees Only';
    return finalString.charAt(0).toUpperCase() + finalString.slice(1);
};