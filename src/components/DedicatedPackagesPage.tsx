/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Check, 
  X,
  ChevronDown, 
  ChevronUp, 
  Award, 
  ShieldCheck, 
  Download, 
  Share2, 
  Heart, 
  MessageSquare,
  ArrowLeft,
  FileText,
  BadgePercent,
  Search,
  Filter
} from 'lucide-react';
import { HealthPackage } from '../types';
import { healthPackages } from '../data';
import { getWhatsAppBookingUrl } from '../utils/whatsapp';

interface DedicatedPackagesPageProps {
  onBookPackage: (packageItem: { type: 'Package'; id: string; name: string; price: number }) => void;
  packages?: HealthPackage[];
  onBackToHome: () => void;
}

export default function DedicatedPackagesPage({ onBookPackage, packages, onBackToHome }: DedicatedPackagesPageProps) {
  const allPackages = packages || healthPackages;

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Package states
  const [expandedPackageIds, setExpandedPackageIds] = useState<string[]>(['pkg-arogya-e-pro']);
  const [savedPackageIds, setSavedPackageIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Categories list
  const categories = [
    'All',
    'Premium Full Body',
    '1+1 Free Offers',
    'Arogya Base Packages',
    'Specialty Screening'
  ];

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
    triggerToast(`Generating high-resolution official PDF for ${name}...`);
    setTimeout(() => {
      setDownloadingId(null);
      triggerToast(`📥 "${name}" details downloaded successfully!`);
    }, 1500);
  };

  const getPackageBadge = (pkg: HealthPackage) => {
    if (pkg.id === 'pkg-arogya-e-pro') return 'Elite Full Body';
    if (pkg.id === 'pkg-arogya-e-plus') return 'Best Seller';
    if (pkg.id === 'pkg-arogya-e-cardiac') return '1+1 Free (Cardiac)';
    if (pkg.id === 'pkg-arogya-fit-g') return '1+1 Free (Offer)';
    if (pkg.id === 'pkg-womens-profile') return 'Free Doctor Consultation Included';
    if (pkg.category.toLowerCase().includes('base')) return 'Value Choice';
    return 'Special Offer';
  };

  // Filter logic
  const filteredPackages = allPackages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'All') return matchesSearch;
    if (selectedCategory === 'Premium Full Body') {
      return matchesSearch && (pkg.id === 'pkg-arogya-e-pro' || pkg.id === 'pkg-arogya-e-plus');
    }
    if (selectedCategory === '1+1 Free Offers') {
      return matchesSearch && (pkg.id === 'pkg-arogya-e-cardiac' || pkg.id === 'pkg-arogya-fit-g');
    }
    if (selectedCategory === 'Arogya Base Packages') {
      return matchesSearch && pkg.category.includes('Arogya Base');
    }
    if (selectedCategory === 'Specialty Screening') {
      return matchesSearch && pkg.id === 'pkg-womens-profile';
    }
    return matchesSearch;
  });

  // Specialized Packages FAQs list
  const packageFAQs = [
    {
      q: "Do I need to fast before the test?",
      a: "Yes, 10-12 hours of overnight fasting is highly recommended for all packages, especially for accurate glucose (blood sugar) and Lipid profile values. You can consume plain water, but avoid tea, coffee, milk, and breakfast prior to the blood draw."
    },
    {
      q: "How does the '1+1 Free' double benefit offer work?",
      a: "The '1+1 Free' offer (available on Arogya E Cardiac Profile and ArogyaFit G) means you pay the package price once and two people can get tested. Both samples will be collected by a certified phlebotomist during the same home visit. It's perfect for couples, parents, or friends."
    },
    {
      q: "How long does it take to receive the reports?",
      a: "Reports are processed in high-quality automated laboratories following NABL Standards and Protocols to ensure quality and accuracy. Digital copies of all reports are delivered safely via WhatsApp and Email within 12 to 24 hours of sample collection."
    },
    {
      q: "Is there any doctor consultation included?",
      a: "Yes, the Women's Profile and Arogya E – PRO packages include a free general physician report review tele-consultation to guide you on any out-of-range indicators."
    },
    {
      q: "Can I book a package for my family members in other locations?",
      a: "Yes! We cover Mulund, Thane, Dombivli, and surrounding regions. You can enter different collection addresses in the checkout flow or manage them in your profile."
    }
  ];

  return (
    <div className="bg-[#F8FBFF] min-h-screen pt-28 pb-20 relative">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/30 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-emerald-50/40 blur-[150px] pointer-events-none" />

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
        
        {/* Back Link Header */}
        <div className="mb-8">
          <button 
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm border border-slate-150 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#0066CC]" />
            <span>Back to Homepage</span>
          </button>
        </div>

        {/* Dynamic Title / Headline */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-[#00A884] rounded-full text-xs font-extrabold uppercase tracking-wider mb-4">
            <BadgePercent className="w-4 h-4" />
            <span>Exclusive Wellness Series</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">
            Health Checkup Packages
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Protect your health and prevent conditions before they start. Our premium Arogya Series offers affordable medical profiles processed under NABL guidelines.
          </p>
        </div>

        {/* GLOSSY PROMOTIONAL HERO BANNER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 max-w-5xl mx-auto rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-600 via-[#00A884] to-blue-700 text-white shadow-2xl shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-white/10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shrink-0 border border-white/10 shadow-lg">
              🎉
            </div>
            <div>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                Seasonal Celebration Offer
              </span>
              <h2 className="font-black text-xl sm:text-2xl leading-tight mt-1">
                Save up to 70% on all Health Checkup Packages
              </h2>
              <p className="text-white/90 text-xs sm:text-sm font-semibold mt-1 max-w-xl">
                Get high-accuracy pathology profiles with completely free sterile home sample collection by our trained phlebotomists.
              </p>
            </div>
          </div>
          <a
            href="#package-cards-grid"
            className="bg-white text-blue-700 font-extrabold text-xs sm:text-sm px-7 py-4 rounded-2xl shadow-xl hover:bg-slate-50 active:scale-95 transition-all shrink-0 uppercase tracking-wider"
          >
            Browse Arogya Grid
          </a>
        </motion.div>

        {/* Dynamic Filters & Search Panel */}
        <div className="bg-white border border-[#E8EEF5] rounded-3xl p-6 mb-10 shadow-xl shadow-slate-100/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Categories Filter list */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none max-w-full">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0066CC] text-white shadow-md shadow-blue-100'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative w-full lg:max-w-xs shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search packages or tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent bg-slate-50/50"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Empty Filter State */}
        {filteredPackages.length === 0 && (
          <div className="text-center py-16 bg-white border border-[#E8EEF5] rounded-3xl shadow-sm max-w-lg mx-auto">
            <X className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No Packages Found</h3>
            <p className="text-slate-500 text-xs mt-2 px-6">
              No health packages match your query "{searchQuery}". Please try adjusting your search term or category filters.
            </p>
          </div>
        )}

        {/* PACKAGES DYNAMIC CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start" id="package-cards-grid">
          {filteredPackages.map((pkg) => {
            const isFeatured = pkg.isPopular;
            const isExpanded = expandedPackageIds.includes(pkg.id);
            const isSaved = savedPackageIds.includes(pkg.id);
            const badgeText = getPackageBadge(pkg);

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`rounded-[28px] bg-white border transition-all duration-300 relative flex flex-col justify-between h-full ${
                  isFeatured
                    ? 'border-[#0066CC] shadow-2xl shadow-blue-100 lg:-translate-y-4 ring-4 ring-[#0066CC]/5 z-10'
                    : 'border-[#E8EEF5] shadow-lg shadow-slate-100 hover:shadow-2xl hover:shadow-slate-200/50'
                }`}
                id={`packages-page-card-${pkg.id}`}
              >
                {/* Wishlist Button */}
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
                    <button
                      onClick={() => onBookPackage({ type: 'Package', id: pkg.id, name: pkg.name, price: pkg.price })}
                      className="w-full py-3.5 bg-[#0066CC] hover:bg-[#0052CC] text-white rounded-2xl font-black text-xs shadow-md shadow-blue-200/50 hover:shadow-lg hover:shadow-blue-300/60 active:scale-98 transition-all cursor-pointer text-center block uppercase tracking-wider"
                    >
                      Book Now
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Download Details */}
                      <button
                        onClick={() => handleDownload(pkg.id, pkg.name)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold cursor-pointer transition-all active:scale-95"
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
                      >
                        <Share2 className="w-3 h-3 text-slate-400" />
                        <span>Share Package</span>
                      </button>

                      {/* Save Details */}
                      <button
                        onClick={() => toggleSave(pkg.id, pkg.name)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 hover:bg-slate-50 text-slate-500 rounded-xl text-[10px] font-semibold cursor-pointer transition-all"
                      >
                        <Heart className={`w-3 h-3 ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                        <span>{isSaved ? 'Saved' : 'Save Details'}</span>
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

        {/* COMPARISON CHART SECTION */}
        <div className="mt-24 mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Compare Arogya Base Packages
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 font-medium">
              Select the right preventive screening base package depending on your family's health requirements.
            </p>
          </div>

          <div className="bg-white border border-[#E8EEF5] rounded-[32px] overflow-hidden shadow-xl shadow-slate-100/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-5 font-black text-xs text-slate-500 uppercase tracking-wider">Package Indicator</th>
                    <th className="p-5 font-black text-xs text-[#0066CC] uppercase tracking-wider text-center">Arogya (A)</th>
                    <th className="p-5 font-black text-xs text-[#0066CC] uppercase tracking-wider text-center">Arogya (B)</th>
                    <th className="p-5 font-black text-xs text-[#0066CC] uppercase tracking-wider text-center">Arogya (C)</th>
                    <th className="p-5 font-black text-xs text-[#0066CC] uppercase tracking-wider text-center">Arogya (D)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  <tr>
                    <td className="p-5 font-bold text-slate-800">Special Price</td>
                    <td className="p-5 text-center text-[#0066CC] font-black text-sm">₹899</td>
                    <td className="p-5 text-center text-[#0066CC] font-black text-sm">₹1,299</td>
                    <td className="p-5 text-center text-[#0066CC] font-black text-sm">₹1,999</td>
                    <td className="p-5 text-center text-[#0066CC] font-black text-sm">₹2,499</td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-slate-800">Regular Value</td>
                    <td className="p-5 text-center text-slate-400 line-through">₹2,000</td>
                    <td className="p-5 text-center text-slate-400 line-through">₹3,000</td>
                    <td className="p-5 text-center text-slate-400 line-through">₹4,500</td>
                    <td className="p-5 text-center text-slate-400 line-through">₹5,500</td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-slate-800">Total Parameters</td>
                    <td className="p-5 text-center text-slate-800 font-bold bg-slate-50/40">32</td>
                    <td className="p-5 text-center text-slate-800 font-bold bg-slate-50/40">58</td>
                    <td className="p-5 text-center text-slate-800 font-bold bg-slate-50/40">72</td>
                    <td className="p-5 text-center text-slate-800 font-bold bg-slate-50/40">76</td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-slate-800">Complete Blood Count (CBC)</td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-slate-800">Lipid Profile</td>
                    <td className="p-5 text-center text-slate-300">—</td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-slate-800">Liver LFT Panel</td>
                    <td className="p-5 text-center text-slate-300">—</td>
                    <td className="p-5 text-center text-slate-500 text-[10px]">Basic (8 params)</td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-slate-800">Kidney RFT Panel</td>
                    <td className="p-5 text-center text-slate-300">Basic (2 params)</td>
                    <td className="p-5 text-center text-slate-500 text-[10px]">Essential (4 params)</td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-slate-800">Thyroid Profile (T3, T4, TSH)</td>
                    <td className="p-5 text-center text-slate-300">—</td>
                    <td className="p-5 text-center text-slate-300">—</td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-slate-800">Vitamins (D3 & B12)</td>
                    <td className="p-5 text-center text-slate-300">—</td>
                    <td className="p-5 text-center text-slate-300">—</td>
                    <td className="p-5 text-center text-slate-300">—</td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-slate-800">Glycated Hemoglobin (HbA1c)</td>
                    <td className="p-5 text-center text-slate-300">—</td>
                    <td className="p-5 text-center text-slate-300">—</td>
                    <td className="p-5 text-center text-slate-300">—</td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-slate-800">Urine Routine</td>
                    <td className="p-5 text-center text-slate-500 text-[10px]">Basic</td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                    <td className="p-5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PACKAGE SPECIFIC FAQs ACCORDION */}
        <div className="mt-24 mb-16 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Package Booking FAQs
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-2 font-medium">
              Everything you need to know about sample preparation, reporting timeline, and consultations.
            </p>
          </div>

          <div className="space-y-4">
            {packageFAQs.map((faq, fIdx) => (
              <div 
                key={fIdx} 
                className="bg-white border border-[#E8EEF5] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#0066CC] rounded-full" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mt-2.5 pl-3.5 font-medium">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* NABL Verification Assurance */}
        <div className="text-center max-w-xl mx-auto flex flex-col items-center border-t border-slate-100 pt-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#E8EEF5] rounded-xl text-slate-500 text-xs font-bold mb-3 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>We follow NABL Standards and Protocols to ensure quality and accuracy</span>
          </div>
          <p className="text-slate-400 text-[10px] leading-relaxed font-semibold">
            All specimens are barcoded with complete patient anonymity, handled strictly under sterile cold-chain, and routed directly through automated analyzer nodes under multi-level clinical pathologist supervision.
          </p>
        </div>

      </div>
    </div>
  );
}
