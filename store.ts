
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
  completeOnboarding: () => void;
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
          // If no profile found but we have auth, it's a desync.
          // Don't throw immediately, allow UI to handle "incomplete profile" if needed,
          // but usually this means we should sign out.
          throw error;
      }

      if (!profile) throw new Error('User profile not found. Please contact support or sign up again.');

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
      // Force sign out to prevent stuck state if profile is missing/broken
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setCurrentUser(defaultUser);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompanyData = async (companyId: string) => {
    try {
      // Parallel fetch for speed
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

      // Map Settings
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

      // Map Clients
      if (clientsRes.data) {
          setClients(clientsRes.data.map((c: any) => ({
              id: c.id,
              firstName: c.first_name,
              lastName: c.last_name,
              email: c.email,
              phone: c.phone,
              companyName: c.company_name,
              billingAddress: c.billing_address,
              properties: c.properties || [],
              tags: c.tags || [],
              createdAt: c.created_at
          })));
      }

      // Map Jobs
      if (jobsRes.data) {
          setJobs(jobsRes.data.map((j: any) => ({
              id: j.id,
              clientId: j.client_id,
              propertyId: j.property_id,
              assignedTechIds: j.assigned_tech_ids || [],
              title: j.title,
              description: j.description,
              start: j.start_time,
              end: j.end_time,
              status: j.status,
              priority: j.priority,
              vehicleDetails: j.vehicle_details,
              items: j.line_items || [],
              checklists: j.checklists || [],
              photos: j.photos || [],
              notes: j.notes,
              pipelineStage: j.pipeline_stage
          })));
      }

      // Map Campaigns
      if (campaignsRes.data) {
          setMarketingCampaigns(campaignsRes.data.map((c: any) => ({
              id: c.id,
              companyId: c.company_id,
              title: c.title,
              subject: c.subject,
              previewText: c.preview_text,
              from_name: c.from_name,
              content: c.html,
              channel: ChannelType.EMAIL,
              status: c.status as CampaignStatus,
              segmentId: c.audience_segment,
              targetClientIds: c.target_client_ids || [],
              scheduledDate: c.scheduled_at,
              sentDate: c.sent_at,
              stats: c.stats || { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
              tags: []
          })));
      }

      // Load other entities
      if (invoicesRes.data) setInvoices(invoicesRes.data.map((i: any) => ({ ...i, items: i.line_items, balanceDue: i.balance_due, issuedDate: i.issued_date, dueDate: i.due_date })));
      if (quotesRes.data) setQuotes(quotesRes.data.map((q: any) => ({ ...q, items: q.line_items, issuedDate: q.issued_date, expiryDate: q.expiry_date })));
      
      // Inventory
      if (productsRes.data) setInventoryProducts(productsRes.data.map((p: any) => ({ ...p, minStock: p.min_stock, trackSerial: p.track_serial, supplierId: p.supplier_id })));
      if (recordsRes.data) setInventoryRecords(recordsRes.data.map((r: any) => ({ ...r, productId: r.product_id, warehouseId: r.warehouse_id, lastUpdated: r.last_updated })));
      if (warehousesRes.data) setWarehouses(warehousesRes.data);

      // Chat
      if (chatsRes.data) setChats(chatsRes.data.map((c: any) => ({ ...c, participantIds: c.participant_ids })));
      if (messagesRes.data) setMessages(messagesRes.data.map((m: any) => ({ ...m, chatId: m.chat_id, senderId: m.sender_id, readBy: m.read_by })));

      // Fetch Users
      const { data: profiles } = await supabase.from('profiles').select('*').eq('company_id', companyId);
      if (profiles) {
          setUsers(profiles.map((p: any) => ({
              id: p.id,
              companyId: p.company_id,
              name: p.full_name,
              email: p.email,
              role: p.role,
              avatarUrl: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}`,
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

  // --- ACTIONS ---

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

        // 2. Setup Company (Create or Find)
        if (type === 'create') {
            const code = Math.random().toString(36).substring(2, 9).toUpperCase();
            // Generate UUID client-side to ensure we have it even if RLS blocks read-after-write
            companyId = crypto.randomUUID(); 
            companyCode = code;
            
            const { error: settingsError } = await supabase.from('settings').insert({
                company_id: companyId,
                company_name: `${name}'s Company`,
                company_code: code,
                onboarding_step: 1
            });
            
            if (settingsError) throw settingsError;
        } else {
            const { data: settingsData, error: findError } = await supabase.from('settings').select('company_id').eq('company_code', joinCode).single();
            if (findError || !settingsData) throw new Error("Invalid Company Code");
            companyId = settingsData.company_id;
            role = UserRole.TECHNICIAN;
        }

        // 3. Create Profile
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            company_id: companyId,
            email,
            full_name: name,
            role,
            onboarding_complete: false
        });

        if (profileError) throw profileError;

        // 4. Force full data reload and wait for it BEFORE resolving
        // This ensures the store has the correct company_id and profile data
        await loadUserData(authData.user.id);
        
        return { error: null, companyCode: type === 'create' ? companyCode : undefined };
    } catch (err: any) {
        setIsLoading(false);
        // Clean up if auth user was created but profile failed? 
        // For now, return error so UI can show it.
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

  // --- JOB ACTIONS ---
  const addJob = async (job: Job) => {
      if (!currentUser.companyId) return;
      
      const { error } = await supabase.from('jobs').insert({
          id: job.id, // Using the ID generated in the component (UUID)
          company_id: currentUser.companyId,
          client_id: job.clientId,
          property_id: job.propertyId,
          title: job.title,
          description: job.description,
          start_time: job.start,
          end_time: job.end,
          status: job.status,
          vehicle_details: job.vehicleDetails,
          line_items: job.items,
          checklists: job.checklists
      });

      if (!error) {
          setJobs(prev => [...prev, job]);
          logActivity(currentUser.id, 'CREATED', `Created job: ${job.title}`, job.id);
      }
  };

  const updateJob = (job: Job) => {
      setJobs(prev => prev.map(j => j.id === job.id ? job : j));
  };

  const updateJobStatus = (id: string, status: JobStatus) => {
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
      logActivity(currentUser.id, 'UPDATED', `Updated job status to ${status}`, id);
  };

  const updateJobStage = (id: string, stage: any) => {
      setJobs(prev => prev.map(j => j.id === id ? { ...j, pipelineStage: stage } : j));
  };

  const assignJob = (jobId: string, techId: string) => {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, assignedTechIds: [...j.assignedTechIds, techId] } : j));
  };

  const cancelJob = (id: string) => updateJobStatus(id, JobStatus.CANCELLED);
  
  const moveJob = (jobId: string, start: string, end: string, techId?: string) => {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, start, end, assignedTechIds: techId ? [techId] : j.assignedTechIds } : j));
  };

  const unscheduleJob = (jobId: string) => {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, assignedTechIds: [], status: JobStatus.DRAFT } : j));
  };

  // --- CLIENT ACTIONS ---
  const addClient = async (client: Client) => {
      if (!currentUser.companyId) return;
      const { error } = await supabase.from('clients').insert({
          id: client.id,
          company_id: currentUser.companyId,
          first_name: client.firstName,
          last_name: client.lastName,
          email: client.email,
          phone: client.phone,
          billing_address: client.billingAddress,
          properties: client.properties
      });
      if (!error) setClients(prev => [...prev, client]);
  };

  const updateClient = (client: Client) => {
      setClients(prev => prev.map(c => c.id === client.id ? client : c));
  };

  // --- QUOTE/INVOICE ACTIONS ---
  const addQuote = (quote: Quote) => setQuotes(prev => [...prev, quote]);
  const updateQuote = (quote: Quote) => setQuotes(prev => prev.map(q => q.id === quote.id ? quote : q));
  
  const createInvoice = (invoice: Invoice) => setInvoices(prev => [...prev, invoice]);
  const updateInvoice = (invoice: Invoice) => setInvoices(prev => prev.map(i => i.id === invoice.id ? invoice : i));

  // --- MARKETING ACTIONS ---
  const addCampaign = async (campaign: MarketingCampaign) => {
      if (!currentUser.companyId) return { error: 'No user' };
      
      const payload = {
        id: campaign.id,
        company_id: currentUser.companyId,
        title: campaign.title,
        subject: campaign.subject,
        preview_text: campaign.previewText,
        from_name: campaign.fromName,
        html: campaign.content,
        status: campaign.status,
        audience_segment: campaign.segmentId,
        target_client_ids: campaign.targetClientIds || [],
        scheduled_at: campaign.scheduledDate || null,
        sent_at: null,
        stats: campaign.stats
      };

      const { error } = await supabase.from('email_campaigns').insert(payload);

      if (!error) {
          setMarketingCampaigns(prev => [...prev, campaign]);
      }
      return { error };
  };

  const updateCampaign = async (campaign: MarketingCampaign) => {
      const { error } = await supabase.from('email_campaigns').update({
          title: campaign.title,
          subject: campaign.subject,
          html: campaign.content,
          status: campaign.status,
          target_client_ids: campaign.targetClientIds,
          scheduled_at: campaign.scheduledDate || null
      }).eq('id', campaign.id);

      if (!error) {
          setMarketingCampaigns(prev => prev.map(c => c.id === campaign.id ? campaign : c));
      }
      return { error };
  };

  const addAutomation = (automation: MarketingAutomation) => {
      setMarketingAutomations(prev => [...prev, automation]);
  };

  // --- OTHER ACTIONS ---
  const logActivity = (userId: string, type: any, description: string, jobId?: string) => {
      const log: ActivityLogItem = {
          id: crypto.randomUUID(),
          userId,
          type,
          description,
          timestamp: new Date().toISOString(),
          jobId
      };
      setActivityLog(prev => [log, ...prev]);
  };

  const sendMessage = (chatId: string, content: string, senderId?: string) => {
      const msg: ChatMessage = {
          id: crypto.randomUUID(),
          chatId,
          senderId: senderId || currentUser.id,
          content,
          timestamp: new Date().toISOString(),
          readBy: [currentUser.id]
      };
      setMessages(prev => [...prev, msg]);
  };

  const createChat = (participantIds: string[], name?: string) => {
      const newChat: Chat = {
          id: crypto.randomUUID(),
          type: name ? 'GROUP' : 'DIRECT',
          participantIds: [currentUser.id, ...participantIds],
          name
      };
      setChats(prev => [newChat, ...prev]);
  };

  const deleteChat = (chatId: string) => {
      setChats(prev => prev.filter(c => c.id !== chatId));
  };

  const addTimeEntry = (entry: TimeEntry) => setTimeEntries(prev => [...prev, entry]);
  const updateTimeEntry = (entry: TimeEntry) => setTimeEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
  const approveTimeEntry = (id: string) => setTimeEntries(prev => prev.map(e => e.id === id ? { ...e, status: TimeEntryStatus.APPROVED } : e));
  const clockIn = (jobId?: string) => {};
  const clockOut = () => {};

  const addProduct = (p: InventoryProduct) => setInventoryProducts(prev => [...prev, p]);
  const updateStock = (r: InventoryRecord) => setInventoryRecords(prev => [...prev, r]); 
  const addWarehouse = (w: Warehouse) => setWarehouses(prev => [...prev, w]);
  const updateWarehouse = (w: Warehouse) => setWarehouses(prev => prev.map(wh => wh.id === w.id ? w : wh));
  const createPO = (po: PurchaseOrder) => setPurchaseOrders(prev => [...prev, po]);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
      if (currentUser.companyId) {
          await supabase.from('settings').update({
              company_name: newSettings.companyName,
              // map other fields
          }).eq('company_id', currentUser.companyId);
      }
  };

  const deleteAccount = async () => { return { error: null }; };
  const addUser = (u: User) => setUsers(prev => [...prev, u]);
  const updateUser = (u: User) => setUsers(prev => prev.map(usr => usr.id === u.id ? u : usr));
  
  const completeOnboarding = async () => {
      if (currentUser.id) {
          await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', currentUser.id);
          setCurrentUser(prev => ({ ...prev, onboardingComplete: true }));
      }
  };

  const addJobTemplate = async (template: JobTemplate) => {
      if (!currentUser.companyId) return;
      await supabase.from('job_templates').insert({
          id: template.id,
          company_id: currentUser.companyId,
          name: template.name,
          description: template.description,
          default_price: template.defaultPrice,
          category: template.category
      });
  };

  // UI Helpers
  const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      if (newTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  };

  const markNotificationRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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
