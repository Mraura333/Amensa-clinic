/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Cpu, Truck, HeartHandshake, Sparkles, ClipboardCheck } from 'lucide-react';

export default function WhyChooseUs() {
  const points = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-[#0066CC]" />,
      title: 'Accurate Reports',
      desc: 'We follow NABL Standards and Protocols to ensure quality and accuracy in diagnostic services, backed by double-blind quality audits.',
      highlight: '100% Barcoded Automation',
      bgColor: 'from-blue-50/50 to-blue-100/10'
    },
    {
      icon: <Cpu className="w-8 h-8 text-emerald-500" />,
      title: 'Advanced Technology',
      desc: 'State-of-the-art pathology, ECG, X-Ray and Sonography equipment for clinical precision.',
      highlight: 'Siemens & Roche Systems',
      bgColor: 'from-emerald-50/50 to-emerald-100/10'
    },
    {
      icon: <Truck className="w-8 h-8 text-amber-500" />,
      title: 'Free Home Sample Collection',
      desc: 'Certified phlebotomist dispatched within 60 minutes with sterile, cold-chain sealed carrier kits.',
      highlight: '60 Minute Express Dispatch',
      bgColor: 'from-amber-50/50 to-amber-100/10'
    },
    {
      icon: <HeartHandshake className="w-8 h-8 text-indigo-500" />,
      title: 'Expert Support',
      desc: 'Free doctor consultation on selected packages to interpret your diagnostic reports clearly.',
      highlight: 'Tele-Consultation Included',
      bgColor: 'from-indigo-50/50 to-indigo-100/10'
    }
  ];

  return (
    <section id="why-choose" className="py-24 bg-[#F8FBFF] relative overflow-hidden">
      {/* Background design elements */}
      <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-blue-100/30 blur-[100px] pointer-events-none" />
      <div className="absolute left-10 top-10 w-64 h-64 rounded-full bg-[#EAF7FF]/40 blur-[80px] pointer-events-none" />

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
            <span>Uncompromising Diagnostics</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
          >
            Why Choose Amensa Diagnostics?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-slate-500"
          >
            Setting new gold standards in diagnostic accuracy, patient comfort, and digital report transparency across Mumbai.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {points.map((point, idx) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -6, boxShadow: '0 25px 30px -5px rgb(0 102 204 / 0.05), 0 10px 15px -6px rgb(0 102 204 / 0.03)' }}
              className={`p-8 rounded-[24px] bg-white border border-[#E8EEF5] flex flex-col md:flex-row gap-6 items-start transition-all duration-300 relative overflow-hidden group`}
              id={`why-card-${idx}`}
            >
              {/* Card background tint on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${point.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

              {/* Icon Container */}
              <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white group-hover:shadow-md transition-all duration-300 shrink-0 relative z-10 border border-slate-100">
                {point.icon}
              </div>

              {/* Text Area */}
              <div className="flex flex-col relative z-10">
                <span className="text-[10px] font-bold text-[#00A884] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  {point.highlight}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#0066CC] transition-colors">
                  {point.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {point.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Diagnostic Quality Stat Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 p-8 rounded-[30px] bg-gradient-to-r from-[#0066CC] to-[#0052CC] text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8"
          id="quality-audit-highlight-banner"
        >
          <div className="max-w-xl text-center lg:text-left">
            <h4 className="text-2xl font-bold mb-2">Our Double-Blind Quality Audit Guarantee</h4>
            <p className="text-white/80 text-sm leading-relaxed">
              Every pathology sample is labeled with an anonymous barcode and independently tested across two separate clinical automated analyzers. Reports are finalized only when results match 100%.
            </p>
          </div>
          <div className="flex items-center gap-6 divide-x divide-white/20">
            <div className="text-center px-4">
              <p className="text-4xl font-extrabold text-white">99.9%</p>
              <p className="text-white/70 text-xs font-semibold uppercase mt-1">Accuracy Audited</p>
            </div>
            <div className="text-center pl-6 pr-4">
              <p className="text-4xl font-extrabold text-[#00A884]">60 Mins</p>
              <p className="text-white/70 text-xs font-semibold uppercase mt-1">Sample Pickup</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
