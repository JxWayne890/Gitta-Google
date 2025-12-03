
// ==============================================
// SECTION 2: FULL DATABASE SCHEMA (Types)
// ==============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  OFFICE = 'OFFICE',
  TECHNICIAN = 'TECHNICIAN',
  CLIENT = 'CLIENT',
}

export type PayrollType = 'HOURLY' | 'COMMISSION' | 'DAILY_RATE';

export enum JobStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type PipelineStage = 
  | 'LEAD' 
  | 'ESTIMATE_SENT' 
  | 'APPROVED' 
  | 'SCHEDULED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'INVOICED' 
  | 'PAID' 
  | 'ON_HOLD';

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  CONVERTED = 'CONVERTED'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  BAD_DEBT = 'BAD_DEBT'
}

export interface ActivityLogItem {
  id: string;
  userId: string;
  type: 'ARRIVED' | 'COMPLETED' | 'STARTED' | 'CREATED' | 'UPDATED' | 'NOTE';
  description: string;
  timestamp: string;
  jobId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

// --- COMMUNICATION TYPES ---
export type ChatType = 'DIRECT' | 'GROUP';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: string;
  readBy: string[];
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  participantIds: string[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

// --- INVENTORY MANAGEMENT TYPES ---

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand?: string;
  description?: string;
  unit: string;
  cost: number;
  price: number;
  minStock: number;
  trackSerial: boolean;
  image?: string;
  supplierId?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  type: 'WAREHOUSE' | 'VEHICLE';
  assignedUserId?: string;
  address?: string;
}

export interface InventoryRecord {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  binLocation?: string;
  lastUpdated: string;
  lastUpdatedBy?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  paymentTerms?: string;
}

export enum POStatus {
  DRAFT = 'DRAFT',
  ORDERED = 'ORDERED',
  PARTIAL = 'PARTIAL',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED'
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  status: POStatus;
  orderDate: string;
  expectedDate?: string;
  items: { productId: string; quantity: number; cost: number }[];
  total: number;
  notes?: string;
}

// --- TIMESHEET TYPES ---
export enum TimeEntryType {
  JOB = 'JOB',
  TRAVEL = 'TRAVEL',
  BREAK = 'BREAK',
  ADMIN = 'ADMIN'
}

export enum TimeEntryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface TimeEntry {
  id: string;
  userId: string;
  type: TimeEntryType;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  jobId?: string;
  notes?: string;
  status: TimeEntryStatus;
  gpsLocation?: { lat: number; lng: number; address: string };
}

export interface TimeOffRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  type: 'VACATION' | 'SICK' | 'PERSONAL';
}

// --- MARKETING TYPES ---
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED'
}

export enum ChannelType {
  EMAIL = 'EMAIL',
  SMS = 'SMS'
}

export interface MarketingCampaign {
  id: string; 
  companyId?: string;
  title: string;
  subject?: string;
  previewText?: string;
  fromName?: string;
  content: string; 
  channel: ChannelType;
  status: CampaignStatus;
  segmentId: string;
  targetClientIds?: string[]; // New field for individual selection
  scheduledDate?: string;
  sentDate?: string;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied?: number;
    bounced: number;
    unsubscribed: number;
  };
  tags: string[];
}

export interface EmailLog {
  id: string;
  campaignId: string;
  resendMessageId: string;
  toEmail: string;
  status: 'sent' | 'delivered' | 'bounced' | 'complained';
  opened: boolean;
  clicked: boolean;
  timestamp: string;
}

export type AutomationTriggerType = 
  | 'CUSTOMER_CREATED' 
  | 'JOB_COMPLETED' 
  | 'INVOICE_SENT' 
  | 'JOB_DECLINED';

export type AutomationActionType = 
  | 'SEND_EMAIL' 
  | 'ADD_TAG' 
  | 'UPDATE_NOTES' 
  | 'MOVE_SEGMENT';

export interface AutomationAction {
  type: AutomationActionType;
  config: {
    templateId?: string; 
    emailBody?: string;
    emailSubject?: string;
    tagName?: string;
    segmentId?: string;
    noteText?: string;
  };
}

export interface MarketingAutomation {
  id: string;
  title: string;
  trigger: AutomationTriggerType;
  triggerConfig?: any;
  actions: AutomationAction[];
  status: 'ACTIVE' | 'PAUSED';
  stats: {
    active: number;
    completed: number;
    revenue: number;
  };
  steps?: number;
}

export interface AutomationRun {
  id: string;
  automationId: string;
  triggerType: string;
  payload: any;
  result: string;
  ranAt: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  type: 'STATIC' | 'DYNAMIC';
  criteria?: string;
  count: number;
  lastUpdated: string;
}

// --- NEW ONBOARDING TYPES ---

export interface JobTemplate {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  defaultDurationMinutes: number;
  category?: string;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  companyCode?: string;
  taxRate: number;
  taxName?: string;
  currency: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  lowStockThreshold: number;
  enableAutoInvoice: boolean;
  smsTemplateOnMyWay: string;
  serviceCategories?: string[];
  paymentMethods?: string[];
  defaultDepositRate?: number;
  brandColors?: { primary: string; secondary: string };
  messageTemplates?: Record<string, string>;
  onboardingStep?: number;
}

export interface User {
  id: string;
  companyId: string;
  companyCode?: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  phone?: string;
  color?: string;
  skills?: string[];
  rating?: number;
  joinDate?: string;
  lat?: number;
  lng?: number;
  onboardingComplete: boolean;
  enableTimesheets: boolean;
  payrollType: PayrollType;
  payRate: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
}

export interface Property {
  id: string;
  clientId: string;
  address: Address;
  accessInstructions?: string;
}

export interface VehicleDetails {
    make: string;
    model: string;
    year: string;
    color: string;
    type: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phone: string;
  billingAddress: Address;
  properties: Property[];
  tags: string[];
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  isCompleted: boolean;
}

export interface JobPhoto {
    id: string;
    url: string;
    uploadedAt: string;
}

export interface Job {
  id: string;
  clientId: string;
  propertyId: string;
  assignedTechIds: string[];
  title: string;
  description: string;
  start: string;
  end: string;
  status: JobStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  vehicleDetails?: VehicleDetails;
  items: LineItem[];
  checklists: ChecklistItem[];
  photos: JobPhoto[];
  notes?: string;
  pipelineStage?: PipelineStage;
}

export interface Quote {
  id: string;
  clientId: string;
  propertyId: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: QuoteStatus;
  issuedDate: string;
  expiryDate: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'CREDIT_CARD' | 'CASH' | 'CHECK' | 'TRANSFER';
  date: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  jobId?: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  balanceDue: number;
  status: InvoiceStatus;
  dueDate: string;
  issuedDate: string;
  payments: Payment[];
}
