/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { faqItems } from '../data';
import { FAQItem } from '../types';

interface FAQsSectionProps {
  faqsList?: FAQItem[];
}

export default function FAQsSection({ faqsList }: FAQsSectionProps) {
  const activeFaqs = faqsList || faqItems;
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    if (openFaqId === id) {
      setOpenFaqId(null);
    } else {
      setOpenFaqId(id);
    }
  };

  return (
    <section id="faqs" className="py-24 bg-[#F8FBFF] relative overflow-hidden">
      {/* Decorative backdrop gradients */}
      <div className="absolute top-1/3 left-0 w-80 h-80 rounded-full bg-blue-100/30 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EAF7FF] text-[#0066CC] rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Faq Knowledge Base</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
          >
            Frequently Asked Questions
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base text-slate-500"
          >
            Have clinical, logistics, or payment queries? We have compiled responses to help you coordinate tests seamlessly.
          </motion.p>
        </div>

        {/* Accordions */}
        <div className="space-y-4" id="faqs-accordion-list">
          {activeFaqs.map((item) => {
            const isOpen = openFaqId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'border-[#0066CC] shadow-md ring-2 ring-[#0066CC]/5'
                    : 'border-[#E8EEF5] shadow-sm hover:border-slate-300'
                }`}
                id={`faq-item-${item.id}`}
              >
                {/* Header Toggle Clickable */}
                <button
                  onClick={() => toggleFaq(item.id)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-[#0066CC] uppercase tracking-wider px-2.5 py-1 bg-[#EAF7FF] rounded-md">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                      {item.question}
                    </h3>
                  </div>
                  
                  {/* Toggle Arrow icon */}
                  <div className={`p-1.5 rounded-full bg-slate-50 text-slate-400 group-hover:bg-slate-100 transition-colors shrink-0`}>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#0066CC]" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Sliding Body content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-6 pb-6 pt-1 border-t border-dashed border-slate-100">
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Global CTA if more questions */}
        <div className="mt-12 text-center p-6 bg-white border border-[#E8EEF5] rounded-[24px] max-w-xl mx-auto">
          <p className="text-xs text-slate-500 font-medium">
            Still have an unanswered clinical or procedural query?
          </p>
          <a
            href="tel:07039394488"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0066CC] hover:text-[#0052CC] hover:underline mt-2"
          >
            <span>Dial our Help Desk (07039394488)</span>
          </a>
        </div>

      </div>
    </section>
  );
}
