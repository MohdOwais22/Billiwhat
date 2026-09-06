'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import { APP_NAME, getBrandInitials } from '@/config/brand';

interface StartTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: string;
  onLaunchDashboard: () => void;
}

export function StartTrialModal({
  isOpen,
  onClose,
  selectedPlan = 'Business',
  onLaunchDashboard,
}: StartTrialModalProps) {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [industry, setIndustry] = useState('Electrical Distribution');
  const [city, setCity] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      id="start-trial-modal-overlay"
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-slate-900 font-sans animate-in zoom-in-95 duration-150"
        id="start-trial-modal-container"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-slate-950 flex items-center justify-center font-bold text-xs">
              {getBrandInitials()}
            </div>
            <div>
              <h3 className="text-sm font-bold">Start Free with {APP_NAME}</h3>
              <p className="text-[10px] text-slate-400">Plan selected: {selectedPlan}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!formSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <p className="text-slate-600 text-xs leading-relaxed">
                Connect your WhatsApp workflow. No credit card required — get full access to WhatsApp invoicing and receivables tracking.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Business / Trading Firm Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahavir Electricals & Hardware"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  WhatsApp Mobile Number *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 font-medium text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    placeholder="98765 43210"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-r-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Industry Sector
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition text-xs"
                  >
                    <option>Electrical Distribution</option>
                    <option>Hardware Wholesale</option>
                    <option>Building Materials</option>
                    <option>FMCG Wholesale</option>
                    <option>Auto Parts & Spares</option>
                    <option>Industrial Supplies</option>
                    <option>Other Credit Trade</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Trade City / Hub
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pune / Surat"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Activate 14-Day Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Your trade data remains 100% private and encrypted</span>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Welcome to {APP_NAME}!
                </h4>
                <p className="text-xs text-slate-600">
                  Your trial request for <strong>{businessName || 'your business'}</strong> has been registered. Our onboarding specialist will send your WhatsApp setup code.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 text-left space-y-1">
                <span className="font-bold block">Next Step:</span>
                <span>You can access the {APP_NAME} Web Dashboard right now in your browser.</span>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => {
                    onClose();
                    onLaunchDashboard();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Open WhatsBill Web Dashboard</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Continue browsing website
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
