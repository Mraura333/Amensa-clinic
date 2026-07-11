/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Search, UserCheck, TestTube, Smartphone, MessageSquareCode, Sparkles } from 'lucide-react';
import { getWhatsAppBookingUrl } from '../utils/whatsapp';

export default function HomeTestTimeline() {
  const steps = [
    {
      num: '01',
      title: 'Choose Tests',
      desc: 'Patients select only the tests they need or pick from our curated wellness screening packages.',
      icon: <Search className="w-6 h-6 text-[#0066CC]" />,
      color: 'bg-[#EAF7FF] border-[#0066CC]/20 text-[#0066CC]',
      badge: 'Pathology & Radiology'
    },
    {
      num: '02',
      title: '60 Minute Collection',
      desc: 'Certified medical professional (phlebotomist) arrives at your doorstep in a sterile uniform with specialized vacuum tubes.',
      icon: <UserCheck className="w-6 h-6 text-emerald-500" />,
      color: 'bg-emerald-50 border-emerald-500/10 text-emerald-600',
      badge: 'Sterile & Painless'
    },
    {
      num: '03',
      title: 'Quality Processing',
      desc: 'Samples undergo state-of-the-art double-blind clinical audits across fully automated analyzers to eliminate any errors.',
      icon: <TestTube className="w-6 h-6 text-indigo-500" />,
      color: 'bg-indigo-50 border-indigo-500/10 text-indigo-600',
      badge: 'NABL Standard Audit'
    },
    {
      num: '04',
      title: 'Digital Reports',
      desc: 'Smart, simplified lab reports are formatted and delivered directly via WhatsApp and Email within 24 hours.',
      icon: <Smartphone className="w-6 h-6 text-[#00A884]" />,
      color: 'bg-teal-50 border-teal-500/10 text-teal-600',
      badge: 'WhatsApp Delivery'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative backdrop blobs */}
      <div className="absolute top-1/3 left-0 w-96 h-96 rounded-full bg-[#EAF7FF]/30 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EAF7FF] text-[#0066CC] rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seamless Diagnostics @ Home</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
          >
            How Home Diagnostics Works
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-slate-500"
          >
            Experience a stress-free, clinic-grade testing experience without leaving the comfort of your living room.
          </motion.p>
        </div>

        {/* Premium Timeline Layout */}
        <div className="relative">
          {/* Central Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#0066CC]/10 via-emerald-500/15 to-transparent -translate-x-1/2 z-0" />

          <div className="space-y-12 lg:space-y-24">
            {steps.map((step, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={step.num}
                  className={`flex flex-col lg:flex-row items-stretch gap-8 lg:gap-16 relative z-10 ${
                    isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                  id={`timeline-step-${idx}`}
                >
                  {/* Left or Right Content Box */}
                  <div className="w-full lg:w-1/2 flex items-center">
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.6 }}
                      className="p-8 rounded-[24px] bg-white border border-[#E8EEF5] hover:border-[#0066CC]/30 hover:shadow-2xl hover:shadow-slate-100 transition-all duration-300 w-full relative group"
                    >
                      {/* Step Number Badge */}
                      <div 
                        className="absolute top-6 right-6 text-4xl sm:text-5xl font-black select-none transition-colors"
                        style={{
                          color: '#000000',
                          backgroundColor: idx === 1 ? '#ffffff' : undefined
                        }}
                      >
                        {step.num}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#0066CC] uppercase tracking-wider mb-2">
                          {step.badge}
                        </span>
                        
                        <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-[#0066CC] transition-colors">
                          {step.title}
                        </h3>
                        
                        <p className="text-slate-500 text-sm leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Central Node Visuals */}
                  <div className="hidden lg:flex items-center justify-center relative">
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className={`w-14 h-14 rounded-full border-4 border-white shadow-lg flex items-center justify-center relative z-20 ${step.color} outline-8 outline-[#F8FBFF]`}
                    >
                      {step.icon}
                    </motion.div>
                  </div>

                  {/* Empty Spacer Side (Desktop) */}
                  <div className="hidden lg:block w-1/2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* WhatsApp Call to Action Integration */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-6 md:p-8 rounded-[24px] bg-emerald-50 border border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-6"
          id="timeline-whatsapp-action-banner"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-2xl text-white shrink-0 shadow-md">
              <MessageSquareCode className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-extrabold text-slate-800">Prefer booking on WhatsApp?</h4>
              <p className="text-slate-500 text-sm mt-0.5">Simply send your prescription to receive a free pricing quote instantly.</p>
            </div>
          </div>
          <a
            href={getWhatsAppBookingUrl('Home Collection Health Test')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm rounded-full transition-all shadow-md hover:shadow-lg text-center"
            id="whatsapp-direct-link"
          >
            <span>Book Via WhatsApp</span>
          </a>
        </motion.div>

      </div>
    </section>
  );
}
