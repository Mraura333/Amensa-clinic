/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { Sparkles, Calendar, Heart, ShieldCheck, Activity, Award, CheckCircle, ClipboardList, X, CreditCard, Loader2, AlertTriangle, Check } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustBanner from './components/TrustBanner';
import Logo from './components/Logo';
import WhyChooseUs from './components/WhyChooseUs';
import HomeTestTimeline from './components/HomeTestTimeline';
import PackagesSection from './components/PackagesSection';
import RoutineTestsSection from './components/RoutineTestsSection';
import RadiologySection from './components/RadiologySection';
import ServiceAreas from './components/ServiceAreas';
import LocationsSection from './components/LocationsSection';
import TestimonialsSection from './components/TestimonialsSection';
import FAQsSection from './components/FAQsSection';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';
import PatientPortal from './components/PatientPortal';
import AdminPanel from './components/AdminPanel';
import DedicatedPackagesPage from './components/DedicatedPackagesPage';
import EstimateCartModal, { CartItem } from './components/EstimateCartModal';
import { Booking, HealthPackage, Test, RadiologyService, LocationCard, Testimonial, FAQItem } from './types';
import { getWhatsAppBookingUrl } from './utils/whatsapp';
import { 
  getStoredSettings, 
  getStoredPackages, 
  getStoredTests, 
  getStoredRadiology, 
  getStoredLocations, 
  getStoredTestimonials, 
  getStoredFAQs,
  WebsiteSettings
} from './utils/storageHelper';
import { db, collection, onSnapshot } from './lib/firebase';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [preselectedItem, setPreselectedItem] = useState<{
    type: 'Package' | 'RoutineTest' | 'Radiology';
    id: string;
    name: string;
    price: number;
    autoPay?: boolean;
  } | null>(null);

  // Patient Portal state sync
  const [isPatientPortalOpen, setIsPatientPortalOpen] = useState(false);
  const [patientSessionName, setPatientSessionName] = useState<string>('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Estimate Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);


  const showToast = (message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  const handleAddToEstimate = (item: CartItem) => {
    // If already exists, do not duplicate
    if (cartItems.some((i) => i.id === item.id)) {
      showToast(`"${item.name}" is already in your cart.`);
      return;
    }
    setCartItems((prev) => [...prev, item]);
    showToast(`✅ "${item.name}" added to your cart.`);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // States for CMS dynamic items
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [radiology, setRadiology] = useState<RadiologyService[]>([]);
  const [locations, setLocations] = useState<LocationCard[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);

  // Page Scroll Progress Tracker Hook
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const targetId = hash.substring(1);
        if (targetId && targetId !== 'home') {
          setTimeout(() => {
            const element = document.getElementById(targetId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }, 150);
        }
      }
    };
    handleHashChange(); // Run on mount
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Function to refresh all content from localstorage / helper
  const reloadCmsContent = () => {
    setPackages(getStoredPackages());
    setTests(getStoredTests());
    setRadiology(getStoredRadiology());
    setLocations(getStoredLocations());
    setTestimonials(getStoredTestimonials());
    setFaqs(getStoredFAQs());
    setSettings(getStoredSettings());
  };

  // Load clinical simulation loader & local bookings count
  useEffect(() => {
    const loaderTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);

    const updateBookingsCount = () => {
      reloadCmsContent();
    };

    const checkPatientSession = () => {
      fetch('/api/auth/me')
        .then(res => {
          if (!res.ok) return null;
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return res.json();
          }
          return null;
        })
        .then(data => {
          if (data && data.fullName) {
            setPatientSessionName(data.fullName);
          } else {
            setPatientSessionName('');
          }
        })
        .catch(err => {
          console.warn("Patient session check bypassed:", err.message || err);
          setPatientSessionName('');
        });
    };

    updateBookingsCount();
    checkPatientSession();

    // Real-time Firestore CMS Listener
    let unsubscribeCms: (() => void) | null = null;
    try {
      unsubscribeCms = onSnapshot(collection(db, 'cms'), (snapshot) => {
        snapshot.forEach((doc) => {
          const id = doc.id;
          const data = doc.data();
          if (id === 'settings') {
            localStorage.setItem('amensa_settings', JSON.stringify(data));
          } else if (id === 'packages') {
            localStorage.setItem('amensa_packages', JSON.stringify(data.list || []));
          } else if (id === 'tests') {
            localStorage.setItem('amensa_tests', JSON.stringify(data.list || []));
          } else if (id === 'radiology') {
            localStorage.setItem('amensa_radiology', JSON.stringify(data.list || []));
          } else if (id === 'locations') {
            localStorage.setItem('amensa_locations', JSON.stringify(data.list || []));
          } else if (id === 'testimonials') {
            localStorage.setItem('amensa_testimonials', JSON.stringify(data.list || []));
          } else if (id === 'faqs') {
            localStorage.setItem('amensa_faqs', JSON.stringify(data.list || []));
          } else if (id === 'gallery') {
            localStorage.setItem('amensa_gallery', JSON.stringify(data.list || []));
          } else if (id === 'enquiries') {
            localStorage.setItem('amensa_enquiries', JSON.stringify(data.list || []));
          }
        });
        reloadCmsContent();
      }, (err) => {
        console.warn('Firestore CMS snapshot listener bypassed:', err);
      });
    } catch (e) {
      console.warn('Firestore CMS snapshot init error:', e);
    }
    
    // Listen to localstorage updates if any
    const handleStorageUpdate = () => {
      updateBookingsCount();
      checkPatientSession();
    };
    window.addEventListener('storage', handleStorageUpdate);

    // Check active session every 15 seconds
    const sessionInterval = setInterval(checkPatientSession, 15000);

    return () => {
      clearTimeout(loaderTimer);
      window.removeEventListener('storage', handleStorageUpdate);
      clearInterval(sessionInterval);
      if (unsubscribeCms) {
        unsubscribeCms();
      }
    };
  }, []);

  // Shared trigger when patient clicks Book on any card
  const handleBookingTrigger = (item?: {
    type: 'Package' | 'RoutineTest' | 'Radiology';
    id: string;
    name: string;
    price: number;
    autoPay?: boolean;
  }) => {
    if (item) {
      setPreselectedItem(item);
    }
    
    // Smooth scroll down to the contact form section
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearPreselected = () => {
    setPreselectedItem(null);
  };

  return (
    <>
      {/* 1. Clinical Diagnostics Loader Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-[#F8FBFF] z-[9999] flex flex-col items-center justify-center"
            id="clinical-system-loader"
          >
            {/* Spinning helix graphics */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-[#0066CC]/10 border-t-4 border-t-[#0066CC] animate-spin" />
              <div className="absolute w-12 h-12 rounded-full border-4 border-emerald-500/15 border-b-4 border-b-[#00A884] animate-[spin_1.5s_linear_infinite_reverse]" />
              <Heart className="absolute w-6 h-6 text-[#0066CC] animate-pulse" />
            </div>

            <Logo variant="vertical" className="mb-2 scale-110" />
            
            <p className="text-slate-400 text-xs font-semibold animate-pulse mt-4">
              Calibrating automated analyzer node... 100% Ready
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0066CC] via-[#00A884] to-[#0066CC] origin-left z-[999]"
        style={{ scaleX }}
        id="scroll-progress-indicator"
      />

      <div className="min-h-screen bg-[#F8FBFF] font-sans antialiased text-[#1A1A1A]">
        {/* Sticky luxury navigation header */}
        <Navbar 
          onBookClick={handleBookingTrigger} 
          cartCount={cartItems.length}
          onCartClick={() => setIsCartOpen(true)}
        />

        {/* Hero Section */}
        <Hero onBookClick={() => handleBookingTrigger()} />

        {/* Trust Badges Banner */}
        <TrustBanner />

        {/* Why Choose Amensa */}
        <WhyChooseUs />

        {/* How It Works Home Collection Timeline */}
        <HomeTestTimeline />

        {/* Premium Packages pricing cards */}
        <PackagesSection 
          onBookPackage={handleBookingTrigger} 
          onAddToEstimate={handleAddToEstimate} 
          packages={packages} 
        />

        {/* Live searchable individual tests catalog */}
        <RoutineTestsSection 
          onBookTest={handleBookingTrigger} 
          onAddToEstimate={handleAddToEstimate} 
          tests={tests} 
        />

        {/* Radiology clinical scans cards */}
        <RadiologySection 
          onBookRadiology={handleBookingTrigger} 
          onAddToEstimate={handleAddToEstimate} 
          services={radiology} 
        />

        {/* Service coverage map */}
        <ServiceAreas />

        {/* Flagship clinical centers */}
        <LocationsSection locationsList={locations} />

        {/* Patient reviews and feedback */}
        <TestimonialsSection testimonialsList={testimonials} />

        {/* Accordion FAQs */}
        <FAQsSection faqsList={faqs} />

        {/* Booking Engine & Contacts coordinates */}
        <ContactForm preselectedItem={preselectedItem} onClearPreselected={clearPreselected} />

        {/* Large premium footer */}
        <Footer onAdminClick={() => setIsAdminOpen(true)} />

        {/* Clinical Admin Dashboard overlay */}
        <AdminPanel
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />

        {/* Patient Portal Workspace Overlay */}
        <PatientPortal
          isOpen={isPatientPortalOpen}
          onClose={() => setIsPatientPortalOpen(false)}
          onBookingAdded={() => {}}
        />

        {/* Estimate Cart Modal */}
        <EstimateCartModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
        />

        {/* Premium Toast Notifications (Top Right) */}
        <div className="fixed top-24 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none" id="toast-notifications-container">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="pointer-events-auto flex items-start justify-between gap-3 px-4.5 py-3.5 bg-white border border-emerald-100 shadow-2xl shadow-emerald-500/10 rounded-2xl"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5 shrink-0">✅</span>
                  <div>
                    <h5 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1">Success</h5>
                    <p className="text-xs font-semibold text-slate-700 leading-snug">
                      {toast.message.replace('✅ ', '')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Floating Action Buttons Stack */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3" id="floating-actions-stack">

          {/* Estimate Cart Floating Trigger */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 px-5 py-3.5 bg-[#0066CC] text-white rounded-full shadow-xl shadow-blue-200/50 hover:bg-[#0052CC] hover:shadow-2xl hover:shadow-blue-300/60 active:scale-95 transition-all cursor-pointer group border border-blue-400/20"
            id="estimate-cart-floating-btn"
          >
            <span className="text-base">🛒</span>
            <span className="text-xs font-black tracking-wide">
              Estimate Cart {cartItems.length > 0 ? `(${cartItems.length})` : ''}
            </span>
          </motion.button>

          {/* Persistent Chat on WhatsApp Button */}
          <motion.a
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            href={getWhatsAppBookingUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3.5 bg-[#45b02f] text-white rounded-full shadow-xl shadow-emerald-200/50 hover:bg-[#3ca128] hover:shadow-2xl hover:shadow-emerald-300/60 active:scale-95 transition-all cursor-pointer group border border-emerald-400/20"
            id="whatsapp-chat-floating-btn"
          >
            <svg className="w-5 h-5 fill-current text-white shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="text-xs font-bold tracking-wide">Chat on WhatsApp</span>
          </motion.a>
        </div>



      </div>
    </>
  );
}

