'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, AlertCircle, Building2, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { Customer } from '@/types/database';
import { updateCustomer } from '@/lib/services/dashboardService';

interface EditCustomerModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCustomerModal({ customer, isOpen, onClose, onSuccess }: EditCustomerModalProps) {
  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [creditDays, setCreditDays] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (customer && isOpen) {
      setBusinessName(customer.business_name || '');
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setWhatsappPhone(customer.whatsapp_phone || customer.phone || '');
      setEmail(customer.email || '');
      setGstin(customer.gstin || '');
      setBillingAddress(customer.billing_address === 'N/A' ? '' : (customer.billing_address || ''));
      setShippingAddress(customer.shipping_address || '');
      setCreditLimit(customer.credit_limit !== undefined && customer.credit_limit !== null ? String(customer.credit_limit) : '0');
      setCreditDays(customer.credit_days !== undefined && customer.credit_days !== null ? String(customer.credit_days) : '0');
      setNotes(customer.notes || '');
      setIsActive(customer.is_active ?? true);
      setErrorMsg(null);
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedBusiness = businessName.trim();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

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

    const cleanWhatsapp = whatsappPhone.trim().replace(/[\s\-\(\)]/g, '');
    if (cleanWhatsapp && cleanWhatsapp.length < 10) {
      setErrorMsg('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const trimmedGstin = gstin.trim().toUpperCase();
    if (trimmedGstin) {
      if (trimmedGstin.length !== 15) {
        setErrorMsg('GSTIN must be exactly 15 characters.');
        return;
      }
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(trimmedGstin)) {
        setErrorMsg('Invalid GSTIN format. Example: 27AABCU9603R1ZM');
        return;
      }
    }

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

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await updateCustomer(customer.id, {
        name: trimmedName || trimmedBusiness,
        businessName: trimmedBusiness || trimmedName,
        phone: cleanPhone,
        whatsappPhone: cleanWhatsapp || null,
        email: trimmedEmail || null,
        gstin: trimmedGstin || null,
        billingAddress: billingAddress.trim() || 'N/A',
        shippingAddress: shippingAddress.trim() || null,
        creditLimit: parsedCreditLimit,
        creditDays: parsedCreditDays,
        notes: notes.trim() || null,
        isActive,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update customer details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
      id="edit-customer-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-8 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Edit3 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Customer Profile</h3>
              <p className="text-xs text-slate-500">Update party details, credit limit, and addresses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-cust-business-name">
                Business / Firm Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-cust-business-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business Name"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-cust-contact-name">
                Owner / Contact Person
              </label>
              <input
                id="edit-cust-contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contact Person Name"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Phone & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-cust-phone">
                Primary Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-cust-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-cust-whatsapp">
                WhatsApp Phone Number
              </label>
              <input
                id="edit-cust-whatsapp"
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Email & GSTIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-cust-email">
                Email Address
              </label>
              <input
                id="edit-cust-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-cust-gstin">
                GSTIN Number
              </label>
              <input
                id="edit-cust-gstin"
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                maxLength={15}
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Credit Terms & Limits */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Credit Terms & Limits</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-cust-credit-limit">
                  Credit Limit (₹) <span className="text-slate-400 font-normal">(0 = No Limit)</span>
                </label>
                <input
                  id="edit-cust-credit-limit"
                  type="number"
                  min="0"
                  step="1000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-cust-credit-days">
                  Credit Period (Days)
                </label>
                <input
                  id="edit-cust-credit-days"
                  type="number"
                  min="0"
                  max="365"
                  value={creditDays}
                  onChange={(e) => setCreditDays(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Billing & Shipping Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-cust-billing">
              Billing Address
            </label>
            <textarea
              id="edit-cust-billing"
              rows={2}
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-cust-shipping">
              Shipping Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="edit-cust-shipping"
              rows={2}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="edit-cust-notes">
              Internal Notes
            </label>
            <input
              id="edit-cust-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs font-bold text-slate-900">Customer Account Active</span>
              <p className="text-[11px] text-slate-500">Inactive accounts are hidden from invoice creation dropdowns</p>
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
              id="submit-edit-customer-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Customer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
