
import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, FileText, Briefcase, DollarSign,
  ChevronRight, ChevronLeft, PieChart, HardHat, PanelLeftOpen, Megaphone,
  Zap, Send, BarChart3, ChevronDown, Bot, Package, ShoppingCart, Box,
  MessageSquare, LogOut, Settings, Bell, Moon, Sun, ArrowLeft, Clock
} from 'lucide-react';
import { UserRole, User } from '../types';
import { StoreContext } from '../store';
import { formatDistanceToNow } from 'date-fns';

interface SidebarProps {
  user: User;
  onSwitchUser: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

type SidebarView = 'nav' | 'settings';

export const Sidebar: React.FC<SidebarProps> = ({ user, onSwitchUser, isCollapsed, toggleCollapse }) => {
  const store = useContext(StoreContext);
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.OFFICE;
  
  const [currentView, setCurrentView] = useState<SidebarView>('nav');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'marketing': false,
    'inventory': false
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = store?.notifications.filter(n => n.userId === user.id) || [];
  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadMessageCount = store?.messages.filter(m => m.senderId !== user.id && !m.readBy.includes(user.id)).length || 0;

  const toggleGroup = (key: string) => {
    if (isCollapsed) toggleCollapse();
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleProfileClick = () => {
    if (isCollapsed) toggleCollapse();
    setCurrentView(currentView === 'nav' ? 'settings' : 'nav');
  };

  const navSections = [
    {
      label: 'General',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, show: true },
        { path: '/schedule', label: 'Schedule', icon: Calendar, show: true },
        { path: '/communication', label: 'Inbox', icon: MessageSquare, show: true, badge: unreadMessageCount },
      ]
    },
    {
      label: 'Operations',
      items: [
        { path: '/jobs', label: 'Jobs', icon: Briefcase, show: true },
        { path: '/timesheets', label: 'Timesheets', icon: Clock, show: true },
        { path: '/clients', label: 'Clients', icon: Users, show: isAdmin },
        { path: '/team', label: 'Team', icon: HardHat, show: isAdmin },
      ]
    },
    {
      label: 'Finance',
      items: [
        { path: '/quotes', label: 'Quotes', icon: FileText, show: isAdmin },
        { path: '/invoices', label: 'Invoices', icon: DollarSign, show: isAdmin },
      ]
    },
    {
      label: 'Growth',
      items: [
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
      ]
    },
    {
      label: 'Insights',
      items: [
        { path: '/reports', label: 'Reports', icon: PieChart, show: isAdmin },
        { path: '/ai-receptionist', label: 'AI Agent', icon: Bot, show: true },
      ]
    }
  ];

  return (
    <aside className={`h-screen flex flex-col fixed left-0 top-0 z-50 shadow-2xl font-sans transition-[width] duration-300 ease-in-out border-r bg-white border-slate-200 text-slate-600 dark:bg-[#0B1120] dark:border-slate-800 dark:text-slate-300 ${isCollapsed ? 'w-[80px]' : 'w-52'}`}>
      <div className="h-20 flex items-center justify-center shrink-0 relative px-4">
        {currentView === 'settings' ? (
           <div className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
              <div className={`transition-all duration-300 font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white ${isCollapsed ? 'hidden' : 'block'}`}><Settings className="w-5 h-5 text-teal-500" /> Settings</div>
              <button onClick={() => { setCurrentView('nav'); setNotificationsOpen(false); }} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
           </div>
        ) : (
          <>
            <div className={`transition-all duration-300 flex items-center justify-center ${isCollapsed ? 'w-10 opacity-100' : 'w-32 opacity-100'}`}>
                <img src="https://i.imgur.com/Bt9CDPn.png" alt="Gitta Job" className="max-w-full max-h-12 object-contain dark:hidden" />
                <img src="https://i.imgur.com/Bt9CDPn.png" alt="Gitta Job" className="max-w-full max-h-12 object-contain hidden dark:block brightness-0 invert" />
            </div>
            <button onClick={toggleCollapse} className="absolute -right-3 top-8 p-1 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 z-50 border bg-white text-slate-500 border-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:text-white">{isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
        {currentView === 'nav' && navSections.map((section, idx) => {
            const hasVisibleItems = section.items.some((item: any) => item.show);
            if (!hasVisibleItems) return null;
            return (
                <div key={section.label} className="mb-6">
                  <div className={`px-6 mb-2 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{section.label}</p>
                  </div>
                  <div className="px-3 space-y-0.5">
                    {section.items.filter((item: any) => item.show).map((item: any) => {
                      if (item.isGroup) {
                        const isOpen = expandedGroups[item.id];
                        const isChildActive = item.subItems.some((sub: any) => location.pathname === sub.path);
                        return (
                          <div key={item.id} className="mb-1">
                            <button onClick={() => toggleGroup(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${isChildActive ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>
                              {isChildActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-500 rounded-r-full" />}
                              <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isChildActive ? 'text-teal-500 dark:text-teal-400' : 'group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
                              <div className={`flex items-center justify-between flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                                <span className="text-sm font-medium">{item.label}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen && !isCollapsed ? 'max-h-[300px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                              <div className="ml-9 border-l border-slate-200 dark:border-slate-700/50 space-y-1 pl-2">
                                {item.subItems.map((sub: any) => (
                                  <Link key={sub.path} to={sub.path} className={`block px-3 py-2 rounded-md text-xs font-medium transition-colors ${location.pathname === sub.path ? 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-500/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800/30'}`}>{sub.label}</Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                      return (
                        <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive ? 'bg-gradient-to-r from-teal-50 to-transparent dark:from-teal-500/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'}`}>
                          {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-500 rounded-r-full shadow-[0_0_10px_rgba(20,184,166,0.5)]" />}
                          <div className="relative">
                            <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-teal-500 dark:text-teal-400' : 'group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} strokeWidth={isActive ? 2.5 : 2} />
                            {isCollapsed && item.badge > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-[#0B1120]"></span>}
                          </div>
                          <div className={`flex-1 flex items-center justify-between overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                             <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                             {item.badge > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ml-2">{item.badge > 99 ? '99+' : item.badge}</span>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
            );
        })}
        {currentView === 'settings' && (
          <div className="px-3 space-y-2">
             <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl overflow-hidden mb-4 border border-slate-200 dark:border-slate-800">
                <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="relative"><Bell className="w-5 h-5 text-slate-500 dark:text-slate-300" />{unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />}</div>
                      <span className={`text-sm font-medium text-slate-700 dark:text-slate-300 ${isCollapsed ? 'hidden' : 'block'}`}>Notifications</span>
                   </div>
                   {!isCollapsed && <div className="flex items-center gap-2">{unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">{unreadCount}</span>}<ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${notificationsOpen ? 'rotate-180' : ''}`} /></div>}
                </button>
                <div className={`transition-all duration-300 ease-in-out bg-slate-100/50 dark:bg-slate-900/50 ${notificationsOpen && !isCollapsed ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                   {notifications.length === 0 ? <div className="p-4 text-center text-xs text-slate-500">No notifications</div> : (
                      <div className="overflow-y-auto max-h-[300px] custom-scrollbar">
                         {notifications.map(n => (
                            <div key={n.id} onClick={() => store?.markNotificationRead(n.id)} className={`p-3 border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-200/50 dark:hover:bg-slate-800/80 cursor-pointer ${!n.read ? 'bg-white dark:bg-slate-800/40' : ''}`}>
                               <div className="flex justify-between items-start mb-1"><span className={`text-xs font-bold ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{n.title}</span><span className="text-[9px] text-slate-500 dark:text-slate-600">{formatDistanceToNow(new Date(n.timestamp))}</span></div>
                               <p className={`text-[10px] ${!n.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'} line-clamp-2`}>{n.message}</p>
                            </div>
                         ))}
                         {unreadCount > 0 && <button onClick={() => store?.markAllNotificationsRead()} className="w-full py-2 text-center text-[10px] text-emerald-600 dark:text-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 font-bold bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-900">Mark all as read</button>}
                      </div>
                   )}
                </div>
             </div>
             <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"><Settings className="w-5 h-5" /><span className={`text-sm font-medium ${isCollapsed ? 'hidden' : 'block'}`}>{isAdmin ? 'Full Settings' : 'My Profile'}</span></button>
             <button onClick={store?.toggleTheme} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">{store?.theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}<span className={`text-sm font-medium ${isCollapsed ? 'hidden' : 'block'}`}>{store?.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span></button>
             <button onClick={onSwitchUser} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"><PanelLeftOpen className="w-5 h-5" /><span className={`text-sm font-medium ${isCollapsed ? 'hidden' : 'block'}`}>Switch Role</span></button>
             <button onClick={store?.logout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mt-4"><LogOut className="w-5 h-5" /><span className={`text-sm font-medium ${isCollapsed ? 'hidden' : 'block'}`}>Logout</span></button>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800/50 bg-white dark:bg-[#0B1120]">
        <button onClick={handleProfileClick} className={`w-full relative bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 outline-none ${isCollapsed ? 'p-2' : 'p-3'} ${currentView === 'settings' ? 'ring-2 ring-teal-500/50 border-teal-500/50' : ''}`}>
          <div className="flex items-center gap-3 text-left">
            <div className="relative shrink-0">
              <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-600 group-hover:border-teal-500 transition-colors" />
              {unreadCount > 0 && currentView !== 'settings' && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>}
            </div>
            <div className={`flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <p className="text-sm font-bold text-slate-700 dark:text-white truncate">{user.name.split(' ')[0]}</p>
              <p className="text-[10px] font-medium text-teal-600 dark:text-teal-500 uppercase tracking-wide truncate">{currentView === 'settings' ? 'Close Settings' : 'My Settings'}</p>
            </div>
            {!isCollapsed && <Settings className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${currentView === 'settings' ? 'rotate-90 text-teal-500' : ''}`} />}
          </div>
        </button>
      </div>
    </aside>
  );
};
