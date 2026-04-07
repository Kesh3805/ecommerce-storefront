import { redirect } from 'next/navigation';
import { normalizeCountryCode } from '@/lib/countries';

export const revalidate = 300;

export default async function RootPage({
  searchParams,
}: {
  searchParams?: Promise<{ country?: string }>;
}) {
  const query = searchParams ? await searchParams : undefined;
  const country = normalizeCountryCode(query?.country);
  const suffix = country ? `?country=${country}` : '';
  redirect(`/stores/alice-s-apparel${suffix}`);
}
