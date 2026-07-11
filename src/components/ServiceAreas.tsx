/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Pin, CheckCircle, Truck, Clock, Sparkles } from 'lucide-react';
import { serviceAreas } from '../data';

export default function ServiceAreas() {
  const [activeAreaName, setActiveAreaName] = useState('Thane');

  const selectedArea = serviceAreas.find((area) => area.name === activeAreaName) || serviceAreas[0];

  // SVG representation locations for interactive map
  const mapNodes = [
    { name: 'Thane', x: 25, y: 35, color: '#3B82F6' },
    { name: 'Mulund', x: 38, y: 55, color: '#10B981' },
    { name: 'Dombivli', x: 65, y: 48, color: '#F59E0B' }
  ];

  return (
    <section id="service-areas" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative vectors */}
      <div className="absolute top-1/4 left-0 w-80 h-80 rounded-full bg-emerald-50/20 blur-[110px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EAF7FF] text-[#0066CC] rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Regional Coverage Map</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight"
          >
            Our Service Coverage Areas
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-slate-500"
          >
            We operate a dedicated network of medical phlebotomists across key regions, ensuring sample pickup within 60 minutes.
          </motion.p>
        </div>

        {/* Interactive Coverage Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch" id="service-areas-layout">
          
          {/* Left Column: Interactive Region Selector List */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Select A Region</span>
              {serviceAreas.map((area) => {
                const isActive = area.name === activeAreaName;
                return (
                  <button
                    key={area.name}
                    onClick={() => setActiveAreaName(area.name)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 select-none cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-[#EAF7FF] border-[#0066CC] shadow-md text-[#0066CC]'
                        : 'bg-white border-[#E8EEF5] text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Pin className={`w-5 h-5 ${isActive ? 'text-[#0066CC]' : 'text-slate-400'}`} />
                      <span className="font-bold text-base">{area.name}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      isActive ? 'bg-[#0066CC] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {area.averageTimeMinutes} Mins
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Express 30-Min Home Sample Collection Info block */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-lg">⚡</span>
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Express Home Collection</span>
                <p className="text-emerald-700 text-xs font-semibold leading-relaxed">
                  <strong>Mulund:</strong> Home Sample Collection within <strong>30 minutes</strong><br />
                  <strong>Dombivli:</strong> Home Sample Collection within <strong>30 minutes</strong>
                </p>
              </div>
            </div>

            {/* Quick disclaimer footer inside selector */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-[#E8EEF5]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notice</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                If your exact pincode is not shown, please dial our emergency collection desk at 07039394488 to request an off-route phlebotomist dispatch.
              </p>
            </div>
          </div>

          {/* Center Column: Interactive Stylized Vector Map representation */}
          <div className="lg:col-span-5 bg-gradient-to-tr from-[#F8FBFF] to-blue-50/40 rounded-[28px] border border-[#E8EEF5] p-6 flex flex-col justify-between min-h-[350px] relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[radial-gradient(#0066CC_1px,transparent_1px)] [background-size:16px_16px]" />
            
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interactive Network Nodes</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-500/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Hubs
              </span>
            </div>

            {/* Abstract Map Nodes Render */}
            <div className="relative h-64 w-full z-10 my-auto flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full text-slate-100" viewBox="0 0 100 100">
                {/* Connecting lines */}
                <path d="M 25 35 L 38 55 L 45 75" fill="none" stroke="#E2EBF5" strokeWidth="1.5" strokeDasharray="3" />
                <path d="M 25 35 L 65 48" fill="none" stroke="#E2EBF5" strokeWidth="1.5" strokeDasharray="3" />
                <path d="M 65 48 L 75 25" fill="none" stroke="#E2EBF5" strokeWidth="1.5" strokeDasharray="3" />
                <path d="M 38 55 L 65 48" fill="none" stroke="#E2EBF5" strokeWidth="1.5" strokeDasharray="3" />
              </svg>

              {mapNodes.map((node) => {
                const isSelected = node.name === activeAreaName;
                return (
                  <button
                    key={node.name}
                    onClick={() => setActiveAreaName(node.name)}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none cursor-pointer select-none"
                    id={`map-node-${node.name}`}
                  >
                    {/* Pulsing glow ring on active */}
                    {isSelected && (
                      <span className="absolute -inset-4 rounded-full bg-[#0066CC]/15 animate-ping" />
                    )}

                    {/* Node Core */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#0066CC] border-white scale-125 z-20'
                        : 'bg-white border-slate-300 group-hover:border-slate-400 scale-100 z-10'
                    }`}>
                      <Pin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    </div>

                    {/* Node Label Floating */}
                    <span className={`absolute top-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md text-[10px] font-bold shadow-sm transition-all duration-300 uppercase tracking-wider ${
                      isSelected
                        ? 'bg-[#0066CC] text-white font-black scale-105'
                        : 'bg-white text-slate-500 font-bold group-hover:text-slate-800'
                    }`}>
                      {node.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative z-10 text-[10px] text-slate-400 font-medium text-center">
              * Click on any location node on the map representation to view dispatch details.
            </div>
          </div>

          {/* Right Column: Statistics & Detailed metrics */}
          <div className="lg:col-span-3 flex flex-col justify-center bg-slate-50/50 border border-[#E8EEF5] rounded-[28px] p-8" id="coverage-details-pane">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedArea.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold uppercase tracking-wider w-fit mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fully Operational</span>
                </div>

                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {selectedArea.name} Division
                </h3>
                
                <p className="text-slate-500 text-sm leading-relaxed mt-3 mb-6">
                  {selectedArea.description}
                </p>

                {/* Grid stats */}
                <div className="space-y-4">
                  {/* Stat: Phlebotomists */}
                  <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-[#E8EEF5]">
                    <div className="p-2 bg-[#EAF7FF] rounded-lg text-[#0066CC]">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Active Couriers</p>
                      <p className="text-sm font-bold text-slate-800">{selectedArea.phlebotomists} Certified Phlebotomists</p>
                    </div>
                  </div>

                  {/* Stat: TAT */}
                  <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-[#E8EEF5]">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Dispatch Time</p>
                      <p className="text-sm font-bold text-slate-800">{selectedArea.averageTimeMinutes} Minute Doorstep Arrival</p>
                    </div>
                  </div>
                </div>

                {/* Serving Zip Codes */}
                <div className="mt-6 pt-6 border-t border-[#E8EEF5]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Pincodes Served</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedArea.zipcodes.map((zip) => (
                      <span key={zip} className="px-2.5 py-1 bg-white border border-[#E8EEF5] rounded-md text-xs font-mono font-semibold text-slate-600">
                        {zip}
                      </span>
                    ))}
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
