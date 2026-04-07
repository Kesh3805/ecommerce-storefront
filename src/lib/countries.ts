export interface CountryOption {
  code: string;
  name: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
];

const COUNTRY_CODES = new Set(COUNTRY_OPTIONS.map((country) => country.code));

export function normalizeCountryCode(value?: string | null): string | undefined {
  const normalized = (value ?? '').trim().toUpperCase();
  if (!normalized || !COUNTRY_CODES.has(normalized)) {
    return undefined;
  }

  return normalized;
}
