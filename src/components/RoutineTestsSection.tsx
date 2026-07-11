/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  ShoppingCart, 
  MessageCircle, 
  ArrowUpDown, 
  Clock, 
  Droplet, 
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Test } from '../types';
import { routineTests } from '../data';
import { getWhatsAppBookingUrl } from '../utils/whatsapp';
import PrescriptionUploadSection from './PrescriptionUploadSection';

interface RoutineTestsSectionProps {
  onBookTest: (test: { type: 'RoutineTest'; id: string; name: string; price: number }) => void;
  onAddToEstimate?: (item: { type: 'Package' | 'RoutineTest' | 'Radiology'; id: string; name: string; price: number }) => void;
  tests?: Test[];
}

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

export default function RoutineTestsSection({ onBookTest, onAddToEstimate, tests }: RoutineTestsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper function to escape special regex characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Helper function to highlight text that matches search query
  const highlightText = (text: string, query: string) => {
    if (!query || !query.trim()) return <span>{text}</span>;
    const escapedQuery = escapeRegExp(query.trim());
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-100 text-[#0066CC] font-black px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const activeTests = tests || routineTests;

  // Dynamically extract all available categories
  const categories = useMemo(() => {
    const list = new Set(activeTests.map((t) => t.category));
    return ['All', ...Array.from(list)];
  }, [activeTests]);

  // Filter and sort tests
  const filteredAndSortedTests = useMemo(() => {
    const filtered = activeTests.filter((test) => {
      const matchesCategory = selectedCategory === 'All' || test.category === selectedCategory;
      const matchesSearch =
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'price-asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price-desc') {
        return b.price - a.price;
      }
      return 0;
    });
  }, [searchQuery, selectedCategory, sortBy]);

  // Sliced tests based on isExpanded
  const displayedTests = useMemo(() => {
    if (isExpanded) {
      return filteredAndSortedTests;
    }
    return filteredAndSortedTests.slice(0, 15);
  }, [filteredAndSortedTests, isExpanded]);

  const hasMoreThanLimit = filteredAndSortedTests.length > 15;

  const handleToggleExpand = () => {
    if (isExpanded) {
      setIsExpanded(false);
      // Automatically scroll back to top of routine-tests section smoothly
      setTimeout(() => {
        const element = document.getElementById('routine-tests');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    } else {
      setIsExpanded(true);
    }
  };

  // Generate dynamic WhatsApp link for inquiries
  const getWhatsAppUrl = (test: Test) => {
    return getWhatsAppBookingUrl(test.name);
  };

  return (
    <section id="routine-tests" className="py-24 bg-slate-50/50 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#0066CC]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EAF7FF] text-[#0066CC] rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Premium Pathology Catalogue</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
          >
            Routine Pathology Tests
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-slate-500"
          >
            Explore our comprehensive list of {routineTests.length} pathology tests with exact, transparent pricing. Search by test name or select a category below.
          </motion.p>
        </div>

        {/* Search, Filter, and Sort Controls Card */}
        <div className="bg-white border border-[#E8EEF5] rounded-3xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            
            {/* Search Input */}
            <div className="relative col-span-1 lg:col-span-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search test names, categories, or biomarkers..."
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim() !== '') {
                    setIsExpanded(true);
                  }
                }}
                className="w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 hover:border-[#0066CC]/30 focus:border-[#0066CC] focus:outline-none focus:ring-4 focus:ring-[#0066CC]/5 rounded-2xl text-sm transition-all duration-300 font-medium placeholder:text-slate-400"
                id="routine-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Sort Controls */}
            <div className="relative col-span-1 lg:col-span-3">
              <div className="relative">
                <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 hover:border-[#0066CC]/30 focus:border-[#0066CC] focus:outline-none focus:ring-4 focus:ring-[#0066CC]/5 rounded-2xl text-sm transition-all duration-300 font-semibold text-slate-700 cursor-pointer appearance-none"
                >
                  <option value="name-asc">Alphabetical (A - Z)</option>
                  <option value="name-desc">Alphabetical (Z - A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center px-1 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Live Counter Display */}
            <div className="col-span-1 lg:col-span-3 flex justify-end">
              <div className="w-full text-center lg:text-right py-3.5 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Showing {filteredAndSortedTests.length} of {routineTests.length} Tests
              </div>
            </div>
          </div>
        </div>

        {/* Prescription Upload Required Flow Card */}
        <div className="mb-12">
          <PrescriptionUploadSection type="Blood Test" availableTests={activeTests} />
        </div>

        {/* STICKY Category Navigation Bar */}
        <div className="sticky top-2 z-30 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md shadow-slate-100/50 rounded-2xl p-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider pl-2 pr-1 hidden sm:inline-block border-r border-slate-200 py-1.5 mr-1 select-none">
              Filter:
            </span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 select-none cursor-pointer shrink-0 whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-[#0066CC] text-white shadow-md shadow-[#0066CC]/25'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Premium Interactive Catalogue */}
        <div className="bg-white border border-[#E8EEF5] rounded-3xl overflow-hidden shadow-xl shadow-slate-100" id="routine-tests-table-wrapper">
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-[#E8EEF5]">
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Test Name & Biomarkers</th>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Specimen</th>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Report TAT</th>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Special Price</th>
                  <th className="p-6 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Action / Book</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EEF5]">
                <AnimatePresence mode="popLayout">
                  {displayedTests.length > 0 ? (
                    displayedTests.map((test) => (
                      <motion.tr 
                        key={test.id} 
                        layout="position"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={`hover:bg-slate-50/50 transition-colors group ${
                          searchQuery ? 'bg-blue-50/40 border-l-4 border-l-[#0066CC]' : ''
                        }`}
                      >
                        {/* Test Name & Details */}
                        <td className="p-6 max-w-md">
                          <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-[#0066CC] transition-colors">
                            {highlightText(test.name, searchQuery)}
                          </h4>
                          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed line-clamp-2">
                            {highlightText(test.description, searchQuery)}
                          </p>
                        </td>

                        {/* Category Badge */}
                        <td className="p-6 text-xs">
                          <span className="px-2.5 py-1 bg-slate-100 rounded-md text-slate-600 font-bold uppercase tracking-wider border border-slate-200/50 whitespace-nowrap">
                            {highlightText(test.category, searchQuery)}
                          </span>
                        </td>

                        {/* Specimen Tag */}
                        <td className="p-6 text-xs font-semibold text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Droplet className={`w-3.5 h-3.5 ${test.specimen.toLowerCase().includes('blood') ? 'text-red-500' : 'text-amber-500'}`} />
                            <span>{test.specimen}</span>
                          </div>
                        </td>

                        {/* Report Turnaround */}
                        <td className="p-6 text-xs font-medium text-slate-600">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{test.reportTime}</span>
                          </div>
                        </td>

                        {/* Price Details */}
                        <td className="p-6">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-[#0066CC] text-base">₹{test.price}</span>
                            {test.originalPrice && (
                              <span className="text-xs text-slate-400 line-through">₹{test.originalPrice}</span>
                            )}
                          </div>
                        </td>

                        {/* Actions Stack */}
                        <td className="p-6">
                          <div className="flex items-center justify-center gap-2.5">
                            {/* WhatsApp Inquiry Button */}
                            <a
                              href={getWhatsAppUrl(test)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#EAFBEF] hover:bg-emerald-500 text-emerald-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow"
                              title="Inquire via WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>

                            {/* Book Now Button */}
                            <button
                              onClick={() => onBookTest({ type: 'RoutineTest', id: test.id, name: test.name, price: test.price })}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EAF7FF] hover:bg-[#0066CC] hover:text-white text-[#0066CC] text-xs font-bold transition-all duration-300 shadow-sm cursor-pointer hover:shadow"
                            >
                              <span>Book Now</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Add to Cart Button */}
                            <button
                              onClick={() => onAddToEstimate && onAddToEstimate({ type: 'RoutineTest', id: test.id, name: test.name, price: test.price })}
                              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-[#0066CC]/10 text-slate-700 hover:text-[#0066CC] border border-slate-200 hover:border-[#0066CC]/30 text-xs font-bold transition-all duration-300 shadow-sm hover:shadow cursor-pointer"
                              title="Add to Cart"
                            >
                              <span>+ Cart</span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-16 text-center text-slate-400">
                        <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-slate-600">No diagnostic tests matching your search.</p>
                        <p className="text-xs mt-1 text-slate-400">Try checking spelling, selecting 'All' filters, or typing synonyms.</p>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout (Touch Targets >= 44px) */}
          <div className="block md:hidden divide-y divide-[#E8EEF5]">
            <AnimatePresence mode="popLayout">
              {displayedTests.length > 0 ? (
                displayedTests.map((test) => (
                  <motion.div 
                    key={test.id} 
                    layout="position"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`p-5 flex flex-col hover:bg-slate-50/50 transition-colors ${
                      searchQuery ? 'bg-blue-50/40 border-l-4 border-l-[#0066CC]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-extrabold text-[#0066CC] uppercase tracking-wider bg-[#EAF7FF] px-2 py-0.5 rounded border border-[#EAF7FF]">
                          {highlightText(test.category, searchQuery)}
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-sm mt-2">
                          {highlightText(test.name, searchQuery)}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-[#0066CC] text-lg block leading-none">₹{test.price}</span>
                        {test.originalPrice && (
                          <span className="text-xs text-slate-400 line-through block mt-1">₹{test.originalPrice}</span>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-500 text-xs mt-2.5 leading-relaxed">
                      {highlightText(test.description, searchQuery)}
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex items-center justify-between gap-4 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100/80">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                        <Droplet className={`w-3.5 h-3.5 ${test.specimen.toLowerCase().includes('blood') ? 'text-red-500' : 'text-amber-500'}`} />
                        <span>Specimen: {test.specimen}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>TAT: {test.reportTime}</span>
                      </div>
                    </div>

                    {/* Mobile Action Buttons Stack (Explicitly 44px+ Touch Target height) */}
                    <div className="grid grid-cols-6 gap-2.5 mt-4">
                      {/* WhatsApp Inquiry Button */}
                      <a
                        href={getWhatsAppUrl(test)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-2 h-11 bg-[#EAFBEF] hover:bg-emerald-500/10 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200/50 cursor-pointer"
                        style={{ minHeight: '44px' }}
                      >
                        <MessageCircle className="w-4.5 h-4.5 text-emerald-500" />
                        <span>Inquire</span>
                      </a>

                      {/* Primary Booking Button */}
                      <button
                        onClick={() => onBookTest({ type: 'RoutineTest', id: test.id, name: test.name, price: test.price })}
                        className="col-span-2 h-11 bg-[#0066CC] hover:bg-[#0052CC] text-white font-extrabold text-[11px] rounded-xl shadow-md shadow-[#0066CC]/15 flex items-center justify-center gap-1 cursor-pointer"
                        style={{ minHeight: '44px' }}
                        title="Book Routine Test"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Book</span>
                      </button>

                      {/* Estimate Button */}
                      <button
                        onClick={() => onAddToEstimate && onAddToEstimate({ type: 'RoutineTest', id: test.id, name: test.name, price: test.price })}
                        className="col-span-2 h-11 bg-slate-100 hover:bg-[#0066CC]/10 text-slate-700 hover:text-[#0066CC] border border-slate-200 hover:border-[#0066CC]/30 font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                        style={{ minHeight: '44px' }}
                        title="Add to Cart"
                      >
                        <span>+ Cart</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-16 text-center text-slate-400">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">No tests match your keywords.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Expand / Collapse Button */}
        {hasMoreThanLimit && (
          <div className="flex justify-center mt-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleToggleExpand}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border border-slate-200 hover:border-[#0066CC]/50 text-[#0066CC] hover:bg-[#F0F7FF] text-sm font-extrabold rounded-2xl shadow-sm hover:shadow transition-all duration-300 cursor-pointer"
              id="toggle-expand-tests-btn"
            >
              <span>{isExpanded ? 'View Less' : 'View More'}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-[#0066CC]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#0066CC]" />
              )}
            </motion.button>
          </div>
        )}

      </div>
    </section>
  );
}
