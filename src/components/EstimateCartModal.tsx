/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ShieldCheck, Calendar, Phone, Clock, MessageSquare, Calculator, MapPin, CreditCard, QrCode, Landmark, Wallet, Check, AlertTriangle, Loader2, Copy, Upload, CheckCircle } from 'lucide-react';


export interface CartItem {
  id: string;
  name: string;
  price: number;
  type: 'Package' | 'RoutineTest' | 'Radiology';
}

interface EstimateCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

// Utility to load Cashfree SDK script dynamically
const loadCashfreeScript = (): Promise<any> => {
  return new Promise((resolve) => {
    if ((window as any).Cashfree) {
      resolve((window as any).Cashfree);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      resolve((window as any).Cashfree);
    };
    script.onerror = () => {
      resolve(null);
    };
    document.body.appendChild(script);
  });
};

export default function EstimateCartModal({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearCart
}: EstimateCartModalProps) {
  // Patient details states
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

  // Address states
  const [address, setAddress] = useState('');

  // Patient Profile state (for auto-filling if logged in)
  const [patientId, setPatientId] = useState('');
  const [patientEmail, setPatientEmail] = useState('');

  // Payment gateway states
  const [paymentMethod, setPaymentMethod] = useState<'WhatsApp' | 'Online' | 'UPI'>('WhatsApp');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [createdBookings, setCreatedBookings] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCfSimulated, setIsCfSimulated] = useState(false);

  // Dynamic UPI payment states
  const [isUPICheckoutActive, setIsUPICheckoutActive] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState<string | null>(null);
  const [copiedUPI, setCopiedUPI] = useState(false);

  // Edit this UPI ID to your active clinic UPI ID (e.g. UPI ID or GPay/PhonePe business ID)
  const CLINIC_UPI_ID = "amensadiagnostics@okhdfcbank";

  // Pre-fill user profile if logged in
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Guest session');
      })
      .then((data) => {
        if (data && data.id) {
          setPatientId(data.id);
          setPatientName(data.fullName || '');
          setPatientPhone(data.mobile || '');
          setPatientEmail(data.email || '');
          if (data.dob) {
            const birthYear = new Date(data.dob).getFullYear();
            const currentYear = new Date().getFullYear();
            setPatientAge(String(currentYear - birthYear));
          }
          if (data.gender) {
            setPatientGender(data.gender);
          }
          if (data.address) {
            setAddress(data.address);
          }
        }
      })
      .catch(() => {
        // Safe to ignore: user is booking as a guest/anonymous visitor
      });
  }, [isOpen]);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const visitCharge = subtotal > 0 && subtotal < 500 ? 100 : 0;
  const totalAmount = subtotal + visitCharge;

  // Construct secure upi deep link and dynamic qr code server link
  const cartItemNames = items.map(i => i.name).join(', ');
  const cleanItemNamesForNote = cartItemNames.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-');
  const upiUrl = `upi://pay?pa=${CLINIC_UPI_ID}&pn=${encodeURIComponent("Amensa Diagnostics")}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`Booking-${cleanItemNamesForNote}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  // Detect whether specific Radiology items are present in the estimate cart to enforce schedule slots
  const hasSonography = useMemo(() => items.some(item => item.id === 'rad-sonography'), [items]);
  const hasXray = useMemo(() => items.some(item => item.id === 'rad-xray'), [items]);
  const has2dEcho = useMemo(() => items.some(item => item.id === 'rad-2decho'), [items]);
  const hasRadiology = useMemo(() => items.some(item => item.type === 'Radiology'), [items]);

  const { cartTimeOptions, cartTimeSlotNotice } = useMemo(() => {
    let options = [
      "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
      "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
      "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"
    ];
    let notices: string[] = [];

    if (hasSonography) {
      options = ["10:30 AM"];
      notices.push("🩺 Sonography requires a clinic visit. Appointment time is strictly fixed at 10:30 AM.");
    } else if (has2dEcho) {
      options = ["04:00 PM - 04:30 PM"];
      notices.push("💖 2D Echo requires a clinic visit. Appointment time is strictly 4:00 PM – 4:30 PM.");
    } else if (hasXray) {
      options = [
        "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM",
        "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
      ];
      notices.push("🩻 Digital X-Ray operating hours: 9:00 AM to 7:00 PM (Walk-ins Accepted).");
    } else if (hasRadiology) {
      notices.push("🩺 Radiology scans require a clinic visit (Walk-in mode is preselected).");
    }

    return { cartTimeOptions: options, cartTimeSlotNotice: notices.join(" | ") };
  }, [hasSonography, has2dEcho, hasXray, hasRadiology]);

  // Synchronize correct appointment mode and pre-filled times for Cart
  useEffect(() => {
    if (hasRadiology) {
      setCollectionType('Walk-in');
    }
    if (hasSonography) {
      setPreferredTime('10:30 AM');
    } else if (has2dEcho) {
      setPreferredTime('04:00 PM - 04:30 PM');
    } else if (hasXray) {
      const validXrayTimes = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"];
      if (!validXrayTimes.includes(preferredTime)) {
        setPreferredTime('09:00 AM');
      }
    }
  }, [hasRadiology, hasSonography, has2dEcho, hasXray]);

  const handleSendEstimate = () => {
    const isAddressValid = collectionType === 'Walk-in' || address.trim() !== '';

    if (!patientName.trim() || !patientPhone.trim() || !patientAge.trim() || !isAddressValid) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);

    // Build the tests/packages list
    const itemsListText = items
      .map((item) => `• ${item.name} (${item.type})`)
      .join('\n');

    let addressPart = '';
    if (collectionType === 'Home Collection') {
      addressPart = `\n📍 Address: ${address}`;
    }

    let pricingBreakdown = `💵 Total Estimate Amount: ₹${totalAmount}`;
    if (visitCharge > 0) {
      pricingBreakdown = `💵 Tests Subtotal: ₹${subtotal}\n🚗 Visit Charge: ₹${visitCharge} (Below ₹500)\n💰 Total Estimate Amount: ₹${totalAmount}`;
    }

    const message = `Hello Amensa Diagnostics,

I would like to book an appointment.

**Patient Details**
👤 Name: ${patientName}
🎂 Age: ${patientAge}
⚧ Gender: ${patientGender}
📞 Phone Number: ${patientPhone}

🧪 Selected Tests/Packages:
${itemsListText}

${pricingBreakdown}

🏠 Collection Type: ${collectionType}${addressPart}

📅 Preferred Date: ${preferredDate || 'Not specified'}
🕒 Preferred Time: ${preferredTime}${additionalNotes ? `\n\n📝 Additional Notes: ${additionalNotes}` : ''}

Please confirm my appointment. Thank you.`;

    const waUrl = `https://wa.me/917039394488?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleUPIPaymentTrigger = () => {
    const isAddressValid = collectionType === 'Walk-in' || address.trim() !== '';

    if (!patientName.trim() || !patientPhone.trim() || !patientAge.trim() || !isAddressValid) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);
    setIsUPICheckoutActive(true);
  };

  const handleOnlinePayment = async () => {
    const isAddressValid = collectionType === 'Walk-in' || address.trim() !== '';

    if (!patientName.trim() || !patientPhone.trim() || !patientAge.trim() || !isAddressValid) {
      setShowValidationErrors(true);
      return;
    }
    setShowValidationErrors(false);
    setPaymentStatus('processing');
    setErrorMessage(null);

    // Build the clinical bookingDetails object
    const bookingDetails = {
      patientId: patientId || "",
      patientName,
      patientAge: Number(patientAge),
      patientGender,
      mobile: patientPhone,
      email: patientEmail,
      bookingType: collectionType === 'Home Collection' ? 'HomeCollection' : 'CenterVisit',
      preferredDate: preferredDate || new Date().toISOString().split('T')[0],
      preferredTimeSlot: preferredTime,
      address: collectionType === 'Home Collection' ? address : undefined,
      locationId: collectionType === 'Walk-in' ? 'loc-mulund-east-primary' : undefined,
      notes: additionalNotes,
      items: items.map(item => ({ id: item.id, name: item.name, price: item.price, type: item.type })),
      visitCharge
    };

    try {
      const response = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          patientName,
          patientPhone,
          patientEmail,
          bookingDetails
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Cashfree checkout order.');
      }

      setCreatedOrderId(data.orderId);
      setCreatedSessionId(data.paymentSessionId);
      setIsCfSimulated(!!data.isSimulated);

      if (data.isSimulated) {
        // Trigger simulated popup/overlay
        setShowSimulator(true);
      } else {
        // Live Cashfree SDK Trigger
        const CashfreeSDK = await loadCashfreeScript();
        if (!CashfreeSDK) {
          throw new Error('Could not load the Cashfree Payment SDK from secure server.');
        }

        const cashfreeInstance = CashfreeSDK({
          mode: data.environment === 'production' ? 'production' : 'sandbox'
        });

        cashfreeInstance.checkout({
          paymentSessionId: data.paymentSessionId,
          returnUrl: `${window.location.origin}/?cf_order_id=${data.orderId}`
        });
      }
    } catch (err: any) {
      console.error(err);
      setPaymentStatus('failed');
      setErrorMessage(err.message || 'Payment request failed to initiate.');
    }
  };

  const handleSimulatedPaymentSuccess = async () => {
    setShowSimulator(false);
    setPaymentStatus('processing');
    
    // Call verify endpoint
    try {
      const res = await fetch('/api/cashfree/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: createdOrderId,
          isSimulated: true
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setPaymentStatus('success');
        setCreatedBookings(result.bookings || []);
        // Trigger CMS content refresh
        onClearCart();
      } else {
        setPaymentStatus('failed');
        setErrorMessage(result.error || 'Verification of simulated order failed.');
      }
    } catch (err: any) {
      setPaymentStatus('failed');
      setErrorMessage('Verification network issue.');
    }
  };




  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" id="estimate-cart-overlay">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-[#0066CC] rounded-xl">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Custom Estimate Cart</h3>
                    <p className="text-xs text-slate-400 font-medium">Configure your screening panel and book instantly</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {items.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-3xl">
                      🛒
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-700">Your Estimate Cart is Empty</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Browse our health packages, pathology blood tests, and radiology services to add items and generate your custom pricing quote.
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-[#0066CC] text-white font-extrabold text-xs rounded-xl hover:bg-[#0052CC] transition-colors"
                    >
                      Start Adding Items
                    </button>
                  </div>
                ) : paymentStatus !== 'success' ? (
                  <>
                    {/* List of Added Items */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          Selected Tests & Packages ({items.length})
                        </span>
                        <button
                          onClick={onClearCart}
                          className="text-[10px] font-extrabold text-rose-500 hover:underline hover:text-rose-600"
                        >
                          Clear All Items
                        </button>
                      </div>

                      <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-slate-50/30">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                            <div>
                              <span className="text-[9px] font-bold text-[#0066CC] uppercase tracking-wider px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md">
                                {item.type === 'RoutineTest' ? 'Routine Test' : item.type}
                              </span>
                              <h4 className="text-sm font-bold text-slate-800 mt-1">{item.name}</h4>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-extrabold text-slate-900">₹{item.price}</span>
                              <button
                                onClick={() => onRemoveItem(item.id)}
                                className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Summary Total */}
                        <div className="bg-blue-50/40 border-t border-slate-200 divide-y divide-blue-100/40">
                          {visitCharge > 0 && (
                            <>
                              <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-500 font-medium">
                                <span>Tests Subtotal:</span>
                                <span>₹{subtotal}</span>
                              </div>
                              <div className="flex items-center justify-between px-4 py-2 text-xs text-amber-700 font-bold bg-amber-50/30">
                                <span className="flex items-center gap-1">
                                  <span>Visit Charge:</span>
                                  <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded uppercase">Below ₹500</span>
                                </span>
                                <span>+₹{visitCharge}</span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center justify-between p-4">
                            <span className="text-xs font-bold text-slate-600 uppercase">Estimated Total:</span>
                            <span className="text-xl font-black text-[#0066CC]">₹{totalAmount}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Patient Details & Scheduling Form */}
                    {!isUPICheckoutActive ? (
                      <>
                        <div className="border-t border-slate-100 pt-6 space-y-4">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                          Patient & Booking Information
                        </h4>
                        <p className="text-slate-400 text-xs mt-0.5">Please provide patient details to complete your pre-filled WhatsApp quote request.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5" htmlFor="cart-booking-name">
                            Patient Name *
                          </label>
                          <input
                            id="cart-booking-name"
                            type="text"
                            placeholder="e.g. Rahul Sharma"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-[#0066CC] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5" htmlFor="cart-booking-phone">
                            Phone Number *
                          </label>
                          <input
                            id="cart-booking-phone"
                            type="tel"
                            placeholder="e.g. 9876543210"
                            value={patientPhone}
                            onChange={(e) => setPatientPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-[#0066CC] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
                          />
                        </div>

                        {/* Age */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5" htmlFor="cart-booking-age">
                            Age (Years) *
                          </label>
                          <input
                            id="cart-booking-age"
                            type="number"
                            placeholder="e.g. 32"
                            value={patientAge}
                            onChange={(e) => setPatientAge(e.target.value)}
                            min="1"
                            max="120"
                            className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-[#0066CC] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm"
                          />
                        </div>

                        {/* Gender */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Gender *
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {['Male', 'Female', 'Other'].map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setPatientGender(g)}
                                className={`py-2.5 rounded-xl font-semibold text-xs transition-all border cursor-pointer ${
                                  patientGender === g
                                    ? 'bg-[#EAF7FF] border-[#0066CC] text-[#0066CC]'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Preferred Branch */}
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5" htmlFor="cart-booking-branch">
                            Preferred Branch
                          </label>
                          <select
                            id="cart-booking-branch"
                            value={preferredBranch}
                            onChange={(e) => setPreferredBranch(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-[#0066CC] rounded-xl text-xs text-slate-800 focus:outline-none transition-all shadow-sm cursor-pointer"
                          >
                            <option value="Mulund East – Secondary Hub">Mulund East – Secondary Hub</option>
                            <option value="Mulund East – Sonography Center">Mulund East – Sonography Center</option>
                            <option value="Mulund West – Community Testing Collection Center">Mulund West – Community Testing Collection Center</option>
                            <option value="Dombivli East – Extended Hours Lab">Dombivli East – Extended Hours Lab</option>
                          </select>
                        </div>

                        {/* Home Collection vs Walk-In */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Appointment Mode
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['Home Collection', 'Walk-in'] as const).map((type) => {
                              const isHomeDisabled = type === 'Home Collection' && hasRadiology;
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  disabled={isHomeDisabled}
                                  onClick={() => setCollectionType(type)}
                                  className={`py-2.5 rounded-xl font-semibold text-xs transition-all border cursor-pointer ${
                                    isHomeDisabled
                                      ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                                      : collectionType === type
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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
                              <div className="p-3 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-3 mt-1 text-left">
                                <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <MapPin className="w-3 h-3 text-emerald-600" />
                                  <span>Home Collection Address *</span>
                                </h4>
                                <div>
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1" htmlFor="cart-booking-address">
                                    Complete Address *
                                  </label>
                                  <textarea
                                    id="cart-booking-address"
                                    rows={3}
                                    placeholder="Enter your complete home address (Building/Flat, Street, Area, PIN Code)"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-[#0066CC] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm resize-none"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Preferred Date */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5" htmlFor="cart-booking-date">
                            Preferred Date
                          </label>
                          <input
                            id="cart-booking-date"
                            type="date"
                            value={preferredDate}
                            onChange={(e) => setPreferredDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-[#0066CC] rounded-xl text-xs text-slate-800 focus:outline-none transition-all shadow-sm cursor-pointer"
                          />
                        </div>

                        {/* Preferred Time */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5" htmlFor="cart-booking-time">
                            Preferred Time
                          </label>
                          <select
                            id="cart-booking-time"
                            value={preferredTime}
                            onChange={(e) => setPreferredTime(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-[#0066CC] rounded-xl text-xs text-slate-800 focus:outline-none transition-all shadow-sm cursor-pointer"
                          >
                            {cartTimeOptions.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        {/* Dynamic Cart Warning/Notice */}
                        {cartTimeSlotNotice && (
                          <div className="md:col-span-2 p-3.5 bg-[#EAF7FF] border border-[#B3DDF2] rounded-xl text-[#0055B3] text-xs font-bold flex items-start gap-2 animate-fade-in shadow-sm text-left">
                            <span className="text-sm mt-0.5 shrink-0">💡</span>
                            <span>{cartTimeSlotNotice}</span>
                          </div>
                        )}

                        {/* Additional Notes */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5" htmlFor="cart-booking-notes">
                            Additional Notes / Symptoms
                          </label>
                          <textarea
                            id="cart-booking-notes"
                            rows={1}
                            placeholder="e.g. Any specific requests"
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-[#0066CC] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all shadow-sm resize-none"
                          />
                        </div>

                        {/* Booking & Payment Method Option Selector */}
                        <div className="md:col-span-2 border-t border-slate-100 pt-5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-left">
                            Choose Booking & Payment Method *
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('WhatsApp')}
                              className={`p-4 rounded-2xl font-bold text-xs transition-all border flex items-center gap-3 justify-start text-left cursor-pointer ${
                                paymentMethod === 'WhatsApp'
                                  ? 'bg-[#EBFBF7] border-[#00A884] text-[#008f6f] shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="p-2.5 bg-emerald-50 rounded-xl text-[#00A884]">
                                <MessageSquare className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-extrabold text-xs">Book & Pay on WhatsApp</p>
                                <p className="text-[9px] font-medium text-slate-400 mt-0.5">Pay cash/UPI during collection</p>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPaymentMethod('UPI')}
                              className={`p-4 rounded-2xl font-bold text-xs transition-all border flex items-center gap-3 justify-start text-left cursor-pointer ${
                                paymentMethod === 'UPI'
                                  ? 'bg-amber-50/50 border-amber-500 text-amber-700 shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                                <QrCode className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-extrabold text-xs">Instant UPI / QR Code</p>
                                <p className="text-[9px] font-medium text-slate-400 mt-0.5">Scan & pay instantly with any UPI app</p>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPaymentMethod('Online')}
                              className={`p-4 rounded-2xl font-bold text-xs transition-all border flex items-center gap-3 justify-start text-left cursor-pointer ${
                                paymentMethod === 'Online'
                                  ? 'bg-blue-50/40 border-[#0066CC] text-[#0066CC] shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="p-2.5 bg-blue-50 rounded-xl text-[#0066CC]">
                                <CreditCard className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-extrabold text-xs">Pay Online Securely</p>
                                <p className="text-[9px] font-medium text-slate-400 mt-0.5">Cards & Net Banking via Cashfree</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Validation Errors */}
                    {showValidationErrors && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold">
                        ⚠️ Please fill in Patient Name, Phone Number, Age{collectionType === 'Home Collection' ? ', and complete address' : ''} to complete your order.
                      </div>
                    )}

                    {/* Error Alerts */}
                    {errorMessage && (
                      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-rose-950 uppercase tracking-wider">Checkout Session Failure</p>
                          <p className="font-medium text-rose-700/90 mt-0.5">{errorMessage}</p>
                        </div>
                      </div>
                    )}

                    {/* Loading Screen */}
                    {paymentStatus === 'processing' && (
                      <div className="p-10 text-center space-y-4">
                        <Loader2 className="w-10 h-10 text-[#0066CC] animate-spin mx-auto" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Securing Transaction Credentials</h4>
                          <p className="text-xs text-slate-400 mt-0.5">Contacting Cashfree PG Core Node to generate payment session...</p>
                        </div>
                      </div>
                    )}

                    {/* Secure and Sterile workflow card */}
                    <div className="bg-emerald-50/50 border border-emerald-100/40 rounded-2xl p-4 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">Gold Standard Verification</span>
                        <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                          Amensa Diagnostics guarantees multi-level clinical pathologist validation for all custom test panels. Online checkouts are secured via end-to-end PCI DSS compliant Cashfree tokenized keys.
                        </p>
                      </div>
                    </div>
                      </>
                    ) : (
                      /* UPI Scan & Pay View inside EstimateCartModal */
                      <div className="space-y-6 text-left">
                        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2.5 bg-blue-50 text-[#0066CC] rounded-xl">
                              <QrCode className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Instant UPI Payment</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Secure Scan & Pay Gateway</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsUPICheckoutActive(false)}
                            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="Go Back"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Booking Details Summary */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold uppercase text-[9px]">Patient Name</span>
                            <span className="font-bold text-slate-800">{patientName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-semibold uppercase text-[9px]">Booking Items</span>
                            <span className="font-bold text-slate-800 truncate max-w-[200px]" title={cartItemNames}>
                              {cartItemNames}
                            </span>
                          </div>
                          {visitCharge > 0 && (
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-semibold uppercase text-[9px]">Visit Charge</span>
                              <span className="font-bold text-slate-800">₹{visitCharge}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-slate-200/60 pt-2.5">
                            <span className="text-slate-400 font-extrabold uppercase text-[9px]">Total Amount</span>
                            <span className="font-mono font-black text-base text-[#0066CC]">₹{totalAmount}</span>
                          </div>
                        </div>

                        {/* Step 1: Complete UPI Transaction */}
                        <div className="space-y-3.5">
                          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Step 1: Complete UPI Transaction</h4>
                          
                          <div className="space-y-3">
                            {/* Mobile Intent deep link */}
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

                            {/* QR Code */}
                            <div className="flex flex-col items-center justify-center py-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                              <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100/80">
                                <img
                                  src={qrCodeUrl}
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

                        {/* Step 2: Upload Proof */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Step 2: Upload Payment Proof</h4>
                          
                          <div className="space-y-3">
                            {/* Drag and Drop */}
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
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Send via WhatsApp */}
                            <button
                              type="button"
                              onClick={() => {
                                const msg = `Hello,

I have completed my payment.

Name: ${patientName}
Phone Number: ${patientPhone}
Package: ${cartItemNames}
Amount Paid: ₹${totalAmount}

I am attaching my payment screenshot for verification.`;

                                const waUrl = `https://wa.me/917039394488?text=${encodeURIComponent(msg)}`;
                                window.open(waUrl, '_blank', 'noopener,noreferrer');
                                
                                // Transition to success state
                                onClearCart();
                                setPaymentStatus('success');
                                setIsUPICheckoutActive(false);
                                setPaymentScreenshot(null);
                                setPaymentScreenshotUrl(null);
                              }}
                              className="w-full py-3.5 bg-[#00A884] hover:bg-[#008f6f] text-white font-extrabold text-xs rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider active:scale-98 transition-all cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>Send Screenshot via WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Success View inside Modal for simulated checkout */
                  <div className="text-center py-8 px-4 space-y-6">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-4xl shadow-md">
                      <Check className="w-10 h-10 stroke-[3]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900">Payment Successful & Confirmed!</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Your transaction has been securely processed and verified. Our phlebotomist team and clinical coordinator have been notified.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 max-w-md mx-auto text-left divide-y divide-slate-100">
                      <div className="pb-2 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Booking References</span>
                        <span className="font-mono font-black text-[#0066CC] text-right">
                          {createdBookings.map(b => b.id).join(', ') || `AMS-B${Math.floor(100000 + Math.random() * 900000)}`}
                        </span>
                      </div>
                      <div className="py-2 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Patient Name</span>
                        <span className="font-bold text-slate-800">{patientName}</span>
                      </div>
                      <div className="py-2 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Amount Paid</span>
                        <span className="font-mono font-black text-emerald-600">₹{totalAmount}</span>
                      </div>
                      <div className="pt-2 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Fulfillment Mode</span>
                        <span className="font-bold text-slate-800">{collectionType}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => {
                          window.print();
                        }}
                        className="px-5 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        🖨️ Print Receipt Slip
                      </button>
                      <button
                        onClick={() => {
                          setPaymentStatus('idle');
                          onClose();
                        }}
                        className="px-6 py-3 bg-[#0066CC] hover:bg-[#0052CC] text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
                      >
                        Continue Browsing
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {items.length > 0 && paymentStatus !== 'success' && !isUPICheckoutActive && (
                <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[10px] text-slate-400 text-center sm:text-left max-w-xs">
                    Phlebotomist arrives within 30 minutes in Mulund & Dombivli. Order compilation is secure and fast.
                  </p>
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {paymentMethod === 'WhatsApp' ? (
                      <button
                        onClick={handleSendEstimate}
                        className="w-full sm:w-auto px-6 py-3.5 bg-[#00A884] hover:bg-[#008f6f] active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-100 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                        id="cart-whatsapp-submit-btn"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Book via WhatsApp</span>
                      </button>
                    ) : paymentMethod === 'UPI' ? (
                      <button
                        onClick={handleUPIPaymentTrigger}
                        className="w-full sm:w-auto px-7 py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-amber-100 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                        id="cart-upi-pay-btn"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Pay via UPI: ₹{totalAmount}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleOnlinePayment}
                        disabled={paymentStatus === 'processing'}
                        className="w-full sm:w-auto px-7 py-3.5 bg-[#0066CC] hover:bg-[#0052CC] active:scale-95 text-white font-black text-xs rounded-xl shadow-md shadow-blue-100 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        id="cart-online-pay-btn"
                      >
                        {paymentStatus === 'processing' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            <span>Pay Online: ₹{totalAmount}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Cashfree Simulated Gateway Interactive Dialog Overlay */}
          <AnimatePresence>
            {showSimulator && (
              <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 30 }}
                  className="bg-white rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden max-w-md w-full flex flex-col max-h-[85vh] font-sans"
                >
                  {/* Simulator Header */}
                  <div className="bg-[#1e293b] px-6 py-4 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#4ade80] flex items-center justify-center text-slate-950 text-xs font-black">
                        cf
                      </div>
                      <div>
                        <h4 className="text-xs font-black tracking-wide uppercase">Cashfree Checkout</h4>
                        <p className="text-[9px] text-emerald-400 font-bold">Clinical Sandbox Simulation</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowSimulator(false);
                        setPaymentStatus('failed');
                        setErrorMessage('Payment cancelled by user.');
                      }}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Pricing Ribbons */}
                  <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center text-xs shrink-0">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Paying To</span>
                      <p className="font-extrabold text-slate-800">Amensa Diagnostics Clinic</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Amount Due</span>
                      <p className="font-mono font-black text-[#0066CC] text-base">₹{totalAmount}</p>
                    </div>
                  </div>

                  {/* Simulator Body (Tabbed selector) */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
                    <div className="p-3 bg-blue-50 border border-blue-100 text-blue-800 text-[10px] font-bold rounded-xl leading-normal">
                      🛡️ This checkout is simulating Cashfree's PCI DSS compliant v3 JS SDK. You can choose any payment method below to complete booking instantly.
                    </div>

                    <div className="space-y-3">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Select Payment Mode</span>
                      <div className="grid grid-cols-2 gap-2">
                        {/* UPI */}
                        <div className="p-3.5 border border-slate-200 hover:border-[#0066CC] bg-slate-50/20 hover:bg-blue-50/10 rounded-xl cursor-pointer flex flex-col gap-2 items-center text-center transition-all">
                          <QrCode className="w-6 h-6 text-indigo-500" />
                          <span className="text-[10px] font-black text-slate-700">UPI / QR Scan</span>
                        </div>

                        {/* Cards */}
                        <div className="p-3.5 border border-[#0066CC] bg-blue-50/30 rounded-xl cursor-pointer flex flex-col gap-2 items-center text-center transition-all">
                          <CreditCard className="w-6 h-6 text-blue-500" />
                          <span className="text-[10px] font-black text-[#0066CC]">Cards (Debit/Credit)</span>
                        </div>

                        {/* Net Banking */}
                        <div className="p-3.5 border border-slate-200 hover:border-[#0066CC] bg-slate-50/20 hover:bg-blue-50/10 rounded-xl cursor-pointer flex flex-col gap-2 items-center text-center transition-all">
                          <Landmark className="w-6 h-6 text-amber-500" />
                          <span className="text-[10px] font-black text-slate-700">Net Banking</span>
                        </div>

                        {/* Wallets */}
                        <div className="p-3.5 border border-slate-200 hover:border-[#0066CC] bg-slate-50/20 hover:bg-blue-50/10 rounded-xl cursor-pointer flex flex-col gap-2 items-center text-center transition-all">
                          <Wallet className="w-6 h-6 text-emerald-500" />
                          <span className="text-[10px] font-black text-slate-700">Mobile Wallets</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive mock card section */}
                    <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50/40 space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Enter Mock Card Details</span>
                        <div className="flex gap-1 text-[9px] font-black text-slate-400">
                          <span>VISA</span>
                          <span>MC</span>
                          <span>RUPAY</span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="4111 2222 3333 4444"
                            readOnly
                            value="4111 •••• •••• 4444"
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none font-mono"
                          />
                          <CreditCard className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="12/29"
                            readOnly
                            value="12/29"
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none font-mono text-center"
                          />
                          <input
                            type="text"
                            placeholder="CVV"
                            readOnly
                            value="•••"
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none font-mono text-center"
                          />
                        </div>
                        <p className="text-[9px] font-medium text-slate-400 leading-normal">
                          * Simulated visa card is locked. Click Authorize below to complete checkout simulation.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Simulator footer with success/failure triggers */}
                  <div className="bg-slate-50 border-t border-slate-100 p-4 shrink-0 flex flex-col gap-2">
                    <button
                      onClick={handleSimulatedPaymentSuccess}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wide transition-all shadow-md shadow-emerald-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Authorize Simulated Payment</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowSimulator(false);
                        setPaymentStatus('failed');
                        setErrorMessage('Simulation: Payment declined by gateway.');
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 text-[10px] font-black rounded-xl cursor-pointer transition-all uppercase tracking-wide"
                    >
                      Simulate Payment Failure
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
