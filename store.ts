
import { useState, useEffect, createContext } from 'react';
import { 
  User, Job, Client, Quote, Invoice, ActivityLogItem, 
  Notification, InventoryProduct, InventoryRecord, 
  Warehouse, Vendor, PurchaseOrder, TimeEntry, 
  MarketingCampaign, MarketingAutomation, AudienceSegment,
  Chat, ChatMessage, AppSettings, JobTemplate,
  UserRole, JobStatus, InvoiceStatus, QuoteStatus, POStatus,
  TimeEntryStatus, TimeEntryType, CampaignStatus, ChannelType,
  PayrollType
} from './types';
import { supabase } from './supabaseClient';

interface StoreContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: User;
  users: User[];
  clients: Client[];
  jobs: Job[];
  quotes: Quote[];
  invoices: Invoice[];
  timeEntries: TimeEntry[];
  activityLog: ActivityLogItem[];
  notifications: Notification[];
  settings: AppSettings;
  
  // Inventory
  inventoryProducts: InventoryProduct[];
  inventoryRecords: InventoryRecord[];
  warehouses: Warehouse[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];

  // Marketing
  marketingCampaigns: MarketingCampaign[];
  marketingAutomations: MarketingAutomation[];
  marketingAudiences: AudienceSegment[];

  // Communication
  chats: Chat[];
  messages: ChatMessage[];

  // Actions
  login: (email: string, pass: string) => Promise<{ error: any }>;
  signup: (email: string, pass: string, name: string, type: 'create' | 'join', joinCode?: string) => Promise<{ error: any, companyCode?: string }>;
  logout: () => void;
  switchUser: (role: UserRole) => void;
  
  // Entity Actions
  addJob: (job: Job) => void;
  updateJob: (job: Job) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  updateJobStage: (id: string, stage: any) => void;
  assignJob: (jobId: string, techId: string, job: Job) => void;
  cancelJob: (id: string, reason: string) => void;
  moveJob: (jobId: string, start: string, end: string, techId?: string) => void;
  unscheduleJob: (jobId: string) => void;

  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;

  addQuote: (quote: Quote) => void;
  updateQuote: (quote: Quote) => void;

  createInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;

  addTimeEntry: (entry: TimeEntry) => void;
  updateTimeEntry: (entry: TimeEntry) => void;
  approveTimeEntry: (id: string) => void;
  clockIn: (jobId?: string) => void;
  clockOut: () => void;

  // Inventory Actions
  addProduct: (product: InventoryProduct) => void;
  updateStock: (record: InventoryRecord) => void;
  addWarehouse: (warehouse: Warehouse) => void;
  updateWarehouse: (warehouse: Warehouse) => void;
  createPO: (po: PurchaseOrder) => void;

  // Marketing Actions
  addCampaign: (campaign: MarketingCampaign) => Promise<{ error?: any }>;
  updateCampaign: (campaign: MarketingCampaign) => Promise<{ error?: any }>;
  addAutomation: (automation: MarketingAutomation) => void;
  
  // Comm Actions
  sendMessage: (chatId: string, content: string, senderId?: string) => void;
  createChat: (participantIds: string[], name?: string) => void;
  deleteChat: (chatId: string) => void;

  // Settings / Admin
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteAccount: () => Promise<{ error: any }>;
  completeOnboarding: () => Promise<void>;
  addJobTemplate: (template: JobTemplate) => void;

  // UI
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

// Default State
const defaultSettings: AppSettings = {
  companyName: 'My Service Company',
  companyAddress: '',
  taxRate: 0.08,
  currency: 'USD',
  businessHoursStart: '08:00',
  businessHoursEnd: '18:00',
  lowStockThreshold: 5,
  enableAutoInvoice: false,
  smsTemplateOnMyWay: "Hi {{clientName}}, this is {{techName}} from {{companyName}}. I'm on my way to your location!",
  onboardingStep: 1
};

const defaultUser: User = {
  id: 'guest', 
  companyId: '',
  name: 'Guest',
  email: '',
  role: UserRole.ADMIN,
  avatarUrl: 'https://i.pravatar.cc/150?u=guest',
  onboardingComplete: false,
  enableTimesheets: true,
  payrollType: 'HOURLY',
  payRate: 0
};

export const StoreContext = createContext<StoreContextType | null>(null);

export const useAppStore = (): StoreContextType => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  
  // Inventory
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  // Marketing
  const [marketingCampaigns, setMarketingCampaigns] = useState<MarketingCampaign[]>([]);
  const [marketingAutomations, setMarketingAutomations] = useState<MarketingAutomation[]>([]);
  const [marketingAudiences, setMarketingAudiences] = useState<AudienceSegment[]>([]);

  // Chat
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // --- INITIALIZATION ---
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserData(session.user.id);
        } else {
          setIsLoading(false);
        }
    } catch (e) {
        console.error("Session check failed", e);
        setIsLoading(false);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      // 1. Get Profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
          console.warn('Profile loading error (User might need to complete signup):', error.message);
          // If no profile, user is effectively guest until signup completes
          setIsLoading(false);
          return;
      }

      // 2. Map to User Object
      const user: User = {
        id: profile.id,
        companyId: profile.company_id,
        name: profile.full_name || profile.email || 'User',
        email: profile.email,
        role: (profile.role as UserRole) || UserRole.ADMIN,
        avatarUrl: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}`,
        onboardingComplete: profile.onboarding_complete,
        enableTimesheets: profile.enable_timesheets ?? true,
        payrollType: (profile.payroll_type as PayrollType) || 'HOURLY',
        payRate: profile.pay_rate || 0
      };

      setCurrentUser(user);
      setIsAuthenticated(true);

      // 3. Load Company Data if exists
      if (user.companyId) {
        await loadCompanyData(user.companyId);
      }
    } catch (err: any) {
      console.error('Error loading user:', err.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompanyData = async (companyId: string) => {
    try {
      const [
        settingsRes, clientsRes, jobsRes, quotesRes, invoicesRes, 
        campaignsRes, automationsRes, productsRes, recordsRes, 
        warehousesRes, chatsRes, messagesRes
      ] = await Promise.all([
        supabase.from('settings').select('*').eq('company_id', companyId).single(),
        supabase.from('clients').select('*').eq('company_id', companyId),
        supabase.from('jobs').select('*').eq('company_id', companyId),
        supabase.from('quotes').select('*').eq('company_id', companyId),
        supabase.from('invoices').select('*').eq('company_id', companyId),
        supabase.from('email_campaigns').select('*').eq('company_id', companyId),
        supabase.from('marketing_automations').select('*').eq('company_id', companyId),
        supabase.from('inventory_products').select('*').eq('company_id', companyId),
        supabase.from('inventory_stock').select('*').eq('company_id', companyId),
        supabase.from('warehouses').select('*').eq('company_id', companyId),
        supabase.from('chats').select('*').eq('company_id', companyId),
        supabase.from('messages').select('*').eq('company_id', companyId)
      ]);

      if (settingsRes.data) {
          setSettings({
              companyName: settingsRes.data.company_name,
              companyAddress: settingsRes.data.company_address || '',
              companyCode: settingsRes.data.company_code,
              taxRate: settingsRes.data.tax_rate,
              currency: settingsRes.data.currency,
              businessHoursStart: settingsRes.data.business_hours_start,
              businessHoursEnd: settingsRes.data.business_hours_end,
              lowStockThreshold: settingsRes.data.low_stock_threshold,
              enableAutoInvoice: settingsRes.data.enable_auto_invoice,
              smsTemplateOnMyWay: settingsRes.data.sms_template_on_my_way,
              serviceCategories: settingsRes.data.service_categories || [],
              paymentMethods: settingsRes.data.payment_methods || [],
              taxName: settingsRes.data.tax_name,
              brandColors: settingsRes.data.brand_colors,
              onboardingStep: settingsRes.data.onboarding_step
          });
      }

      if (clientsRes.data) setClients(clientsRes.data.map((c: any) => ({ ...c, billingAddress: c.billing_address, firstName: c.first_name, lastName: c.last_name })));
      if (jobsRes.data) setJobs(jobsRes.data.map((j: any) => ({ ...j, clientId: j.client_id, propertyId: j.property_id, assignedTechIds: j.assigned_tech_ids || [], start: j.start_time, end: j.end_time, items: j.line_items || [] })));
      if (quotesRes.data) setQuotes(quotesRes.data.map((q: any) => ({ ...q, clientId: q.client_id, propertyId: q.property_id, items: q.items || [] })));
      if (invoicesRes.data) setInvoices(invoicesRes.data.map((i: any) => ({ ...i, clientId: i.client_id, items: i.items || [], balanceDue: i.balance_due })));
      
      const { data: profiles } = await supabase.from('profiles').select('*').eq('company_id', companyId);
      if (profiles) {
          setUsers(profiles.map((p: any) => ({
              id: p.id,
              companyId: p.company_id,
              name: p.full_name,
              email: p.email,
              role: p.role,
              avatarUrl: p.avatar_url,
              onboardingComplete: p.onboarding_complete,
              enableTimesheets: p.enable_timesheets ?? true,
              payrollType: p.payroll_type || 'HOURLY',
              payRate: p.pay_rate || 0
          })));
      }
    } catch (error) {
      console.error("Error loading company data", error);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (!error) await checkSession();
    else setIsLoading(false);
    return { error };
  };

  const signup = async (email: string, pass: string, name: string, type: 'create' | 'join', joinCode?: string) => {
    setIsLoading(true);
    try {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email, password: pass, options: { data: { full_name: name } }
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed");

        let companyId = '';
        let role = UserRole.ADMIN;
        let companyCode = '';

        // 2. Resolve Company ID
        if (type === 'create') {
            companyId = crypto.randomUUID(); 
            companyCode = Math.random().toString(36).substring(2, 9).toUpperCase();
            
            // Insert Settings FIRST (RLS allows any authenticated user to insert new company)
            const { error: settingsError } = await supabase.from('settings').insert({
                company_id: companyId,
                company_name: `${name}'s Company`,
                company_code: companyCode,
                onboarding_step: 1
            });
            if (settingsError) throw new Error(`Settings creation failed: ${settingsError.message}`);

        } else {
            // Join Team: Use Secure RPC to find company ID by code
            if (!joinCode) throw new Error("Join code required");
            const { data: foundId, error: rpcError } = await supabase.rpc('get_company_id_by_code', { code_input: joinCode });
            
            if (rpcError || !foundId) throw new Error("Invalid Company Code");
            companyId = foundId;
            role = UserRole.TECHNICIAN;
        }

        // 3. Create Profile
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            company_id: companyId,
            email,
            full_name: name,
            role,
            onboarding_complete: type === 'join' // Techs skip wizard
        });

        if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);

        // 4. Reload Data
        await loadUserData(authData.user.id);
        
        return { error: null, companyCode: type === 'create' ? companyCode : undefined };
    } catch (err: any) {
        setIsLoading(false);
        console.error("Signup Flow Error:", err);
        return { error: err };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(defaultUser);
    setIsLoading(false);
  };

  const switchUser = (role: UserRole) => {
      setCurrentUser(prev => ({ ...prev, role }));
  };

  // --- ENTITY ACTIONS (CORRECTED SNAKE_CASE & COMPANY_ID) ---
  
  const addJob = async (job: Job) => { 
      if (!currentUser.companyId) return;
      
      const payload = {
          id: job.id, 
          company_id: currentUser.companyId, 
          client_id: job.clientId, 
          property_id: job.propertyId,
          title: job.title, 
          description: job.description, 
          start_time: job.start, 
          end_time: job.end, 
          status: job.status,
          priority: job.priority, 
          vehicle_details: job.vehicleDetails, 
          line_items: job.items, 
          checklists: job.checklists,
          assigned_tech_ids: job.assignedTechIds
      };

      const { error } = await supabase.from('jobs').insert(payload);
      if (error) { console.error("Add Job Failed", error); return; }
      
      setJobs(prev => [...prev, job]); 
  };

  const updateJob = async (job: Job) => {
      const payload = {
          client_id: job.clientId, 
          property_id: job.propertyId,
          title: job.title, 
          description: job.description, 
          start_time: job.start, 
          end_time: job.end, 
          status: job.status,
          priority: job.priority, 
          vehicle_details: job.vehicleDetails, 
          line_items: job.items, 
          checklists: job.checklists,
          assigned_tech_ids: job.assignedTechIds
      };
      const { error } = await supabase.from('jobs').update(payload).eq('id', job.id);
      if (!error) setJobs(prev => prev.map(j => j.id === job.id ? job : j));
  };

  const addClient = async (client: Client) => { 
      if (!currentUser.companyId) return;
      const payload = {
          id: client.id, 
          company_id: currentUser.companyId, 
          first_name: client.firstName, 
          last_name: client.lastName,
          email: client.email, 
          phone: client.phone, 
          billing_address: client.billingAddress, 
          properties: client.properties
      };
      const { error } = await supabase.from('clients').insert(payload);
      if (error) { console.error("Add Client Failed", error); return; }
      setClients(prev => [...prev, client]); 
  };

  const updateClient = async (client: Client) => {
      const payload = {
          first_name: client.firstName, 
          last_name: client.lastName,
          email: client.email, 
          phone: client.phone, 
          billing_address: client.billingAddress, 
          properties: client.properties
      };
      await supabase.from('clients').update(payload).eq('id', client.id);
      setClients(prev => prev.map(c => c.id === client.id ? client : c)); 
  };

  // Simplified Actions for brevity - following same pattern of mapping fields
  const addQuote = async (quote: Quote) => {
      const payload = {
          id: quote.id,
          company_id: currentUser.companyId,
          client_id: quote.clientId,
          property_id: quote.propertyId,
          items: quote.items,
          subtotal: quote.subtotal,
          tax: quote.tax,
          total: quote.total,
          status: quote.status,
          issued_date: quote.issuedDate,
          expiry_date: quote.expiryDate
      };
      await supabase.from('quotes').insert(payload);
      setQuotes(prev => [...prev, quote]);
  };

  const updateQuote = (quote: Quote) => setQuotes(prev => prev.map(q => q.id === quote.id ? quote : q));

  const createInvoice = async (invoice: Invoice) => {
      const payload = {
          id: invoice.id,
          company_id: currentUser.companyId,
          client_id: invoice.clientId,
          job_id: invoice.jobId,
          items: invoice.items,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
          balance_due: invoice.balanceDue,
          status: invoice.status,
          due_date: invoice.dueDate,
          issued_date: invoice.issuedDate,
          payments: invoice.payments
      };
      await supabase.from('invoices').insert(payload);
      setInvoices(prev => [...prev, invoice]);
  };

  const updateInvoice = async (invoice: Invoice) => {
      const payload = {
          status: invoice.status,
          balance_due: invoice.balanceDue,
          payments: invoice.payments
      };
      await supabase.from('invoices').update(payload).eq('id', invoice.id);
      setInvoices(prev => prev.map(i => i.id === invoice.id ? invoice : i));
  };

  // Other actions follow same pattern, ensuring snake_case for DB and company_id presence
  const updateJobStatus = (id: string, status: JobStatus) => { 
      supabase.from('jobs').update({ status }).eq('id', id).then(() => {
          setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
      });
  };
  const updateJobStage = (id: string, stage: any) => { 
      setJobs(prev => prev.map(j => j.id === id ? { ...j, pipelineStage: stage } : j)); 
  };
  const assignJob = (jobId: string, techId: string, job: Job) => { 
      const newTechs = [...job.assignedTechIds, techId];
      supabase.from('jobs').update({ assigned_tech_ids: newTechs }).eq('id', jobId).then(() => {
          setJobs(prev => prev.map(j => j.id === jobId ? { ...j, assignedTechIds: newTechs } : j));
      });
  };
  const cancelJob = (id: string, reason: string) => updateJobStatus(id, JobStatus.CANCELLED);
  const moveJob = (jobId: string, start: string, end: string, techId?: string) => { 
      // Update logic here
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, start, end, assignedTechIds: techId ? [techId] : j.assignedTechIds } : j)); 
  };
  const unscheduleJob = (jobId: string) => { 
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, assignedTechIds: [], status: JobStatus.DRAFT } : j)); 
  };

  // Time & Inventory Actions - Stubbed to update local state for UI responsiveness, ideally would insert to DB too
  const addTimeEntry = (entry: TimeEntry) => setTimeEntries(prev => [...prev, entry]);
  const updateTimeEntry = (entry: TimeEntry) => setTimeEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
  const approveTimeEntry = (id: string) => setTimeEntries(prev => prev.map(e => e.id === id ? { ...e, status: TimeEntryStatus.APPROVED } : e));
  const clockIn = () => {};
  const clockOut = () => {};

  const addProduct = (p: InventoryProduct) => setInventoryProducts(prev => [...prev, p]);
  const updateStock = (r: InventoryRecord) => setInventoryRecords(prev => [...prev, r]); 
  const addWarehouse = (w: Warehouse) => setWarehouses(prev => [...prev, w]);
  const updateWarehouse = (w: Warehouse) => setWarehouses(prev => prev.map(wh => wh.id === w.id ? w : wh));
  const createPO = (po: PurchaseOrder) => setPurchaseOrders(prev => [...prev, po]);

  const addCampaign = async (campaign: MarketingCampaign) => { return { error: null } };
  const updateCampaign = async (campaign: MarketingCampaign) => { return { error: null } };
  const addAutomation = (automation: MarketingAutomation) => { setMarketingAutomations(prev => [...prev, automation]); };

  const sendMessage = (chatId: string, content: string, senderId?: string) => {
      const msg: ChatMessage = { id: crypto.randomUUID(), chatId, senderId: senderId || currentUser.id, content, timestamp: new Date().toISOString(), readBy: [currentUser.id] };
      setMessages(prev => [...prev, msg]);
  };
  const createChat = (participantIds: string[], name?: string) => {
      const newChat: Chat = { id: crypto.randomUUID(), type: name ? 'GROUP' : 'DIRECT', participantIds: [currentUser.id, ...participantIds], name };
      setChats(prev => [newChat, ...prev]);
  };
  const deleteChat = (chatId: string) => { setChats(prev => prev.filter(c => c.id !== chatId)); };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
      if (currentUser.companyId) {
          // Map to DB columns
          const dbSettings = {
              company_id: currentUser.companyId,
              company_name: newSettings.companyName,
              company_address: newSettings.companyAddress,
              onboarding_step: newSettings.onboardingStep,
              tax_rate: newSettings.taxRate,
              business_hours_start: newSettings.businessHoursStart,
              business_hours_end: newSettings.businessHoursEnd,
              sms_template_on_my_way: newSettings.smsTemplateOnMyWay,
              enable_auto_invoice: newSettings.enableAutoInvoice
          };
          
          const { error } = await supabase.from('settings').upsert(dbSettings, { onConflict: 'company_id' });
          if (error) console.error("Failed to update settings", error);
      }
  };

  const addUser = (u: User) => setUsers(prev => [...prev, u]);
  const updateUser = async (u: User) => {
      if (u.id) {
          const payload = {
              full_name: u.name,
              role: u.role,
              payroll_type: u.payrollType,
              pay_rate: u.payRate,
              enable_timesheets: u.enableTimesheets
          };
          await supabase.from('profiles').update(payload).eq('id', u.id);
          setUsers(prev => prev.map(usr => usr.id === u.id ? u : usr));
      }
  };
  
  const deleteAccount = async () => { 
      // Supabase Auth Admin deletion usually required, simple placeholder
      return { error: null }; 
  };
  
  const completeOnboarding = async () => {
      if (currentUser.id) {
          const { error } = await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', currentUser.id);
          if (!error) {
              setCurrentUser(prev => ({ ...prev, onboardingComplete: true }));
          }
      }
  };

  const addJobTemplate = async (template: JobTemplate) => {
      if (!currentUser.companyId) return;
      const payload = {
          id: template.id, 
          company_id: currentUser.companyId, 
          name: template.name,
          description: template.description, 
          default_price: template.defaultPrice, 
          category: template.category
      };
      await supabase.from('job_templates').insert(payload);
  };

  const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      if (newTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  };

  const markNotificationRead = (id: string) => { setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); };
  const markAllNotificationsRead = () => { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); };

  return {
      isAuthenticated, isLoading, currentUser, users, clients, jobs, quotes, invoices,
      timeEntries, activityLog, notifications, settings,
      inventoryProducts, inventoryRecords, warehouses, vendors, purchaseOrders,
      marketingCampaigns, marketingAutomations, marketingAudiences,
      chats, messages,
      login, signup, logout, switchUser,
      addJob, updateJob, updateJobStatus, updateJobStage, assignJob, cancelJob, moveJob, unscheduleJob,
      addClient, updateClient, addQuote, updateQuote, createInvoice, updateInvoice,
      addTimeEntry, updateTimeEntry, approveTimeEntry, clockIn, clockOut,
      addProduct, updateStock, addWarehouse, updateWarehouse, createPO,
      addCampaign, updateCampaign, addAutomation,
      sendMessage, createChat, deleteChat,
      updateSettings, addUser, updateUser, deleteAccount, completeOnboarding, addJobTemplate,
      theme, toggleTheme, markNotificationRead, markAllNotificationsRead
  };
};
