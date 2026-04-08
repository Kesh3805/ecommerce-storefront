import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Money } from '@/types';
import { siteConfig } from '@/config';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/**
 * Normalize backend media URLs so Next Image can render relative upload paths.
 */
export function normalizeMediaUrl(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }

  const candidate = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;

  try {
    const parsed = new URL(candidate);
    if (parsed.hostname === 'example.com') {
      return undefined;
    }

    return parsed.toString();
  } catch {
    const normalizedPath = candidate.startsWith('/') ? candidate : `/${candidate}`;

    try {
      const baseUrl = siteConfig.api.baseUrl.replace(/\/+$/, '');
      const resolved = new URL(normalizedPath, `${baseUrl}/`);
      if (resolved.hostname === 'example.com') {
        return undefined;
      }

      return resolved.toString();
    } catch {
      return undefined;
    }
  }
}

export function canRenderMediaUrl(url?: string | null): boolean {
  return Boolean(normalizeMediaUrl(url));
}

export function shouldUseUnoptimizedImage(url?: string | null): boolean {
  const normalized = normalizeMediaUrl(url);
  if (!normalized) {
    return false;
  }

  try {
    return new URL(normalized).hostname.endsWith('gstatic.com');
  } catch {
    return false;
  }
}

/**
 * Format money value with currency
 */
export function formatMoney(money: Money | undefined | null): string {
  if (!money) return '';
  
  const amount = parseFloat(money.amount);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format price range for display
 */
export function formatPriceRange(min: Money, max: Money): string {
  const minFormatted = formatMoney(min);
  const maxFormatted = formatMoney(max);
  
  if (min.amount === max.amount) {
    return minFormatted;
  }
  
  return `${minFormatted} - ${maxFormatted}`;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(price: Money, compareAtPrice: Money): number {
  const priceAmount = parseFloat(price.amount);
  const compareAmount = parseFloat(compareAtPrice.amount);
  
  if (compareAmount <= 0 || priceAmount >= compareAmount) return 0;
  
  return Math.round(((compareAmount - priceAmount) / compareAmount) * 100);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate product URL
 */
export function getProductUrl(handle: string): string {
  return `/products/${handle}`;
}

/**
 * Generate collection URL
 */
export function getCollectionUrl(handle: string): string {
  return `/collections/${handle}`;
}

/**
 * Slugify text for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Check if product is on sale
 */
export function isOnSale(price: Money, compareAtPrice?: Money): boolean {
  if (!compareAtPrice) return false;
  return parseFloat(compareAtPrice.amount) > parseFloat(price.amount);
}

/**
 * Get variant option value by name
 */
export function getOptionValue(
  options: { name: string; value: string }[],
  optionName: string
): string | undefined {
  return options.find((opt) => opt.name.toLowerCase() === optionName.toLowerCase())?.value;
}

/**
 * Parse query string to object
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  
  return searchParams.toString();
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Get initials from name
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0).toUpperCase() || '';
  const last = lastName?.charAt(0).toUpperCase() || '';
  return first + last || '?';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(items: { price: number; quantity: number }[]): {
  subtotal: number;
  itemCount: number;
} {
  return items.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.price * item.quantity,
      itemCount: acc.itemCount + item.quantity,
    }),
    { subtotal: 0, itemCount: 0 }
  );
}

