/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, ChevronDown, Menu, X, ShieldCheck, Heart, Activity, MapPin, User } from 'lucide-react';
import Logo from './Logo';

interface NavbarProps {
  onBookClick: (item?: { type: 'Package' | 'RoutineTest' | 'Radiology'; id: string; name: string; price: number }) => void;
  cartCount?: number;
  onCartClick?: () => void;
}

export default function Navbar({ onBookClick, cartCount = 0, onCartClick }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: 'Home', href: '#home' },
    { name: 'Why Amensa', href: '#why-choose' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Health Packages', href: '#packages' },
    { name: 'Pathology Tests', href: '#routine-tests' },
    { name: 'Radiology', href: '#radiology' },
    { name: 'Locations', href: '#locations' },
  ];

  return (
    <>
      <header
        id="luxury-header"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 backdrop-blur-md border-b border-[#E8EEF5] shadow-sm py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-[92rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <a href="#home" className="focus:outline-none">
              <Logo />
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {menuItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-slate-800 hover:text-[#0066CC] transition-colors rounded-lg hover:bg-brand-accent/40"
                >
                  {item.name}
                </a>
              ))}

              {/* Services Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsServicesDropdownOpen(true)}
                onMouseLeave={() => setIsServicesDropdownOpen(false)}
              >
                <button
                  id="services-dropdown-btn"
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-800 hover:text-[#0066CC] transition-colors rounded-lg hover:bg-brand-accent/40 focus:outline-none"
                >
                  Services <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {isServicesDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-1 w-64 rounded-2xl bg-white shadow-xl border border-brand-border py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-brand-border mb-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diagnostic Divisions</span>
                      </div>
                      <a
                        href="#packages"
                        onClick={() => setIsServicesDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-brand-accent/60 hover:text-[#0066CC] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-brand-secondary" />
                        <div>
                          <p className="font-medium">Preventive Health Packages</p>
                          <p className="text-[11px] text-slate-400">Save up to 70% on screenings</p>
                        </div>
                      </a>
                      <a
                        href="#routine-tests"
                        onClick={() => setIsServicesDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-brand-accent/60 hover:text-[#0066CC] transition-colors"
                      >
                        <Activity className="w-4 h-4 text-[#0066CC]" />
                        <div>
                          <p className="font-medium">Routine Pathology Tests</p>
                          <p className="text-[11px] text-slate-400">Fasting, CBC, HbA1c, Lipids</p>
                        </div>
                      </a>
                      <a
                        href="#radiology"
                        onClick={() => setIsServicesDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-brand-accent/60 hover:text-[#0066CC] transition-colors"
                      >
                        <Heart className="w-4 h-4 text-[#00A884]" />
                        <div>
                          <p className="font-medium">Radiology & Imaging</p>
                          <p className="text-[11px] text-slate-400">X-Ray, Sonography, ECG</p>
                        </div>
                      </a>
                      <a
                        href="#how-it-works"
                        onClick={() => setIsServicesDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-brand-accent/60 hover:text-[#0066CC] transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-[#0066CC]" />
                        <div>
                          <p className="font-medium">Free Home Blood Collection</p>
                          <p className="text-[11px] text-slate-400">Certified phlebotomist in 60 mins</p>
                        </div>
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

             {/* Call and Book Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href="tel:07039394488"
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#0066CC] text-[#0066CC] rounded-[14px] text-sm font-bold shadow-sm hover:bg-slate-50 transition-all duration-300"
                id="navbar-call-btn"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>Call Now</span>
              </a>

              {/* Estimate Cart Button */}
              <button
                onClick={onCartClick}
                className="relative flex items-center justify-center p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#0066CC] text-slate-700 hover:text-[#0066CC] rounded-[14px] transition-all duration-300 cursor-pointer h-10 w-10 shrink-0"
                id="navbar-cart-btn"
                title="View Cart"
              >
                <span className="text-lg">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onBookClick()}
                className="px-5 py-2.5 bg-[#0066CC] hover:bg-[#0052CC] text-white rounded-[14px] text-sm font-bold shadow-lg shadow-blue-200 hover:shadow-xl active:scale-95 transition-all duration-300 cursor-pointer"
                id="navbar-book-btn"
              >
                Book Appointment
              </button>
            </div>

            {/* Mobile Actions (Cart + Menu) */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={onCartClick}
                className="relative flex items-center justify-center p-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl"
                id="navbar-cart-mobile-btn"
                title="View Cart"
              >
                <span className="text-base">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-1 ring-white">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-slate-700 hover:text-[#0066CC] hover:bg-brand-accent focus:outline-none"
                aria-label="Toggle menu"
                id="mobile-menu-toggle"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-white border-t border-brand-border shadow-xl overflow-hidden"
            >
              <div className="px-4 pt-4 pb-6 space-y-2">
                {menuItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-base font-medium text-slate-800 hover:text-[#0066CC] hover:bg-brand-accent/50 rounded-xl transition-all"
                  >
                    {item.name}
                  </a>
                ))}

                <div className="border-t border-brand-border my-4 pt-4 space-y-3">
                  <a
                    href="tel:07039394488"
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-[#0066CC] bg-white border-2 border-[#0066CC] rounded-[14px] shadow-sm hover:bg-slate-50 transition-all"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Call Now (07039394488)</span>
                  </a>



                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onBookClick();
                    }}
                    className="w-full py-3 text-sm font-bold text-white bg-[#0066CC] hover:bg-[#0052CC] rounded-[14px] shadow-lg shadow-blue-200 cursor-pointer text-center transition-all"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
