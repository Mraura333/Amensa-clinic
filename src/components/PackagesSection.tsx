/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  ShieldAlert, 
  Download, 
  Share2, 
  Heart, 
  MessageSquare,
  FileText
} from 'lucide-react';
import { HealthPackage } from '../types';
import { healthPackages } from '../data';
import { getWhatsAppBookingUrl } from '../utils/whatsapp';

interface PackagesSectionProps {
  onBookPackage: (packageItem: { type: 'Package'; id: string; name: string; price: number }) => void;
  onAddToEstimate?: (item: { type: 'Package' | 'RoutineTest' | 'Radiology'; id: string; name: string; price: number }) => void;
  packages?: HealthPackage[];
}

export default function PackagesSection({ onBookPackage, onAddToEstimate, packages }: PackagesSectionProps) {
  const activePackages = packages || healthPackages;

  // Track expanded cards
  const [expandedPackageIds, setExpandedPackageIds] = useState<string[]>(['pkg-arogya-e-pro', 'pkg-arogya-fit-g']);
  
  // Wishlist state for premium interaction
  const [savedPackageIds, setSavedPackageIds] = useState<string[]>([]);
  
  // Custom interactive toasts
  const [toast, setToast] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const toggleExpand = (id: string) => {
    if (expandedPackageIds.includes(id)) {
      setExpandedPackageIds(expandedPackageIds.filter((pId) => pId !== id));
    } else {
      setExpandedPackageIds([...expandedPackageIds, id]);
    }
  };

  const toggleSave = (id: string, name: string) => {
    if (savedPackageIds.includes(id)) {
      setSavedPackageIds(savedPackageIds.filter(pId => pId !== id));
      triggerToast(`Removed "${name}" from your saved packages.`);
    } else {
      setSavedPackageIds([...savedPackageIds, id]);
      triggerToast(`✨ Saved "${name}" to your wishlist!`);
    }
  };

  const handleShare = (name: string) => {
    const shareText = `Check out the ${name} preventive health package from Amensa Diagnostics!`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: name,
        text: shareText,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      triggerToast(`📋 Package link copied to clipboard! Share it with friends or family.`);
    }
  };

  const handleDownload = (id: string, name: string) => {
    setDownloadingId(id);
    triggerToast(`Generating high-resolution brochure for ${name}...`);
    setTimeout(() => {
      const pkg = activePackages.find(p => p.id === id);
      if (pkg) {
        const fileContent = `============================================================
             AMENSA DIAGNOSTICS - OFFICIAL BROCHURE
============================================================
Package Name : ${pkg.name.toUpperCase()}
Category     : ${pkg.category}
Special Offer: ₹${pkg.price} (Original: ₹${pkg.originalPrice} - ${pkg.discount})
Fulfillment  : Free Sterile Home Sample Collection Included
Parameters   : ${pkg.testsCount} Lab Parameters

------------------------------------------------------------
DESCRIPTION:
------------------------------------------------------------
${pkg.description}

------------------------------------------------------------
INCLUDED CLINICAL PARAMETERS:
------------------------------------------------------------
${pkg.testsList.map((test, index) => `[ ] ${index + 1}. ${test}`).join('\n')}

------------------------------------------------------------
CLINICAL TESTING GUIDELINES:
- Requires 10-12 hours of overnight fasting.
- Samples collected using sterile vacuum barcode containers.
- Reports double-blind verified under NABL Standards and Protocols.
- Digital reports delivered via Email/WhatsApp in 12-24 hours.

------------------------------------------------------------
BOOKING DETAILS:
- Phone / WhatsApp: +91 70393 94488
- Email: amensadiagnostics@gmail.com
- Central Lab: Sarojini Naidu Rd, Mulund West, Mumbai, MH - 400080
============================================================`;

        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Amensa_Health_Package_${pkg.name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      setDownloadingId(null);
      triggerToast(`📥 "${name}" details downloaded successfully!`);
    }, 1200);
  };

  // Helper to resolve custom badge text based on package attributes
  const getPackageBadge = (pkg: HealthPackage) => {
    if (pkg.id === 'pkg-arogya-e-pro') return 'Elite Full Body';
    if (pkg.id === 'pkg-arogya-e-plus') return 'Best Seller';
    if (pkg.id === 'pkg-arogya-e-cardiac') return '1+1 Free (Cardiac)';
    if (pkg.id === 'pkg-arogya-fit-g') return '1+1 Free (Offer)';
    if (pkg.id === 'pkg-womens-profile') return 'Free Doctor Consultation Included';
    if (pkg.category.toLowerCase().includes('base')) return 'Value Choice';
    return 'Special Offer';
  };

  return (
    <section id="packages" className="py-24 bg-[#F8FBFF] relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-100/30 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-emerald-50/40 blur-[120px] pointer-events-none" />

      {/* Floating Interactive Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-3.5 px-6 rounded-full shadow-2xl z-[9999] flex items-center gap-2 border border-slate-800"
          >
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EAF7FF] text-[#0066CC] rounded-full text-xs font-extrabold uppercase tracking-wider mb-4"
          >
            <Award className="w-3.5 h-3.5" />
            <span>NABL Standard Health Screenings</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
          >
            Health Packages (Arogya Series)
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed"
          >
            Choose from our specialized preventive wellness checkups designed to map out comprehensive organ functions, cardiac health, and metabolic parameters.
          </motion.p>
        </div>

        {/* FEATURED PROMOTIONAL BANNER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-16 max-w-5xl mx-auto rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-600 via-[#00A884] to-blue-700 text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
          id="promo-discount-banner"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shrink-0">
              🎉
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl leading-snug">
                Save up to 70% on all Health Checkup Packages
              </h3>
              <p className="text-white/90 text-xs sm:text-sm font-medium mt-1">
                Zero collection fees. Reports checked by double-blind automated audits and verified by expert Pathologists.
              </p>
            </div>
          </div>
          <a
            href="#packages-grid"
            className="bg-white text-blue-700 font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg hover:bg-slate-50 active:scale-95 transition-all shrink-0 uppercase tracking-wider"
          >
            Explore Arogya Series
          </a>
        </motion.div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start" id="packages-grid">
          {activePackages.map((pkg) => {
            const isFeatured = pkg.isPopular;
            const isExpanded = expandedPackageIds.includes(pkg.id);
            const isSaved = savedPackageIds.includes(pkg.id);
            const badgeText = getPackageBadge(pkg);

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={`rounded-[28px] bg-white border transition-all duration-300 relative flex flex-col justify-between h-full ${
                  isFeatured
                    ? 'border-[#0066CC] shadow-2xl shadow-blue-100 lg:-translate-y-4 ring-4 ring-[#0066CC]/5 z-10'
                    : 'border-[#E8EEF5] shadow-lg shadow-slate-100 hover:shadow-2xl hover:shadow-slate-200/50'
                }`}
                id={`package-card-${pkg.id}`}
              >
                {/* Save to Wishlist Ribbon Corner Button */}
                <button
                  onClick={() => toggleSave(pkg.id, pkg.name)}
                  className="absolute top-5 right-5 p-2 rounded-full bg-slate-50 border border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-90 transition-all cursor-pointer z-20 shadow-sm"
                  title="Save Package"
                >
                  <Heart className={`w-4 h-4 transition-colors ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                {/* Card Header Info */}
                <div className="p-8 pb-5">
                  <div className="flex flex-wrap gap-2 items-center mb-3">
                    <span className="text-[10px] font-extrabold text-brand-secondary uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                      {pkg.category}
                    </span>
                    {badgeText && (
                      <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 shrink-0" />
                        <span>{badgeText}</span>
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 pr-8">
                    {pkg.name}
                  </h3>
                  
                  <p className="text-slate-500 text-xs leading-relaxed min-h-[48px]">
                    {pkg.description}
                  </p>

                  {/* Included Parameters Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl text-[11px] font-bold text-slate-700 mt-4 border border-slate-100">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Includes {pkg.testsCount} Parameters</span>
                  </div>
                </div>

                {/* Pricing Block */}
                <div className="p-8 py-5 bg-slate-50/50 border-t border-b border-slate-100">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-3xl font-extrabold text-[#0066CC]">
                      ₹{pkg.price}
                    </span>
                    <span className="text-slate-400 text-xs line-through font-semibold">
                      ₹{pkg.originalPrice}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {pkg.discount}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-wider">
                    Inclusive of free sample pickup & report delivery
                  </p>
                </div>

                {/* Actions & Expand Details Block */}
                <div className="p-8 pt-5 flex-1 flex flex-col justify-end">
                  
                  {/* Primary & Secondary Buttons */}
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-5 gap-2.5">
                      <button
                        onClick={() => onBookPackage({ type: 'Package', id: pkg.id, name: pkg.name, price: pkg.price })}
                        className="col-span-3 py-3.5 bg-[#0066CC] hover:bg-[#0052CC] text-white rounded-2xl font-black text-xs shadow-md shadow-blue-200/50 hover:shadow-lg hover:shadow-blue-300/60 active:scale-98 transition-all cursor-pointer text-center block uppercase tracking-wider"
                      >
                        Book Now
                      </button>
                      <button
                        onClick={() => onAddToEstimate && onAddToEstimate({ type: 'Package', id: pkg.id, name: pkg.name, price: pkg.price })}
                        className="col-span-2 py-3.5 bg-slate-100 hover:bg-[#0066CC]/10 text-slate-700 hover:text-[#0066CC] border border-slate-200 hover:border-[#0066CC]/30 rounded-2xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Add to Cart"
                      >
                        <span>+ Cart</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Download Details (Future-Ready) */}
                      <button
                        onClick={() => handleDownload(pkg.id, pkg.name)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95"
                        title="Download Package PDF"
                        disabled={downloadingId === pkg.id}
                      >
                        <Download className={`w-3.5 h-3.5 shrink-0 ${downloadingId === pkg.id ? 'animate-bounce text-[#0066CC]' : 'text-slate-500'}`} />
                        <span>{downloadingId === pkg.id ? 'Saving...' : 'PDF Spec'}</span>
                      </button>

                      {/* WhatsApp Enquiry */}
                      <a
                        href={getWhatsAppBookingUrl(pkg.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#e8f6e8] hover:bg-[#d4edd4] text-[#2e7d32] rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95 text-center border border-emerald-100"
                        title="Enquire on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#2e7d32]" />
                        <span>WhatsApp</span>
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Share Package */}
                      <button
                        onClick={() => handleShare(pkg.name)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 hover:bg-slate-50 text-slate-500 rounded-xl text-[10px] font-semibold cursor-pointer transition-all"
                        title="Share Package with Family"
                      >
                        <Share2 className="w-3 h-3 text-slate-400" />
                        <span>Share Package</span>
                      </button>

                      {/* Save Details (Auxiliary text indicator) */}
                      <button
                        onClick={() => toggleSave(pkg.id, pkg.name)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 hover:bg-slate-50 text-slate-500 rounded-xl text-[10px] font-semibold cursor-pointer transition-all"
                      >
                        <Heart className={`w-3 h-3 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                        <span>{isSaved ? 'Saved in Wishlist' : 'Save Details'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Toggle Expand Details */}
                  <button
                    onClick={() => toggleExpand(pkg.id)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-[#0066CC] hover:text-[#0052CC] hover:underline cursor-pointer"
                  >
                    <span>{isExpanded ? 'View Less' : 'View Details'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* Expanded Parameters List */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden mt-4"
                      >
                        <div className="pt-3 border-t border-dashed border-slate-200 max-h-72 overflow-y-auto pr-1 space-y-2">
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">
                            Included Tests ({pkg.testsList.length}):
                          </p>
                          {pkg.testsList.map((testName, tIdx) => (
                            <div key={tIdx} className="flex items-start gap-2 text-[11px] text-slate-600">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="leading-relaxed font-semibold">{testName}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* NABL Verification Assurance Footer */}
        <div className="mt-16 text-center max-w-xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#E8EEF5] rounded-xl text-slate-500 text-xs font-bold mb-3 shadow-sm">
            <ShieldAlert className="w-4 h-4 text-brand-secondary" />
            <span>We follow NABL Standards and Protocols to ensure quality and accuracy</span>
          </div>
          <p className="text-slate-400 text-[10px] leading-relaxed font-semibold">
            All specimens are barcoded with complete patient anonymity, handled strictly under sterile cold-chain, and routed directly through automated analyzer nodes under multi-level clinical pathologist supervision.
          </p>
        </div>

      </div>
    </section>
  );
}
