'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { MarketingNavbar } from './MarketingNavbar';
import { HeroSection } from './HeroSection';
import { ProblemSection } from './ProblemSection';
import { BigIdeaSection } from './BigIdeaSection';
import { WhatsAppExperienceSection } from './WhatsAppExperienceSection';
import { ProductFeatureGrid } from './ProductFeatureGrid';
import { ReceivablesSection } from './ReceivablesSection';
import { WhoItsForSection } from './WhoItsForSection';
import { BeforeAfterSection } from './BeforeAfterSection';
import { WhyWhatsBillSection } from './WhyWhatsBillSection';
import { PricingSection } from './PricingSection';
import { SecurityTrustSection } from './SecurityTrustSection';
import { AboutSection } from './AboutSection';
import { FaqSection } from './FaqSection';
import { FinalCtaSection } from './FinalCtaSection';
import { MarketingFooter } from './MarketingFooter';
import { AuthModal } from '@/components/modals/AuthModal';
import { PlaygroundModal } from './PlaygroundModal';

interface MarketingPageProps {
  onOpenDashboard: () => void;
}

export function MarketingPage({ onOpenDashboard }: MarketingPageProps) {
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [authContext, setAuthContext] = useState<'login' | 'start' | 'try'>('start');
  const [session, setSession] = useState<any>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setIsSessionLoading(false);
      return;
    }

    // Load initial session
    client.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsSessionLoading(false);
    });

    // Listen to real-time auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setIsSessionLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleOpenAuth = (context: 'login' | 'start' | 'try') => {
    if (session?.user) {
      onOpenDashboard();
    } else {
      setAuthContext(context);
      setIsAuthModalOpen(true);
    }
  };

  const handleStartFree = () => {
    handleOpenAuth('start');
  };

  const handleLoginContext = () => {
    handleOpenAuth('login');
  };

  const handleTryContext = () => {
    setIsPlaygroundOpen(true);
  };

  const handleTalkToUs = () => {
    window.open(
      'https://wa.me/919876543210?text=Hi%20WhatsBill%20Team%2C%20I%20would%20like%20to%20learn%20more%20about%20WhatsBill',
      '_blank'
    );
  };

  const handleScrollToWorkflow = () => {
    const el = document.querySelector('#how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Sticky Marketing Header Navigation */}
      <MarketingNavbar
        onOpenApp={onOpenDashboard}
        onOpenAuthModal={handleLoginContext}
        session={session}
        isSessionLoading={isSessionLoading}
      />

      {/* Main Marketing Page Content */}
      <main>
        {/* Section 1: Hero */}
        <HeroSection
          onOpenApp={handleStartFree}
          onOpenDemoModal={handleStartFree}
          onOpenPlayground={() => setIsPlaygroundOpen(true)}
          onScrollToWorkflow={handleScrollToWorkflow}
        />

        {/* Section 2: The Problem */}
        <ProblemSection />

        {/* Section 3: The Big Idea (Workflow + Deterministic Engine) */}
        <BigIdeaSection onTryLive={handleTryContext} />

        {/* Section 4: Real WhatsApp Experience (Interactive Chat & Voice) */}
        <WhatsAppExperienceSection />

        {/* Section 5: Product (6-Card Feature Grid) */}
        <ProductFeatureGrid />

        {/* Section 6: Receivables Dashboard (High Impact Showcase) */}
        <ReceivablesSection />

        {/* Section 7: Who It's For (8 Wholesale Sectors) */}
        <WhoItsForSection />

        {/* Section 8: Before vs After */}
        <BeforeAfterSection />

        {/* Section 9: Why WhatsBill (3 Core Pillars + Deterministic Philosophy) */}
        <WhyWhatsBillSection />

        {/* Section 10: Pricing */}
        <PricingSection onSelectPlan={() => handleStartFree()} />

        {/* Section 11: Security & Trust */}
        <SecurityTrustSection />

        {/* Section 12: About */}
        <AboutSection />

        {/* Section 13: FAQ */}
        <FaqSection />

        {/* Section 14: Final High-Conversion CTA */}
        <FinalCtaSection
          onStartFree={handleStartFree}
          onTalkToUs={handleTalkToUs}
          onOpenApp={session?.user ? onOpenDashboard : handleStartFree}
        />
      </main>

      {/* Footer */}
      <MarketingFooter
        onOpenApp={session?.user ? onOpenDashboard : handleStartFree}
        onOpenContact={handleTalkToUs}
      />

      {/* Interactive Anonymous Login-Free Playground Modal */}
      <PlaygroundModal
        isOpen={isPlaygroundOpen}
        onClose={() => setIsPlaygroundOpen(false)}
        onOpenAuthModal={() => {
          setIsPlaygroundOpen(false);
          handleStartFree();
        }}
      />

      {/* Unified Closeable Canonical WhatsApp OTP Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          // Callback after successful real verification
          router.refresh();
        }}
        entryContext={authContext}
      />
    </div>
  );
}
