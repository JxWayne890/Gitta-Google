
import React, { useContext, useState, useRef, useEffect } from 'react';
import { Bell, Check, ChevronRight, Inbox, X } from 'lucide-react';
import { StoreContext } from '../store';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export const NotificationCenter: React.FC = () => {
  const store = useContext(StoreContext);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!store) return null;

  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead } = store;

  // Filter notifications for the current user
  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (id: string) => {
    markNotificationRead(id);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50" ref={containerRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-full transition-all duration-200 ${
          isOpen || unreadCount > 0 
            ? 'bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white ring-2 ring-slate-100 dark:ring-slate-700' 
            : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
      >
        <Bell 
          className={`w-6 h-6 transition-transform duration-300 ${
            unreadCount > 0 ? 'text-slate-900 dark:text-white' : ''
          } ${isOpen ? 'scale-110' : ''}`} 
          strokeWidth={unreadCount > 0 ? 2.5 : 2}
        />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 text-xs font-bold text-white items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right ring-1 ring-black/5">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllNotificationsRead}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 px-2 py-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {userNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <Inbox className="w-6 h-6 opacity-50" />
                </div>
                <p className="text-sm font-medium">No notifications</p>
              </div>
            ) : (
              userNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-4 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors relative group cursor-pointer ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                  onClick={() => notif.link ? null : handleNotificationClick(notif.id)}
                >
                  <div className="flex gap-4">
                    {/* Status Dot */}
                    <div className="mt-1.5 shrink-0">
                      {!notif.read ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50 ring-2 ring-blue-100 dark:ring-blue-900"></div>
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-bold truncate pr-2 ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap font-medium">
                          {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed mb-2 ${!notif.read ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-500'}`}>
                        {notif.message}
                      </p>
                      
                      {notif.link && (
                        <Link 
                          to={notif.link}
                          onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notif.id);
                          }}
                          className="inline-flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mt-1"
                        >
                          View Details <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
