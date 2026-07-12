/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Calendar, MapPin, ShieldCheck, Search, ChevronDown, Sparkles, MessageSquare, CreditCard, QrCode, Copy, Check, Upload, CheckCircle, X, RefreshCw } from 'lucide-react';
import { healthPackages, routineTests, radiologyServices } from '../data';
import { getWhatsAppBookingUrl, getWhatsAppPrescriptionUrl } from '../utils/whatsapp';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { storageService } from '../services/storageService';

interface ContactFormProps {
  preselectedItem?: { type: 'Package' | 'RoutineTest' | 'Radiology'; id: string; name: string; price: number; autoPay?: boolean } | null;
  onClearPreselected?: () => void;
}

export default function ContactForm({ preselectedItem, onClearPreselected }: ContactFormProps) {
  // Custom Selection Dropdown States
  const [selectedItemType, setSelectedItemType] = useState<'Package' | 'RoutineTest' | 'Radiology'>('Package');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [localQrCodeUrl, setLocalQrCodeUrl] = useState<string>('');
  
  // Sync preselected items from clicking other CTAs
  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemType(preselectedItem.type);
      setSelectedItemId(preselectedItem.id);
      setItemSearchQuery('');

      if (preselectedItem.autoPay) {
        setTimeout(() => {
          handlePayNowUPI();
        }, 300);
      }
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

  // Dynamic UPI payment states
  const [isUPIModalOpen, setIsUPIModalOpen] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string | null>(null);
  const [isUPIPaymentSubmitted, setIsUPIPaymentSubmitted] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [copiedUPI, setCopiedUPI] = useState(false);

  // Edit this UPI ID to your active clinic UPI ID (e.g. UPI ID or GPay/PhonePe business ID)
  const CLINIC_UPI_ID = "amensadiagnostics@okhdfcbank";

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

  const handleWhatsAppBooking = async () => {
    const isAddressValid = collectionType === 'Walk-in' || address.trim() !== '';

    if (!patientName.trim() || !patientPhone.trim() || !patientAge.trim() || !isAddressValid) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);

    try {
      // Save booking in Firestore
      await bookingService.createBooking({
        patientName,
        patientAge: Number(patientAge) || 30,
        patientGender: (patientGender === 'Male' || patientGender === 'Female' || patientGender === 'Other') ? patientGender : 'Other',
        mobile: patientPhone,
        selectedItemType: selectedItemType,
        selectedItemId: selectedItemId,
        selectedItemName: activeSelectedItem.name,
        bookingType: collectionType === 'Home Collection' ? 'HomeCollection' : 'CenterVisit',
        preferredDate: preferredDate || new Date().toISOString().split('T')[0],
        preferredTimeSlot: preferredTime,
        address: collectionType === 'Home Collection' ? address : undefined,
        locationId: collectionType === 'Walk-in' ? preferredBranch : undefined,
        status: 'Pending',
        pricePaid: activeSelectedItem.price
      });
    } catch (dbErr) {
      console.warn('Silent fallback: Saved booking to Firestore deferred/completed:', dbErr);
    }

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

  function handlePayNowUPI() {
    const isAddressValid = collectionType === 'Walk-in' || address.trim() !== '';

    if (!patientName.trim() || !patientPhone.trim() || !patientAge.trim() || !isAddressValid) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);
    setIsUPIModalOpen(true);
  }

  // Construct secure upi deep link and dynamic qr code server link
  const cleanPackageNameForNote = activeSelectedItem.name.replace(/[^a-zA-Z0-9]/g, '-');
  const upiUrl = `upi://pay?pa=${CLINIC_UPI_ID}&pn=${encodeURIComponent("Amensa Diagnostics")}&am=${activeSelectedItem.price}&cu=INR&tn=${encodeURIComponent(`Booking-${cleanPackageNameForNote}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  // Generate self-contained local QR code in production to avoid ad-blockers / CORS / CDN 404 failures on Netlify
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(upiUrl, {
      width: 250,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
      .then(url => {
        if (active) {
          setLocalQrCodeUrl(url);
        }
      })
      .catch(err => {
        console.error('Local QR Code Generation Error:', err);
      });
    return () => {
      active = false;
    };
  }, [upiUrl]);

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
              <div className="pt-4 border-t border-[#E8EEF5] flex flex-col lg:flex-row items-center justify-between gap-4">
                <p className="text-[10px] text-slate-400 leading-relaxed text-center lg:text-left max-w-xs">
                  Our certified phlebotomists are ready for gold standard sterile home collections. Pay online instantly using secure UPI or route via WhatsApp.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={handlePayNowUPI}
                    className="w-full sm:w-auto px-6 py-4 bg-[#0066CC] hover:bg-[#0052CC] active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-100 hover:shadow-xl transition-all cursor-pointer text-center whitespace-nowrap flex items-center justify-center gap-2"
                    id="form-pay-now-upi-btn"
                  >
                    <CreditCard className="w-4.5 h-4.5" />
                    <span>Pay Now (Instant UPI)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsAppBooking}
                    className="w-full sm:w-auto px-6 py-4 bg-[#00A884] hover:bg-[#008f6f] active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-100 hover:shadow-xl transition-all cursor-pointer text-center whitespace-nowrap flex items-center justify-center gap-2"
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

      </div>
      {/* Dynamic UPI Payment Modal */}
      <AnimatePresence>
        {isUPIModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-50 text-[#0066CC] rounded-xl">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-slate-900 text-sm leading-tight">Instant UPI Payment</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Secure Scan & Pay Gateway</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsUPIModalOpen(false);
                    setIsUPIPaymentSubmitted(false);
                    setPaymentScreenshot(null);
                    setPaymentScreenshotUrl(null);
                  }}
                  className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {!isUPIPaymentSubmitted ? (
                  <>
                    {/* Booking Details Summary */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5 text-left text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold uppercase text-[9px]">Patient Name</span>
                        <span className="font-bold text-slate-800">{patientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold uppercase text-[9px]">Booking Item</span>
                        <span className="font-extrabold text-slate-800 truncate max-w-[200px]" title={activeSelectedItem.name}>{activeSelectedItem.name}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200/60 pt-2.5">
                        <span className="text-slate-400 font-extrabold uppercase text-[9px]">Amount Due</span>
                        <span className="font-mono font-black text-base text-[#0066CC]">₹{activeSelectedItem.price}</span>
                      </div>
                    </div>

                    {/* Step 1: Complete UPI Transaction */}
                    <div className="space-y-3.5 text-left">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Step 1: Complete UPI Transaction</h4>
                      
                      {/* Mobile App Intent button & Desktop QR code */}
                      <div className="space-y-3">
                        {/* Mobile Deep Link - visible on touch devices */}
                        <div className="md:hidden">
                          <a
                            href={upiUrl}
                            className="w-full py-4 px-6 bg-[#0066CC] hover:bg-[#0052CC] text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2.5 uppercase tracking-wider active:scale-98 transition-all text-center"
                          >
                            <span>📱 Tap to Pay via UPI App</span>
                          </a>
                          <p className="text-[10px] text-slate-400 font-medium text-center mt-2 leading-tight">
                            Select Google Pay, PhonePe, Paytm, or BHIM after tapping.
                          </p>
                        </div>

                        {/* Copy UPI ID */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs">
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Clinic UPI ID</p>
                            <p className="font-mono font-bold text-slate-800 mt-0.5">{CLINIC_UPI_ID}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(CLINIC_UPI_ID);
                              setCopiedUPI(true);
                              setTimeout(() => setCopiedUPI(false), 2000);
                            }}
                            className="py-1.5 px-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-[#0066CC] transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            {copiedUPI ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-extrabold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy ID</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* QR Code Container */}
                        <div className="flex flex-col items-center justify-center py-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                          <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100/80">
                            <img
                              src={localQrCodeUrl || qrCodeUrl}
                              alt="UPI QR Code"
                              className="w-36 h-36 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mt-3">
                            Scan with any UPI App to Pay
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5 text-center px-4 leading-tight">
                            Amount and notes are pre-filled securely.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Upload Screenshot */}
                    <div className="space-y-3 pt-2 text-left">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Step 2: Upload Payment Proof</h4>
                      
                      <div className="space-y-3">
                        {/* Drag and Drop File Input */}
                        <div
                          className={`border-2 border-dashed rounded-2xl p-4 transition-all text-center relative ${
                            paymentScreenshotUrl
                              ? 'border-emerald-300 bg-emerald-50/10'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/20'
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            id="upi-screenshot-file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPaymentScreenshot(file);
                                setPaymentScreenshotUrl(URL.createObjectURL(file));
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          {!paymentScreenshotUrl ? (
                            <div className="space-y-1.5 flex flex-col items-center justify-center py-2">
                              <Upload className="w-5 h-5 text-slate-400" />
                              <p className="text-xs font-bold text-slate-700">Upload Transaction Screenshot</p>
                              <p className="text-[10px] text-slate-400">Drag & drop or tap to select image</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-left p-1">
                              <img
                                src={paymentScreenshotUrl}
                                alt="Screenshot Preview"
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0"
                              />
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-800 truncate">
                                  {paymentScreenshot ? paymentScreenshot.name : 'screenshot.png'}
                                </p>
                                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                                  <Check className="w-3 h-3" /> Ready to Verify
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPaymentScreenshot(null);
                                  setPaymentScreenshotUrl(null);
                                }}
                                className="ml-auto p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer relative z-20 animate-fade-in"
                                title="Remove Image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Send via WhatsApp Button */}
                        <button
                          type="button"
                          disabled={isSubmittingPayment}
                          onClick={async () => {
                            setIsSubmittingPayment(true);
                            let uploadedUrl = '';
                            let bookingId = `AMS-B${Math.floor(100000 + Math.random() * 900000)}`;
                            const paymentId = `AMS-PAY-${Math.floor(100000 + Math.random() * 900000)}`;

                            try {
                              // 1. Upload screenshot if present
                              if (paymentScreenshot) {
                                try {
                                  uploadedUrl = await storageService.uploadFile(paymentScreenshot, 'payment-screenshots');
                                } catch (uploadErr) {
                                  console.error('Firebase Storage upload failed:', uploadErr);
                                }
                              }

                              // 2. Create booking in Firestore
                              try {
                                const createdId = await bookingService.createBooking({
                                  patientName,
                                  patientAge: Number(patientAge) || 30,
                                  patientGender: (patientGender === 'Male' || patientGender === 'Female' || patientGender === 'Other') ? patientGender : 'Other',
                                  mobile: patientPhone,
                                  selectedItemType: selectedItemType,
                                  selectedItemId: selectedItemId,
                                  selectedItemName: activeSelectedItem.name,
                                  bookingType: collectionType === 'Home Collection' ? 'HomeCollection' : 'CenterVisit',
                                  preferredDate: preferredDate || new Date().toISOString().split('T')[0],
                                  preferredTimeSlot: preferredTime,
                                  address: collectionType === 'Home Collection' ? address : undefined,
                                  locationId: collectionType === 'Walk-in' ? preferredBranch : undefined,
                                  status: 'Paid',
                                  pricePaid: activeSelectedItem.price
                                });
                                if (createdId) {
                                  bookingId = createdId;
                                }
                              } catch (bookErr) {
                                console.error('Booking registration failed in Firestore:', bookErr);
                              }

                              // 3. Create payment in Firestore
                              try {
                                await paymentService.createPayment({
                                  paymentId,
                                  bookingId,
                                  patientName,
                                  patientPhone,
                                  patientEmail: '',
                                  serviceName: activeSelectedItem.name,
                                  serviceCategory: selectedItemType,
                                  packageName: selectedItemType === 'Package' ? activeSelectedItem.name : '',
                                  amount: activeSelectedItem.price,
                                  paymentMethod: 'UPI',
                                  paymentStatus: 'Paid',
                                  transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
                                  paymentScreenshotURL: uploadedUrl,
                                  verificationStatus: 'Pending',
                                  notes: 'Uploaded via Patient Payment Portal'
                                });
                              } catch (payErr) {
                                console.error('Payment record writing failed:', payErr);
                              }
                            } catch (err) {
                              console.error('Unified payment submission workflow error:', err);
                            } finally {
                              setIsSubmittingPayment(false);
                            }

                            const msg = `Hello,

I have completed my payment.

Receipt ID: ${paymentId}
Booking ID: ${bookingId}
Name: ${patientName}
Phone Number: ${patientPhone}
Package: ${activeSelectedItem.name}
Amount Paid: ₹${activeSelectedItem.price}

I have uploaded my payment screenshot for verification.`;

                            const waUrl = `https://wa.me/917039394488?text=${encodeURIComponent(msg)}`;
                            window.open(waUrl, '_blank', 'noopener,noreferrer');
                            setIsUPIPaymentSubmitted(true);
                          }}
                          className="w-full py-3.5 bg-[#00A884] hover:bg-[#008f6f] text-white font-extrabold text-xs rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingPayment ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Securing Transaction...</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4" />
                              <span>Send Screenshot via WhatsApp</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 px-4 space-y-5">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm">
                      <CheckCircle className="w-8 h-8 stroke-[2.5]" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-extrabold text-slate-900 leading-tight">Verification In Progress!</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                        "Your payment will be verified by our team. Your appointment will be confirmed shortly."
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs space-y-2 text-left">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold uppercase text-[9px]">Patient</span>
                        <span className="font-bold text-slate-800">{patientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold uppercase text-[9px]">Amount Paid</span>
                        <span className="font-bold text-slate-800">₹{activeSelectedItem.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold uppercase text-[9px]">Payment Mode</span>
                        <span className="font-bold text-slate-800">Instant UPI</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUPIModalOpen(false);
                        setIsUPIPaymentSubmitted(false);
                        setPaymentScreenshot(null);
                        setPaymentScreenshotUrl(null);
                      }}
                      className="px-6 py-3 bg-[#0066CC] hover:bg-[#0052CC] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Close Portal
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
