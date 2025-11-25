
// ==============================================
// SECTION 2: FULL DATABASE SCHEMA (Types)
// ==============================================

export enum UserRole {
  ADMIN = 'ADMIN',
  OFFICE = 'OFFICE',
  TECHNICIAN = 'TECHNICIAN',
  CLIENT = 'CLIENT',
}

export enum BusinessType {
  MOBILE_DETAILING = 'MOBILE_DETAILING',
  LANDSCAPING = 'LANDSCAPING',
  ROOFING = 'ROOFING',
  CONSTRUCTION = 'CONSTRUCTION',
  HVAC = 'HVAC',
  PLUMBING = 'PLUMBING',
  PRESSURE_WASHING = 'PRESSURE_WASHING',
  CLEANING = 'CLEANING',
  OTHER = 'OTHER'
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

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

// --- TIME SHEET TYPES (NEW) ---

export enum TimeEntryType {
  WORK = 'WORK',
  BREAK = 'BREAK',
  TRAVEL = 'TRAVEL'
}

export enum TimeSheetStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface TimeEntry {
  id: string;
  userId: string;
  jobId?: string; // Optional link to a specific job
  type: TimeEntryType;
  start: string; // ISO String
  end?: string; // ISO String (undefined if currently clocked in)
  durationMinutes?: number; 
  notes?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: TimeSheetStatus;
}

// --- COMMUNICATION TYPES ---

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'TEXT' | 'SYSTEM';
}

export interface Chat {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string; // For groups
  participantIds: string[];
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  jobId?: string;
  type: 'ON_THE_WAY' | 'ARRIVED' | 'COMPLETED' | 'MESSAGE' | 'SYSTEM' | 'CANCELLED';
  description: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'ASSIGNMENT' | 'SYSTEM' | 'ALERT' | 'REMINDER';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  link?: string;
}

// --- INVENTORY MANAGEMENT TYPES ---

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand?: string;
  description?: string;
  unit: string; // e.g., 'ea', 'gal', 'box'
  cost: number;
  price: number;
  minStock: number; // Reorder Point
  trackSerial: boolean;
  image?: string;
  supplierId?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  type: 'WAREHOUSE' | 'VEHICLE';
  assignedUserId?: string; // If vehicle
  address?: string;
}

export interface InventoryRecord {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  binLocation?: string;
  lastUpdated: string;
  lastUpdatedBy?: string; // User ID of who last touched this
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

// --- MARKETING TYPES ---
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  ARCHIVED = 'ARCHIVED'
}

export enum ChannelType {
  EMAIL = 'EMAIL',
  SMS = 'SMS'
}

export interface MarketingCampaign {
  id: string;
  title: string;
  subject?: string; // Email only
  previewText?: string; // Email only
  content: string; // HTML for email, text for SMS
  channel: ChannelType;
  status: CampaignStatus;
  segmentId: string;
  scheduledDate?: string;
  sentDate?: string;
  stats: {
    sent: number;
    delivered: number;
    opened?: number; // Email
    clicked: number;
    replied?: number; // SMS
    bounced: number;
    unsubscribed: number;
  };
  tags: string[];
}

export interface MarketingAutomation {
  id: string;
  title: string;
  trigger: string; // e.g., "Job Completed", "New Lead"
  status: 'ACTIVE' | 'PAUSED';
  steps: number;
  stats: {
    active: number;
    completed: number;
    revenue: number;
  };
}

export interface AudienceSegment {
  id: string;
  name: string;
  type: 'STATIC' | 'DYNAMIC';
  criteria?: string;
  count: number;
  lastUpdated: string;
}

// --- EXISTING INTERFACES ---

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: 'ACTIVE' | 'INVITED'; // NEW: Track invitation status
  businessType?: BusinessType; // Used for logic switching
  businessName?: string; // NEW: Store the actual company name
  industry?: string; // NEW: Store the specific industry string
  avatarUrl: string;
  phone?: string;
  color?: string;
  skills?: string[];
  rating?: number;
  hourlyRate?: number; // NEW: For Payroll calc
  joinDate?: string;
  lat?: number;
  lng?: number;
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

// For Detailing
export interface VehicleDetails {
    make: string;
    model: string;
    year: string;
    color: string;
    type: string;
}

// NEW: For Construction, Roofing, etc.
export interface PropertyDetails {
    homeSizeSqFt?: string;
    homeType?: 'Single Family' | 'Townhouse' | 'Commercial' | 'Apartment' | 'Other';
    stories?: number;
    roofMaterial?: string; // For Roofers
    lotSizeAcres?: string; // For Landscapers
    notes?: string;
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
  vehicleDetails?: VehicleDetails; // Used if businessType === MOBILE_DETAILING
  propertyDetails?: PropertyDetails; // Used for other business types
  items: LineItem[];
  checklists: ChecklistItem[];
  photos: JobPhoto[];
  notes?: string;
  onMyWayBy?: string; // User ID of who is on the way
  cancellationReason?: string; // Reason if cancelled
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