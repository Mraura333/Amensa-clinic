/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, Award, ShieldCheck, HeartPulse, UserCheck, Truck, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function TrustBanner() {
  const badges = [
    {
      icon: <Award className="w-5 h-5 text-[#0066CC]" />,
      label: 'NABL Guidelines',
      desc: 'We follow protocols'
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      label: 'ISO 9001:2015',
      desc: 'Quality Certified'
    },
    {
      icon: <HeartPulse className="w-5 h-5 text-rose-500" />,
      label: 'Advanced Tech',
      desc: 'Automated Systems'
    },
    {
      icon: <UserCheck className="w-5 h-5 text-blue-600" />,
      label: 'Doctor Verified',
      desc: 'MD Sign-off'
    },
    {
      icon: <Truck className="w-5 h-5 text-amber-500" />,
      label: 'Free Collection',
      desc: 'Sterile Sealed Kits'
    },
    {
      icon: <Clock className="w-5 h-5 text-indigo-500" />,
      label: '24 Hr Reports',
      desc: 'Fast Turnaround'
    }
  ];

  return (
    <section className="bg-white border-y border-[#E8EEF5] py-8 overflow-hidden" id="trust-banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Label */}
          <div className="shrink-0 text-center md:text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Amensa Trust Index</p>
            <h4 className="text-lg font-extrabold text-slate-800">Why Patients Trust Us</h4>
          </div>

          {/* Badges Grid */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {badges.map((badge, idx) => (
              <motion.div
                key={badge.label}
                whileHover={{ y: -3, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FBFF] border border-[#E8EEF5] hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all duration-300"
              >
                <div className="p-2 bg-white rounded-xl shadow-sm border border-[#E8EEF5] shrink-0">
                  {badge.icon}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-xs font-bold text-slate-900">{badge.label}</span>
                  <span className="text-[9px] text-slate-400 font-semibold mt-0.5">{badge.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
