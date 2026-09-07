'use client';

import React from 'react';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';

// Modals
import { InvoiceDetailModal } from '@/components/modals/InvoiceDetailModal';
import { RecordPaymentModal } from '@/components/modals/RecordPaymentModal';
import { CreateInvoiceModal } from '@/components/modals/CreateInvoiceModal';
import { AddCustomerModal } from '@/components/modals/AddCustomerModal';
import { AddProductModal } from '@/components/modals/AddProductModal';
import { WhatsAppReminderModal } from '@/components/modals/WhatsAppReminderModal';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const {
    currentRoute,
    handleNavigate,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    organization,
    gstProfile,
    userEmail,
    dataSource,
    isLoading,
    dashboardData,
    loadData,
    selectedInvoice,
    isInvoiceDetailOpen,
    setIsInvoiceDetailOpen,
    isRecordPaymentOpen,
    setIsRecordPaymentOpen,
    paymentInitialInvoice,
    paymentInitialCustomerId,
    paymentInitialAmount,
    handleOpenRecordPayment,
    isCreateInvoiceOpen,
    setIsCreateInvoiceOpen,
    isAddCustomerOpen,
    setIsAddCustomerOpen,
    isAddProductOpen,
    setIsAddProductOpen,
    whatsAppItem,
    isWhatsAppOpen,
    setIsWhatsAppOpen,
    handleQueueWhatsApp,
  } = useDashboard();

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-slate-50 font-sans antialiased text-slate-900" id="whatsbill-app-root">
      {/* Sidebar Navigation - Desktop is fixed on left, Mobile is sliding drawer */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={(route) => handleNavigate(route)}
        organization={organization}
        isLoading={isLoading}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Shell Area - Takes remaining width and scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50">
        <DashboardHeader
          organization={organization}
          gstProfile={gstProfile}
          isLoading={isLoading}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          dataSource={dataSource}
          userEmail={userEmail}
        />

        {/* Tab Route Content - Independent scroll container */}
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-slate-50 pb-12 sm:pb-16" id="main-content-scrollable">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          isOpen={isInvoiceDetailOpen}
          onClose={() => setIsInvoiceDetailOpen(false)}
          onRecordPayment={(inv) => {
            setIsInvoiceDetailOpen(false);
            handleOpenRecordPayment(inv, inv.customer_id, inv.balance_due);
          }}
          onSendWhatsAppReminder={(inv) => {
            setIsInvoiceDetailOpen(false);
            handleQueueWhatsApp(inv as any);
          }}
        />
      )}

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        onSuccess={() => {
          setIsRecordPaymentOpen(false);
          loadData();
        }}
        initialInvoice={paymentInitialInvoice}
        initialCustomerId={paymentInitialCustomerId}
        initialAmount={paymentInitialAmount}
        customers={dashboardData?.customers || []}
      />

      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onSuccess={() => {
          setIsCreateInvoiceOpen(false);
          loadData();
        }}
        customers={dashboardData?.customers || []}
        products={dashboardData?.products || []}
        organization={organization}
        gstProfile={gstProfile}
        onOpenAddCustomer={() => {
          setIsCreateInvoiceOpen(false);
          setIsAddCustomerOpen(true);
        }}
        onOpenAddProduct={() => {
          setIsCreateInvoiceOpen(false);
          setIsAddProductOpen(true);
        }}
      />

      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSuccess={() => {
          setIsAddCustomerOpen(false);
          loadData();
        }}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSuccess={() => {
          setIsAddProductOpen(false);
          loadData();
        }}
      />

      <WhatsAppReminderModal
        item={whatsAppItem}
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        onSent={() => loadData()}
        organization={organization}
      />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
