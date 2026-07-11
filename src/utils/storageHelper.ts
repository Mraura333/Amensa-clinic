/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HealthPackage, Test, RadiologyService, LocationCard, Testimonial, FAQItem, Booking } from '../types';
import { healthPackages as defaultPackages, routineTests as defaultTests, radiologyServices as defaultRadiology, locations as defaultLocations, testimonials as defaultTestimonials, faqItems as defaultFAQs } from '../data';
import { db, doc, setDoc } from '../lib/firebase';

export interface WebsiteSettings {
  logoText: string;
  brandColor: 'blue' | 'emerald' | 'violet' | 'rose' | 'amber';
  contactPhone: string;
  whatsappNumber: string;
  email: string;
  operatingHours: string;
  googleMapsEmbedUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  seoTitle: string;
  seoDescription: string;
  
  // Hero CMS
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  
  // About Us CMS
  aboutTitle: string;
  aboutDescription: string;
  aboutStats: { label: string; value: string }[];
}

export interface ContactEnquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'Unread' | 'Read' | 'Replied';
  replyContent?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  order: number;
}

const DEFAULT_SETTINGS: WebsiteSettings = {
  logoText: 'AMENSA',
  brandColor: 'blue',
  contactPhone: '+91 70393 94488',
  whatsappNumber: '+91 70393 94488',
  email: 'amensadiagnostics@gmail.com',
  operatingHours: 'Mon-Sun: 8:00 AM - 9:00 PM',
  googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3768.4237731773094!2d72.95107577583689!3d19.176718449100806!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b9015bcbc3d1%3A0xe21ba681b95b871!2sSarojini%20Naidu%20Rd%2C%20Tambe%20Nagar%2C%20Mulund%20West%2C%20Mumbai%2C%20Maharashtra%20400080!5e0!3m2!1sen!2sin!4v1719395232810!5m2!1sen!2sin',
  facebookUrl: 'https://facebook.com/amensadiagnostics',
  twitterUrl: 'https://twitter.com/amensalabs',
  instagramUrl: 'https://instagram.com/amensadiagnostics',
  seoTitle: 'Amensa Diagnostics - Follows NABL Standards in Mulund, Mumbai',
  seoDescription: 'Accurate pathology reports, home sample collection within 60 minutes, and premium diagnostics at affordable prices in Mulund and Thane.',
  
  // Hero
  heroTitle: 'Accurate Diagnostics. Trusted Healthcare. Delivered To Your Door.',
  heroSubtitle: 'Amensa Diagnostics is Mumbai\'s premier clinical network, bringing state-of-the-art pathology, imaging, and 60-minute doorstep sample collection together with automated digital accuracy.',
  heroBadge: 'We Follow NABL Standards & Protocols',
  
  // About
  aboutTitle: 'About Amensa Diagnostics',
  aboutDescription: 'Amensa Diagnostics represents the cutting edge of clinical lab test accuracy in Mumbai. Established with a single-minded vision to make elite diagnostics affordable and transparent, we serve thousands of families across Mulund, Thane, and Dombivli with double-blind verified pathology, digital radiology, and painless home pick-ups.',
  aboutStats: [
    { label: 'Accurate Reports Delivered', value: '50K+' },
    { label: 'Follows NABL Standards', value: '100%' },
    { label: 'Certified Phlebotomists', value: '25+' },
    { label: 'Verified 5-Star Reviews', value: '4.9/5' }
  ]
};

const DEFAULT_GALLERY: GalleryItem[] = [];

const DEFAULT_ENQUIRIES: ContactEnquiry[] = [
  {
    id: 'ENQ-901',
    name: 'Doctor Name',
    email: 'doctor@example.com',
    phone: '9819234567',
    subject: 'Doctor Referral Partnership Query',
    message: 'Hello, I am a consulting physician in Mulund West. I would like to know if you provide custom referral codes for senior patients to avail of the 15% discount on radiology scans at your Sarojini Naidu centre. Kindly call me back.',
    createdAt: '2026-06-25T11:20:00Z',
    status: 'Unread'
  },
  {
    id: 'ENQ-902',
    name: 'Patient Name',
    email: 'patient@example.com',
    phone: '9820556677',
    subject: 'Corporate Health Checkup for 45 Staff Members',
    message: 'We are looking to schedule an annual corporate health screening at our office in Thane West. We want CBC, Fasting Sugar, and Lipid Profiles for 45 employees. Do you offer on-site camps for this? Looking forward to your quote.',
    createdAt: '2026-06-24T15:40:00Z',
    status: 'Replied',
    replyContent: 'Dear Patient, thank you for reaching out to Amensa. Yes, we conduct on-site corporate health screening camps. I have emailed a custom proposal with corporate rates to your address. Our manager will call you at 10 AM tomorrow to coordinate.'
  },
  {
    id: 'ENQ-903',
    name: 'Patient Name B',
    email: 'patient.b@example.com',
    phone: '9167334455',
    subject: 'Home collection service area confirmation',
    message: 'Do you cover Khopat area in Thane West for morning fasting blood collection? My mother is 82 and cannot travel. Please let me know.',
    createdAt: '2026-06-25T18:05:00Z',
    status: 'Read'
  }
];

// Helper to initialize storage on first load
export function initLocalStorageCMS() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem('amensa_settings')) {
    localStorage.setItem('amensa_settings', JSON.stringify(DEFAULT_SETTINGS));
  }
  const storedPkgs = localStorage.getItem('amensa_packages');
  let hasOldPkgs = false;
  if (storedPkgs) {
    try {
      const parsed = JSON.parse(storedPkgs);
      if (Array.isArray(parsed) && (parsed.length === 0 || parsed.some(p => p.id === 'pkg-cbc') || parsed.some(p => p.id === 'pkg-arogya-b' && p.price !== 999) || parsed.some(p => p.id === 'pkg-womens-profile' && p.price !== 2500) || parsed.some(p => p.id === 'pkg-arogya-e-cardiac' && p.price !== 6000))) {
        hasOldPkgs = true;
      }
    } catch (e) {
      hasOldPkgs = true;
    }
  }
  if (!storedPkgs || hasOldPkgs) {
    localStorage.setItem('amensa_packages', JSON.stringify(defaultPackages));
  }
  const storedTests = localStorage.getItem('amensa_tests');
  let hasOldTests = false;
  if (storedTests) {
    try {
      const parsed = JSON.parse(storedTests);
      if (Array.isArray(parsed) && (parsed.length === 0 || !parsed.some(t => t.id === 't-throat-swab-exact') || parsed.some(t => t.id === 't-cbc-exact' && t.price !== 250))) {
        hasOldTests = true;
      }
    } catch (e) {
      hasOldTests = true;
    }
  }
  if (!storedTests || hasOldTests) {
    localStorage.setItem('amensa_tests', JSON.stringify(defaultTests));
  }
  const storedRadiology = localStorage.getItem('amensa_radiology');
  let hasOldRadiology = false;
  if (storedRadiology) {
    try {
      const parsed = JSON.parse(storedRadiology);
      if (
        Array.isArray(parsed) &&
        (parsed.length < 13 ||
          !parsed.some((r) => r.id === 'rad-msk-single') ||
          !parsed.some((r) => r.id === 'rad-sonography') ||
          !parsed.some((r) => r.id === 'rad-xray') ||
          !parsed.some((r) => r.id === 'rad-2decho') ||
          parsed.some((r) => r.id === 'rad-usg-abd-pel' && r.bmcPrice !== 2200))
      ) {
        hasOldRadiology = true;
      }
    } catch (e) {
      hasOldRadiology = true;
    }
  }
  if (!storedRadiology || hasOldRadiology) {
    localStorage.setItem('amensa_radiology', JSON.stringify(defaultRadiology));
  }
  const storedLocations = localStorage.getItem('amensa_locations');
  let hasOldLocations = false;
  if (storedLocations) {
    try {
      const parsed = JSON.parse(storedLocations);
      if (Array.isArray(parsed) && (parsed.length === 0 || parsed.some(l => l.id === 'loc-mulund' || l.id === 'loc-thane' || l.id === 'loc-mulund-east-secondary' || !l.name || !l.name.startsWith('Amensa Diagnostics')) || !parsed.some(l => l.id === 'loc-mulund-east-primary') || !parsed.some(l => l.id === 'loc-dombivli-east'))) {
        hasOldLocations = true;
      }
    } catch (e) {
      hasOldLocations = true;
    }
  }
  if (!storedLocations || hasOldLocations) {
    localStorage.setItem('amensa_locations', JSON.stringify(defaultLocations));
  }
  // Initialize testimonials from defaultTestimonials if not set or empty
  const storedTestimonialsStr = localStorage.getItem('amensa_testimonials');
  if (storedTestimonialsStr) {
    try {
      const stored = JSON.parse(storedTestimonialsStr);
      if (!Array.isArray(stored) || stored.length === 0) {
        localStorage.setItem('amensa_testimonials', JSON.stringify(defaultTestimonials));
      }
    } catch (e) {
      localStorage.setItem('amensa_testimonials', JSON.stringify(defaultTestimonials));
    }
  } else {
    localStorage.setItem('amensa_testimonials', JSON.stringify(defaultTestimonials));
  }

  if (!localStorage.getItem('amensa_faqs')) {
    localStorage.setItem('amensa_faqs', JSON.stringify(defaultFAQs));
  }

  // Proactively clear default/placeholder gallery photos
  const storedGalleryStr = localStorage.getItem('amensa_gallery');
  if (storedGalleryStr) {
    try {
      const stored = JSON.parse(storedGalleryStr);
      const hasFake = stored.some((item: any) => item.id && item.id.startsWith('gal-'));
      if (hasFake) {
        localStorage.setItem('amensa_gallery', JSON.stringify([]));
      }
    } catch (e) {
      localStorage.setItem('amensa_gallery', JSON.stringify([]));
    }
  } else {
    localStorage.setItem('amensa_gallery', JSON.stringify([]));
  }
  if (!localStorage.getItem('amensa_enquiries')) {
    localStorage.setItem('amensa_enquiries', JSON.stringify(DEFAULT_ENQUIRIES));
  }
}

// Getters & Setters
export function getStoredSettings(): WebsiteSettings {
  initLocalStorageCMS();
  return JSON.parse(localStorage.getItem('amensa_settings') || JSON.stringify(DEFAULT_SETTINGS));
}

export function saveStoredSettings(settings: WebsiteSettings) {
  localStorage.setItem('amensa_settings', JSON.stringify(settings));
  try {
    setDoc(doc(db, 'cms', 'settings'), settings).catch(err => console.error('Firestore settings sync error:', err));
  } catch (e) {
    console.warn('Firestore settings sync setup error:', e);
  }
}

export function getStoredPackages(): HealthPackage[] {
  initLocalStorageCMS();
  return JSON.parse(localStorage.getItem('amensa_packages') || '[]');
}

export function saveStoredPackages(packages: HealthPackage[]) {
  localStorage.setItem('amensa_packages', JSON.stringify(packages));
  try {
    setDoc(doc(db, 'cms', 'packages'), { list: packages }).catch(err => console.error('Firestore packages sync error:', err));
  } catch (e) {
    console.warn('Firestore packages sync setup error:', e);
  }
}

export function getStoredTests(): Test[] {
  initLocalStorageCMS();
  return JSON.parse(localStorage.getItem('amensa_tests') || '[]');
}

export function saveStoredTests(tests: Test[]) {
  localStorage.setItem('amensa_tests', JSON.stringify(tests));
  try {
    setDoc(doc(db, 'cms', 'tests'), { list: tests }).catch(err => console.error('Firestore tests sync error:', err));
  } catch (e) {
    console.warn('Firestore tests sync setup error:', e);
  }
}

export function getStoredRadiology(): RadiologyService[] {
  initLocalStorageCMS();
  return JSON.parse(localStorage.getItem('amensa_radiology') || '[]');
}

export function saveStoredRadiology(services: RadiologyService[]) {
  localStorage.setItem('amensa_radiology', JSON.stringify(services));
  try {
    setDoc(doc(db, 'cms', 'radiology'), { list: services }).catch(err => console.error('Firestore radiology sync error:', err));
  } catch (e) {
    console.warn('Firestore radiology sync setup error:', e);
  }
}

export function getStoredLocations(): LocationCard[] {
  initLocalStorageCMS();
  return JSON.parse(localStorage.getItem('amensa_locations') || '[]');
}

export function saveStoredLocations(locations: LocationCard[]) {
  localStorage.setItem('amensa_locations', JSON.stringify(locations));
  try {
    setDoc(doc(db, 'cms', 'locations'), { list: locations }).catch(err => console.error('Firestore locations sync error:', err));
  } catch (e) {
    console.warn('Firestore locations sync setup error:', e);
  }
}

export function getStoredTestimonials(): Testimonial[] {
  initLocalStorageCMS();
  return JSON.parse(localStorage.getItem('amensa_testimonials') || '[]');
}

export function saveStoredTestimonials(testimonials: Testimonial[]) {
  localStorage.setItem('amensa_testimonials', JSON.stringify(testimonials));
  try {
    setDoc(doc(db, 'cms', 'testimonials'), { list: testimonials }).catch(err => console.error('Firestore testimonials sync error:', err));
  } catch (e) {
    console.warn('Firestore testimonials sync setup error:', e);
  }
}

export function getStoredFAQs(): FAQItem[] {
  initLocalStorageCMS();
  return JSON.parse(localStorage.getItem('amensa_faqs') || '[]');
}

export function saveStoredFAQs(faqs: FAQItem[]) {
  localStorage.setItem('amensa_faqs', JSON.stringify(faqs));
  try {
    setDoc(doc(db, 'cms', 'faqs'), { list: faqs }).catch(err => console.error('Firestore faqs sync error:', err));
  } catch (e) {
    console.warn('Firestore faqs sync setup error:', e);
  }
}

export function getStoredGallery(): GalleryItem[] {
  initLocalStorageCMS();
  return JSON.parse(localStorage.getItem('amensa_gallery') || '[]');
}

export function saveStoredGallery(gallery: GalleryItem[]) {
  localStorage.setItem('amensa_gallery', JSON.stringify(gallery));
  try {
    setDoc(doc(db, 'cms', 'gallery'), { list: gallery }).catch(err => console.error('Firestore gallery sync error:', err));
  } catch (e) {
    console.warn('Firestore gallery sync setup error:', e);
  }
}

export function getStoredEnquiries(): ContactEnquiry[] {
  initLocalStorageCMS();
  return JSON.parse(localStorage.getItem('amensa_enquiries') || '[]');
}

export function saveStoredEnquiries(enquiries: ContactEnquiry[]) {
  localStorage.setItem('amensa_enquiries', JSON.stringify(enquiries));
  try {
    setDoc(doc(db, 'cms', 'enquiries'), { list: enquiries }).catch(err => console.error('Firestore enquiries sync error:', err));
  } catch (e) {
    console.warn('Firestore enquiries sync setup error:', e);
  }
}
