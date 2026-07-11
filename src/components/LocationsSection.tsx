/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, 
  Clock, 
  Phone, 
  ExternalLink, 
  Copy, 
  Check, 
  Calendar, 
  Navigation,
  ShieldCheck,
  Building,
  Activity,
  HeartHandshake
} from 'lucide-react';
import { LocationCard } from '../types';
import { locations as defaultLocations } from '../data';

interface LocationsSectionProps {
  locationsList?: LocationCard[];
}

const MAP_EMBEDS: Record<string, string> = {
  'loc-mulund-east-primary': 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3768.1722830867015!2d72.9642!3d19.182283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b9328224b163%3A0xb30e55b4107eb4bf!2sGopal+Krishna+Gokhale+Road%2C+Mulund+East!5e0!3m2!1sen!2sin!4v1719400000001',
  'loc-mulund-east-sono': 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3768.25!2d72.964!3d19.18!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b931fc4cbba7%3A0xe54d9c7cb63a483e!2sM+P+Road%2C+Mulund+East!5e0!3m2!1sen!2sin!4v1719400000002',
  'loc-mulund-west-coll': 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3768.4237731773094!2d72.9510757!3d19.1767184!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b9015bcbc3d1%3A0xe21ba681b95b871!2sSarojini+Naidu+Rd%2C+Tambe Nagar%2C+Mulund+West!5e0!3m2!1sen!2sin!4v1719395232810'
};

const DEFAULT_MAP = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d120562.15878985163!2d72.92383214539126!3d19.169389278278275!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b931fc4cbba7%3A0xe54d9c7cb63a483e!2sMulund+East%2C+Mumbai%2C+Maharashtra!5e0!3m2!1sen!2sin!4v1719395232000';

export default function LocationsSection({ locationsList }: LocationsSectionProps) {
  const activeLocations = locationsList || defaultLocations;
  
  // States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLocId, setSelectedLocId] = useState<string>(
    activeLocations.length > 0 ? activeLocations[0].id : ''
  );

  // Sorting: respect .order field, group into Mumbai and Thane
  const sortedLocations = [...activeLocations].sort((a, b) => {
    return (a.order || 99) - (b.order || 99);
  });

  const mumbaiCenters = sortedLocations.filter(
    (loc) => !loc.region || loc.region.toLowerCase() === 'mumbai'
  );
  const thaneCenters = sortedLocations.filter(
    (loc) => loc.region && loc.region.toLowerCase() === 'thane'
  );

  // Copy Address to Clipboard
  const handleCopyAddress = (id: string, addressText: string) => {
    navigator.clipboard.writeText(addressText);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Get active map embed URL
  const getEmbedUrl = () => {
    if (!selectedLocId) return DEFAULT_MAP;
    return MAP_EMBEDS[selectedLocId] || DEFAULT_MAP;
  };

  const activeSelectedLoc = sortedLocations.find(l => l.id === selectedLocId);

  return (
    <section id="locations" className="py-20 bg-slate-50 relative overflow-hidden" style={{ contentVisibility: 'auto' }}>
      
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-indigo-50 blur-[150px] -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-blue-50 blur-[150px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Our Locations</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight"
          >
            Trusted Diagnostic Centers Across Mumbai & Thane
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-sm sm:text-base text-slate-500 font-medium"
          >
            Serving patients with free home sample collection and advanced diagnostic services.
          </motion.p>
        </div>

        {/* General Info Overview Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {/* Operating Hours card */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Operating Hours</span>
              <p className="text-sm font-black text-slate-800 mt-1">7:30 AM – 9:00 PM</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Monday to Saturday (Sundays Closed)</p>
            </div>
          </div>

          {/* Central Helpline */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-start gap-4 shadow-sm md:col-span-1 lg:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Central Helpline</span>
              <div className="flex flex-col mt-1">
                <a href="tel:7039394488" className="text-sm font-black text-slate-800 hover:text-indigo-600 transition-colors">
                  7039394488
                </a>
                <a href="tel:8422007488" className="text-sm font-black text-slate-800 hover:text-indigo-600 transition-colors">
                  8422007488
                </a>
              </div>
            </div>
          </div>

          {/* Home Collection Promise */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl flex items-start gap-4 shadow-md md:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-indigo-300 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block">Quality Promise</span>
              <p className="text-xs font-bold text-slate-100 mt-1.5 leading-relaxed">
                Qualified Phlebotomists follow 100% sterile barcoded sample processing guidelines.
              </p>
            </div>
          </div>
        </div>

        {/* Free Home Sample Collection Service Area Banner */}
        <div className="mb-14 overflow-hidden rounded-[24px] bg-indigo-950 text-white relative shadow-lg">
          {/* Subtle background route vectors */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/50 via-slate-950 to-indigo-950" />
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center lg:text-left">
              <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">Doorstep Diagnostics Convenience</span>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">Free Home Sample Collection Available In:</h3>
              <p className="text-slate-300 text-xs font-semibold">Book any test or health packages & get zero-fee phlebotomist home visits.</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {['Dombivli', 'Thane', 'Mulund'].map((area) => (
                <div 
                  key={area}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-xs font-bold tracking-wide">{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Split Section Layout: Interactive Map + Premium Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Block (Llg:col-span-7): Branch Lists */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Mumbai Centers Block */}
            {mumbaiCenters.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-base font-black text-slate-800 tracking-wider uppercase">Mumbai Centers</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mumbaiCenters.map((loc) => (
                    <LocationItemCard 
                      key={loc.id} 
                      loc={loc} 
                      isSelected={selectedLocId === loc.id}
                      copiedId={copiedId}
                      onSelect={() => setSelectedLocId(loc.id)}
                      onCopyAddress={handleCopyAddress}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Thane Centers Block */}
            {thaneCenters.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-base font-black text-slate-800 tracking-wider uppercase">Thane Centers</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {thaneCenters.map((loc) => (
                    <LocationItemCard 
                      key={loc.id} 
                      loc={loc} 
                      isSelected={selectedLocId === loc.id}
                      copiedId={copiedId}
                      onSelect={() => setSelectedLocId(loc.id)}
                      onCopyAddress={handleCopyAddress}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Block (lg:col-span-5): Interactive Embedded Map */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-200 p-4 rounded-[24px] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-indigo-600" />
                    Interactive Branch Locator Map
                  </h4>
                  {activeSelectedLoc && (
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate max-w-[280px]">
                      Showing: {activeSelectedLoc.name}
                    </p>
                  )}
                </div>
                
                {activeSelectedLoc && (
                  <a
                    href={activeSelectedLoc.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-extrabold uppercase flex items-center gap-1 transition-all"
                  >
                    <span>Open in Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Map Iframe */}
              <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-slate-100 relative bg-slate-50 shadow-inner">
                <iframe
                  title="Amensa Diagnostics Labs Locations"
                  src={getEmbedUrl()}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Selected Branch Detail Quick View Card */}
              {activeSelectedLoc && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 text-white rounded uppercase tracking-wider ${
                      activeSelectedLoc.badge?.includes('PRIMARY HUB')
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}>
                      {activeSelectedLoc.badge || 'Diagnostic Center'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {activeSelectedLoc.region || 'Mumbai'} Center
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-800 leading-tight">
                    {activeSelectedLoc.name}
                  </h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    {activeSelectedLoc.address}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

// Sub-component for Cleaner Layout
interface LocationItemCardProps {
  key?: string;
  loc: LocationCard;
  isSelected: boolean;
  copiedId: string | null;
  onSelect: () => void;
  onCopyAddress: (id: string, text: string) => void;
}

function LocationItemCard({ loc, isSelected, copiedId, onSelect, onCopyAddress }: LocationItemCardProps) {
  const isPrimaryHub = loc.badge?.includes('PRIMARY HUB');
  return (
    <motion.div
      onClick={onSelect}
      className={`p-5 bg-white border rounded-[22px] shadow-sm flex flex-col justify-between transition-all duration-200 relative cursor-pointer group ${
        isSelected 
          ? 'border-indigo-600 ring-2 ring-indigo-500/10' 
          : isPrimaryHub
            ? 'border-amber-300 hover:border-amber-400 bg-amber-50/10 shadow-[0_2px_12px_rgba(245,158,11,0.04)]'
            : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Badge */}
          {loc.badge ? (
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${
              isPrimaryHub
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-indigo-50 text-indigo-600 border-indigo-100'
            }`}>
              {loc.badge}
            </span>
          ) : (
            <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
              Diagnostic Center
            </span>
          )}

          {/* Active Highlight Marker */}
          <div className={`w-2 h-2 rounded-full transition-all ${isSelected ? 'bg-indigo-600 scale-125 shadow-md shadow-indigo-600/50' : 'bg-slate-200'}`} />
        </div>

        {/* Name */}
        <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-3">
          {loc.name}
        </h4>

        {/* Coordinates/Info details */}
        <div className="space-y-2 text-[11px] text-slate-500 font-medium mb-4">
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <a 
              href={loc.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="leading-relaxed text-slate-600 hover:text-indigo-600 hover:underline transition-colors"
            >
              {loc.address}
            </a>
          </div>

          <div className="flex items-start gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="whitespace-pre-line text-slate-600">{loc.workingHours}</span>
          </div>

          <div className="flex items-start gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <a href={`tel:${loc.phone.replace(/\s+/g, '')}`} className="text-slate-700 font-semibold hover:text-indigo-600 transition-colors">
              {loc.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
        {/* Copy Address */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopyAddress(loc.id, loc.address);
          }}
          className="flex-1 py-2 text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1 transition-colors border border-slate-200/40"
          title="Copy Address"
        >
          {copiedId === loc.id ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Address</span>
            </>
          )}
        </button>

        {/* Get Directions */}
        <a
          href={loc.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1 py-2 text-[10px] font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-lg text-center flex items-center justify-center gap-1 transition-all border border-indigo-100"
        >
          <span>Directions</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}
