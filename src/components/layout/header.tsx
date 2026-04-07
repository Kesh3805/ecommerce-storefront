'use client';

import Link from 'next/link';
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCartItemCount, useCartActions } from '@/stores/cart.store';
import { siteConfig } from '@/config';
import { COUNTRY_OPTIONS, normalizeCountryCode } from '@/lib/countries';
import { storefrontService } from '@/services/storefront.service';

const navigation = [
  { name: 'New Arrivals', href: '/collections/new-arrivals' },
  { name: 'Best Sellers', href: '/collections/best-sellers' },
  { name: 'Sale', href: '/collections/sale' },
  { name: 'All Products', href: '/collections/all' },
];

export function Header() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [inferredStoreId, setInferredStoreId] = useState<number | null>(null);
  const [storedStoreId, setStoredStoreId] = useState<number | null>(null);
  const cartItemCount = useCartItemCount();
  const { openCart } = useCartActions();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStoreIdFromQuery = searchParams.get('storeId');
  const activeStoreSlugFromQuery = searchParams.get('storeSlug');
  const activeCountry = normalizeCountryCode(searchParams.get('country')) || COUNTRY_OPTIONS[0]?.code || 'US';

  const activeStoreSlug = useMemo(() => {
    const match = pathname.match(/^\/stores\/([^/]+)/);
    return match?.[1] || null;
  }, [pathname]);

  useEffect(() => {
    if (!activeStoreSlug) {
      return;
    }

    let cancelled = false;

    const slugifyStoreName = (name: string): string =>
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const loadStoreId = async () => {
      try {
        const stores = await storefrontService.getPublicStores(30, 1);
        const match = stores.find((store) => slugifyStoreName(store.name) === activeStoreSlug);
        if (!cancelled) {
          const resolved = match?.store_id ?? null;
          setInferredStoreId(resolved);
          if (resolved) {
            window.localStorage.setItem('activeStoreId', String(resolved));
          }
        }
      } catch {
        if (!cancelled) {
          setInferredStoreId(null);
        }
      }
    };

    loadStoreId();

    return () => {
      cancelled = true;
    };
  }, [activeStoreSlug]);

  useEffect(() => {
    if (activeStoreIdFromQuery) {
      const parsed = Number(activeStoreIdFromQuery);
      if (Number.isInteger(parsed) && parsed > 0) {
        setStoredStoreId(parsed);
        window.localStorage.setItem('activeStoreId', String(parsed));
      }
      return;
    }

    const fromStorage = window.localStorage.getItem('activeStoreId');
    if (!fromStorage) {
      return;
    }

    const parsed = Number(fromStorage);
    if (Number.isInteger(parsed) && parsed > 0) {
      setStoredStoreId(parsed);
    }
  }, [activeStoreIdFromQuery]);

  const activeStoreId = activeStoreIdFromQuery
    || (activeStoreSlug ? (inferredStoreId ? String(inferredStoreId) : null) : null)
    || (storedStoreId ? String(storedStoreId) : null);

  const effectiveStoreSlug = activeStoreSlug || activeStoreSlugFromQuery;

  const appendCountryParam = (href: string): string => {
    if (!href.startsWith('/')) {
      return href;
    }

    const [path, query = ''] = href.split('?');
    const params = new URLSearchParams(query);
    if (activeCountry) {
      params.set('country', activeCountry);
    } else {
      params.delete('country');
    }

    const nextQuery = params.toString();
    return nextQuery ? `${path}?${nextQuery}` : path;
  };

  const handleCountryChange = (country: string) => {
    const normalized = normalizeCountryCode(country);
    const params = new URLSearchParams(searchParams.toString());

    if (normalized) {
      params.set('country', normalized);
    } else {
      params.delete('country');
    }

    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const getNavHref = (href: string): string => {
    if (!href.startsWith('/collections/')) {
      return appendCountryParam(href);
    }

    if (effectiveStoreSlug) {
      const collectionHandle = href.replace('/collections/', '');
      return appendCountryParam(`/stores/${encodeURIComponent(effectiveStoreSlug)}/collections/${collectionHandle}`);
    }

    if (!activeStoreId) {
      return appendCountryParam(href);
    }

    return appendCountryParam(`${href}?storeId=${encodeURIComponent(activeStoreId)}`);
  };

  const homeHref = effectiveStoreSlug
    ? appendCountryParam(`/stores/${encodeURIComponent(effectiveStoreSlug)}`)
    : appendCountryParam('/');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Mobile Menu Button */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-75 sm:w-100">
            <nav className="flex flex-col gap-4 mt-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={getNavHref(item.href)}
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href={homeHref} className="flex items-center space-x-2 mr-6">
          <span className="font-bold text-xl">{siteConfig.name}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={getNavHref(item.href)}
              className="transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="hidden lg:block min-w-47.5">
            <Select value={activeCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="hidden sm:flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center">
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-50 lg:w-75"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
            )}
          </div>

          {/* Mobile Search */}
          <Button variant="ghost" size="icon" className="sm:hidden">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Account */}
          <Link href={appendCountryParam('/account')}>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">Account</span>
            </Button>
          </Link>

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => openCart()}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[11px] font-medium text-primary-foreground flex items-center justify-center">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
            <span className="sr-only">Cart</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
