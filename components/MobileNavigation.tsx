
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Briefcase, DollarSign, Menu, 
  X, Users, FileText, PieChart, HardHat, ChevronRight, LogOut,
  MessageSquare, Bot, Package, Megaphone, ShoppingCart, Box,
  BarChart3, Zap, Send, Moon, Sun
} from 'lucide-react';
import { User, UserRole } from '../types';

interface MobileNavigationProps {
  user: User;
  onSwitchUser: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ user, onSwitchUser, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.OFFICE;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const navStructure = [
    {
      label: 'General',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, show: true },
        { path: '/schedule', label: 'Schedule', icon: Calendar, show: true },
        { path: '/jobs', label: 'Jobs', icon: Briefcase, show: true },
        { path: '/communication', label: 'Communication', icon: MessageSquare, show: true },
      ]
    },
    {
      label: 'Management',
      show: isAdmin,
      items: [
        { path: '/clients', label: 'Clients', icon: Users, show: true },
        { path: '/quotes', label: 'Quotes', icon: FileText, show: true },
        { path: '/invoices', label: 'Invoices', icon: DollarSign, show: true },
        { path: '/team', label: 'Team', icon: HardHat, show: true },
        { path: '/reports', label: 'Reports', icon: PieChart, show: true },
      ]
    },
    {
      label: 'Inventory',
      show: isAdmin,
      collapsible: true,
      id: 'inventory',
      icon: Package,
      items: [
        { path: '/inventory', label: 'Dashboard', icon: BarChart3, show: true },
        { path: '/inventory/stock', label: 'Stock Levels', icon: Box, show: true },
        { path: '/inventory/products', label: 'Products', icon: Package, show: true },
        { path: '/inventory/orders', label: 'Purchasing', icon: ShoppingCart, show: true },
      ]
    },
    {
      label: 'Marketing',
      show: isAdmin,
      collapsible: true,
      id: 'marketing',
      icon: Megaphone,
      items: [
        { path: '/marketing', label: 'Overview', icon: BarChart3, show: true },
        { path: '/marketing/campaigns', label: 'Campaigns', icon: Send, show: true },
        { path: '/marketing/automations', label: 'Automations', icon: Zap, show: true },
        { path: '/marketing/audiences', label: 'Audiences', icon: Users, show: true },
      ]
    },
    {
      label: 'Tools',
      items: [
        { path: '/ai-receptionist', label: 'AI Receptionist', icon: Bot, show: true },
      ]
    }
  ];

  const bottomNavItems = [
    { path: '/', label: 'Home', icon: LayoutDashboard },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/jobs', label: 'Jobs', icon: Briefcase },
    ...(isAdmin 
        ? [{ path: '/invoices', label: 'Invoices', icon: DollarSign }] 
        : [{ path: '/communication', label: 'Chat', icon: MessageSquare }]
    ),
  ];

  return (
    <>
       <div className="h-20 md:hidden" />

       {/* Bottom Bar */}
       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 pb-safe pt-2 z-40 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {bottomNavItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
               <Link
                 key={item.path}
                 to={item.path}
                 onClick={() => setIsMenuOpen(false)}
                 className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                   isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                 }`}
               >
                 <item.icon className={`w-6 h-6 ${isActive ? 'fill-current opacity-20' : ''}`} strokeWidth={2} />
                 <span className="text-[10px] font-medium">{item.label}</span>
               </Link>
             );
          })}
          
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                isMenuOpen ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
       </div>

       {/* Drawer */}
       <div 
         className={`md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${
           isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
         }`}
         onClick={() => setIsMenuOpen(false)}
       >
          <div 
            className={`absolute top-0 right-0 bottom-0 w-[85%] max-w-[320px] bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
                isMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            onClick={e => e.stopPropagation()}
          >
             {/* Header */}
             <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold shadow-md">
                        {user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">{user.role}</p>
                    </div>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>

             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {navStructure.map((section, idx) => {
                    if (section.show === false) return null;

                    if (section.collapsible && section.id) {
                        const isExpanded = expandedSections[section.id];
                        return (
                            <div key={idx} className="space-y-1">
                                <button 
                                    onClick={() => toggleSection(section.id!)}
                                    className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {section.icon && <section.icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                                        {section.label}
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                                {isExpanded && (
                                    <div className="pl-4 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-4 my-1">
                                        {section.items.map(item => (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={() => setIsMenuOpen(false)}
                                                className={`flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                    location.pathname === item.path 
                                                    ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20' 
                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <item.icon className="w-4 h-4 opacity-70" />
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <div key={idx}>
                            {section.label && <p className="px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{section.label}</p>}
                            <div className="space-y-1">
                                {section.items.map(item => {
                                    if (item.show === false) return null;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                                                isActive 
                                                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-bold' 
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                                            }`}
                                        >
                                            <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
             </div>

             {/* Footer Actions */}
             <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <button 
                    onClick={toggleDarkMode} 
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-sm active:scale-[0.98] transition-transform mb-3"
                >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </button>
                <button 
                    onClick={() => { onSwitchUser(); setIsMenuOpen(false); }} 
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold shadow-sm active:scale-[0.98] transition-transform mb-3"
                >
                    <Users className="w-4 h-4" /> Switch Role
                </button>
                <button 
                    onClick={() => { window.location.reload(); }} 
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    <LogOut className="w-4 h-4" /> Log Out
                </button>
                <p className="text-center text-[10px] text-slate-400 mt-4">Gitta Job v2.0.2</p>
             </div>
          </div>
       </div>
    </>
  );
};
