/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Calendar, MapPin, ShieldCheck, Search, ChevronDown, Sparkles, MessageSquare } from 'lucide-react';
import { healthPackages, routineTests, radiologyServices } from '../data';
import { getWhatsAppBookingUrl, getWhatsAppPrescriptionUrl } from '../utils/whatsapp';

interface ContactFormProps {
  preselectedItem?: { type: 'Package' | 'RoutineTest' | 'Radiology'; id: string; name: string; price: number } | null;
  onClearPreselected?: () => void;
}

export default function ContactForm({ preselectedItem, onClearPreselected }: ContactFormProps) {
  // Custom Selection Dropdown States
  const [selectedItemType, setSelectedItemType] = useState<'Package' | 'RoutineTest' | 'Radiology'>('Package');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  
  // Sync preselected items from clicking other CTAs
  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemType(preselectedItem.type);
      setSelectedItemId(preselectedItem.id);
      setItemSearchQuery('');
    }
  }, [preselectedItem]);

  // Consolidate all available products for dynamic search selection dropdown
  const allSelectionItems = useMemo(() => {
    if (selectedItemType === 'Package') {
      return healthPackages.map((p) => ({ id: p.id, name: p.name, price: p.price }));
    } else if (selectedItemType === 'RoutineTest') {
      return routineTests.map((t) => ({ id: t.id, name: t.name, price: t.price }));
    } else {
      return radiologyServices.map((r) => ({ id: r.id, name: r.name, price: r.bmcPrice }));
    }
  }, [selectedItemType]);

  // If a preselected item is present and has no selectedItemId, set it
  useEffect(() => {
    if (!selectedItemId && allSelectionItems.length > 0) {
      setSelectedItemId(allSelectionItems[0].id);
    }
  }, [selectedItemType, allSelectionItems, selectedItemId]);

  const filteredSelectionItems = useMemo(() => {
    if (!itemSearchQuery) return allSelectionItems;
    return allSelectionItems.filter((item) =>
      item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
    );
  }, [allSelectionItems, itemSearchQuery]);

  const activeSelectedItem = useMemo(() => {
    return allSelectionItems.find((i) => i.id === selectedItemId) || allSelectionItems[0] || { name: 'Select item', price: 0 };
  }, [allSelectionItems, selectedItemId]);

  // Booking details states
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('');
  const [preferredBranch, setPreferredBranch] = useState('Mulund East – Secondary Hub');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [collectionType, setCollectionType] = useState<'Home Collection' | 'Walk-in'>('Home Collection');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showFormPrescSuccess, setShowFormPrescSuccess] = useState(false);

  // Address states
  const [address, setAddress] = useState('');

  // Dynamically configure available time options & operational hour guidance based on selected Radiology test
  const { timeOptions, timeSlotNotice } = useMemo(() => {
    let options = [
      "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
      "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
      "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"
    ];
    let notice = "";

    if (selectedItemType === 'Radiology') {
      if (selectedItemId === 'rad-sonography') {
        options = ["10:30 AM"];
        notice = "🩺 Sonography (USG) appointment time is strictly fixed at 10:30 AM. Pre-registration is compulsory (Walk-ins not accepted).";
      } else if (selectedItemId === 'rad-xray') {
        options = [
          "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM",
          "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
        ];
        notice = "🩻 Digital X-Ray is operating from 9:00 AM to 7:00 PM. Walk-ins are highly welcome!";
      } else if (selectedItemId === 'rad-2decho') {
        options = ["04:00 PM - 04:30 PM"];
        notice = "💖 2D Echo cardiology screening is available strictly between 4:00 PM and 4:30 PM (By Appointment Only).";
      } else {
        notice = "🩺 Radiology scans must be done at the clinic. Please choose an in-office appointment slot.";
      }
    }
    return { timeOptions: options, timeSlotNotice: notice };
  }, [selectedItemType, selectedItemId]);

  // Synchronize correct appointment mode and pre-filled times whenever selected radiology test changes
  useEffect(() => {
    if (selectedItemType === 'Radiology') {
      setCollectionType('Walk-in');
      if (selectedItemId === 'rad-sonography') {
        setPreferredTime('10:30 AM');
      } else if (selectedItemId === 'rad-2decho') {
        setPreferredTime('04:00 PM - 04:30 PM');
      } else if (selectedItemId === 'rad-xray') {
        setPreferredTime('09:00 AM');
      }
    }
  }, [selectedItemType, selectedItemId]);

  const handleWhatsAppBooking = () => {
    const isAddressValid = collectionType === 'Walk-in' || address.trim() !== '';

    if (!patientName.trim() || !patientPhone.trim() || !patientAge.trim() || !isAddressValid) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);

    const waUrl = getWhatsAppBookingUrl(activeSelectedItem.name, {
      patientName,
      age: patientAge,
      gender: patientGender,
      phone: patientPhone,
      branch: preferredBranch,
      date: preferredDate,
      time: preferredTime,
      collectionType,
      notes: additionalNotes,
      address
    });
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (onClearPreselected) {
      onClearPreselected();
    }
  };

  return (
    <section id="contact" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative backdrop blobs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-[#EAF7FF]/30 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EAF7FF] text-[#0066CC] rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>WhatsApp Booking Hub</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
          >
            Book via WhatsApp In Seconds
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-slate-500"
          >
            We've streamlined our booking! There's no longer any complex forms or waiting. Simply choose your test and book directly on WhatsApp with our clinical coordinator.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch" id="booking-portal-grid">
          
          {/* Left Column: Coordinates & Operational Info */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6">
            <div className="space-y-6">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Direct Help Desks</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Connect directly with our clinical coordinators for prescription evaluations, package customize requests, or immediate sample collection dispatch.
              </p>

              {/* Contacts info list */}
              <div className="space-y-4">
                {/* Phone */}
                <div className="flex items-start gap-4 bg-slate-50 p-4 rounded-2xl border border-[#E8EEF5]">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-[#0066CC]">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Call Coordinator</h4>
                    <a href="tel:07039394488" className="text-base font-extrabold text-slate-800 hover:text-[#0066CC] hover:underline mt-0.5 block">
                      07039394488
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4 bg-slate-50 p-4 rounded-2xl border border-[#E8EEF5]">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-500">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Prescription desk</h4>
                    <a href="https://wa.me/917039394488?text=Hi%20Amensa%20Diagnostics,%20I'd%20like%20to%20send%20my%20prescription." target="_blank" rel="noopener noreferrer" className="text-base font-extrabold text-slate-800 hover:text-emerald-500 hover:underline mt-0.5 block">
                      07039394488
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 bg-slate-50 p-4 rounded-2xl border border-[#E8EEF5]">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-[#0066CC]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Regional Support Email</h4>
                    <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                      amensadiagnostics@gmail.com
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timings card */}
            <div className="bg-slate-50 border border-[#E8EEF5] rounded-[24px] p-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Punctuality Promise</span>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Operational Hours</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our phlebotomy fleet executes blood collections <strong>every day from 8:00 AM to 9:00 PM</strong>, including Sundays. Reports are pushed digitally within 12-24 hours.
              </p>
            </div>
          </div>

          {/* Right Column: WhatsApp Interactive Selector */}
          <div className="lg:col-span-8 bg-[#F8FBFF] border border-[#E8EEF5] rounded-[32px] p-6 sm:p-10 shadow-xl shadow-slate-100 relative flex flex-col justify-center min-h-[500px]">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E8EEF5] pb-4 mb-2">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Interactive Booking Assistant</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Select a test below to generate your pre-filled WhatsApp request</p>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#00A884] uppercase tracking-wider bg-[#EAFBEF] px-2.5 py-1 rounded-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  Instant Chat Setup
                </span>
              </div>

              {/* Item Lookup Selection Segment */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Choose Diagnostic Category</span>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(['Package', 'RoutineTest', 'Radiology'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedItemType(type);
                        setSelectedItemId('');
                      }}
                      className={`py-3 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all select-none cursor-pointer border ${
                        selectedItemType === type
                          ? 'bg-[#EAF7FF] border-[#0066CC] text-[#0066CC]'
                          : 'bg-white border-[#E8EEF5] text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'RoutineTest' ? 'Routine Test' : type}
                    </button>
                  ))}
                </div>

                {/* Custom Autocomplete Dropdown */}
                <div className="relative">
                  <span className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Select Specific Test / Package</span>
                  <button
                    type="button"
                    onClick={() => setIsItemDropdownOpen(!isItemDropdownOpen)}
                    className="w-full px-4 py-3.5 bg-white border border-[#E8EEF5] hover:border-slate-300 focus:border-[#0066CC] focus:outline-none rounded-xl text-sm text-left flex items-center justify-between cursor-pointer shadow-sm"
                    id="form-item-selector-btn"
                  >
                    <span className="font-semibold text-slate-800">
                      {activeSelectedItem.name} (₹{activeSelectedItem.price})
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {/* Dropdown panel */}
                  {isItemDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#E8EEF5] rounded-xl shadow-2xl z-50 overflow-hidden" id="item-lookup-dropdown-panel">
                      {/* Inner search query */}
                      <div className="p-2.5 border-b border-[#E8EEF5] flex items-center gap-2">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Type to filter..."
                          value={itemSearchQuery}
                          onChange={(e) => setItemSearchQuery(e.target.value)}
                          className="w-full text-xs py-1.5 focus:outline-none bg-transparent"
                          id="item-search-query-form"
                        />
                      </div>
                      
                      {/* List */}
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                        {filteredSelectionItems.length > 0 ? (
                          filteredSelectionItems.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setSelectedItemId(item.id);
                                setIsItemDropdownOpen(false);
                                setItemSearchQuery('');
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex justify-between items-center text-xs"
                            >
                              <span className="font-medium text-slate-700">{item.name}</span>
                              <span className="font-extrabold text-[#0066CC] shrink-0 ml-2">₹{item.price}</span>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-400 text-xs">No items match criteria.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Details & Scheduling Fields */}
              <div className="border-t border-[#E8EEF5] pt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3">Patient & Appointment Details</h4>
                  <p className="text-slate-400 text-xs mt-0.5">Please provide basic details below to pre-fill your official WhatsApp booking request.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name Input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5" htmlFor="booking-name">
                      Patient Name *
                    </label>
                    <input
                      id="booking-name"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#E8EEF5] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
                    />
                  </div>

                  {/* Phone Input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5" htmlFor="booking-phone">
                      Phone Number *
                    </label>
                    <input
                      id="booking-phone"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#E8EEF5] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
                    />
                  </div>

                  {/* Age Input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5" htmlFor="booking-age">
                      Age (Years) *
                    </label>
                    <input
                      id="booking-age"
                      type="number"
                      placeholder="e.g. 32"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      min="1"
                      max="120"
                      className="w-full px-4 py-3 bg-white border border-[#E8EEF5] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
                    />
                  </div>

                  {/* Gender Options */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                      Gender *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Male', 'Female', 'Other'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setPatientGender(g)}
                          className={`py-3 rounded-xl font-semibold text-xs transition-all border cursor-pointer ${
                            patientGender === g
                              ? 'bg-[#EAF7FF] border-[#0066CC] text-[#0066CC]'
                              : 'bg-white border-[#E8EEF5] text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Branch */}
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5" htmlFor="booking-branch">
                      Preferred Branch
                    </label>
                    <select
                      id="booking-branch"
                      value={preferredBranch}
                      onChange={(e) => setPreferredBranch(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#E8EEF5] focus:border-[#0066CC] rounded-xl text-sm text-slate-800 focus:outline-none transition-all shadow-sm cursor-pointer"
                    >
                      <option value="Mulund East – Secondary Hub">Mulund East – Secondary Hub</option>
                      <option value="Mulund East – Sonography Center">Mulund East – Sonography Center</option>
                      <option value="Mulund West – Community Testing Collection Center">Mulund West – Community Testing Collection Center</option>
                      <option value="Dombivli East – Extended Hours Lab">Dombivli East – Extended Hours Lab</option>
                    </select>
                  </div>

                  {/* Home Collection vs Walk-In */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                      Appointment Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Home Collection', 'Walk-in'] as const).map((type) => {
                        const isHomeDisabled = type === 'Home Collection' && selectedItemType === 'Radiology';
                        return (
                          <button
                            key={type}
                            type="button"
                            disabled={isHomeDisabled}
                            onClick={() => setCollectionType(type)}
                            className={`py-3 rounded-xl font-semibold text-xs transition-all border cursor-pointer ${
                              isHomeDisabled
                                ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                                : collectionType === type
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                  : 'bg-white border-[#E8EEF5] text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {type} {isHomeDisabled && "(N/A)"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Conditional Address Fields */}
                  <AnimatePresence initial={false}>
                    {collectionType === 'Home Collection' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="md:col-span-2 overflow-hidden"
                      >
                        <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl space-y-4 mt-2">
                          <h4 className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Home Collection Address *</span>
                          </h4>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1" htmlFor="booking-address">
                              Complete Address *
                            </label>
                            <textarea
                              id="booking-address"
                              rows={3}
                              placeholder="Enter your complete home address (Building/Flat, Street, Area, PIN Code)"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              className="w-full px-4 py-2.5 bg-white border border-[#E8EEF5] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm resize-none"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Preferred Date */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5" htmlFor="booking-date">
                      Preferred Date
                    </label>
                    <input
                      id="booking-date"
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#E8EEF5] focus:border-[#0066CC] rounded-xl text-sm text-slate-800 focus:outline-none transition-all shadow-sm cursor-pointer"
                    />
                  </div>

                  {/* Preferred Time */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5" htmlFor="booking-time">
                      Preferred Time
                    </label>
                    <select
                      id="booking-time"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#E8EEF5] focus:border-[#0066CC] rounded-xl text-sm text-slate-800 focus:outline-none transition-all shadow-sm cursor-pointer"
                    >
                      {timeOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Time Slot Warning/Operational Info Note */}
                  {timeSlotNotice && (
                    <div className="md:col-span-2 p-3.5 bg-[#EAF7FF] border border-[#B3DDF2] rounded-xl text-[#0055B3] text-xs font-bold flex items-start gap-2 animate-fade-in shadow-sm">
                      <Sparkles className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
                      <span>{timeSlotNotice}</span>
                    </div>
                  )}

                  {/* Additional Notes */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5" htmlFor="booking-notes">
                      Additional Notes / Symptoms
                    </label>
                    <textarea
                      id="booking-notes"
                      rows={1}
                      placeholder="e.g. Any symptoms or instructions"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#E8EEF5] focus:border-[#0066CC] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Prescription Section in Booking Form */}
              {(selectedItemType === 'Radiology' || selectedItemType === 'RoutineTest') && (
                <div className="bg-white border-2 border-emerald-100 rounded-2xl p-5 shadow-sm text-left relative overflow-hidden mt-2" id="form-prescription-section">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-50/30 blur-[40px] pointer-events-none" />
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <span className="text-lg">📄</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        Upload Your Doctor's Prescription (Required)
                      </h4>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      A valid doctor's prescription is required for selected Radiology and Blood Test services. Please send your prescription via WhatsApp to complete your booking.
                    </p>
                    
                    {/* Prescription Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const prescType = selectedItemType === 'Radiology' ? 'Radiology' : 'Blood Test';
                        const waUrl = getWhatsAppPrescriptionUrl(prescType, {
                          patientName,
                          patientPhone,
                          testName: activeSelectedItem.name,
                          preferredDate,
                        });
                        window.open(waUrl, '_blank', 'noopener,noreferrer');
                        setShowFormPrescSuccess(true);
                        setTimeout(() => setShowFormPrescSuccess(false), 15000);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#00A884] hover:bg-[#008f6f] text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-600/10"
                    >
                      <span>📄 Upload Prescription via WhatsApp</span>
                    </button>

                    {/* Interactive Success message inside form */}
                    <AnimatePresence>
                      {showFormPrescSuccess && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                          id="form-prescription-success"
                        >
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-semibold leading-relaxed">
                            WhatsApp has been opened. Please attach your prescription using the camera or gallery and send it to complete your booking.
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Validation Errors Panel */}
              {showValidationErrors && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold" id="booking-validation-error">
                  ⚠️ Please fill out Patient Name, Phone Number, Age{collectionType === 'Home Collection' ? ', and complete address' : ''} to complete your WhatsApp request.
                </div>
              )}

              {/* Guide steps */}
              <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/50">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#00A884]" />
                  <span>Your booking workflow</span>
                </h4>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li>Fill in the fields above to automatically build your message.</li>
                  <li>Clicking "Book Selected via WhatsApp" opens WhatsApp Web or your WhatsApp mobile app.</li>
                  <li>Just click send — your pre-filled details will go directly to our care desk for instant booking!</li>
                </ul>
              </div>

              {/* Submission Row */}
              <div className="pt-4 border-t border-[#E8EEF5] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[10px] text-slate-400 leading-relaxed text-center sm:text-left">
                  Our certified phlebotomists are ready for gold standard sterile home collections. WhatsApp booking ensures instant routing!
                </p>
                <button
                  onClick={handleWhatsAppBooking}
                  className="w-full sm:w-auto px-8 py-4 bg-[#00A884] hover:bg-[#008f6f] active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-100 hover:shadow-xl transition-all cursor-pointer text-center whitespace-nowrap flex items-center justify-center gap-2"
                  id="form-submit-booking-btn"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                  <span>Book Selected via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
