'use client';

import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Building2, Phone, Mail, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { addNewCustomer } from '@/lib/services/dashboardService';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [usePhoneForWhatsapp, setUsePhoneForWhatsapp] = useState(true);
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [creditLimit, setCreditLimit] = useState('');
  const [creditDays, setCreditDays] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (usePhoneForWhatsapp) {
      setWhatsappPhone(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedBusiness = businessName.trim();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    // 1. Required validation
    if (!trimmedBusiness && !trimmedName) {
      setErrorMsg('Customer or Business Name is required.');
      return;
    }

    if (!trimmedPhone) {
      setErrorMsg('Primary Phone number is required.');
      return;
    }

    const cleanPhone = trimmedPhone.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }

    // 2. WhatsApp phone validation if different
    const finalWhatsapp = usePhoneForWhatsapp ? cleanPhone : whatsappPhone.trim().replace(/[\s\-\(\)]/g, '');
    if (finalWhatsapp && finalWhatsapp.length < 10) {
      setErrorMsg('Please enter a valid 10-digit WhatsApp number or use same as primary.');
      return;
    }

    // 3. Email validation
    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // 4. GSTIN validation
    const trimmedGstin = gstin.trim().toUpperCase();
    if (trimmedGstin) {
      if (trimmedGstin.length !== 15) {
        setErrorMsg('GSTIN must be exactly 15 characters (e.g. 27AAAAA0000A1Z5).');
        return;
      }
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(trimmedGstin)) {
        setErrorMsg('Invalid GSTIN format. Example: 27AABCU9603R1ZM');
        return;
      }
    }

    // 5. Credit limit & credit days validation
    const parsedCreditLimit = creditLimit !== '' ? parseFloat(creditLimit) : 0;
    if (isNaN(parsedCreditLimit) || parsedCreditLimit < 0) {
      setErrorMsg('Credit limit must be a positive number.');
      return;
    }

    const parsedCreditDays = creditDays !== '' ? parseInt(creditDays, 10) : 0;
    if (isNaN(parsedCreditDays) || parsedCreditDays < 0 || parsedCreditDays > 365) {
      setErrorMsg('Credit days must be between 0 and 365.');
      return;
    }

    const finalBillingAddress = billingAddress.trim() || 'N/A';
    const finalShippingAddress = sameAsBilling ? finalBillingAddress : (shippingAddress.trim() || finalBillingAddress);

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await addNewCustomer({
        name: trimmedName || trimmedBusiness,
        businessName: trimmedBusiness || trimmedName,
        phone: cleanPhone,
        whatsappPhone: finalWhatsapp || null,
        email: trimmedEmail || null,
        gstin: trimmedGstin || null,
        billingAddress: finalBillingAddress,
        shippingAddress: finalShippingAddress,
        creditLimit: parsedCreditLimit,
        creditDays: parsedCreditDays,
        notes: notes.trim() || null,
        isActive,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add customer. Please verify details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
      id="add-customer-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-8 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Customer & Credit Party</h3>
              <p className="text-xs text-slate-500">Create a buyer account for invoicing, credit tracking, and WhatsApp ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Business & Contact Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-business-name">
                Business / Firm Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="cust-business-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Hardware Supplies"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-contact-name">
                Owner / Contact Person
              </label>
              <input
                id="cust-contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Phone & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-primary-phone">
                Primary Mobile Phone <span className="text-rose-500">*</span>
              </label>
              <input
                id="cust-primary-phone"
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                required
                placeholder="9876543210"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="cust-whatsapp-phone">
                  WhatsApp Number
                </label>
                <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePhoneForWhatsapp}
                    onChange={(e) => {
                      setUsePhoneForWhatsapp(e.target.checked);
                      if (e.target.checked) {
                        setWhatsappPhone(phone);
                      }
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Same as phone</span>
                </label>
              </div>
              <input
                id="cust-whatsapp-phone"
                type="tel"
                value={usePhoneForWhatsapp ? phone : whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                disabled={usePhoneForWhatsapp}
                placeholder="9876543210"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Email & GSTIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-email">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="cust-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="accounts@buyercompany.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-gstin">
                GSTIN Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="cust-gstin"
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                maxLength={15}
                placeholder="27AABCU9603R1ZM"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Credit Terms & Limit */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Credit Terms & Limits</span>
              <span className="text-[11px] text-slate-500">For receivables & credit control</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-credit-limit">
                  Credit Limit (₹) <span className="text-slate-400 font-normal">(0 = No Limit)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    id="cust-credit-limit"
                    type="number"
                    min="0"
                    step="1000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-credit-days">
                  Credit Period (Days) <span className="text-slate-400 font-normal">(0 = Net 0 / Immediate)</span>
                </label>
                <input
                  id="cust-credit-days"
                  type="number"
                  min="0"
                  max="365"
                  value={creditDays}
                  onChange={(e) => setCreditDays(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Billing & Shipping Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-billing-address">
              Billing Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="cust-billing-address"
              rows={2}
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              placeholder="Shop / Plot No., Industrial Area, City, State - PIN"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          {!sameAsBilling && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-shipping-address">
                Shipping / Delivery Address
              </label>
              <textarea
                id="cust-shipping-address"
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Warehouse / Site Address, City, State - PIN"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cust-same-as-billing"
              checked={sameAsBilling}
              onChange={(e) => setSameAsBilling(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="cust-same-as-billing" className="text-xs text-slate-600 cursor-pointer">
              Shipping address is same as billing address
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-notes">
              Internal Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="cust-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requires PO copy on delivery, preferred transport partner"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs font-bold text-slate-900">Customer Account Status</span>
              <p className="text-[11px] text-slate-500">Active accounts appear in invoice creation and reminder queues</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition shadow-xs cursor-pointer"
              id="submit-customer-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Customer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
