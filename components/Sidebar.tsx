
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, FileText, Briefcase, DollarSign,
  ChevronRight, ChevronLeft, PieChart, HardHat, PanelLeftOpen, Megaphone,
  Zap, Send, BarChart3, ChevronDown, Bot, Package, ShoppingCart, Truck,
  Box, MessageSquare, Moon, Sun, Clock, LogOut
} from 'lucide-react';
import { UserRole, User } from '../types';

interface SidebarProps {
  user: User;
  onSwitchUser: () => void;
  onLogout: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onSwitchUser, onLogout, isCollapsed, toggleCollapse, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.OFFICE;
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'marketing': false,
    'inventory': false
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleSection = (key: string) => {
    if (isCollapsed) toggleCollapse(); 
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const navGroups = [
    {
      title: 'Menu',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, show: true },
        { path: '/schedule', label: 'Schedule', icon: Calendar, show: true },
        { path: '/jobs', label: 'Jobs', icon: Briefcase, show: true },
        { path: '/communication', label: 'Communication', icon: MessageSquare, show: true },
        { path: '/team', label: 'Team', icon: HardHat, show: isAdmin },
        { path: '/clients', label: 'Clients', icon: Users, show: isAdmin },
        { path: '/quotes', label: 'Quotes', icon: FileText, show: isAdmin },
        { path: '/invoices', label: 'Invoices', icon: DollarSign, show: isAdmin },
        { path: '/timesheets', label: 'Time Sheets', icon: Clock, show: true }, // Added Time Sheets
      ]
    },
    {
      title: 'Modules',
      items: [
        { 
          id: 'inventory',
          label: 'Inventory', 
          icon: Package, 
          show: isAdmin,
          isGroup: true,
          subItems: [
            { path: '/inventory', label: 'Dashboard', icon: BarChart3 },
            { path: '/inventory/stock', label: 'Stock Levels', icon: Box },
            { path: '/inventory/products', label: 'Products', icon: Package },
            { path: '/inventory/orders', label: 'Purchasing', icon: ShoppingCart },
          ]
        },
        { 
          id: 'marketing',
          label: 'Marketing', 
          icon: Megaphone, 
          show: isAdmin,
          isGroup: true,
          subItems: [
            { path: '/marketing', label: 'Overview', icon: BarChart3 },
            { path: '/marketing/campaigns', label: 'Campaigns', icon: Send },
            { path: '/marketing/automations', label: 'Automations', icon: Zap },
            { path: '/marketing/audiences', label: 'Audiences', icon: Users },
          ]
        },
        { path: '/reports', label: 'Reports', icon: PieChart, show: isAdmin },
      ]
    },
    {
      title: 'AI Tools',
      items: [
        { path: '/ai-receptionist', label: 'AI Receptionist', icon: Bot, show: true },
      ]
    }
  ];

  return (
    <div 
      className={`h-screen bg-[#0f172a] dark:bg-slate-950 text-white flex flex-col fixed left-0 top-0 z-20 shadow-2xl font-sans print:hidden transition-[width] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] border-r border-slate-800 ${isCollapsed ? 'w-20' : 'w-56'}`}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-10 bg-slate-800 text-slate-400 hover:text-white p-1.5 rounded-full border border-slate-700 shadow-lg z-50 transition-transform hover:scale-110 active:scale-95"
      >
         {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo Area */}
      <div className="h-24 flex items-center justify-center overflow-hidden shrink-0 border-b border-slate-800/50 relative bg-[#0f172a] dark:bg-slate-950">
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-center justify-center ${isCollapsed ? 'w-16 px-2' : 'w-32 px-4'}`}>
             <img src="https://i.imgur.com/Bt9CDPn.png" alt="Gitta Job" className="w-full h-auto object-contain" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
        
        {navGroups.map((group, groupIdx) => (
          <div key={group.title} className={groupIdx > 0 ? "mt-2" : ""}>
            <div className={`px-6 mb-2 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden whitespace-nowrap ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-8 opacity-100'}`}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{group.title}</p>
            </div>
            
            <div className="space-y-1 px-2">
                {group.items
                .filter((item) => item.show)
                .map((item: any) => {
                    // HANDLE GROUPS (Marketing / Inventory)
                    if (item.isGroup) {
                      const isOpen = openSections[item.id];
                      const isChildActive = item.subItems.some((sub: any) => location.pathname === sub.path);
                      
                      return (
                        <div key={item.id} className="mb-1">
                          <button
                            onClick={() => toggleSection(item.id)}
                            className={`w-full group relative flex items-center rounded-xl transition-colors duration-200 min-h-[48px] ${
                              isChildActive ? 'text-slate-200' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                          >
                            {/* Active Indicator for Group */}
                            {isChildActive && isCollapsed && (
                                <div className="absolute left-0 top-2 bottom-2 w-1 bg-teal-500 rounded-r-full" />
                            )}

                            <div className={`flex items-center justify-center shrink-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCollapsed ? 'w-16' : 'w-12'}`}>
                                <item.icon className={`w-5 h-5 transition-colors ${isChildActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                            </div>

                            <div className={`flex items-center justify-between flex-1 overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'}`}>
                                <span className="font-medium text-sm">{item.label}</span>
                                <ChevronDown className={`w-4 h-4 mr-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {/* Sub Items */}
                          <div className={`overflow-hidden transition-all duration-300 ${isOpen && !isCollapsed ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="ml-4 pl-4 border-l border-slate-700/50 space-y-1 mt-1 mb-2">
                                {item.subItems.map((sub: any) => {
                                  const isSubActive = location.pathname === sub.path;
                                  return (
                                    <Link
                                      key={sub.path}
                                      to={sub.path}
                                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                        isSubActive ? 'text-teal-400 bg-teal-500/10 font-medium' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                                      }`}
                                    >
                                      <span>{sub.label}</span>
                                    </Link>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // HANDLE REGULAR ITEMS
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path) && !item.path.startsWith('/marketing') && !item.path.startsWith('/inventory'));
                    return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`group relative flex items-center rounded-xl transition-colors duration-200 min-h-[48px] ${
                        isActive
                            ? 'bg-teal-600/10 text-teal-400'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                    >
                        {isActive && (
                            <div className={`absolute left-0 bg-teal-500 rounded-r-full transition-all duration-300 ${isCollapsed ? 'top-2 bottom-2 w-1' : 'top-1 bottom-1 w-1'}`} />
                        )}
                        
                        <div className={`flex items-center justify-center shrink-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCollapsed ? 'w-16' : 'w-12'}`}>
                          <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        </div>
                        
                        <div className={`flex items-center overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCollapsed ? 'max-w-0 opacity-0 -translate-x-4' : 'max-w-[140px] opacity-100 translate-x-0'}`}>
                            <span className="font-medium text-sm">{item.label}</span>
                        </div>

                        {isCollapsed && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-slate-900 text-slate-200 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl border border-slate-700 z-50">
                                {item.label}
                                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-900"></div>
                            </div>
                        )}
                    </Link>
                    );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile & Dark Mode */}
      <div className="border-t border-slate-800/50 bg-slate-900/50 dark:bg-slate-950/50 overflow-visible shrink-0 relative">
        
        {/* Profile Popup Menu */}
        {showProfileMenu && (
            <>
                <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)}></div>
                <div className={`absolute bottom-[140px] bg-slate-800 border border-slate-700 shadow-xl rounded-xl z-40 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2 ${isCollapsed ? 'left-16 w-48' : 'left-4 right-4'}`}>
                    <div className="p-2">
                        <button 
                            onClick={() => { onLogout(); setShowProfileMenu(false); }}
                            className="flex items-center gap-3 w-full p-2.5 text-red-400 hover:bg-slate-700/50 hover:text-red-300 rounded-lg transition-colors text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </div>
            </>
        )}

        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                 <button
                    onClick={toggleDarkMode}
                    className={`flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-10 h-10 mx-auto' : 'w-full py-2 gap-2'}`}
                    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                 >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    <span className={`text-xs font-semibold transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                 </button>
            </div>

            <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center min-h-[40px] w-full hover:bg-slate-800/50 rounded-lg transition-colors p-1 -ml-1 text-left"
            >
                <div className={`flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] shrink-0 ${isCollapsed ? 'w-full' : 'w-10 mr-3'}`}>
                    <div className="relative group cursor-pointer" title={user.name}>
                        <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-10 h-10 rounded-full border-2 border-teal-500/30 shadow-sm object-cover bg-slate-800"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-teal-500 border-2 border-slate-900 rounded-full"></div>
                    </div>
                </div>
                
                <div className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isCollapsed ? 'max-w-0 opacity-0 -translate-x-4' : 'max-w-[120px] opacity-100 translate-x-0'}`}>
                    <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate capitalize">{user.role.toLowerCase()}</p>
                </div>
            </button>
            
            <button
                onClick={onSwitchUser}
                className={`mt-3 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold text-slate-300 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden whitespace-nowrap ${
                    isCollapsed ? 'w-10 h-10 p-0 justify-center mx-auto' : 'w-full py-2.5 px-3'
                }`}
                title="Switch View"
            >
                <div className={`shrink-0`}>
                    <PanelLeftOpen className="w-4 h-4" />
                </div>
                <span className={`transition-all duration-500 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[100px] opacity-100'}`}>
                    Switch View
                </span>
            </button>
        </div>
      </div>
    </div>
  );
};
