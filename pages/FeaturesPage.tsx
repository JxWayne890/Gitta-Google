
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNavbar } from '../components/PublicNavbar';
import { Button } from '../components/Button';
import { 
  Calendar, MapPin, Users, MessageCircle, 
  CreditCard, Smartphone, ArrowRight, Zap, 
  CheckCircle, BarChart3, Shield, Clock 
} from 'lucide-react';
import { StoreContext } from '../store';

export const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();
  const store = useContext(StoreContext);
  const { darkMode, toggleDarkMode } = store!;
  
  const handleAuthAction = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      <PublicNavbar onSignIn={handleAuthAction} onGetStarted={handleAuthAction} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
            Built specifically for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-slate-600 dark:to-slate-400">Service Pros.</span>
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto mb-10">
            We don't just handle scheduling. We handle your entire business lifecycle, from the moment a lead contacts you to the moment money hits your bank account.
          </p>
        </div>
      </section>

      {/* FEATURE 1: SCHEDULING */}
      <section className="py-20 px-6 bg-white dark:bg-slate-900 overflow-hidden border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 relative">
              {/* Visual Representation using CSS Shapes and Icons */}
              <div className="relative bg-slate-900 p-2 rounded-3xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-white rounded-2xl overflow-hidden h-[400px] flex flex-col">
                      <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                          <div className="flex gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-400"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                              <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          </div>
                          <div className="text-xs font-bold text-slate-400 uppercase">Dispatch View</div>
                      </div>
                      <div className="p-4 grid grid-cols-4 gap-4 h-full">
                          <div className="col-span-1 border-r border-slate-100 pr-2 space-y-3">
                              <div className="h-8 w-full bg-slate-100 rounded"></div>
                              <div className="h-8 w-full bg-slate-100 rounded"></div>
                              <div className="h-8 w-full bg-slate-100 rounded"></div>
                          </div>
                          <div className="col-span-3 relative">
                               {/* Mock Jobs */}
                               <div className="absolute top-4 left-2 right-20 h-16 bg-teal-50 border-l-4 border-teal-500 rounded p-2 shadow-sm">
                                   <div className="h-2 w-20 bg-teal-200 rounded mb-2"></div>
                                   <div className="h-2 w-32 bg-teal-100 rounded"></div>
                               </div>
                               <div className="absolute top-24 left-10 right-4 h-20 bg-blue-50 border-l-4 border-blue-500 rounded p-2 shadow-sm">
                                   <div className="h-2 w-24 bg-blue-200 rounded mb-2"></div>
                                   <div className="h-2 w-40 bg-blue-100 rounded"></div>
                               </div>
                               <div className="absolute top-48 left-0 right-32 h-14 bg-amber-50 border-l-4 border-amber-500 rounded p-2 shadow-sm">
                                   <div className="h-2 w-16 bg-amber-200 rounded mb-2"></div>
                                   <div className="h-2 w-24 bg-amber-100 rounded"></div>
                               </div>
                          </div>
                      </div>
                  </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 animate-bounce delay-700">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full">
                          <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Route Optimized</p>
                          <p className="font-bold text-slate-900 dark:text-white">Saved 12 miles</p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="lg:w-1/2">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Smart Dispatching & Scheduling</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Drag-and-drop jobs onto your calendar and let our system handle the rest. We automatically check for conflicts, calculate drive times, and optimize routes to ensure your technicians spend more time washing and less time driving.
            </p>
            <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                    Real-time conflict detection
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                    Map-based dispatching view
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                    Automated appointment reminders
                </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FEATURE 2: MARKETING */}
      <section className="py-20 px-6 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16">
          <div className="lg:w-1/2 relative">
              <img 
                src="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=1000" 
                alt="Detailing" 
                className="rounded-2xl shadow-2xl opacity-50 mix-blend-overlay absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-purple-400" /> Campaign Builder
                  </h3>
                  <div className="space-y-4">
                      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                          <div className="flex justify-between mb-2">
                              <span className="text-xs font-bold text-slate-400 uppercase">Trigger</span>
                              <span className="text-xs text-teal-400">Active</span>
                          </div>
                          <p className="font-medium text-slate-200">When job marked "Completed"</p>
                      </div>
                      <div className="flex justify-center">
                          <ArrowRight className="w-5 h-5 text-slate-600 transform rotate-90" />
                      </div>
                      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                          <div className="flex justify-between mb-2">
                              <span className="text-xs font-bold text-slate-400 uppercase">Action</span>
                              <span className="text-xs text-blue-400">Wait 3 Days</span>
                          </div>
                          <p className="font-medium text-slate-200">Send "Request Review" SMS</p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="lg:w-1/2">
             <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Automated Marketing that Works</h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Stop chasing customers. Our marketing suite works in the background to fill your schedule. Automatically reactivate old leads, request reviews after a job, and send weather-based promotions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <Smartphone className="w-6 h-6 text-blue-400 mb-3" />
                    <h4 className="font-bold text-white">SMS Blasts</h4>
                    <p className="text-sm text-slate-400 mt-1">98% open rates for instant bookings.</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <BarChart3 className="w-6 h-6 text-teal-400 mb-3" />
                    <h4 className="font-bold text-white">Revenue Tracking</h4>
                    <p className="text-sm text-slate-400 mt-1">See exactly how much money each campaign makes.</p>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 3: CRM */}
      <section className="py-20 px-6 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">A CRM that knows your customers.</h2>
                  <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Store vehicle details, gate codes, and preferences so you never have to ask twice.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Profile Card 1 */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:border-teal-400 dark:hover:border-teal-500 transition-colors group">
                      <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300">JD</div>
                          <div>
                              <h4 className="font-bold text-slate-900 dark:text-white">John Doe</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Client since 2021</p>
                          </div>
                      </div>
                      <div className="space-y-4">
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                  <Smartphone className="w-4 h-4" />
                              </div>
                              (555) 123-4567
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                              <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                  <MapPin className="w-4 h-4" />
                              </div>
                              123 Maple Ave, Lubbock
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 mt-4">
                              <span className="font-bold block text-xs text-slate-400 uppercase mb-1">Vehicle</span>
                              2022 Tesla Model 3 (White)
                          </div>
                      </div>
                  </div>

                   {/* Profile Card 2 */}
                   <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:border-teal-400 dark:hover:border-teal-500 transition-colors group md:translate-y-8">
                      <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-600 dark:text-slate-300">SC</div>
                          <div>
                              <h4 className="font-bold text-slate-900 dark:text-white">Sarah Connor</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">VIP Member</p>
                          </div>
                      </div>
                      <div className="space-y-4">
                           <div className="flex justify-between items-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800">
                               <span className="text-sm font-medium text-teal-800 dark:text-teal-300">Lifetime Value</span>
                               <span className="font-bold text-teal-700 dark:text-teal-400">$4,250</span>
                           </div>
                           <div className="grid grid-cols-3 gap-2">
                               <img src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=100&q=80" className="rounded-lg h-16 w-full object-cover" />
                               <img src="https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&w=100&q=80" className="rounded-lg h-16 w-full object-cover" />
                               <div className="bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300">+12</div>
                           </div>
                      </div>
                  </div>

                   {/* Feature List */}
                   <div className="flex flex-col justify-center space-y-6">
                       <div className="flex gap-4">
                           <Shield className="w-8 h-8 text-teal-500 shrink-0" />
                           <div>
                               <h4 className="font-bold text-slate-900 dark:text-white text-lg">Secure Data</h4>
                               <p className="text-slate-500 dark:text-slate-400">Bank-level encryption for all client data and payments.</p>
                           </div>
                       </div>
                       <div className="flex gap-4">
                           <Users className="w-8 h-8 text-blue-500 shrink-0" />
                           <div>
                               <h4 className="font-bold text-slate-900 dark:text-white text-lg">Segmentation</h4>
                               <p className="text-slate-500 dark:text-slate-400">Group clients by vehicle type, location, or spend to send better offers.</p>
                           </div>
                       </div>
                   </div>
              </div>
          </div>
      </section>

       {/* FEATURE 4: FINANCE */}
       <section className="py-24 px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
             <div className="lg:w-1/2">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-6">
                    <CreditCard className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Professional Invoicing & Payments</h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    Send estimates that convert to jobs, and jobs that convert to invoices. Accept credit cards on the spot or send a secure link for clients to pay later.
                </p>
                <Button size="lg" onClick={handleAuthAction} className="shadow-lg shadow-teal-500/20 bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-700 text-white border-transparent">
                    Start Sending Invoices
                </Button>
             </div>
             
             <div className="lg:w-1/2 relative">
                 <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-md mx-auto rotate-1 hover:rotate-0 transition-transform duration-500">
                     <div className="flex justify-between items-center mb-8">
                         <div className="h-8 w-8 bg-slate-900 dark:bg-slate-700 rounded-lg"></div>
                         <div className="text-right">
                             <p className="text-xs font-bold text-slate-400 uppercase">Invoice #</p>
                             <p className="font-bold text-slate-900 dark:text-white">INV-2024-001</p>
                         </div>
                     </div>
                     <div className="space-y-4 mb-8 border-b border-slate-100 dark:border-slate-700 pb-8">
                         <div className="flex justify-between">
                             <span className="text-slate-600 dark:text-slate-300">Full Interior Detail</span>
                             <span className="font-bold text-slate-900 dark:text-white">$250.00</span>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-slate-600 dark:text-slate-300">Pet Hair Removal</span>
                             <span className="font-bold text-slate-900 dark:text-white">$50.00</span>
                         </div>
                         <div className="flex justify-between">
                             <span className="text-slate-600 dark:text-slate-300">Ozone Treatment</span>
                             <span className="font-bold text-slate-900 dark:text-white">$75.00</span>
                         </div>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-lg font-bold text-slate-900 dark:text-white">Total Due</span>
                         <span className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">$375.00</span>
                     </div>
                     <div className="mt-8">
                         <button className="w-full py-3 bg-slate-900 dark:bg-teal-600 text-white rounded-lg font-bold">Pay Now</button>
                     </div>
                 </div>
             </div>
          </div>
       </section>

       {/* CTA */}
      <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
         <div className="max-w-3xl mx-auto px-6">
             <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">Ready to streamline your business?</h2>
             <p className="text-xl text-slate-500 dark:text-slate-400 mb-10">Join the detailers who are saving time and making more money with Gitta Job.</p>
             <Button size="lg" onClick={handleAuthAction} className="h-14 px-10 text-lg shadow-2xl shadow-teal-500/30 bg-teal-600 hover:bg-teal-700 text-white border-transparent">
                 Get Started Free
             </Button>
         </div>
      </section>

    </div>
  );
};
