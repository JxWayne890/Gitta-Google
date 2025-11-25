
import {
  User,
  UserRole,
  Client,
  Job,
  JobStatus,
  Quote,
  QuoteStatus,
  Invoice,
  InvoiceStatus,
  Property,
  VehicleDetails,
  MarketingCampaign,
  MarketingAutomation,
  AudienceSegment,
  ChannelType,
  CampaignStatus,
  InventoryProduct,
  Warehouse,
  InventoryRecord,
  Vendor,
  PurchaseOrder,
  POStatus,
  Chat,
  ChatMessage,
  ActivityLog,
  TimeEntry,
  TimeEntryType,
  TimeSheetStatus
} from './types';

// ==============================================
// SECTION 3: MOCK DATA GENERATOR
// ==============================================

const TECH_NAMES = [
  { name: 'Elijah Johnson', color: 'rose', skills: ['Ceramic Coating', 'Paint Correction', 'Management'] },
  { name: 'Marcus Detail', color: 'blue', skills: ['Interior Specialist', 'Upholstery', 'Steam Clean'] },
  { name: 'Sarah Shine', color: 'amber', skills: ['Exterior Wash', 'Waxing', 'Polishing'] },
  { name: 'David Buff', color: 'emerald', skills: ['Detailing', 'Engine Bay', 'Headlight Resto'] },
];

const CLIENT_NAMES = [
  ['John', 'Doe'],
  ['Sarah', 'Connor'],
  ['Walter', 'White'],
  ['Bruce', 'Wayne'],
  ['Diana', 'Prince'],
  ['Peter', 'Parker'],
  ['Tony', 'Stark'],
  ['Clark', 'Kent'],
  ['Natasha', 'Romanoff'],
  ['Steve', 'Rogers'],
];

const JOB_TITLES = [
  'Full Interior Detail',
  'Exterior Wash & Wax',
  'Ceramic Coating - Gold Package',
  'Headlight Restoration',
  'Engine Bay Cleaning',
  'Odor Removal Treatment',
  'Fleet Wash - 3 Vehicles',
  'Paint Correction Stage 1',
  'Maintenance Wash',
  'Leather Conditioning Treatment',
];

const VEHICLES: VehicleDetails[] = [
  { make: 'Tesla', model: 'Model 3', year: '2022', color: 'Pearl White', type: 'Sedan' },
  { make: 'Ford', model: 'F-150 Raptor', year: '2021', color: 'Matte Black', type: 'Truck' },
  { make: 'Porsche', model: '911 GT3', year: '2023', color: 'Shark Blue', type: 'Coupe' },
  { make: 'Toyota', model: 'Sienna', year: '2020', color: 'Silver', type: 'Van' },
  { make: 'Range Rover', model: 'Sport', year: '2024', color: 'Black', type: 'SUV' },
  { make: 'BMW', model: 'M4', year: '2021', color: 'Isle of Man Green', type: 'Coupe' },
  { make: 'Mercedes', model: 'G-Wagon', year: '2022', color: 'Matte Olive', type: 'SUV' },
];

// Lubbock, TX Coordinates approx: 33.5779, -101.8552
const ADDRESSES = [
  { street: '2500 Broadway', city: 'Lubbock', state: 'TX', zip: '79401', lat: 33.5843, lng: -101.8737 }, // Near Tech
  { street: '5001 Chicago Ave', city: 'Lubbock', state: 'TX', zip: '79414', lat: 33.5620, lng: -101.9380 }, // Residential
  { street: '8201 Quaker Ave', city: 'Lubbock', state: 'TX', zip: '79424', lat: 33.5180, lng: -101.9050 }, // South Lubbock
  { street: '1900 34th St', city: 'Lubbock', state: 'TX', zip: '79411', lat: 33.5660, lng: -101.8600 }, // Mid-city
  { street: '112 University Ave', city: 'Lubbock', state: 'TX', zip: '79415', lat: 33.5880, lng: -101.8700 }, // North Overton
  { street: '301 19th St', city: 'Lubbock', state: 'TX', zip: '79401', lat: 33.5790, lng: -101.8400 }, // Downtown
  { street: '6600 Milwaukee Ave', city: 'Lubbock', state: 'TX', zip: '79424', lat: 33.5400, lng: -101.9500 }, // Far West
  { street: '4000 4th St', city: 'Lubbock', state: 'TX', zip: '79416', lat: 33.5930, lng: -101.8900 }, // Medical District
];

// Helpers
const randomId = () => Math.random().toString(36).substr(2, 9);
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// 1. Users
export const mockUsers: User[] = [
  {
    id: 'admin-1',
    name: 'Elijah Johnson (Owner)',
    email: 'elijah@gittajob.com',
    role: UserRole.ADMIN,
    avatarUrl: 'https://i.pravatar.cc/150?u=admin-1',
    color: 'rose',
    joinDate: '2020-01-15',
    lat: 33.5779,
    lng: -101.8552,
    hourlyRate: 65
  },
  ...TECH_NAMES.slice(1).map((tech, i) => ({
    id: `tech-${i}`,
    name: tech.name,
    email: `${tech.name.split(' ')[0].toLowerCase()}@gittajob.com`,
    role: UserRole.TECHNICIAN,
    avatarUrl: `https://i.pravatar.cc/150?u=tech-${i}`,
    phone: '806-555-010' + i,
    color: tech.color,
    skills: tech.skills,
    rating: 4.5 + (Math.random() * 0.5), 
    joinDate: new Date(Date.now() - Math.random() * 100000000000).toISOString().split('T')[0],
    lat: 33.5779 + (Math.random() * 0.04 - 0.02),
    lng: -101.8552 + (Math.random() * 0.04 - 0.02),
    hourlyRate: 25 + (i * 5)
  })),
];

// 2. Clients
export const mockClients: Client[] = CLIENT_NAMES.map((names, i) => {
  const clientId = `client-${i}`;
  const addressTemplate = ADDRESSES[i % ADDRESSES.length];
  const lat = addressTemplate.lat + (Math.random() * 0.002 - 0.001);
  const lng = addressTemplate.lng + (Math.random() * 0.002 - 0.001);

  const properties: Property[] = [
    {
      id: `prop-${i}-1`,
      clientId,
      address: { ...addressTemplate, lat, lng },
      accessInstructions: 'Please park in driveway, water spigot on left side.',
    },
  ];
  return {
    id: clientId,
    firstName: names[0],
    lastName: names[1],
    email: `${names[0].toLowerCase()}.${names[1].toLowerCase()}@example.com`,
    phone: `806-555-${1000 + i}`,
    billingAddress: properties[0].address,
    properties,
    tags: i % 2 === 0 ? ['VIP Member'] : ['Referral', 'One-off'],
    createdAt: new Date().toISOString(),
  };
});

// 3. Jobs
export const mockJobs: Job[] = Array.from({ length: 20 }).map((_, i) => {
  const client = randomItem(mockClients);
  const tech = randomItem(mockUsers.filter((u) => u.role === UserRole.TECHNICIAN));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + (i - 5));
  startDate.setHours(8 + Math.floor(Math.random() * 8), 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);

  const vehicle = randomItem(VEHICLES);

  return {
    id: `job-${i}`,
    clientId: client.id,
    propertyId: client.properties[0].id,
    assignedTechIds: [tech.id],
    title: randomItem(JOB_TITLES),
    description: 'Standard mobile detailing service.',
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    status: i < 5 ? JobStatus.COMPLETED : i < 8 ? JobStatus.IN_PROGRESS : JobStatus.SCHEDULED,
    priority: 'MEDIUM',
    vehicleDetails: vehicle,
    items: [
      { id: randomId(), description: 'Mobile Detail Service', quantity: 1, unitPrice: 200, total: 200 },
    ],
    checklists: [],
    photos: [],
    notes: 'Gate code is 1234',
  };
});

// 4. Quotes
export const mockQuotes: Quote[] = Array.from({ length: 5 }).map((_, i) => {
  const client = randomItem(mockClients);
  return {
    id: `quote-${i}`,
    clientId: client.id,
    propertyId: client.properties[0].id,
    items: [{ id: randomId(), description: 'Estimate', quantity: 1, unitPrice: 500, total: 500 }],
    subtotal: 500,
    tax: 0,
    total: 500,
    status: QuoteStatus.SENT,
    issuedDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
  };
});

// 5. Invoices
export const mockInvoices: Invoice[] = Array.from({ length: 10 }).map((_, i) => {
    const client = randomItem(mockClients);
    return {
        id: `inv-${i}`,
        clientId: client.id,
        items: [{ id: `item-${i}`, description: 'Service', quantity: 1, unitPrice: 200, total: 200 }],
        subtotal: 200,
        tax: 16,
        total: 216,
        balanceDue: i % 2 === 0 ? 0 : 216,
        status: i % 2 === 0 ? InvoiceStatus.PAID : InvoiceStatus.SENT,
        dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
        issuedDate: new Date().toISOString(),
        payments: i % 2 === 0 ? [{ id: `pay-${i}`, invoiceId: `inv-${i}`, amount: 216, method: 'CREDIT_CARD', date: new Date().toISOString() }] : [],
    };
});


// --- MARKETING DATA ---

export const mockSegments: AudienceSegment[] = [
  { id: 'seg-1', name: 'All Clients', type: 'DYNAMIC', count: 1450, lastUpdated: 'Today' },
  { id: 'seg-2', name: 'VIP Members', type: 'STATIC', count: 230, criteria: 'Spent > $1000', lastUpdated: 'Yesterday' },
  { id: 'seg-3', name: 'Inactive > 90 Days', type: 'DYNAMIC', count: 540, criteria: 'Last Service > 90d', lastUpdated: 'Today' },
  { id: 'seg-4', name: 'New Leads (No Service)', type: 'DYNAMIC', count: 85, criteria: 'Jobs = 0', lastUpdated: '2 hrs ago' },
  { id: 'seg-5', name: 'Ceramic Coating Interest', type: 'STATIC', count: 42, criteria: 'Tag: Ceramic Interest', lastUpdated: '3 days ago' }
];

export const mockCampaigns: MarketingCampaign[] = [
  {
    id: 'camp-1',
    title: 'September Special - 20% Off',
    subject: 'Get your car shine back! 🚗',
    previewText: 'Exclusive offer for our loyal customers inside...',
    content: '<html>...</html>',
    channel: ChannelType.EMAIL,
    status: CampaignStatus.SENT,
    segmentId: 'seg-1',
    sentDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    stats: { sent: 1450, delivered: 1420, opened: 850, clicked: 210, bounced: 30, unsubscribed: 5 },
    tags: ['Promo', 'Monthly']
  },
  {
    id: 'camp-2',
    title: 'Winter Prep Reminder',
    content: 'Hey {{firstName}}, winter is coming! Book your protective wax today to save your paint from salt/snow. Reply YES to book.',
    channel: ChannelType.SMS,
    status: CampaignStatus.SENT,
    segmentId: 'seg-2',
    sentDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    stats: { sent: 230, delivered: 228, clicked: 45, replied: 18, bounced: 2, unsubscribed: 1 },
    tags: ['Seasonal', 'Reminder']
  },
  {
    id: 'camp-3',
    title: 'Review Request Blast',
    subject: 'How did we do?',
    previewText: 'We would love your feedback!',
    content: '<html>...</html>',
    channel: ChannelType.EMAIL,
    status: CampaignStatus.SCHEDULED,
    segmentId: 'seg-1',
    scheduledDate: new Date(Date.now() + 86400000 * 1).toISOString(), // Tomorrow
    stats: { sent: 0, delivered: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
    tags: ['Reviews']
  },
  {
    id: 'camp-4',
    title: 'Flash Sale - This Weekend',
    content: 'Flash Sale! ⚡ $50 off Full Details this weekend only. Call 806-555-0100 to claim.',
    channel: ChannelType.SMS,
    status: CampaignStatus.DRAFT,
    segmentId: 'seg-3',
    stats: { sent: 0, delivered: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
    tags: ['Promo']
  }
];

export const mockAutomations: MarketingAutomation[] = [
  {
    id: 'auto-1',
    title: 'New Lead Welcome Series',
    trigger: 'New Client Created',
    status: 'ACTIVE',
    steps: 3,
    stats: { active: 12, completed: 450, revenue: 12500 }
  },
  {
    id: 'auto-2',
    title: 'Post-Service Review Request',
    trigger: 'Job Completed',
    status: 'ACTIVE',
    steps: 2,
    stats: { active: 5, completed: 1200, revenue: 0 }
  },
  {
    id: 'auto-3',
    title: 'Win-Back: 6 Months Inactive',
    trigger: 'Inactive 180 Days',
    status: 'PAUSED',
    steps: 1,
    stats: { active: 0, completed: 150, revenue: 3200 }
  }
];

// --- INVENTORY MOCK DATA ---

export const mockVendors: Vendor[] = [
  { id: 'ven-1', name: 'AutoDetail Supply Co.', email: 'orders@autodetailsupply.com', phone: '800-555-0199', contactPerson: 'Mike Smith' },
  { id: 'ven-2', name: 'ChemGuys Wholesale', email: 'wholesale@chemguys.com', phone: '800-555-0122', contactPerson: 'Sarah Jones', paymentTerms: 'Net 30' },
  { id: 'ven-3', name: 'Local Hardware', email: 'biz@localhardware.com', phone: '806-555-0900', contactPerson: 'Tom' },
];

export const mockWarehouses: Warehouse[] = [
  { id: 'wh-1', name: 'Main Warehouse', type: 'WAREHOUSE', address: '1234 Warehouse Row, Lubbock TX' },
  { id: 'wh-2', name: 'Tech Van 1', type: 'VEHICLE', assignedUserId: 'tech-0' },
  { id: 'wh-3', name: 'Tech Truck 2', type: 'VEHICLE', assignedUserId: 'tech-1' },
  { id: 'wh-4', name: 'Tech Vehicle 3', type: 'VEHICLE', assignedUserId: 'tech-2' },
];

export const mockProducts: InventoryProduct[] = [
  { id: 'prod-1', sku: 'CC-KIT-001', name: 'Ceramic Coating Kit (Gold)', category: 'Protection', brand: 'ShieldPro', unit: 'Kit', cost: 85.00, price: 250.00, minStock: 5, trackSerial: true, supplierId: 'ven-1' },
  { id: 'prod-2', sku: 'MF-TWL-50', name: 'Microfiber Towels (50pk)', category: 'Consumables', brand: 'SoftTouch', unit: 'Pack', cost: 25.00, price: 45.00, minStock: 10, trackSerial: false, supplierId: 'ven-1' },
  { id: 'prod-3', sku: 'SOAP-GAL', name: 'Ultra Foam Soap (1 Gal)', category: 'Chemicals', brand: 'ChemGuys', unit: 'Gallon', cost: 18.50, price: 35.00, minStock: 8, trackSerial: false, supplierId: 'ven-2' },
  { id: 'prod-4', sku: 'WAX-PASTE', name: 'Carnauba Paste Wax', category: 'Chemicals', brand: 'ShineMaster', unit: 'Tin', cost: 12.00, price: 29.99, minStock: 15, trackSerial: false, supplierId: 'ven-2' },
  { id: 'prod-5', sku: 'TIRE-SHINE', name: 'High Gloss Tire Shine', category: 'Chemicals', brand: 'ChemGuys', unit: 'Gallon', cost: 22.00, price: 45.00, minStock: 5, trackSerial: false, supplierId: 'ven-2' },
  { id: 'prod-6', sku: 'PAD-FOAM-6', name: '6" Foam Polishing Pad', category: 'Tools', brand: 'BuffMaster', unit: 'Each', cost: 8.50, price: 15.00, minStock: 20, trackSerial: false, supplierId: 'ven-1' },
];

export const mockInventoryRecords: InventoryRecord[] = [
  // Main Warehouse Stock
  { id: 'rec-1', productId: 'prod-1', warehouseId: 'wh-1', quantity: 12, binLocation: 'A-01', lastUpdated: '2023-10-01', lastUpdatedBy: 'admin-1' },
  { id: 'rec-2', productId: 'prod-2', warehouseId: 'wh-1', quantity: 45, binLocation: 'B-02', lastUpdated: '2023-10-01', lastUpdatedBy: 'admin-1' },
  { id: 'rec-3', productId: 'prod-3', warehouseId: 'wh-1', quantity: 20, binLocation: 'C-05', lastUpdated: '2023-10-02', lastUpdatedBy: 'admin-1' },
  { id: 'rec-4', productId: 'prod-6', warehouseId: 'wh-1', quantity: 100, binLocation: 'D-10', lastUpdated: '2023-09-28', lastUpdatedBy: 'admin-1' },
  
  // Van 1 Stock
  { id: 'rec-5', productId: 'prod-1', warehouseId: 'wh-2', quantity: 1, lastUpdated: '2023-10-05', lastUpdatedBy: 'tech-0' },
  { id: 'rec-6', productId: 'prod-3', warehouseId: 'wh-2', quantity: 2, lastUpdated: '2023-10-05', lastUpdatedBy: 'tech-0' },
  { id: 'rec-7', productId: 'prod-2', warehouseId: 'wh-2', quantity: 2, lastUpdated: '2023-10-05', lastUpdatedBy: 'tech-0' },

  // Van 2 Stock
  { id: 'rec-8', productId: 'prod-3', warehouseId: 'wh-3', quantity: 1, lastUpdated: '2023-10-04', lastUpdatedBy: 'tech-1' },
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO-1001',
    vendorId: 'ven-1',
    status: POStatus.RECEIVED,
    orderDate: '2023-09-15',
    total: 450.00,
    items: [
      { productId: 'prod-1', quantity: 5, cost: 85.00 },
      { productId: 'prod-2', quantity: 1, cost: 25.00 }
    ]
  },
  {
    id: 'PO-1002',
    vendorId: 'ven-2',
    status: POStatus.ORDERED,
    orderDate: '2023-10-01',
    expectedDate: '2023-10-10',
    total: 320.50,
    items: [
      { productId: 'prod-3', quantity: 10, cost: 18.50 },
      { productId: 'prod-5', quantity: 5, cost: 22.00 },
      { productId: 'prod-4', quantity: 2, cost: 12.75 }
    ]
  },
  {
    id: 'PO-1003',
    vendorId: 'ven-1',
    status: POStatus.DRAFT,
    orderDate: '2023-10-05',
    total: 0,
    items: []
  }
];

// --- COMMUNICATION DATA ---

export const mockChats: Chat[] = [
  {
    id: 'chat-general',
    type: 'GROUP',
    name: 'General Team',
    participantIds: ['admin-1', 'tech-0', 'tech-1', 'tech-2', 'tech-3'],
    lastMessage: {
      id: 'msg-1',
      chatId: 'chat-general',
      senderId: 'admin-1',
      content: 'Remember to check tire pressure on all vans this week!',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      type: 'TEXT'
    },
    unreadCount: 0
  },
  {
    id: 'chat-1',
    type: 'DIRECT',
    participantIds: ['admin-1', 'tech-0'],
    lastMessage: {
      id: 'msg-2',
      chatId: 'chat-1',
      senderId: 'tech-0',
      content: 'I need some more wax for the truck.',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      type: 'TEXT'
    },
    unreadCount: 1
  }
];

export const mockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    chatId: 'chat-general',
    senderId: 'admin-1',
    content: 'Remember to check tire pressure on all vans this week!',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: 'TEXT'
  },
  {
    id: 'msg-2',
    chatId: 'chat-1',
    senderId: 'tech-0',
    content: 'I need some more wax for the truck.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    type: 'TEXT'
  }
];

export const mockActivityLog: ActivityLog[] = [
  {
    id: 'act-1',
    userId: 'tech-0',
    jobId: 'job-6',
    type: 'ON_THE_WAY',
    description: 'Marcus is on the way to Fleet Wash',
    timestamp: new Date(Date.now() - 1800000).toISOString() // 30 mins ago
  },
  {
    id: 'act-2',
    userId: 'tech-1',
    jobId: 'job-7',
    type: 'ARRIVED',
    description: 'Sarah started working on Paint Correction',
    timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 'act-3',
    userId: 'tech-2',
    jobId: 'job-8',
    type: 'COMPLETED',
    description: 'David finished Odor Removal',
    timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  }
];

// --- TIME SHEET DATA ---

export const mockTimeEntries: TimeEntry[] = [
  // Entries for Tech 0 (Marcus)
  {
    id: 'te-1',
    userId: 'tech-0',
    type: TimeEntryType.WORK,
    start: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
    durationMinutes: 240,
    status: TimeSheetStatus.APPROVED,
    location: { lat: 33.5779, lng: -101.8552, address: 'HQ' }
  },
  {
    id: 'te-2',
    userId: 'tech-0',
    type: TimeEntryType.BREAK,
    start: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
    durationMinutes: 30,
    status: TimeSheetStatus.APPROVED
  },
  {
    id: 'te-3',
    userId: 'tech-0',
    type: TimeEntryType.WORK,
    start: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
    end: undefined, // Currently clocked in
    status: TimeSheetStatus.DRAFT,
    location: { lat: 33.5843, lng: -101.8737, address: '2500 Broadway' }
  },
  // Entries for Tech 1 (Sarah) - Past day
  {
    id: 'te-4',
    userId: 'tech-1',
    type: TimeEntryType.WORK,
    start: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Yesterday
    end: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    durationMinutes: 480, // 8 hours
    status: TimeSheetStatus.SUBMITTED
  }
];
