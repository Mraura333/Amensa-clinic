/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Award, ShieldCheck, CheckCircle2, Clock, MapPin, Sparkles, ChevronRight } from 'lucide-react';

interface HeroProps {
  onBookClick: () => void;
}

export default function Hero({ onBookClick }: HeroProps) {
  // Floating statistics cards data
  const floatingCards = [
    {
      id: 'fc-nabl',
      icon: <Award className="w-5 h-5 text-[#0066CC]" />,
      title: 'NABL Standards',
      desc: 'Followed strictly',
      delay: 0.2,
      style: 'top-10 -left-6 md:-left-12',
      animation: 'animate-float'
    },
    {
      id: 'fc-reports',
      icon: <Clock className="w-5 h-5 text-emerald-500" />,
      title: '24 Hour Reports',
      desc: 'Digital Delivery',
      delay: 0.4,
      style: 'top-1/2 -right-4 md:-right-8',
      animation: 'animate-float'
    },
    {
      id: 'fc-home',
      icon: <MapPin className="w-5 h-5 text-amber-500" />,
      title: 'Home Collection',
      desc: 'Free in 60 Mins',
      delay: 0.6,
      style: 'bottom-8 -left-2 md:-left-6',
      animation: 'animate-float [animation-delay:2s]'
    },
    {
      id: 'fc-accuracy',
      icon: <CheckCircle2 className="w-5 h-5 text-teal-500" />,
      title: '100% Accurate',
      desc: 'Double-Blind Audited',
      delay: 0.8,
      style: 'bottom-32 right-6 md:right-16',
      animation: 'animate-float [animation-delay:4s]'
    }
  ];

  return (
    <section
      id="home"
      className="relative min-h-screen pt-32 pb-20 flex items-center bg-[#F8FBFF] overflow-hidden"
    >
      {/* Abstract medical geometric background patterns */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        {/* Soft blue gradient circles */}
        <div className="absolute top-1/4 left-1/3 w-[500px] height-[500px] rounded-full bg-blue-100 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] height-[600px] rounded-full bg-emerald-50 blur-[140px]" />
        
        {/* Decorative Grid SVG */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2EBF5" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Abstract molecular chains */}
        <svg className="absolute right-12 top-24 w-64 h-64 text-slate-200/50" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="20" cy="20" r="4" />
          <circle cx="50" cy="35" r="3" />
          <circle cx="80" cy="15" r="5" />
          <circle cx="40" cy="70" r="4.5" />
          <circle cx="70" cy="80" r="3.5" />
          <line x1="20" y1="20" x2="50" y2="35" stroke="currentColor" strokeWidth="0.5" />
          <line x1="50" y1="35" x2="80" y2="15" stroke="currentColor" strokeWidth="0.5" />
          <line x1="50" y1="35" x2="40" y2="70" stroke="currentColor" strokeWidth="0.5" />
          <line x1="40" y1="70" x2="70" y2="80" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Side: Copy and CTAs */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Accreditation Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#EAF7FF] border border-blue-200 rounded-full w-fit mb-6 shadow-sm"
              id="hero-certification-badge"
            >
              <Award className="w-5 h-5 text-[#0066CC]" />
              <span className="text-xs font-bold text-[#0066CC] uppercase tracking-wider">
                We Follow NABL Standards & Protocols
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6"
              id="hero-title"
            >
              Accurate <span className="text-[#0066CC]">Diagnostics.</span> <br />
              Trusted <span className="text-[#00A884]">Healthcare.</span> <br />
              Delivered To Your Door.
            </motion.h1>

            {/* Mission / Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl"
              id="hero-mission"
            >
              Amensa Diagnostics is Mumbai's premier clinical network, bringing state-of-the-art pathology, imaging, and 60-minute doorstep sample collection together with automated digital accuracy.
            </motion.p>

            {/* Benefit Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 flex items-center gap-3 text-emerald-600 font-semibold text-sm"
              id="hero-reports-badge"
            >
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span>Reports delivered digitally within 24 hours via WhatsApp & Email.</span>
            </motion.div>

            {/* Actions Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center"
              id="hero-actions"
            >
              <button
                onClick={onBookClick}
                className="px-8 py-4 bg-[#0066CC] hover:bg-[#0052CC] text-white rounded-[20px] font-bold text-lg shadow-xl shadow-blue-100 hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-300 text-center flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Book Appointment</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#packages"
                className="px-8 py-4 bg-white border-2 border-[#E8EEF5] text-slate-700 hover:text-slate-900 rounded-[20px] font-bold text-base shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-300 text-center"
              >
                Explore Packages
              </a>
            </motion.div>
          </div>

          {/* Right Side: Animated Diagnostic Illustration & Floating Stats */}
          <div className="lg:col-span-5 relative mt-12 lg:mt-0 flex justify-center items-center">
            
            {/* The Main Artpiece/Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] rounded-full bg-white/60 backdrop-blur-sm border border-[#E8EEF5] flex items-center justify-center shadow-inner"
              id="hero-artwork-stage"
            >
              {/* Spinning Ring */}
              <div className="absolute inset-4 rounded-full border-2 border-dashed border-[#0066CC]/15 animate-[spin_50s_linear_infinite]" />
              <div className="absolute inset-12 rounded-full border border-emerald-500/10 animate-[spin_30s_linear_infinite_reverse]" />

              {/* High-end custom flat-vector lab diagnostics illustration inside a glowing orb */}
              <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 bg-gradient-to-tr from-blue-50 to-emerald-50 rounded-full border border-blue-100 flex items-center justify-center shadow-lg overflow-hidden group">
                <svg
                  viewBox="0 0 200 200"
                  fill="none"
                  className="w-48 h-48 sm:w-56 sm:h-56 select-none transition-transform duration-500 group-hover:scale-105"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Background Lab Shelving */}
                  <rect x="35" y="140" width="130" height="6" rx="3" fill="#E2EBF5" />
                  
                  {/* Test Tube Rack */}
                  <rect x="90" y="110" width="70" height="30" rx="4" fill="#FFFFFF" stroke="#C3DAF0" strokeWidth="2" />
                  <rect x="100" y="90" width="10" height="30" rx="5" fill="#0066CC" fillOpacity="0.8" />
                  <rect x="120" y="85" width="10" height="35" rx="5" fill="#00A884" fillOpacity="0.8" />
                  <rect x="140" y="95" width="10" height="25" rx="5" fill="#F59E0B" fillOpacity="0.8" />
                  <line x1="90" y1="125" x2="160" y2="125" stroke="#E2EBF5" strokeWidth="2" />

                  {/* Microscopic slide analyzer or beaker */}
                  <path d="M45 140 L55 85 A5 5 0 0 1 60 80 L80 80 A5 5 0 0 1 85 85 L95 140 Z" fill="#FFFFFF" stroke="#0066CC" strokeWidth="3" />
                  {/* Liquid inside beaker with floating bubbles */}
                  <path d="M49 115 L53 95 L87 95 L91 115 Z" fill="#EAF7FF" />
                  <path d="M49 115 L91 115 L93 125 A4 4 0 0 1 89 129 L51 129 A4 4 0 0 1 47 125 Z" fill="#0066CC" fillOpacity="0.15" />
                  <circle cx="60" cy="110" r="3" fill="#0066CC" fillOpacity="0.4" />
                  <circle cx="78" cy="104" r="2" fill="#0066CC" fillOpacity="0.4" />
                  <circle cx="68" cy="120" r="4" fill="#0066CC" fillOpacity="0.4" />

                  {/* Scientific Microscope */}
                  <rect x="110" y="130" width="30" height="10" rx="2" fill="#4A5568" />
                  
                  {/* DNA Strands floating */}
                  <path d="M60 40 Q70 20 80 40 T100 40" stroke="#00A884" strokeWidth="2" strokeLinecap="round" />
                  <path d="M60 30 Q70 50 80 30 T100 30" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" />
                  <line x1="70" y1="31" x2="70" y2="39" stroke="#E2EBF5" strokeWidth="1.5" />
                  <line x1="80" y1="30" x2="80" y2="40" stroke="#E2EBF5" strokeWidth="1.5" />
                  <line x1="90" y1="31" x2="90" y2="39" stroke="#E2EBF5" strokeWidth="1.5" />
                  
                  {/* Shield of Trust badge vector overlay */}
                  <g filter="url(#glow)">
                    <path d="M100 15 L120 22 V35 C120 48 111 58 100 62 C89 58 80 48 80 35 V22 L100 15 Z" fill="#0066CC" />
                    <path d="M92 34 L97 39 L108 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </g>

                  <defs>
                    <filter id="glow" x="70" y="5" width="60" height="70" filterUnits="userSpaceOnUse">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0066CC" floodOpacity="0.3" />
                    </filter>
                  </defs>
                </svg>

                {/* Sparkling icon floating within orb */}
                <div className="absolute top-8 left-8 text-amber-400 animate-pulse-slow">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              {/* Floating Stat Badges around the Stage */}
              {floatingCards.map((card) => (
                <div
                  key={card.id}
                  className={`absolute ${card.style} ${card.animation} flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl shadow-xl shadow-slate-100 border border-[#E8EEF5] hover:shadow-2xl transition-all duration-300 z-20`}
                >
                  <div className="p-2 bg-slate-50 rounded-xl">
                    {card.icon}
                  </div>
                  <div className="flex flex-col leading-tight pr-1">
                    <span className="text-xs font-bold text-slate-900">{card.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{card.desc}</span>
                  </div>
                </div>
              ))}
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
