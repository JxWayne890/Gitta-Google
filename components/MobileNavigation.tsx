import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Briefcase, DollarSign, Menu, 
  X, Users, FileText, PieChart, HardHat, ChevronRight, LogOut,
  Settings, Bell, Moon, Sun, ArrowLeft, MessageSquare, Clock,
  Pause, Play, MapPin
} from 'lucide-react';
import { User, UserRole } from '../types';
import { StoreContext } from '../store';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';

interface MobileNavigationProps {
  user: User;
  onSwitchUser: () => void;
}

type DrawerView = 'menu' | 'settings';

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ user, onSwitchUser }) => {
  const store = useContext(StoreContext);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<DrawerView>('menu');
  const [elapsed, setElapsed] = useState(0);
  
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.OFFICE;
  const notifications = store?.notifications.filter(n => n.userId === user.id) || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Unread Messages for Badge
  const unreadMessageCount = store?.messages.filter(m => 
    m.senderId !== user.id && !m.readBy.includes(user.id)
  ).length || 0;

  // Active Timer Logic
  const activeEntry = store?.timeEntries.find((e: any) => e.userId === user.id && !e.endTime);
  
  useEffect(() => {
    let interval: any;
    if (activeEntry) {
        const start = new Date(activeEntry.startTime);
        setElapsed(differenceInSeconds(new Date(), start));
        interval = setInterval(() => {
            setElapsed(differenceInSeconds(new Date(), start));
        }, 1000);
    } else {
        setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeEntry]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Primary Bottom Bar Items (Max 5)
  const primaryItems = [
    { path: '/', label: 'Home', icon: LayoutDashboard, show: true },
    { path: '/schedule', label: 'Schedule', icon: Calendar, show: true },
    { path: '/jobs', label: 'Jobs', icon: Briefcase, show: true },
    { path: '/communication', label: 'Inbox', icon: MessageSquare, badge: unreadMessageCount, show: true }, 
    { path: '/timesheets', label: 'Time', icon: Clock, show: true },
  ];

  // Secondary Items (Hidden in Menu)
  const menuItems = [
    { path: '/clients', label: 'Clients', icon: Users, show: isAdmin, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { path: '/invoices', label: 'Invoices', icon: DollarSign, show: isAdmin, color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
    { path: '/quotes', label: 'Quotes', icon: FileText, show: isAdmin, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
    { path: '/team', label: 'Team', icon: HardHat, show: isAdmin, color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
    { path: '/reports', label: 'Reports', icon: PieChart, show: isAdmin, color: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
  ];

  const handleClose = () => {
      setIsMenuOpen(false);
      setCurrentView('menu'); // Reset view on close
  };

  return (
    <>
      {/* SPACER to prevent content being hidden behind bottom bar */}
      <div className="h-20 md:hidden" />

      {/* BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 pb-safe pt-2 z-40 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {primaryItems.filter(i => i.show !== false).slice(0, 4).map((item) => { // Limit to 4 to leave room for Menu
          const isActive = location.pathname === item.path;
          
          // Special Logic for Time Tab
          const isTimeTab = item.path === '/timesheets';
          const displayLabel = isTimeTab && activeEntry ? formatTime(elapsed) : item.label;
          const iconColor = isTimeTab && activeEntry ? 'text-emerald-600 dark:text-emerald-400' : isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500';
          const labelColor = isTimeTab && activeEntry ? 'text-emerald-700 dark:text-emerald-300 font-bold font-mono' : isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500';
          const bgPulse = isTimeTab && activeEntry ? 'bg-emerald-50 dark:bg-emerald-900/20' : '';

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleClose}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[64px] relative ${labelColor} ${bgPulse}`}
            >
              <div className="relative">
                <item.icon className={`w-6 h-6 ${iconColor} ${isTimeTab && activeEntry ? 'animate-pulse' : isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white dark:border-slate-900">
                        {item.badge > 9 ? '9+' : item.badge}
                    </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{displayLabel}</span>
            </Link>
          );
        })}

        {/* MENU TRIGGER */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[64px] ${
            isMenuOpen ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="relative">
             <Menu className="w-6 h-6" strokeWidth={2} />
             {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-white dark:border-slate-900"></span>}
          </div>
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>

      {/* FULL SCREEN MENU DRAWER */}
      <div 
        className={`md:hidden fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      >
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl p-6 transition-transform duration-300 ease-out max-h-[90vh] overflow-y-auto flex flex-col ${
            isMenuOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Drawer Handle */}
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 shrink-0" />

          {/* ACTIVE SESSION PILL (Persistent Clock Style) */}
          {activeEntry && currentView === 'menu' && (
              <Link 
                to="/timesheets"
                onClick={handleClose}
                className="mb-6 block"
              >
                <div className="bg-[#0B1120] text-white rounded-full pl-2 pr-6 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-between gap-4 border border-slate-800/60 ring-1 ring-white/5 active:scale-95 transition-all w-full">
                    
                    {/* Icon Container */}
                    <div className="relative w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500/10 shrink-0 border border-emerald-500/20">
                        <Clock className="w-5 h-5 text-emerald-500" />
                        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#0B1120]"></span>
                        </span>
                    </div>
                    
                    {/* Text Container */}
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">On the Clock</p>
                        <p className="font-mono text-xl font-bold leading-none tracking-tight text-white tabular-nums shadow-black drop-shadow-md">
                            {formatTime(elapsed)}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Vertical Separator */}
                        <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent mx-1 opacity-50"></div>
                        
                        {/* Activity Indicator / Pulse */}
                        <div className="flex flex-col gap-0.5">
                            <div className="w-1 h-1 bg-slate-600 rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-slate-600 rounded-full animate-pulse delay-75"></div>
                            <div className="w-1 h-1 bg-slate-600 rounded-full animate-pulse delay-150"></div>
                        </div>
                    </div>
                </div>
              </Link>
          )}

          {currentView === 'menu' ? (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Menu</h2>
                    <button 
                    onClick={handleClose}
                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                    <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User Profile Section (Clickable) */}
                <button 
                    onClick={() => setCurrentView('settings')}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-100 dark:border-slate-800 flex items-center gap-4 w-full text-left active:bg-slate-100 dark:active:bg-slate-800 transition-colors relative"
                >
                    <div className="relative">
                        <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white dark:border-slate-800">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold flex items-center gap-1">
                            {user.role} <ChevronRight className="w-3 h-3" />
                        </p>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                        <Settings className="w-5 h-5 text-slate-400" />
                    </div>
                </button>

                {/* Secondary Navigation Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {/* Add any items not in bottom bar here if needed, e.g. Invoices if it didn't fit */}
                    {primaryItems.length > 4 && primaryItems.slice(4, 5).map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleClose}
                            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm active:scale-[0.98] transition-transform"
                        >
                            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{item.label}</span>
                        </Link>
                    ))}

                    {menuItems.filter(i => i.show !== false).map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleClose}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm active:scale-[0.98] transition-transform"
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{item.label}</span>
                    </Link>
                    ))}
                </div>
            </>
          ) : (
            /* --- SETTINGS VIEW --- */
            <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setCurrentView('menu')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                        <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
                </div>

                <div className="space-y-6 flex-1">
                    {/* Theme */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${store?.theme === 'dark' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {store?.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                                {store?.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </span>
                        </div>
                        <button 
                            onClick={() => store?.toggleTheme()}
                            className={`w-12 h-6 rounded-full transition-colors relative ${store?.theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${store?.theme === 'dark' ? 'translate-x-6' : ''}`}></div>
                        </button>
                    </div>

                    {/* Role Switch */}
                    <button onClick={() => { onSwitchUser(); handleClose(); }} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold active:bg-slate-50 dark:active:bg-slate-700">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-slate-400" />
                            Switch Role
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>

                    {/* Logout */}
                    <button onClick={() => { store?.logout(); handleClose(); }} className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold active:bg-red-100 dark:active:bg-red-900/20">
                        <div className="flex items-center gap-3">
                            <LogOut className="w-5 h-5" />
                            Logout
                        </div>
                    </button>

                    {/* Notifications List */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Notifications</h3>
                        {notifications.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-4">No notifications</p>
                        ) : (
                            <div className="space-y-2">
                                {notifications.slice(0, 5).map(n => (
                                    <div 
                                        key={n.id} 
                                        onClick={() => store?.markNotificationRead(n.id)}
                                        className={`p-3 rounded-xl border border-slate-100 dark:border-slate-800 ${n.read ? 'bg-white dark:bg-slate-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <p className={`text-sm font-bold ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{n.title}</p>
                                            <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(n.timestamp))}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )}

          <div className="mt-8 text-center shrink-0">
            <p className="text-xs text-slate-300 font-medium">Gitta Job v2.0.1</p>
          </div>
        </div>
      </div>
    </>
  );
};