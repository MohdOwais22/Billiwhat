import React, { useState } from 'react';
import { Sidebar, NavRoute } from './components/layout/Sidebar';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ModulePlaceholder } from './components/placeholder/ModulePlaceholder';
import { SEED_ORGANIZATION } from './data/seedData';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<NavRoute>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-full min-h-screen bg-slate-50 font-sans antialiased text-slate-900" id="whatsbill-app-root">
      {/* Sidebar Navigation */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={(route) => {
          setCurrentRoute(route);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        organization={SEED_ORGANIZATION}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {currentRoute === 'dashboard' ? (
          <DashboardPage
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onNavigate={(route) => setCurrentRoute(route)}
          />
        ) : (
          <div className="min-h-screen flex flex-col">
            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1.5 text-slate-600 rounded-lg hover:bg-slate-100"
              >
                Menu
              </button>
              <span className="font-bold text-slate-900 capitalize">{currentRoute}</span>
            </header>
            <ModulePlaceholder
              route={currentRoute}
              onBackToDashboard={() => setCurrentRoute('dashboard')}
            />
          </div>
        )}
      </div>
    </div>
  );
}

