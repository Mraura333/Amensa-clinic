/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Sparkles, CheckCircle, MessageSquare, ArrowRight } from 'lucide-react';
import { getWhatsAppPrescriptionUrl } from '../utils/whatsapp';

interface PrescriptionUploadSectionProps {
  type: 'Radiology' | 'Blood Test';
  availableTests?: { id: string; name: string }[];
}

export default function PrescriptionUploadSection({ type, availableTests = [] }: PrescriptionUploadSectionProps) {
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedTest, setSelectedTest] = useState(availableTests[0]?.name || '');
  const [preferredDate, setPreferredDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpload = () => {
    const waUrl = getWhatsAppPrescriptionUrl(type, {
      patientName,
      patientPhone,
      testName: selectedTest,
      preferredDate,
    });
    
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setShowSuccess(true);
    
    // Auto-dismiss success message after 15 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 15000);
  };

  return (
    <div 
      className="bg-white border-2 border-emerald-100 rounded-[28px] p-6 sm:p-8 shadow-xl shadow-emerald-500/5 relative overflow-hidden text-left"
      id={`prescription-upload-${type.toLowerCase().replace(' ', '-')}`}
    >
      {/* Decorative backdrop mesh */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-emerald-50/40 blur-[80px] pointer-events-none" />
      
      <div className="relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0 shadow-sm border border-emerald-100/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100/60 text-emerald-700 rounded-md text-[10px] font-extrabold uppercase tracking-widest mb-1.5">
                Required Flow
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Upload Your Doctor's Prescription (Required)
              </h3>
            </div>
          </div>
          <div className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl self-start md:self-center">
            🔒 End-to-End Encrypted via WhatsApp
          </div>
        </div>

        {/* Prescription Requirement Note */}
        <div className="p-4 bg-[#EAF7FF] border border-[#B3DDF2] rounded-2xl text-[#0055B3] text-xs font-semibold flex items-start gap-3 mb-6">
          <Sparkles className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            A valid doctor's prescription is required for selected Radiology and Blood Test services. Please send your prescription via WhatsApp to complete your booking.
          </p>
        </div>

        {/* Patient Details Pre-fill form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Patient Name */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5" htmlFor={`presc-name-${type}`}>
              Patient Name
            </label>
            <input
              id={`presc-name-${type}`}
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5" htmlFor={`presc-phone-${type}`}>
              Mobile Number
            </label>
            <input
              id={`presc-phone-${type}`}
              type="tel"
              placeholder="e.g. 9876543210"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
            />
          </div>

          {/* Preferred Test */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5" htmlFor={`presc-test-${type}`}>
              Preferred Test
            </label>
            {availableTests.length > 0 ? (
              <select
                id={`presc-test-${type}`}
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-800 focus:outline-none transition-all shadow-sm cursor-pointer"
              >
                {availableTests.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            ) : (
              <input
                id={`presc-test-${type}`}
                type="text"
                placeholder="e.g. Sonography / CBC"
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
              />
            )}
          </div>

          {/* Preferred Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5" htmlFor={`presc-date-${type}`}>
              Preferred Date
            </label>
            <input
              id={`presc-date-${type}`}
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-800 focus:outline-none transition-all shadow-sm cursor-pointer"
            />
          </div>
        </div>

        {/* Bottom CTA Block */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-start gap-2.5 max-w-lg">
            <span className="text-sm mt-0.5 shrink-0">💡</span>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              <strong>Seamless Mobile Integration:</strong> Our system will open WhatsApp with your details. Click the paperclip icon (📎) or camera icon within WhatsApp to attach your prescription directly.
            </p>
          </div>

          <button
            onClick={handleUpload}
            className="px-6 py-3.5 bg-[#00A884] hover:bg-[#008f6f] active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-100 hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 border border-emerald-600/10"
            id={`presc-whatsapp-btn-${type.toLowerCase().replace(' ', '-')}`}
          >
            <span className="text-sm leading-none shrink-0">📄</span>
            <span>Upload Prescription via WhatsApp</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Interactive Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
              id={`presc-success-msg-${type.toLowerCase().replace(' ', '-')}`}
            >
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3.5 shadow-sm text-emerald-800 text-xs font-semibold animate-fade-in">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-extrabold text-emerald-900 uppercase tracking-wide text-[10px]">WhatsApp Link Active</p>
                  <p className="text-emerald-700 leading-relaxed font-semibold">
                    WhatsApp has been opened. Please attach your prescription using the camera or gallery and send it to complete your booking.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
