/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Heart, MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram, Award } from 'lucide-react';
import Logo from './Logo';

interface FooterProps {
  onAdminClick?: () => void;
}

export default function Footer({ onAdminClick }: FooterProps = {}) {
  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Why Choose Us', href: '#why-choose' },
    { name: 'Home Diagnostics Process', href: '#how-it-works' },
    { name: 'Wellness Packages', href: '#packages' },
    { name: 'Pathology Tests', href: '#routine-tests' },
    { name: 'Radiology', href: '#radiology' },
    { name: 'Diagnostic Centers', href: '#locations' },
    { name: 'FAQs', href: '#faqs' }
  ];

  const divisions = [
    { name: 'Comprehensive Pathology Profiles', href: '#packages' },
    { name: 'Routine Lab Investigations', href: '#routine-tests' },
    { name: 'Digital Chest X-Rays', href: '#radiology' },
    { name: 'Ultrasonography & Sonology', href: '#radiology' },
    { name: '12-Lead Electrocardiograms', href: '#radiology' },
    { name: '60 Minute Express Home Blood Pick', href: '#how-it-works' }
  ];

  return (
    <footer className="bg-slate-900 text-white pt-20 pb-10 relative overflow-hidden" id="luxury-footer">
      {/* Decorative vectors */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          
          {/* Logo & Intro Column */}
          <div className="lg:col-span-4 space-y-6">
            <Logo light={true} variant="footer" />
            <p className="text-slate-400 text-xs leading-relaxed">
              Amensa Diagnostics is a premium certified network of pathology and home diagnostic laboratories. We follow NABL Guidelines and Protocols to ensure quality and accuracy in diagnostic services directly at patient doorsteps.
            </p>
            
            {/* Accreditation indicators */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl w-fit">
              <Award className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="leading-none">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">NABL Guidelines</span>
                <span className="text-[9px] text-slate-500 font-semibold mt-0.5 block">ISO 9001:2015 Quality Hub</span>
              </div>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Quick Navigation</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Divisions Column */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Diagnostic Divisions</h4>
            <ul className="space-y-2.5">
              {divisions.map((div) => (
                <li key={div.name}>
                  <a
                    href={div.href}
                    className="text-xs text-slate-400 hover:text-white transition-colors block leading-relaxed"
                  >
                    {div.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Regional locations summary column */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">Hub coordinates</h4>
            <div className="space-y-3.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">SHOP NO. 13, SAI SANTOSH CHS, Sarojini Naidu Rd, Tambe Nagar, Siddharth Nagar, Mulund West, Mumbai, Maharashtra 400080</p>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <a href="tel:07039394488" className="hover:text-white transition-colors">07039394488</a>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>amensadiagnostics@gmail.com</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Pathology Dispatch: 8:00 AM - 9:00 PM Daily</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Social Media and Copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Copyright description */}
          <div className="text-center sm:text-left text-[11px] text-slate-500 font-semibold space-y-1">
            <p>© {new Date().getFullYear()} Amensa Diagnostics. All rights reserved.</p>
            <p className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span>Designed for Amensa Healthcare Group. Medical Registration Certificate No. MH-421-KD0392.</span>
              {onAdminClick && (
                <>
                  <span className="text-slate-700">•</span>
                  <button 
                    onClick={onAdminClick}
                    className="text-slate-400 hover:text-[#0066CC] transition-colors cursor-pointer underline hover:no-underline font-extrabold"
                  >
                    Clinical Admin Portal
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Social media icons */}
          <div className="flex gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-[#0066CC] hover:border-[#0066CC] transition-all"
              aria-label="Find us on Facebook"
            >
              <Facebook className="w-4.5 h-4.5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-[#0066CC] hover:border-[#0066CC] transition-all"
              aria-label="Find us on Twitter"
            >
              <Twitter className="w-4.5 h-4.5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-pink-600 hover:border-pink-600 transition-all"
              aria-label="Find us on Instagram"
            >
              <Instagram className="w-4.5 h-4.5" />
            </a>
          </div>

        </div>

      </div>
    </footer>
  );
}
