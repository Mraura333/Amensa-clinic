/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronLeft, ChevronRight, Quote, Sparkles, MessageSquare } from 'lucide-react';
import { testimonials } from '../data';
import { Testimonial } from '../types';

interface TestimonialsSectionProps {
  testimonialsList?: Testimonial[];
}

export default function TestimonialsSection({ testimonialsList }: TestimonialsSectionProps) {
  const activeTestimonials = testimonialsList || testimonials;
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-slide carousel interval
  useEffect(() => {
    if (activeTestimonials.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activeTestimonials.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [activeTestimonials]);

  const handlePrev = () => {
    if (activeTestimonials.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + activeTestimonials.length) % activeTestimonials.length);
  };

  const handleNext = () => {
    if (activeTestimonials.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % activeTestimonials.length);
  };

  const activeTestimonial = activeTestimonials[activeIndex] || activeTestimonials[0];

  return (
    <section id="testimonials" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative vectors */}
      <div className="absolute top-1/4 right-0 w-80 h-80 rounded-full bg-emerald-50/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 rounded-full bg-[#EAF7FF]/30 blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EAF7FF] text-[#0066CC] rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verifiable Patient Feedback</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
          >
            What Patients Say About Us
          </motion.h2>
        </div>

        {activeTestimonials.length === 0 ? (
          /* Elegant professional empty state if no verified testimonials are loaded */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-white border border-dashed border-slate-300 rounded-[32px] p-12 md:p-16 text-center max-w-3xl mx-auto shadow-sm"
            id="testimonials-empty-state"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 mb-6">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800">Patient testimonials will be added after client approval.</h3>
          </motion.div>
        ) : (
          /* Carousel Visual Frame */
          <div className="relative bg-white border border-[#E8EEF5] rounded-[32px] p-8 md:p-14 shadow-2xl shadow-slate-200/80 overflow-hidden" id="testimonial-carousel-box">
            <div className="absolute top-10 right-10 text-slate-200/50 pointer-events-none">
              <Quote className="w-24 h-24 stroke-[1.5]" />
            </div>

            <div className="relative z-10 min-h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col md:flex-row gap-8 items-center"
                >
                  {/* Profile Avatar Column */}
                  <div className="shrink-0 relative">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-slate-50 to-[#EAF7FF] flex items-center justify-center">
                      <span className="text-[#0066CC] text-2xl md:text-3.5xl font-black select-none">
                        {activeTestimonial.name.charAt(0)}
                      </span>
                    </div>
                    
                    {/* Decorative rating count overlay */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md border border-[#E8EEF5] flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                      <span className="text-[10px] font-bold text-slate-800">5.0</span>
                    </div>
                  </div>

                  {/* Feedback Body */}
                  <div className="flex-1 text-center md:text-left">
                    {/* Star row */}
                    <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
                      {[...Array(activeTestimonial.rating)].map((_, starIdx) => (
                        <Star key={starIdx} className="w-5 h-5 fill-amber-400 stroke-amber-400" />
                      ))}
                    </div>

                    {/* Quote Description */}
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed font-medium italic">
                      "{activeTestimonial.review}"
                    </p>

                    {/* Profile info footer */}
                    <div className="mt-6 pt-4 border-t border-[#E8EEF5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{activeTestimonial.name}</h4>
                        <p className="text-slate-400 text-xs font-semibold">{activeTestimonial.location}</p>
                      </div>
                      
                      {/* Diagnostic Taken tag & Google Maps Review Link */}
                      <div className="flex flex-col sm:flex-row items-center gap-2.5">
                        {activeTestimonial.reviewUrl && (
                          <a
                            href={activeTestimonial.reviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition-all shadow-sm group cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shrink-0"></span>
                            <span>Verified Google Review</span>
                            <span className="group-hover:translate-x-0.5 transition-transform text-[9px]">→</span>
                          </a>
                        )}
                        <span className="inline-block px-3 py-1 bg-[#EAF7FF] text-[#0066CC] border border-blue-100 rounded-lg text-xs font-bold w-fit mx-auto sm:mx-0">
                          Test: {activeTestimonial.testTaken}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Carousel Arrows and Pagination Indicators Row */}
            <div className="mt-8 pt-6 border-t border-[#E8EEF5] flex items-center justify-between relative z-10">
              {/* Dots */}
              <div className="flex gap-2">
                {activeTestimonials.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setActiveIndex(dotIdx)}
                    className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
                      dotIdx === activeIndex ? 'w-8 bg-[#0066CC]' : 'w-2.5 bg-slate-300'
                    }`}
                    aria-label={`Slide ${dotIdx + 1}`}
                  />
                ))}
              </div>

              {/* Nav Arrows */}
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  className="p-2.5 bg-white border border-[#E8EEF5] hover:bg-slate-50 hover:border-[#0066CC]/30 rounded-full shadow-sm text-slate-700 transition-colors focus:outline-none cursor-pointer"
                  aria-label="Previous test review"
                  id="testimonial-prev-btn"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2.5 bg-white border border-[#E8EEF5] hover:bg-slate-50 hover:border-[#0066CC]/30 rounded-full shadow-sm text-slate-700 transition-colors focus:outline-none cursor-pointer"
                  aria-label="Next test review"
                  id="testimonial-next-btn"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
