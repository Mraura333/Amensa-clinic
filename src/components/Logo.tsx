/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
// @ts-ignore
import headerLogo from '../assets/images/regenerated_image_1782818531816.png';
// @ts-ignore
import footerLogo from '../assets/images/regenerated_image_1782818533411.png';

interface LogoProps {
  className?: string;
  light?: boolean;
  text?: string;
  vertical?: boolean;
  variant?: 'navbar' | 'footer' | 'vertical';
}

export default function Logo({ 
  className = '', 
  light = false, 
  text, 
  vertical = false,
  variant = 'navbar'
}: LogoProps) {
  const [imgError, setImgError] = useState(false);

  // Determine configuration based on variant and fallback prop
  const isFooter = variant === 'footer';
  const isVertical = variant === 'vertical' || vertical;

  // Responsive styling tailored to strict branding requirements:
  // - Desktop: Height: 75–90px (we use lg:h-[80px])
  // - Tablet: Height: 65–75px (we use md:h-[70px])
  // - Mobile: Height: 50–60px (we use h-[55px])
  // - Width is auto-scaled to preserve original proportions
  const imageClass = isFooter
    ? 'h-[55px] md:h-[70px] lg:h-[80px] w-auto object-contain transition-all duration-300'
    : 'w-full h-full object-contain transition-all duration-300';

  const wrapperClass = isFooter
    ? ""
    : "w-[148px] h-[124px] sm:w-[156px] sm:h-[130px] md:w-[166px] md:h-[138px] lg:w-[176px] lg:h-[146px] transition-all duration-300 flex items-center justify-center";

  // Fallback representation if logo.png is not present in the local preview
  if (imgError) {
    const logoText = text || 'amensa';
    return (
      <div 
        id={isVertical ? 'amensa-logo-vertical' : 'amensa-logo'}
        className={`flex ${isVertical ? 'flex-col items-center text-center' : 'items-center'} gap-3.5 select-none ${className}`}
      >
        {/* High-fidelity Fallback SVG Wave */}
        <svg
          width={isVertical ? '110' : '64'}
          height={isVertical ? '82' : '48'}
          viewBox={isVertical ? '0 0 120 70' : '0 0 120 60'}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-[0_2px_4px_rgba(0,102,204,0.06)]"
        >
          <path d="M 34 34 C 48 24, 68 12, 94 12 C 82 22, 60 30, 34 34 Z" fill={light ? 'white' : '#1565C0'} />
          <path d="M 26 40 C 42 30, 66 21, 98 21 C 84 29, 56 36, 26 40 Z" fill="#76C139" />
          <path d="M 18 46 C 36 36, 64 30, 101 30 C 84 38, 52 42, 18 46 Z" fill="#FBC02D" />
          <path d="M 10 52 C 30 43, 60 39, 94 42 C 76 47, 44 49, 10 52 Z" fill="#DE3232" />
        </svg>

        {/* Fallback Text Brand Block */}
        <div className="flex flex-col leading-none text-left">
          <div className="flex items-center justify-start gap-0.5">
            <span 
              className={`font-extrabold text-3xl md:text-4xl tracking-tight transition-colors duration-300 ${
                light ? 'text-white' : 'text-[#1565C0]'
              }`}
              style={{ fontFamily: "'Lora', 'Georgia', serif" }}
            >
              {logoText}
            </span>
            <span className={`text-[10px] font-bold mt-1 ${light ? 'text-white' : 'text-[#1565C0]'}`}>®</span>
          </div>
          <span 
            className={`text-[11px] font-bold tracking-[0.28em] mt-2 uppercase transition-colors duration-300 ${
              light ? 'text-slate-300' : 'text-[#7E8B9B]'
            }`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Diagnostics
          </span>
        </div>
      </div>
    );
  }

  // Official logo image element preserving colors, typography, design, and proportions 100% identically
  return (
    <div 
      id={isVertical ? 'amensa-logo-vertical' : 'amensa-logo'}
      className={`flex items-center justify-center select-none py-1.5 ${className}`}
    >
      <div className={light ? "bg-white px-4 py-2.5 rounded-2xl inline-flex items-center justify-center shadow-sm border border-slate-100" : wrapperClass}>
        <img
          src={isFooter ? footerLogo : headerLogo}
          alt="Amensa Diagnostics Logo"
          className={imageClass}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          loading="eager" // Ensure instant load with no lazy compression
        />
      </div>
    </div>
  );
}
