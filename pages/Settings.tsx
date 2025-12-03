
import React, { useContext, useState } from 'react';
import { StoreContext } from '../store';
import { 
    Building2, Users, Calendar, DollarSign, List, Bell, Box, 
    MessageSquare, Save, Settings as SettingsIcon, Database, 
    ToggleLeft, ToggleRight, Check, Briefcase, Tag, User, Copy,
    Mail, MessageCircle
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { User as UserType, PayrollType, UserRole } from '../types';

export const Settings: React.FC = () => {
  const store = useContext(StoreContext);
  const [activeTab, setActiveTab] = useState('');
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  
  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  if (!store) return null;
  const { settings, updateSettings, users, updateUser, currentUser, deleteAccount } = store;
  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.OFFICE;

  // Initialize active tab based on role
  if (!activeTab) {
      setActiveTab(isAdmin ? 'company' : 'profile');
  }

  // --- Feature 2: Team & Payroll Handlers ---
  const handleUserUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingUser) {
          updateUser(editingUser);
          setEditingUser(null);
      }
  };

  const copyInviteCode = () => {
      if (settings.companyCode) {
          navigator.clipboard.writeText(settings.companyCode);
          alert("Invite code copied to clipboard!");
      }
  };

  const copyInviteInstructions = () => {
      const text = `Join my team on Gitta Job!\n\n1. Go to the app.\n2. Select "Join Existing Team".\n3. Enter this code: ${settings.companyCode}`;
      navigator.clipboard.writeText(text);
      alert("Invite instructions copied to clipboard!");
  };

  const handleDeleteAccount = async () => {
      if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
          const { error } = await deleteAccount();
          if (error) {
              alert("Error deleting account: " + error.message);
          }
      }
  };

  const allTabs = [
      { id: 'company', label: 'Company Profile', icon: Building2, adminOnly: true },
      { id: 'profile', label: 'My Profile', icon: User, adminOnly: false },
      { id: 'team', label: 'Team & Payroll', icon: Users, adminOnly: true },
      { id: 'schedule', label: 'Schedule Config', icon: Calendar, adminOnly: true },
      { id: 'finance', label: 'Finance & Tax', icon: DollarSign, adminOnly: true },
      { id: 'services', label: 'Service Menu', icon: List, adminOnly: true },
      { id: 'notifications', label: 'Notifications', icon: Bell, adminOnly: true },
      { id: 'inventory', label: 'Inventory', icon: Box, adminOnly: true },
      { id: 'workflow', label: 'Workflow', icon: Briefcase, adminOnly: true },
      { id: 'data', label: 'Data Management', icon: Database, adminOnly: true },
  ];

  const visibleTabs = allTabs.filter(tab => isAdmin || !tab.adminOnly);

  return (
    <div className="max-w-7xl mx-auto pb-10">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-slate-900 dark:bg-white rounded-xl text-white dark:text-slate-900">
                <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400">Configure your business logic, team, and preferences.</p>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full lg:w-64 shrink-0">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden sticky top-24">
                    {visibleTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${activeTab === tab.id ? 'bg-slate-50 dark:bg-slate-700/50 border-emerald-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 lg:p-8 min-h-[600px]">
                    
                    {/* 0. My Profile (For Techs) */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 max-w-2xl">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">My Profile</h2>
                            <div className="flex items-center gap-4 mb-6">
                                <img src={currentUser.avatarUrl} alt="Profile" className="w-20 h-20 rounded-full border-4 border-slate-100 dark:border-slate-700" />
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{currentUser.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 uppercase">{currentUser.role}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                                <input 
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
                                    value={currentUser.email}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                                <input 
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    defaultValue={currentUser.phone}
                                />
                            </div>
                            <div className="pt-4 flex flex-col gap-4">
                                <Button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">Save Changes</Button>
                                
                                <div className="pt-8 border-t border-slate-100 dark:border-slate-700">
                                    <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2 uppercase tracking-wide">Danger Zone</h3>
                                    <Button variant="danger" size="sm" onClick={handleDeleteAccount}>Delete Account</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 1. Company Profile */}
                    {activeTab === 'company' && isAdmin && (
                        <div className="space-y-6 max-w-2xl">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">Company Profile</h2>
                            
                            {/* Invite Code Box */}
                            <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-xl p-4 flex flex-col gap-2">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Team Invite Code</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">
                                        {settings.companyCode || '-------'}
                                    </span>
                                    <button 
                                        onClick={copyInviteCode}
                                        className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-slate-600 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-500"
                                        title="Copy to clipboard"
                                    >
                                        <Copy className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500">Share this code with your employees to let them join your team.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Company Name</label>
                                <input 
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={settings.companyName}
                                    onChange={(e) => updateSettings({ companyName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Address</label>
                                <input 
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={settings.companyAddress}
                                    onChange={(e) => updateSettings({ companyAddress: e.target.value })}
                                />
                            </div>
                            <div className="pt-4">
                                <Button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">Save Changes</Button>
                            </div>
                        </div>
                    )}

                    {/* 2. Team & Payroll (The Requested Feature) */}
                    {activeTab === 'team' && isAdmin && (
                        <div>
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Team & Payroll</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage access, timesheets, and pay structures.</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setIsInviteModalOpen(true)}>Invite New User</Button>
                            </div>

                            <div className="space-y-4">
                                {users.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <img src={user.avatarUrl} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 object-cover" />
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">{user.role}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Payroll</p>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {user.payrollType === 'HOURLY' ? `$${user.payRate}/hr` : user.payrollType === 'COMMISSION' ? `${user.payRate}% Comm.` : `$${user.payRate}/day`}
                                                </p>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Timesheets</p>
                                                <p className={`text-sm font-bold ${user.enableTimesheets ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    {user.enableTimesheets ? 'Enabled' : 'Disabled'}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="secondary" onClick={() => setEditingUser(user)}>Edit</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. Schedule Config */}
                    {activeTab === 'schedule' && isAdmin && (
                        <div className="space-y-6 max-w-2xl">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">Schedule Configuration</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Business Start</label>
                                    <input 
                                        type="time"
                                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={settings.businessHoursStart}
                                        onChange={(e) => updateSettings({ businessHoursStart: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Business End</label>
                                    <input 
                                        type="time"
                                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={settings.businessHoursEnd}
                                        onChange={(e) => updateSettings({ businessHoursEnd: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm">
                                <span className="font-bold">Note:</span> These hours determine the visible grid on your calendar view.
                            </div>
                        </div>
                    )}

                    {/* 4. Finance & Tax */}
                    {activeTab === 'finance' && isAdmin && (
                        <div className="space-y-6 max-w-2xl">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">Finance & Taxes</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Default Tax Rate (%)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={settings.taxRate}
                                        onChange={(e) => updateSettings({ taxRate: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Currency</label>
                                    <select 
                                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={settings.currency}
                                        onChange={(e) => updateSettings({ currency: e.target.value })}
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. Service Menu (Mock) */}
                    {activeTab === 'services' && isAdmin && (
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">Service Menu</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Define standard services to speed up quoting.</p>
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                    <span>Service Name</span>
                                    <span>Default Price</span>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-900 dark:text-white">
                                    <div className="p-3 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50"><span>Full Interior Detail</span> <span className="font-mono">$250.00</span></div>
                                    <div className="p-3 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50"><span>Exterior Wash & Wax</span> <span className="font-mono">$150.00</span></div>
                                    <div className="p-3 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50"><span>Ceramic Coating</span> <span className="font-mono">$800.00</span></div>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" className="mt-4">Add Service</Button>
                        </div>
                    )}

                    {/* 6. Notifications */}
                    {activeTab === 'notifications' && isAdmin && (
                        <div className="space-y-6 max-w-2xl">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">Notification Templates</h2>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">"On My Way" SMS</label>
                                <textarea 
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none h-24"
                                    value={settings.smsTemplateOnMyWay}
                                    onChange={(e) => updateSettings({ smsTemplateOnMyWay: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Available variables: {'{{clientName}}'}, {'{{techName}}'}</p>
                            </div>
                        </div>
                    )}

                    {/* 7. Inventory */}
                    {activeTab === 'inventory' && isAdmin && (
                        <div className="space-y-6 max-w-2xl">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">Inventory Settings</h2>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Low Stock Alert Threshold</label>
                                <input 
                                    type="number"
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={settings.lowStockThreshold}
                                    onChange={(e) => updateSettings({ lowStockThreshold: parseInt(e.target.value) })}
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Products below this quantity will be flagged in red.</p>
                            </div>
                        </div>
                    )}

                    {/* 8. Workflow */}
                    {activeTab === 'workflow' && isAdmin && (
                        <div className="space-y-6 max-w-2xl">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">Workflow Automation</h2>
                            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">Auto-Invoice</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Automatically generate a draft invoice when a job is completed.</p>
                                </div>
                                <button 
                                    onClick={() => updateSettings({ enableAutoInvoice: !settings.enableAutoInvoice })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enableAutoInvoice ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-600'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enableAutoInvoice ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 9. Data */}
                    {activeTab === 'data' && isAdmin && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">Data Management</h2>
                            <div className="flex gap-4">
                                <Button variant="outline">Export Clients (CSV)</Button>
                                <Button variant="outline">Export Invoices (CSV)</Button>
                            </div>
                            <div className="pt-8 border-t border-slate-100 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2 uppercase tracking-wide">Danger Zone</h3>
                                <Button variant="danger" size="sm" onClick={handleDeleteAccount}>Delete Account</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Edit User Modal */}
        <Modal
            isOpen={!!editingUser}
            onClose={() => setEditingUser(null)}
            title={`Edit Settings: ${editingUser?.name}`}
            footer={
                <>
                    <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
                    <Button onClick={handleUserUpdate}>Save Changes</Button>
                </>
            }
        >
            {editingUser && (
                <div className="space-y-4 p-2">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Enable Timesheets</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Allow this user to track time.</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setEditingUser({ ...editingUser, enableTimesheets: !editingUser.enableTimesheets })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingUser.enableTimesheets ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-600'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingUser.enableTimesheets ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Payroll Type</label>
                        <select 
                            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={editingUser.payrollType}
                            onChange={(e) => setEditingUser({ ...editingUser, payrollType: e.target.value as PayrollType })}
                        >
                            <option value="HOURLY">Hourly Rate ($/hr)</option>
                            <option value="COMMISSION">Commission (% of Job)</option>
                            <option value="DAILY_RATE">Daily Rate ($/day)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Rate Value</label>
                        <input 
                            type="number"
                            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={editingUser.payRate}
                            onChange={(e) => setEditingUser({ ...editingUser, payRate: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>
            )}
        </Modal>

        {/* Invite User Modal */}
        <Modal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            title="Invite Team Member"
            footer={
                <>
                    <Button variant="ghost" onClick={() => setIsInviteModalOpen(false)}>Close</Button>
                    <Button onClick={copyInviteInstructions}>Copy Instructions</Button>
                </>
            }
        >
            <div className="p-4 space-y-6 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invite your team</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Share this code with your team members. They will need to enter it when they select "Join Existing Team" during signup.
                    </p>
                </div>

                <div className="bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 relative group">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Company Code</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-4xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">
                            {settings.companyCode || 'LOADING'}
                        </span>
                    </div>
                    <div className="absolute top-2 right-2">
                        <button onClick={copyInviteCode} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors" title="Copy Code">
                            <Copy className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 justify-center">
                    <Button variant="secondary" onClick={() => window.open(`mailto:?subject=Join ${settings.companyName} on Gitta Job&body=Hey,%0D%0A%0D%0APlease join our workspace on Gitta Job.%0D%0A%0D%0A1. Create an account.%0D%0A2. Select "Join Existing Team".%0D%0A3. Enter code: ${settings.companyCode}`)}>
                        <Mail className="w-4 h-4 mr-2" /> Send Email
                    </Button>
                    <Button variant="secondary" onClick={copyInviteInstructions}>
                        <MessageCircle className="w-4 h-4 mr-2" /> Copy Message
                    </Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};
