/**
 * Hero Banner Component
 * Displays hero banners with images, text, and call-to-action
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeroBanner as HeroBannerType } from '@/services/merchandising.service';

interface HeroBannerProps {
  banners: HeroBannerType[];
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!banners || banners.length === 0) {
    return null;
  }

  const banner = banners[currentIndex];

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setImageError(false);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setImageError(false);
  };

  const textPositionClass = {
    TOP_LEFT: 'items-start justify-start',
    TOP_CENTER: 'items-start justify-center',
    TOP_RIGHT: 'items-start justify-end',
    CENTER_LEFT: 'items-center justify-start',
    CENTER_CENTER: 'items-center justify-center',
    CENTER_RIGHT: 'items-center justify-end',
    BOTTOM_LEFT: 'items-end justify-start',
    BOTTOM_CENTER: 'items-end justify-center',
    BOTTOM_RIGHT: 'items-end justify-end',
  }[banner.text_position] || 'items-center justify-center';

  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {/* Background Image or Video */}
      {banner.video_url ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={banner.video_url} type="video/mp4" />
        </video>
      ) : (
        <>
          {/* Desktop Image */}
          <div className="hidden md:block absolute inset-0">
            {!imageError ? (
              <Image
                src={banner.desktop_image_url}
                alt={banner.title || 'Hero banner'}
                fill
                priority
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600" />
            )}
          </div>

          {/* Mobile Image */}
          <div className="md:hidden absolute inset-0">
            {!imageError && banner.mobile_image_url ? (
              <Image
                src={banner.mobile_image_url}
                alt={banner.title || 'Hero banner'}
                fill
                priority
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Image
                src={banner.desktop_image_url}
                alt={banner.title || 'Hero banner'}
                fill
                priority
                className="object-cover"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </>
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: banner.overlay_opacity }}
      />

      {/* Content */}
      <div className={`relative h-full flex ${textPositionClass} p-8 md:p-16`}>
        <div className="max-w-2xl text-center" style={{ color: banner.text_color }}>
          {banner.title && (
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
              {banner.title}
            </h1>
          )}
          {banner.subtitle && (
            <p className="text-lg md:text-2xl mb-8 drop-shadow-md">
              {banner.subtitle}
            </p>
          )}
          {banner.cta_text && banner.cta_link && (
            <Link
              href={banner.cta_link}
              className="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              {banner.cta_text}
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Arrows (if multiple banners) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevBanner}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
            aria-label="Previous banner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextBanner}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
            aria-label="Next banner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setImageError(false);
                }}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
