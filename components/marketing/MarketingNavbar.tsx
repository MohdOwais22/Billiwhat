'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { APP_NAME, getBrandInitials } from '@/config/brand';

interface MarketingNavbarProps {
  onOpenApp: () => void;
  onOpenAuthModal: () => void;
  session: any;
  isSessionLoading: boolean;
}

export function MarketingNavbar({ onOpenApp, onOpenAuthModal, session, isSessionLoading }: MarketingNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Product', href: '#product' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Who it’s for', href: '#who-its-for' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'FAQ', href: '#faq' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';

    setTimeout(() => {
      if (!href || href === '#' || href === '#top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const element = document.querySelector(href);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: Math.max(0, elementPosition - offset),
          behavior: 'smooth',
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 20);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3'
            : 'bg-white/80 backdrop-blur-xs border-b border-slate-100 py-4'
        }`}
        id="main-marketing-navbar"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <button
            onClick={() => handleNavClick('#top')}
            className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-hidden"
            aria-label={`${APP_NAME} Home`}
            id="nav-logo-link"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-emerald-700 transition-colors">
              <span className="text-emerald-400 font-extrabold text-base tracking-tighter">{getBrandInitials()[0]}</span>
              <span className="text-white text-xs font-bold -ml-0.5">{getBrandInitials()[1] || ''}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 font-sans">
                {APP_NAME}
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase -mt-0.5 hidden sm:block">
                Bill. Collect. Reconcile.
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links & Dynamic Auth Action */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="px-3 py-1.5 text-xs lg:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-2" />

            {session ? (
              <button
                onClick={onOpenApp}
                className="px-4 py-2 text-xs lg:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition shadow-xs hover:shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                id="nav-dashboard-btn"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-2 text-xs lg:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-transparent border border-slate-200 hover:border-slate-300 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                id="nav-login-btn"
              >
                <span>Log in</span>
              </button>
            )}
          </nav>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            id="mobile-nav-toggle-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-slate-900" /> : <Menu className="w-6 h-6 text-slate-900" />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop & Drawer Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-150"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Menu */}
          <div
            id="mobile-nav-menu"
            className="fixed top-16 left-0 right-0 z-50 md:hidden bg-white border-b border-slate-200 px-5 pt-4 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-top-3 duration-200"
          >
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className="text-left px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-xl transition cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              {session ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenApp();
                  }}
                  className="w-full py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer text-center"
                  id="mobile-menu-dashboard"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full py-3 px-4 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-transparent border border-slate-200 hover:border-slate-300 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-center"
                  id="mobile-menu-login"
                >
                  <span>Log in</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
