
import React, { useContext, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore, StoreContext } from './store';
import { Sidebar } from './components/Sidebar';
import { MobileNavigation } from './components/MobileNavigation';
import { ActivityFeed } from './components/ActivityFeed'; 
import { ClockTimer } from './components/ClockTimer'; 
import { LandingPage } from './pages/LandingPage'; 
import { FeaturesPage } from './pages/FeaturesPage'; 
import { PricingPage } from './pages/PricingPage'; 
import { Dashboard } from './pages/Dashboard';
import { Schedule } from './pages/Schedule';
import { JobDetail } from './pages/JobDetail';
import { JobsList } from './pages/JobsList';
import { Invoices } from './pages/Invoices';
import { ClientsList } from './pages/ClientsList';
import { ClientDetail } from './pages/ClientDetail';
import { QuotesList } from './pages/QuotesList';
import { TeamList } from './pages/TeamList';
import { TeamDetail } from './pages/TeamDetail';
import { Reports } from './pages/Reports';
import { Marketing } from './pages/Marketing';
import { MarketingCampaigns } from './pages/MarketingCampaigns';
import { MarketingCampaignBuilder } from './pages/MarketingCampaignBuilder';
import { MarketingAutomations } from './pages/MarketingAutomations';
import { MarketingAutomationBuilder } from './pages/MarketingAutomationBuilder';
import { MarketingAudiences } from './pages/MarketingAudiences';
import { AIReceptionist } from './pages/AIReceptionist';
import { Communication } from './pages/Communication';
import { Timesheets } from './pages/Timesheets';
import { Settings } from './pages/Settings';
import { InventoryDashboard } from './pages/inventory/InventoryDashboard';
import { Products } from './pages/inventory/Products';
import { StockLevels } from './pages/inventory/StockLevels';
import { PurchaseOrders } from './pages/inventory/PurchaseOrders';
import { OnboardingWizard } from './components/Onboarding/OnboardingWizard'; 
import { Loader2 } from 'lucide-react';

import { UserRole } from './types';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useContext(StoreContext);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!store) return null;
  const { currentUser, switchUser, logout, theme } = store;

  // --- ONBOARDING CHECK ---
  // Ensure we have a valid user before checking onboarding
  if (!currentUser || currentUser.id === 'guest') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
        </div>
      );
  }

  if (!currentUser.onboardingComplete) {
      return <OnboardingWizard />;
  }

  const handleUserSwitch = () => {
    const newRole = currentUser.role === UserRole.ADMIN ? UserRole.TECHNICIAN : UserRole.ADMIN;
    switchUser(newRole);
  };

  return (
    <div className={theme}>
      <div className="min-h-screen flex bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ActivityFeed />
        <ClockTimer /> 
        
        {/* Desktop Sidebar */}
        <div 
          className={`hidden md:block shrink-0 print:hidden transition-[width] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isSidebarCollapsed ? 'w-20' : 'w-52'
          }`}
        >
          <Sidebar 
            user={currentUser} 
            onSwitchUser={handleUserSwitch} 
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>
        
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-30 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 transition-all print:hidden">
           <div className="flex items-center justify-center">
              <div className="h-10 w-auto flex items-center justify-center">
                <img src="https://i.imgur.com/Bt9CDPn.png" alt="Gitta Job" className="h-full w-auto object-contain dark:hidden" />
                <img src="https://i.imgur.com/Bt9CDPn.png" alt="Gitta Job" className="h-full w-auto object-contain hidden dark:block brightness-0 invert" />
              </div>
           </div>
           
           <div className="flex items-center gap-3">
               <button 
                  onClick={logout} 
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
               >
                  Logout
               </button>
               <button onClick={handleUserSwitch} className="relative">
                  <img 
                    src={currentUser.avatarUrl} 
                    alt="User" 
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-slate-800 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">{currentUser.role[0]}</span>
                  </div>
               </button>
           </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNavigation user={currentUser} onSwitchUser={handleUserSwitch} />

        <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 overflow-x-hidden max-w-[1600px] print:p-0 print:mt-0 print:max-w-none print:overflow-visible print:bg-white pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const store = useAppStore();

  // Check if store is still loading OR if authenticated but the user data hasn't fully propagated yet (id is still guest)
  const isInitializing = store.isLoading || (store.isAuthenticated && store.currentUser.id === 'guest');

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Setting up your company...</p>
        </div>
      </div>
    );
  }

  return (
    <StoreContext.Provider value={store}>
      <HashRouter>
        {!store.isAuthenticated ? (
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        ) : (
            <AppLayout>
            <Routes>
                <Route 
                path="/" 
                element={
                    <Dashboard 
                    jobs={store.jobs} 
                    invoices={store.invoices} 
                    quotes={store.quotes} 
                    users={store.users} 
                    />
                } 
                />
                <Route path="/schedule" element={<Schedule jobs={store.jobs} users={store.users} />} />
                <Route path="/jobs" element={<JobsList jobs={store.jobs} clients={store.clients} onAddJob={store.addJob} />} />
                <Route path="/timesheets" element={<Timesheets />} />
                <Route path="/settings" element={<Settings />} />
                <Route 
                    path="/jobs/:id" 
                    element={
                        <JobDetail 
                            jobs={store.jobs} 
                            clients={store.clients} 
                            onUpdateStatus={store.updateJobStatus} 
                        />
                    } 
                />
                <Route path="/clients" element={<ClientsList clients={store.clients} jobs={store.jobs} invoices={store.invoices} onAddClient={store.addClient} />} />
                <Route 
                    path="/clients/:id" 
                    element={
                        <ClientDetail 
                            clients={store.clients}
                            jobs={store.jobs}
                            quotes={store.quotes}
                            invoices={store.invoices}
                            onUpdateClient={store.updateClient}
                            onAddJob={store.addJob}
                        />
                    } 
                />
                <Route path="/quotes" element={<QuotesList quotes={store.quotes} clients={store.clients} onAddQuote={store.addQuote} onUpdateQuote={store.updateQuote} />} />
                <Route path="/invoices" element={<Invoices invoices={store.invoices} clients={store.clients} onCreateInvoice={store.createInvoice} onUpdateInvoice={store.updateInvoice} />} />
                <Route path="/team" element={<TeamList users={store.users} jobs={store.jobs} />} />
                <Route path="/team/:id" element={<TeamDetail users={store.users} jobs={store.jobs} />} />
                <Route path="/reports" element={<Reports jobs={store.jobs} invoices={store.invoices} users={store.users} />} />
                
                {/* MARKETING ROUTES */}
                <Route path="/marketing" element={<Marketing campaigns={store.marketingCampaigns} />} />
                <Route path="/marketing/campaigns" element={<MarketingCampaigns campaigns={store.marketingCampaigns} segments={store.marketingAudiences} onAddCampaign={store.addCampaign} />} />
                <Route path="/marketing/campaigns/:id" element={<MarketingCampaignBuilder />} />
                <Route path="/marketing/automations" element={<MarketingAutomations automations={store.marketingAutomations} />} />
                <Route path="/marketing/automations/:id" element={<MarketingAutomationBuilder />} />
                <Route path="/marketing/audiences" element={<MarketingAudiences segments={store.marketingAudiences} />} />

                {/* INVENTORY ROUTES */}
                <Route path="/inventory" element={<InventoryDashboard products={store.inventoryProducts} records={store.inventoryRecords} purchaseOrders={store.purchaseOrders} />} />
                <Route path="/inventory/products" element={<Products products={store.inventoryProducts} vendors={store.vendors} onAddProduct={store.addProduct} />} />
                <Route path="/inventory/stock" element={<StockLevels products={store.inventoryProducts} records={store.inventoryRecords} warehouses={store.warehouses} onUpdateStock={store.updateStock} />} />
                <Route path="/inventory/orders" element={<PurchaseOrders orders={store.purchaseOrders} vendors={store.vendors} products={store.inventoryProducts} onCreatePO={store.createPO} />} />

                {/* AI TOOLS */}
                <Route path="/ai-receptionist" element={<AIReceptionist />} />
                <Route path="/communication" element={<Communication />} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </AppLayout>
        )}
      </HashRouter>
    </StoreContext.Provider>
  );
};

export default App;
