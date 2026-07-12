/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Scan, ChevronRight, Activity, HelpCircle, HeartPulse, CheckSquare, MessageCircle } from 'lucide-react';
import { RadiologyService } from '../types';
import { radiologyServices } from '../data';
import { getWhatsAppBookingUrl } from '../utils/whatsapp';
import PrescriptionUploadSection from './PrescriptionUploadSection';

interface RadiologySectionProps {
  onBookRadiology: (radiology: { type: 'Radiology'; id: string; name: string; price: number; autoPay?: boolean }) => void;
  onAddToEstimate?: (item: { type: 'Package' | 'RoutineTest' | 'Radiology'; id: string; name: string; price: number }) => void;
  services?: RadiologyService[];
}

export default function RadiologySection({ onBookRadiology, onAddToEstimate, services }: RadiologySectionProps) {
  const activeServices = services || radiologyServices;

  const getWhatsAppUrl = (service: RadiologyService) => {
    return getWhatsAppBookingUrl(service.name);
  };

  return (
    <section id="radiology" className="py-24 bg-[#F8FBFF] relative overflow-hidden">
      {/* Background design accents */}
      <div className="absolute right-0 top-1/3 w-80 h-80 rounded-full bg-blue-100/30 blur-[110px] pointer-events-none" />
      <div className="absolute left-12 bottom-12 w-80 h-80 rounded-full bg-emerald-100/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EAF7FF] text-[#0066CC] rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Advanced Clinical Imaging</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
          >
            High-Resolution Radiology & Scans
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-slate-500"
          >
            Equipped with state-of-the-art low-exposure imaging and 3D diagnostics. Read and verified by senior MD Radiologists.
          </motion.p>
        </div>

        {/* Radiology & WhatsApp Contact Block */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Radiology Calls Only */}
          <div className="p-6 rounded-[24px] bg-slate-50 border border-[#E8EEF5] flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3.5 bg-blue-50 text-[#0066CC] rounded-2xl shrink-0">
              <span className="text-xl font-bold">📞</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">Radiology (Calls Only)</h4>
              <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">+91 98337 71935</p>
              <p className="text-[10px] font-semibold text-[#0066CC] mt-0.5">Calls Only • No WhatsApp</p>
            </div>
          </div>

          {/* WhatsApp Booking */}
          <div className="p-6 rounded-[24px] bg-emerald-50/50 border border-emerald-100/60 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3.5 bg-emerald-100/80 text-emerald-600 rounded-2xl shrink-0">
              <span className="text-xl font-bold">📱</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider leading-none">WhatsApp Booking</h4>
              <p className="text-base sm:text-lg font-extrabold text-emerald-700 mt-1">7039394488</p>
              <p className="text-[10px] font-semibold text-[#00A884] mt-0.5">WhatsApp Appointments & Enquiries</p>
            </div>
          </div>
        </div>

        {/* Clinic Schedules & Doctor Availability Bento Grid */}
        <div className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sonography Card */}
          <div className="bg-white border border-[#E8EEF5] rounded-[24px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🩺</span>
                <h4 className="text-base font-extrabold text-slate-800">Sonography (USG)</h4>
              </div>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">Fixed Time:</span>
                  <span className="font-bold text-[#0066CC]">10:30 AM</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">Appointment:</span>
                  <span className="font-bold text-rose-600 uppercase tracking-wider text-[10px] bg-rose-50 px-2 py-0.5 rounded-md">Compulsory</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">Walk-ins:</span>
                  <span className="font-semibold text-rose-500">Not Accepted</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">Prescription:</span>
                  <span className="font-bold text-rose-600 uppercase tracking-wider text-[10px] bg-rose-50 px-2 py-0.5 rounded-md">Compulsory</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Sundays:</span>
                  <span className="font-semibold text-slate-400">Closed</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons Row */}
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-12 gap-1.5">
              <button
                onClick={() => onBookRadiology({ type: 'Radiology', id: 'rad-sonography', name: 'Sonography (USG)', price: 2200 })}
                className="col-span-5 py-2 px-1 bg-[#0066CC] hover:bg-[#0052CC] active:scale-95 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer flex items-center justify-center"
                style={{ minHeight: '38px' }}
              >
                <span>Book</span>
              </button>
              <button
                onClick={() => onBookRadiology({ type: 'Radiology', id: 'rad-sonography', name: 'Sonography (USG)', price: 2200, autoPay: true })}
                className="col-span-4 py-2 px-1 bg-gradient-to-r from-[#00A884] to-[#008f6f] hover:from-[#008f6f] hover:to-[#007a5f] active:scale-95 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer flex items-center justify-center"
                style={{ minHeight: '38px' }}
              >
                <span>Pay</span>
              </button>
              <button
                onClick={() => onAddToEstimate && onAddToEstimate({ type: 'Radiology', id: 'rad-sonography', name: 'Sonography (USG)', price: 2200 })}
                className="col-span-3 py-2 px-1 bg-slate-100 hover:bg-[#0066CC]/10 text-slate-700 hover:text-[#0066CC] border border-slate-200 hover:border-[#0066CC]/30 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer flex items-center justify-center"
                style={{ minHeight: '38px' }}
              >
                <span>+Cart</span>
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-[24px] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0066CC] font-bold text-xs flex items-center justify-center shrink-0">RG</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Radiologist</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">Dr. Reshma Gokran</p>
              </div>
            </div>
          </div>

          {/* X-Ray Card */}
          <div className="bg-white border border-[#E8EEF5] rounded-[24px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🩻</span>
                <h4 className="text-base font-extrabold text-slate-800">X-Ray Department</h4>
              </div>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">Operating Hours:</span>
                  <span className="font-bold text-[#00A884]">9:00 AM – 7:00 PM</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">Walk-ins:</span>
                  <span className="font-semibold text-emerald-600">Accepted</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Processing:</span>
                  <span className="font-semibold text-slate-600">High-Resolution Digital</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons Row */}
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-12 gap-1.5">
              <button
                onClick={() => onBookRadiology({ type: 'Radiology', id: 'rad-xray', name: 'Digital X-Ray', price: 500 })}
                className="col-span-5 py-2 px-1 bg-[#0066CC] hover:bg-[#0052CC] active:scale-95 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer flex items-center justify-center"
                style={{ minHeight: '38px' }}
              >
                <span>Book</span>
              </button>
              <button
                onClick={() => onBookRadiology({ type: 'Radiology', id: 'rad-xray', name: 'Digital X-Ray', price: 500, autoPay: true })}
                className="col-span-4 py-2 px-1 bg-gradient-to-r from-[#00A884] to-[#008f6f] hover:from-[#008f6f] hover:to-[#007a5f] active:scale-95 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer flex items-center justify-center"
                style={{ minHeight: '38px' }}
              >
                <span>Pay</span>
              </button>
              <button
                onClick={() => onAddToEstimate && onAddToEstimate({ type: 'Radiology', id: 'rad-xray', name: 'Digital X-Ray', price: 500 })}
                className="col-span-3 py-2 px-1 bg-slate-100 hover:bg-[#0066CC]/10 text-slate-700 hover:text-[#0066CC] border border-slate-200 hover:border-[#0066CC]/30 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer flex items-center justify-center"
                style={{ minHeight: '38px' }}
              >
                <span>+Cart</span>
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-[24px]">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Availability</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">No appointment needed for standard chest/bone digital scans</p>
            </div>
          </div>

          {/* 2D Echo Card */}
          <div className="bg-white border border-[#E8EEF5] rounded-[24px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💖</span>
                <h4 className="text-base font-extrabold text-slate-800">2D Echo (Cardiology)</h4>
              </div>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">Available:</span>
                  <span className="font-bold text-indigo-600">4:00 PM – 4:30 PM</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-500">Mode:</span>
                  <span className="font-bold text-indigo-600 uppercase tracking-wider text-[10px] bg-indigo-50 px-2 py-0.5 rounded-md">By Appointment Only</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Sundays:</span>
                  <span className="font-semibold text-slate-400">Closed</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons Row */}
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-12 gap-1.5">
              <button
                onClick={() => onBookRadiology({ type: 'Radiology', id: 'rad-2decho', name: '2D Echo (Cardiology)', price: 2000 })}
                className="col-span-5 py-2 px-1 bg-[#0066CC] hover:bg-[#0052CC] active:scale-95 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer flex items-center justify-center"
                style={{ minHeight: '38px' }}
              >
                <span>Book</span>
              </button>
              <button
                onClick={() => onBookRadiology({ type: 'Radiology', id: 'rad-2decho', name: '2D Echo (Cardiology)', price: 2000, autoPay: true })}
                className="col-span-4 py-2 px-1 bg-gradient-to-r from-[#00A884] to-[#008f6f] hover:from-[#008f6f] hover:to-[#007a5f] active:scale-95 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer flex items-center justify-center"
                style={{ minHeight: '38px' }}
              >
                <span>Pay</span>
              </button>
              <button
                onClick={() => onAddToEstimate && onAddToEstimate({ type: 'Radiology', id: 'rad-2decho', name: '2D Echo (Cardiology)', price: 2000 })}
                className="col-span-3 py-2 px-1 bg-slate-100 hover:bg-[#0066CC]/10 text-slate-700 hover:text-[#0066CC] border border-slate-200 hover:border-[#0066CC]/30 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer flex items-center justify-center"
                style={{ minHeight: '38px' }}
              >
                <span>+Cart</span>
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-[24px] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0">YS</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Cardiologist</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">Dr. Yogesh Solanki</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prescription Upload Required Flow Card */}
        <div className="mb-16">
          <PrescriptionUploadSection type="Radiology" availableTests={activeServices} />
        </div>

        {/* Radiology Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {activeServices.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -6, boxShadow: '0 25px 30px -5px rgb(0 102 204 / 0.04), 0 10px 15px -6px rgb(0 102 204 / 0.03)' }}
              className="bg-white border border-[#E8EEF5] rounded-[28px] p-8 transition-all duration-300 flex flex-col justify-between group"
              id={`radiology-card-${service.id}`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[#0066CC] group-hover:bg-[#EAF7FF] transition-all">
                    {service.id === 'rad-ecg' ? <Activity className="w-6 h-6" /> : <Scan className="w-6 h-6" />}
                  </div>
                  
                  {/* Partner Discount Indicator Badge */}
                  <span className="text-[10px] font-extrabold text-[#00A884] uppercase tracking-wider bg-emerald-100/60 px-3 py-1 rounded-full">
                    Partner Discount Available
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#0066CC] transition-colors mb-2">
                  {service.name}
                </h3>
                
                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  {service.description}
                </p>

                {/* Bullet Specifications */}
                <div className="space-y-2 mb-8" id={`radiology-specs-${service.id}`}>
                  {service.specifications.map((spec, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <CheckSquare className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Price Block and CTA Row */}
              <div className="pt-6 border-t border-[#E8EEF5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Dual pricing display */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-slate-400">Market Price:</span>
                    <span className="text-sm font-bold text-slate-500 line-through">₹{service.price}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xs font-bold text-slate-900 font-sans">Regular Price:</span>
                    <span className="text-xl font-extrabold text-[#00A884]">₹{service.bmcPrice}</span>
                  </div>
                </div>

                {/* CTA Buttons Row */}
                <div className="grid grid-cols-12 gap-2 w-full">
                  {/* WhatsApp Enquiry Button */}
                  <a
                    href={getWhatsAppUrl(service)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-2 inline-flex items-center justify-center h-11 rounded-[14px] bg-[#EAFBEF] hover:bg-emerald-500 text-emerald-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
                    title="Inquire via WhatsApp"
                    style={{ minHeight: '44px' }}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>

                  {/* Book Imaging Slot */}
                  <button
                    onClick={() => onBookRadiology({ type: 'Radiology', id: service.id, name: service.name, price: service.bmcPrice })}
                    className="col-span-4 h-11 bg-[#0066CC] hover:bg-[#0052CC] active:scale-95 text-white font-bold text-xs rounded-[14px] shadow-lg shadow-blue-200 hover:shadow-xl transition-all duration-300 text-center cursor-pointer flex items-center justify-center gap-1"
                    style={{ minHeight: '44px' }}
                  >
                    <span>Book</span>
                  </button>

                  {/* Pay Slot */}
                  <button
                    onClick={() => onBookRadiology({ type: 'Radiology', id: service.id, name: service.name, price: service.bmcPrice, autoPay: true })}
                    className="col-span-3 h-11 bg-gradient-to-r from-[#00A884] to-[#008f6f] hover:from-[#008f6f] hover:to-[#007a5f] active:scale-95 text-white font-bold text-xs rounded-[14px] shadow-lg shadow-emerald-200 hover:shadow-xl transition-all duration-300 text-center cursor-pointer flex items-center justify-center"
                    style={{ minHeight: '44px' }}
                  >
                    <span>Pay</span>
                  </button>

                  {/* Add to Estimate Button */}
                  <button
                    onClick={() => onAddToEstimate && onAddToEstimate({ type: 'Radiology', id: service.id, name: service.name, price: service.bmcPrice })}
                    className="col-span-3 h-11 bg-slate-100 hover:bg-[#0066CC]/10 text-slate-700 hover:text-[#0066CC] border border-slate-200 hover:border-[#0066CC]/30 font-bold text-xs rounded-[14px] transition-all duration-300 text-center cursor-pointer flex items-center justify-center"
                    style={{ minHeight: '44px' }}
                    title="Add to Cart"
                  >
                    <span>+Cart</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Corporate & Partner notice */}
        <div className="mt-16 p-6 rounded-[24px] bg-[#EAF7FF] border border-blue-200/50 text-center max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="p-2 bg-white rounded-xl text-[#0066CC] shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs text-[#0066CC] font-medium text-left leading-relaxed">
            <strong>Are you a municipal or corporate partner?</strong> Show your BMC employee card or corporate partner ID during registration to claim flat BMC discount pricing on all radiological procedures.
          </p>
        </div>

      </div>
    </section>
  );
}
