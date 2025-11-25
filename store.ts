
import { useState, createContext, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Client, Invoice, Job, JobStatus, Quote, User, UserRole, BusinessType,
  MarketingCampaign, MarketingAutomation, AudienceSegment,
  InventoryProduct, InventoryRecord, Vendor, PurchaseOrder, Warehouse,
  Chat, ChatMessage, ActivityLog, Notification, TimeEntry, TimeSheetStatus, TimeEntryType,
  Property
} from './types';
import { 
  mockUsers, mockClients, mockJobs, mockQuotes, mockInvoices, 
  mockCampaigns, mockAutomations, mockSegments,
  mockProducts, mockInventoryRecords, mockVendors, mockPurchaseOrders, mockWarehouses,
  mockChats, mockMessages, mockActivityLog, mockTimeEntries
} from './mockData';

interface AppState {
  isAuthenticated: boolean;
  darkMode: boolean;
  currentUser: User;
  users: User[];
  clients: Client[];
  jobs: Job[];
  quotes: Quote[];
  invoices: Invoice[];
  marketingCampaigns: MarketingCampaign[];
  marketingAutomations: MarketingAutomation[];
  marketingSegments: AudienceSegment[];
  
  // Inventory State
  inventoryProducts: InventoryProduct[];
  inventoryRecords: InventoryRecord[];
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  warehouses: Warehouse[];

  // Communication & Notifications State
  chats: Chat[];
  messages: ChatMessage[];
  activityLog: ActivityLog[];
  notifications: Notification[];

  // Time Sheet State
  timeEntries: TimeEntry[];

  // Actions
  login: (email: string, password: string) => Promise<{ error: any }>;
  loginAsDemo: () => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  toggleDarkMode: () => void;
  switchUser: (role: UserRole) => void;
  updateBusinessType: (type: BusinessType) => void;
  addUser: (user: User) => void;
  addJob: (job: Job) => void;
  assignJob: (jobId: string, techId: string, jobSnapshot?: Job) => void;
  updateJobStatus: (jobId: string, status: JobStatus) => void;
  cancelJob: (jobId: string, reason: string) => void;
  createInvoice: (invoice: Invoice) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  addQuote: (quote: Quote) => void;
  updateQuote: (quote: Quote) => void;
  updateInvoice: (invoice: Invoice) => void;
  moveJob: (jobId: string, newStart: string, newEnd: string, techId: string) => void;
  unscheduleJob: (jobId: string) => void;
  markOnMyWay: (jobId: string) => void;
  addCampaign: (campaign: MarketingCampaign) => void;
  addSegment: (segment: AudienceSegment) => void;
  
  // Inventory Actions
  addProduct: (product: InventoryProduct) => void;
  updateStock: (record: InventoryRecord) => void;
  createPO: (po: PurchaseOrder) => void;
  addVendor: (vendor: Vendor) => void;
  addWarehouse: (warehouse: Warehouse) => void;
  updateWarehouse: (warehouse: Warehouse) => void;

  // Communication Actions
  sendMessage: (chatId: string, content: string, customSenderId?: string) => void;
  createChat: (participantIds: string[], name?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Time Sheet Actions
  clockIn: (userId: string, type: TimeEntryType, jobId?: string, location?: any) => void;
  clockOut: (userId: string, entryId: string, notes?: string) => void;
  addTimeEntry: (entry: TimeEntry) => void;
  updateTimeSheetStatus: (entryIds: string[], status: TimeSheetStatus) => void;
}

export const StoreContext = createContext<AppState | null>(null);

// Default guest user for initial state
const defaultUser: User = {
    id: 'guest',
    name: 'Guest',
    email: '',
    role: UserRole.CLIENT,
    businessType: BusinessType.MOBILE_DETAILING,
    avatarUrl: 'https://ui-avatars.com/api/?name=Guest&background=random',
    joinDate: new Date().toISOString(),
    skills: [],
    rating: 0,
    status: 'ACTIVE'
};

export const useAppStore = (): AppState => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Data States - Initialize empty for real data
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [marketingCampaigns, setMarketingCampaigns] = useState<MarketingCampaign[]>([]);
  const [marketingAutomations, setMarketingAutomations] = useState<MarketingAutomation[]>([]);
  const [marketingSegments, setMarketingSegments] = useState<AudienceSegment[]>([]);

  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  // --- AUTH & DATA FETCHING ---
  useEffect(() => {
    // 1. Check Active Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        fetchUserProfile(session.user.id);
      }
    });

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        fetchUserProfile(session.user.id);
      } else if (!isDemoMode) {
        setIsAuthenticated(false);
        setCurrentUser(defaultUser);
        // Clear data on logout
        setUsers([]);
        setClients([]);
        setJobs([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  const fetchUserProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
          setCurrentUser({ ...data, role: data.role || UserRole.ADMIN, status: data.status || 'ACTIVE' } as User);
      } else if (error) {
          console.error("Error fetching profile:", error);
      }
  };

  // --- FETCH DATA FROM SUPABASE ---
  useEffect(() => {
    if (!isAuthenticated || isDemoMode) return;

    const fetchData = async () => {
      try {
        const results = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('clients').select('*').order('createdAt', { ascending: false }),
          supabase.from('properties').select('*'),
          supabase.from('jobs').select('*'),
          supabase.from('quotes').select('*'),
          supabase.from('invoices').select('*'),
          supabase.from('marketing_campaigns').select('*'),
          supabase.from('marketing_automations').select('*'),
          supabase.from('audience_segments').select('*'),
          supabase.from('inventory_products').select('*'),
          supabase.from('inventory_records').select('*'),
          supabase.from('vendors').select('*'),
          supabase.from('purchase_orders').select('*'),
          supabase.from('warehouses').select('*'),
          supabase.from('chats').select('*'),
          supabase.from('chat_messages').select('*'),
          supabase.from('activity_log').select('*').order('timestamp', { ascending: false }),
          supabase.from('notifications').select('*').order('timestamp', { ascending: false }),
          supabase.from('time_entries').select('*').order('start', { ascending: false })
        ]);

        if (results[0].data) setUsers(results[0].data);
        
        // Clients & Properties Stitching
        if (results[1].data !== null) {
            const fetchedClients: Client[] = results[1].data || [];
            const fetchedProperties: Property[] = results[2].data || [];
            const clientsWithProperties = fetchedClients.map(client => ({
                ...client,
                properties: fetchedProperties.filter(p => p.clientId === client.id)
            }));
            setClients(clientsWithProperties);
        }

        if (results[3].data) setJobs(results[3].data);
        if (results[4].data) setQuotes(results[4].data);
        if (results[5].data) setInvoices(results[5].data);
        if (results[6].data) setMarketingCampaigns(results[6].data);
        if (results[7].data) setMarketingAutomations(results[7].data);
        if (results[8].data) setMarketingSegments(results[8].data);
        if (results[9].data) setInventoryProducts(results[9].data);
        if (results[10].data) setInventoryRecords(results[10].data);
        if (results[11].data) setVendors(results[11].data);
        if (results[12].data) setPurchaseOrders(results[12].data);
        if (results[13].data) setWarehouses(results[13].data);
        if (results[14].data) setChats(results[14].data);
        if (results[15].data) setMessages(results[15].data);
        if (results[16].data) setActivityLog(results[16].data);
        if (results[17].data) setNotifications(results[17].data);
        if (results[18].data) setTimeEntries(results[18].data);

      } catch (error) {
        console.error("Error loading data from Supabase:", error);
      }
    };

    fetchData();
  }, [isAuthenticated, isDemoMode]);

  // --- ACTIONS ---

  const login = async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) console.error("Login error:", error);
      return { error };
  };

  const loginAsDemo = async () => {
      setIsDemoMode(true);
      setIsAuthenticated(true);
      
      // Load Mock Data
      setUsers(mockUsers);
      setClients(mockClients);
      setJobs(mockJobs);
      setQuotes(mockQuotes);
      setInvoices(mockInvoices);
      setMarketingCampaigns(mockCampaigns);
      setMarketingAutomations(mockAutomations);
      setMarketingSegments(mockSegments);
      setInventoryProducts(mockProducts);
      setInventoryRecords(mockInventoryRecords);
      setVendors(mockVendors);
      setPurchaseOrders(mockPurchaseOrders);
      setWarehouses(mockWarehouses);
      setChats(mockChats);
      setMessages(mockMessages);
      setActivityLog(mockActivityLog);
      // Mock notifications - generate on fly
      setNotifications([
          { id: 'n1', userId: 'admin-1', type: 'SYSTEM', title: 'Welcome to Demo', message: 'You are viewing a demo account.', read: false, timestamp: new Date().toISOString() }
      ]);
      setTimeEntries(mockTimeEntries);

      // Set current user as Admin from mock data
      setCurrentUser(mockUsers[0]);
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
      const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
              data: { full_name: userData.name }
          }
      });

      if (error) return { error };

      if (data.user) {
          // 1. CHECK FOR GHOST/INVITED ACCOUNT MATCHING EMAIL
          // In a real app, we would query the DB. Here we check loaded state for hybrid/demo purposes.
          const ghostUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

          if (ghostUser) {
              // === CLAIM ACCOUNT LOGIC ===
              console.log(`Claiming ghost account for ${email}. Old ID: ${ghostUser.id}, New ID: ${data.user.id}`);
              
              const oldId = ghostUser.id;
              const newId = data.user.id;

              const mergedUser = {
                  ...ghostUser,
                  id: newId,
                  status: 'ACTIVE' as const,
                  // Retain existing ghost data (role, etc) but ensure critical fields match auth
                  email: email,
              };

              // Update Local State (Optimistic Update)
              setUsers(prev => prev.map(u => u.id === oldId ? mergedUser : u));
              
              // Update References in State
              setJobs(prev => prev.map(j => ({
                  ...j,
                  assignedTechIds: j.assignedTechIds.map(tid => tid === oldId ? newId : tid),
                  onMyWayBy: j.onMyWayBy === oldId ? newId : j.onMyWayBy
              })));
              setChats(prev => prev.map(c => ({
                  ...c,
                  participantIds: c.participantIds.map(pid => pid === oldId ? newId : pid)
              })));
              
              // In a real Supabase app, you would likely delete the ghost row and insert the new one 
              // OR update the existing row's ID if possible (hard with PKs) 
              // OR (best practice) have an 'auth_id' column in 'users' that you update.
              // For this mock-backend simulation, we'll just insert the new valid user.
              await supabase.from('users').insert([mergedUser]);
              // Optional: cleanup ghost if you can
              // await supabase.from('users').delete().eq('id', oldId); 

          } else {
              // === STANDARD NEW USER ===
              const newUser = {
                  id: data.user.id,
                  email: email,
                  name: userData.name,
                  role: userData.role || UserRole.ADMIN,
                  businessType: userData.businessType,
                  businessName: userData.businessName,
                  phone: userData.phone,
                  avatarUrl: userData.avatarUrl || `https://ui-avatars.com/api/?name=${userData.name}&background=0D9488&color=fff`,
                  joinDate: new Date().toISOString(),
                  skills: [],
                  rating: 5.0,
                  status: 'ACTIVE' as const
              };
              
              setUsers(prev => [...prev, newUser as User]);
              const { error: dbError } = await supabase.from('users').insert([newUser]);
              if (dbError) {
                  console.error("Error creating user profile:", dbError);
                  return { error: dbError };
              }
          }
      }
      return { error: null };
  };
  
  const logout = async () => {
      if (isDemoMode) {
          setIsDemoMode(false);
      }
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setCurrentUser(defaultUser);
  };

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const updateBusinessType = (type: BusinessType) => {
      setCurrentUser(prev => ({ ...prev, businessType: type }));
  };

  const switchUser = (role: UserRole) => {
    // Mock user switching for demo purposes - active even with real auth for testing views
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
        setCurrentUser({ ...targetUser, businessType: currentUser.businessType });
    } else {
        setCurrentUser(prev => ({ ...prev, role }));
    }
  };

  const addUser = async (user: User) => {
    // For "Add Member" functionality - create as INVITED if manually added
    const userWithStatus = { 
        ...user, 
        status: user.status || 'INVITED' 
    };
    setUsers(prev => [...prev, userWithStatus]);
    
    const { hourlyRate, ...dbUser } = userWithStatus;
    const { error } = await supabase.from('users').insert([dbUser]);
    if (error) console.error("Error adding user:", error);
  };

  const addJob = async (job: Job) => {
    setJobs(prev => [...prev, job]);
    const dbJob = {
        id: job.id,
        clientId: job.clientId,
        propertyId: job.propertyId,
        assignedTechIds: job.assignedTechIds,
        title: job.title,
        description: job.description,
        start: job.start,
        end: job.end,
        status: job.status,
        priority: job.priority,
        vehicleDetails: job.vehicleDetails,
        propertyDetails: job.propertyDetails,
        items: job.items,
        checklists: job.checklists,
        photos: job.photos,
        notes: job.notes,
        onMyWayBy: job.onMyWayBy,
        cancellationReason: job.cancellationReason
    };
    const { error } = await supabase.from('jobs').insert([dbJob]);
    if (error) console.error("Error adding job:", error);
  };

  const assignJob = async (jobId: string, techId: string, jobSnapshot?: Job) => {
    setJobs(prevJobs => prevJobs.map(j => {
        if (j.id === jobId) {
            return {
                ...j,
                assignedTechIds: [techId],
                status: j.status === JobStatus.DRAFT ? JobStatus.SCHEDULED : j.status
            };
        }
        return j;
    }));

    const jobToUpdate = jobs.find(j => j.id === jobId);
    const newStatus = jobToUpdate?.status === JobStatus.DRAFT ? JobStatus.SCHEDULED : jobToUpdate?.status || JobStatus.SCHEDULED;
    await supabase.from('jobs').update({ assignedTechIds: [techId], status: newStatus }).eq('id', jobId);

    const tech = users.find(u => u.id === techId);
    const job = jobSnapshot || jobs.find(j => j.id === jobId);

    if (tech && job) {
        const newActivity = {
            id: `act-${Date.now()}`,
            userId: currentUser.id,
            jobId: jobId,
            type: 'SYSTEM',
            description: `Assigned ${job.title} to ${tech.name}`,
            timestamp: new Date().toISOString()
        };
        const newNotification = {
            id: `notif-${Date.now()}`,
            userId: techId,
            type: 'ASSIGNMENT',
            title: 'New Job Assignment',
            message: `You have been assigned to ${job.title} on ${new Date(job.start).toLocaleDateString()}.`,
            read: false,
            timestamp: new Date().toISOString(),
            link: `/jobs/${jobId}`
        };

        setActivityLog(prev => [newActivity as ActivityLog, ...prev]);
        setNotifications(prev => [newNotification as Notification, ...prev]);

        await supabase.from('activity_log').insert([newActivity]);
        await supabase.from('notifications').insert([newNotification]);
    }
  };

  const updateJobStatus = async (jobId: string, status: JobStatus) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status } : j));
    await supabase.from('jobs').update({ status }).eq('id', jobId);
    
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      let type: 'ARRIVED' | 'COMPLETED' | undefined;
      let desc = '';
      
      if (status === JobStatus.IN_PROGRESS) {
        type = 'ARRIVED';
        desc = `${currentUser.name.split(' ')[0]} started ${job.title}`;
      } else if (status === JobStatus.COMPLETED) {
        type = 'COMPLETED';
        desc = `${currentUser.name.split(' ')[0]} completed ${job.title}`;
      }

      if (type) {
        const newActivity = {
          id: `act-${Date.now()}`,
          userId: currentUser.id,
          jobId: job.id,
          type,
          description: desc,
          timestamp: new Date().toISOString()
        };
        setActivityLog(prev => [newActivity as ActivityLog, ...prev]);
        await supabase.from('activity_log').insert([newActivity]);
      }
    }
  };

  const cancelJob = async (jobId: string, reason: string) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: JobStatus.CANCELLED, cancellationReason: reason, assignedTechIds: [] } : j));
    await supabase.from('jobs').update({ status: JobStatus.CANCELLED, cancellationReason: reason, assignedTechIds: [] }).eq('id', jobId);
    
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      const newActivity = {
        id: `act-${Date.now()}`,
        userId: currentUser.id,
        jobId: job.id,
        type: 'CANCELLED',
        description: `${currentUser.name.split(' ')[0]} cancelled ${job.title}. Reason: ${reason}`,
        timestamp: new Date().toISOString()
      };
      setActivityLog(prev => [newActivity as ActivityLog, ...prev]);
      await supabase.from('activity_log').insert([newActivity]);
    }
  };

  const createInvoice = async (invoice: Invoice) => {
    setInvoices(prev => [...prev, invoice]);
    const dbInvoice = {
        id: invoice.id,
        clientId: invoice.clientId,
        jobId: invoice.jobId,
        items: invoice.items,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        balanceDue: invoice.balanceDue,
        status: invoice.status,
        dueDate: invoice.dueDate,
        issuedDate: invoice.issuedDate,
        payments: invoice.payments
    };
    const { error } = await supabase.from('invoices').insert([dbInvoice]);
    if (error) console.error("Error creating invoice:", error);
  };

  const addClient = async (client: Client) => {
    setClients(prev => [client, ...prev]);
    
    const dbClient = {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        companyName: client.companyName,
        email: client.email,
        phone: client.phone,
        billingAddress: client.billingAddress,
        tags: client.tags,
        createdAt: client.createdAt
    };
    const { error: clientError } = await supabase.from('clients').insert([dbClient]);
    if (clientError) console.error("Error adding client:", clientError);

    if (client.properties && client.properties.length > 0) {
        const dbProperties = client.properties.map(p => ({
            id: p.id,
            clientId: client.id,
            address: p.address,
            accessInstructions: p.accessInstructions
        }));
        const { error: propError } = await supabase.from('properties').insert(dbProperties);
        if (propError) console.error("Error adding properties:", propError);
    }
  };

  const updateClient = async (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    const dbClient = {
        firstName: client.firstName,
        lastName: client.lastName,
        companyName: client.companyName,
        email: client.email,
        phone: client.phone,
        billingAddress: client.billingAddress,
        tags: client.tags
    };
    await supabase.from('clients').update(dbClient).eq('id', client.id);
  };

  const addQuote = async (quote: Quote) => {
    setQuotes(prev => [...prev, quote]);
    const dbQuote = {
        id: quote.id,
        clientId: quote.clientId,
        propertyId: quote.propertyId,
        items: quote.items,
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        status: quote.status,
        issuedDate: quote.issuedDate,
        expiryDate: quote.expiryDate
    };
    const { error } = await supabase.from('quotes').insert([dbQuote]);
    if (error) console.error("Error adding quote:", error);
  };

  const updateQuote = async (quote: Quote) => {
    setQuotes(prev => prev.map(q => q.id === quote.id ? quote : q));
    const dbQuote = {
        items: quote.items,
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        status: quote.status,
        issuedDate: quote.issuedDate,
        expiryDate: quote.expiryDate
    };
    await supabase.from('quotes').update(dbQuote).eq('id', quote.id);
  };

  const updateInvoice = async (invoice: Invoice) => {
    setInvoices(invoices.map(i => i.id === invoice.id ? invoice : i));
    const dbInvoice = {
        items: invoice.items,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        balanceDue: invoice.balanceDue,
        status: invoice.status,
        dueDate: invoice.dueDate,
        issuedDate: invoice.issuedDate,
        payments: invoice.payments
    };
    await supabase.from('invoices').update(dbInvoice).eq('id', invoice.id);
  };

  const moveJob = async (jobId: string, newStart: string, newEnd: string, techId: string) => {
    const updatedJobStatus = jobs.find(j => j.id === jobId)?.status === JobStatus.DRAFT ? JobStatus.SCHEDULED : jobs.find(j => j.id === jobId)?.status;
    
    setJobs(jobs.map(j => {
        if (j.id === jobId) {
            return {
                ...j,
                start: newStart,
                end: newEnd,
                assignedTechIds: [techId],
                status: updatedJobStatus || JobStatus.SCHEDULED
            };
        }
        return j;
    }));

    await supabase.from('jobs').update({
        start: newStart,
        end: newEnd,
        assignedTechIds: [techId],
        status: updatedJobStatus
    }).eq('id', jobId);
  };

  const unscheduleJob = async (jobId: string) => {
    setJobs(jobs.map(j => {
        if (j.id === jobId) {
            return { ...j, assignedTechIds: [], status: JobStatus.DRAFT };
        }
        return j;
    }));
    await supabase.from('jobs').update({ assignedTechIds: [], status: JobStatus.DRAFT }).eq('id', jobId);
  };

  const markOnMyWay = async (jobId: string) => {
    setJobs(jobs.map(j => {
        if (j.id === jobId) {
            return { ...j, onMyWayBy: currentUser.id };
        }
        return j;
    }));
    await supabase.from('jobs').update({ onMyWayBy: currentUser.id }).eq('id', jobId);

    const job = jobs.find(j => j.id === jobId);
    if (job) {
        const newActivity = {
            id: `act-${Date.now()}`,
            userId: currentUser.id,
            jobId: job.id,
            type: 'ON_THE_WAY',
            description: `${currentUser.name.split(' ')[0]} is on the way to ${job.title}`,
            timestamp: new Date().toISOString()
        };
        setActivityLog(prev => [newActivity as ActivityLog, ...prev]);
        await supabase.from('activity_log').insert([newActivity]);
    }
  };

  const addCampaign = async (campaign: MarketingCampaign) => {
    setMarketingCampaigns(prev => [...prev, campaign]);
    const dbCampaign = {
        id: campaign.id,
        title: campaign.title,
        subject: campaign.subject,
        previewText: campaign.previewText,
        content: campaign.content,
        channel: campaign.channel,
        status: campaign.status,
        segmentId: campaign.segmentId,
        scheduledDate: campaign.scheduledDate,
        sentDate: campaign.sentDate,
        stats: campaign.stats,
        tags: campaign.tags
    };
    const { error } = await supabase.from('marketing_campaigns').insert([dbCampaign]);
    if (error) console.error("Error adding campaign:", error);
  };

  const addSegment = async (segment: AudienceSegment) => {
    setMarketingSegments(prev => [...prev, segment]);
    const { error } = await supabase.from('audience_segments').insert([segment]);
    if (error) console.error("Error adding segment:", error);
  };

  const addProduct = async (product: InventoryProduct) => {
    setInventoryProducts(prev => [...prev, product]);
    const { error } = await supabase.from('inventory_products').insert([product]);
    if (error) console.error("Error adding product:", error);
  };

  const updateStock = async (record: InventoryRecord) => {
    const existing = inventoryRecords.find(r => r.productId === record.productId && r.warehouseId === record.warehouseId);
    const dbRecord = {
        productId: record.productId,
        warehouseId: record.warehouseId,
        quantity: record.quantity,
        binLocation: record.binLocation,
        lastUpdated: record.lastUpdated,
        lastUpdatedBy: record.lastUpdatedBy
    };

    if (existing) {
        setInventoryRecords(prev => prev.map(r => r.id === existing.id ? record : r));
        await supabase.from('inventory_records').update(dbRecord).eq('id', existing.id);
    } else {
        const newRecord = { ...record, id: record.id || `rec-${Date.now()}` };
        setInventoryRecords(prev => [...prev, newRecord]);
        const { id, ...rest } = newRecord;
        await supabase.from('inventory_records').insert([{...rest, id: newRecord.id}]);
    }
  };

  const createPO = async (po: PurchaseOrder) => {
    setPurchaseOrders(prev => [...prev, po]);
    const dbPO = {
        id: po.id,
        vendorId: po.vendorId,
        status: po.status,
        orderDate: po.orderDate,
        expectedDate: po.expectedDate,
        items: po.items,
        total: po.total,
        notes: po.notes
    };
    const { error } = await supabase.from('purchase_orders').insert([dbPO]);
    if (error) console.error("Error creating PO:", error);
  };

  const addVendor = async (vendor: Vendor) => {
    setVendors(prev => [...prev, vendor]);
    const { error } = await supabase.from('vendors').insert([vendor]);
    if (error) console.error("Error adding vendor:", error);
  };

  const addWarehouse = async (warehouse: Warehouse) => {
    setWarehouses(prev => [...prev, warehouse]);
    const { error } = await supabase.from('warehouses').insert([warehouse]);
    if (error) console.error("Error adding warehouse:", error);
  };

  const updateWarehouse = async (warehouse: Warehouse) => {
    setWarehouses(prev => prev.map(w => w.id === warehouse.id ? warehouse : w));
    await supabase.from('warehouses').update(warehouse).eq('id', warehouse.id);
  };

  const sendMessage = async (chatId: string, content: string, customSenderId?: string) => {
    const newMessage = {
        id: `msg-${Date.now()}`,
        chatId,
        senderId: customSenderId || currentUser.id,
        content,
        timestamp: new Date().toISOString(),
        type: 'TEXT'
    };
    
    const uiMessage: ChatMessage = newMessage as ChatMessage;

    setMessages(prev => [...prev, uiMessage]);
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastMessage: uiMessage } : c));

    await supabase.from('chat_messages').insert([newMessage]);
    await supabase.from('chats').update({ lastMessage: newMessage }).eq('id', chatId);
  };

  const createChat = async (participantIds: string[], name?: string) => {
      const newChat = {
          id: `chat-${Date.now()}`,
          type: name ? 'GROUP' : 'DIRECT',
          name,
          participantIds: [...participantIds, currentUser.id],
          unreadCount: 0
      };
      
      const uiChat: Chat = newChat as Chat;
      
      setChats(prev => [uiChat, ...prev]);
      const { error } = await supabase.from('chats').insert([newChat]);
      if (error) console.error("Error creating chat:", error);
  };

  const markNotificationRead = async (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllNotificationsRead = async () => {
      setNotifications(prev => prev.map(n => n.userId === currentUser.id ? { ...n, read: true } : n));
      await supabase.from('notifications').update({ read: true }).eq('userId', currentUser.id);
  };

  const clockIn = async (userId: string, type: TimeEntryType, jobId?: string, location?: any) => {
      const newEntry: TimeEntry = {
          id: `te-${Date.now()}`,
          userId,
          type,
          start: new Date().toISOString(),
          jobId,
          location,
          status: TimeSheetStatus.DRAFT
      };
      
      setTimeEntries(prev => [newEntry, ...prev]);
      
      const dbEntry = {
          id: newEntry.id,
          userId: newEntry.userId,
          type: newEntry.type,
          start: newEntry.start,
          jobId: newEntry.jobId,
          location: newEntry.location,
          status: newEntry.status
      };
      await supabase.from('time_entries').insert([dbEntry]);
  };

  const clockOut = async (userId: string, entryId: string, notes?: string) => {
      const end = new Date();
      const entry = timeEntries.find(te => te.id === entryId);
      if (!entry) return;

      const start = new Date(entry.start);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      const updates = { end: end.toISOString(), durationMinutes, notes };

      setTimeEntries(prev => prev.map(te => {
          if (te.id === entryId) {
              return { ...te, ...updates };
          }
          return te;
      }));
      await supabase.from('time_entries').update(updates).eq('id', entryId);
  };

  const addTimeEntry = async (entry: TimeEntry) => {
      setTimeEntries(prev => [...prev, entry]);
      const dbEntry = {
          id: entry.id,
          userId: entry.userId,
          type: entry.type,
          start: entry.start,
          end: entry.end,
          durationMinutes: entry.durationMinutes,
          jobId: entry.jobId,
          notes: entry.notes,
          location: entry.location,
          status: entry.status
      };
      await supabase.from('time_entries').insert([dbEntry]);
  };

  const updateTimeSheetStatus = async (entryIds: string[], status: TimeSheetStatus) => {
      setTimeEntries(prev => prev.map(te => 
          entryIds.includes(te.id) ? { ...te, status } : te
      ));
      for (const id of entryIds) {
          await supabase.from('time_entries').update({ status }).eq('id', id);
      }
  };

  return {
    isAuthenticated,
    darkMode,
    currentUser,
    users,
    clients,
    jobs,
    quotes,
    invoices,
    marketingCampaigns,
    marketingAutomations,
    marketingSegments,
    inventoryProducts,
    inventoryRecords,
    vendors,
    purchaseOrders,
    warehouses,
    chats,
    messages,
    activityLog,
    notifications,
    timeEntries,
    login,
    loginAsDemo,
    signUp,
    logout,
    toggleDarkMode,
    switchUser,
    updateBusinessType,
    addUser,
    addJob,
    assignJob,
    updateJobStatus,
    cancelJob, 
    createInvoice,
    addClient,
    updateClient,
    addQuote,
    updateQuote,
    updateInvoice,
    moveJob,
    unscheduleJob,
    markOnMyWay,
    addCampaign,
    addSegment,
    addProduct,
    updateStock,
    createPO,
    addVendor,
    addWarehouse,
    updateWarehouse,
    sendMessage,
    createChat,
    markNotificationRead,
    markAllNotificationsRead,
    clockIn,
    clockOut,
    addTimeEntry,
    updateTimeSheetStatus
  };
};