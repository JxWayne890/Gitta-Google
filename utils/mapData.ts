
// Mock Data for Map Implementation

export interface MapTech {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'Active' | 'Idle' | 'Offline';
  avatar: string;
  currentJob?: string;
  nextJob?: string;
  lastUpdated: string;
}

export interface MapJob {
  id: string;
  title: string;
  lat: number;
  lng: number;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  address: string;
  technicianName?: string;
  technicianAvatar?: string;
  scheduledStart: string;
  scheduledEnd: string;
  description: string;
  serviceType: string;
}

export const mapTechs: MapTech[] = [
  {
    id: "t1",
    name: "Elijah Johnson",
    lat: 39.7817,
    lng: -89.6501,
    status: "Active",
    avatar: "https://i.pravatar.cc/150?u=admin-1",
    currentJob: "Full Interior Detail",
    nextJob: "Ceramic Coating",
    lastUpdated: "2 mins ago"
  },
  {
    id: "t2",
    name: "Marcus Detail",
    lat: 39.7950,
    lng: -89.6450,
    status: "Active",
    avatar: "https://i.pravatar.cc/150?u=tech-0",
    currentJob: "Exterior Wash",
    lastUpdated: "5 mins ago"
  },
  {
    id: "t3",
    name: "Sarah Shine",
    lat: 39.7700,
    lng: -89.6600,
    status: "Idle",
    avatar: "https://i.pravatar.cc/150?u=tech-1",
    lastUpdated: "15 mins ago"
  },
  {
    id: "t4",
    name: "David Buff",
    lat: 39.8000,
    lng: -89.6300,
    status: "Active",
    avatar: "https://i.pravatar.cc/150?u=tech-2",
    currentJob: "Headlight Restoration",
    lastUpdated: "1 min ago"
  },
  {
    id: "t5",
    name: "Alex Gloss",
    lat: 39.7600,
    lng: -89.6700,
    status: "Offline",
    avatar: "https://i.pravatar.cc/150?u=tech-3",
    lastUpdated: "2 hours ago"
  },
  {
    id: "t6",
    name: "Jenny Polish",
    lat: 39.7850,
    lng: -89.6200,
    status: "Active",
    avatar: "https://i.pravatar.cc/150?u=tech-4",
    currentJob: "Fleet Wash",
    lastUpdated: "Just now"
  }
];

export const mapJobs: MapJob[] = [
  {
    id: "j1",
    title: "Full Interior Detail",
    lat: 39.7820,
    lng: -89.6480,
    status: "In Progress",
    address: "123 Maple Ave",
    technicianName: "Elijah Johnson",
    technicianAvatar: "https://i.pravatar.cc/150?u=admin-1",
    scheduledStart: "09:00 AM",
    scheduledEnd: "11:30 AM",
    description: "Deep clean of all interior surfaces.",
    serviceType: "Detailing"
  },
  {
    id: "j2",
    title: "Exterior Wash & Wax",
    lat: 39.7920,
    lng: -89.6420,
    status: "Scheduled",
    address: "742 Evergreen Terr",
    technicianName: "Marcus Detail",
    technicianAvatar: "https://i.pravatar.cc/150?u=tech-0",
    scheduledStart: "01:00 PM",
    scheduledEnd: "02:30 PM",
    description: "Standard wash with premium wax application.",
    serviceType: "Wash"
  },
  {
    id: "j3",
    title: "Ceramic Coating",
    lat: 39.7680,
    lng: -89.6580,
    status: "Scheduled",
    address: "101 Cherry Ln",
    scheduledStart: "10:00 AM",
    scheduledEnd: "04:00 PM",
    description: "Full vehicle protection package.",
    serviceType: "Coating"
  },
  {
    id: "j4",
    title: "Headlight Restoration",
    lat: 39.8020,
    lng: -89.6280,
    status: "In Progress",
    address: "55 Oak St",
    technicianName: "David Buff",
    technicianAvatar: "https://i.pravatar.cc/150?u=tech-2",
    scheduledStart: "11:00 AM",
    scheduledEnd: "12:00 PM",
    description: "Restore clarity to foggy headlights.",
    serviceType: "Restoration"
  },
  {
    id: "j5",
    title: "Engine Bay Cleaning",
    lat: 39.7580,
    lng: -89.6720,
    status: "Completed",
    address: "88 Pine Rd",
    technicianName: "Elijah Johnson",
    technicianAvatar: "https://i.pravatar.cc/150?u=admin-1",
    scheduledStart: "08:00 AM",
    scheduledEnd: "08:45 AM",
    description: "Degrease and dress engine bay.",
    serviceType: "Cleaning"
  },
  {
    id: "j6",
    title: "Fleet Wash (x3)",
    lat: 39.7870,
    lng: -89.6220,
    status: "Scheduled",
    address: "Industiral Park Dr",
    technicianName: "Jenny Polish",
    technicianAvatar: "https://i.pravatar.cc/150?u=tech-4",
    scheduledStart: "02:00 PM",
    scheduledEnd: "05:00 PM",
    description: "Wash 3 delivery vans.",
    serviceType: "Fleet"
  },
  {
    id: "j7",
    title: "Paint Correction",
    lat: 39.7750,
    lng: -89.6350,
    status: "Scheduled",
    address: "404 Error Way",
    scheduledStart: "09:00 AM",
    scheduledEnd: "03:00 PM",
    description: "Two-step correction.",
    serviceType: "Detailing"
  },
  {
    id: "j8",
    title: "Odor Removal",
    lat: 39.7900,
    lng: -89.6650,
    status: "Completed",
    address: "202 Success Blvd",
    technicianName: "Marcus Detail",
    technicianAvatar: "https://i.pravatar.cc/150?u=tech-0",
    scheduledStart: "08:30 AM",
    scheduledEnd: "09:30 AM",
    description: "Ozone treatment.",
    serviceType: "Specialty"
  },
  {
    id: "j9",
    title: "Mold Remediation",
    lat: 39.7650,
    lng: -89.6450,
    status: "Scheduled",
    address: "13 Elm St",
    scheduledStart: "10:00 AM",
    scheduledEnd: "01:00 PM",
    description: "Hazardous material cleanup.",
    serviceType: "Restoration"
  },
  {
    id: "j10",
    title: "Show Car Prep",
    lat: 39.7980,
    lng: -89.6380,
    status: "In Progress",
    address: "1 Museum Dr",
    scheduledStart: "08:00 AM",
    scheduledEnd: "05:00 PM",
    description: "Concours preparation.",
    serviceType: "Detailing"
  }
];
