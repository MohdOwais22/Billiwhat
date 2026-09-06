'use client';

import React, { useState } from 'react';
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
import { StartTrialModal } from './StartTrialModal';

interface MarketingPageProps {
  onOpenDashboard: () => void;
}

export function MarketingPage({ onOpenDashboard }: MarketingPageProps) {
  const router = useRouter();
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Business');

  const handleStartFree = async () => {
    try {
      const client = getSupabaseClient();
      if (client) {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          onOpenDashboard();
          return;
        }
      }
    } catch (e) {
      console.error('Supabase session lookup error:', e);
    }
    router.push('/login');
  };

  const handleOpenTrialModal = (plan = 'Business') => {
    setSelectedPlan(plan);
    setIsTrialModalOpen(true);
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
        onOpenDemoModal={handleStartFree}
      />

      {/* Main Marketing Page Content */}
      <main>
        {/* Section 1: Hero */}
        <HeroSection
          onOpenApp={onOpenDashboard}
          onOpenDemoModal={handleStartFree}
          onScrollToWorkflow={handleScrollToWorkflow}
        />

        {/* Section 2: The Problem */}
        <ProblemSection />

        {/* Section 3: The Big Idea (Workflow + Deterministic Engine) */}
        <BigIdeaSection />

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
          onTalkToUs={() => handleOpenTrialModal('Enterprise Walkthrough')}
          onOpenApp={onOpenDashboard}
        />
      </main>

      {/* Footer */}
      <MarketingFooter
        onOpenApp={onOpenDashboard}
        onOpenContact={() => handleOpenTrialModal('Contact Inquiry')}
      />

      {/* Interactive Consultation / Trial Activation Modal */}
      <StartTrialModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        selectedPlan={selectedPlan}
        onLaunchDashboard={onOpenDashboard}
      />
    </div>
  );
}
