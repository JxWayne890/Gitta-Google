
import React, { useState, useMemo, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Job, Client, JobStatus, BusinessType } from '../types';
import { Calendar, MapPin, User, Plus, ChevronRight, Clock, AlertCircle, Filter, Car, XCircle, UserPlus, Home, Ruler, FileText } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { StoreContext } from '../store';

interface JobsListProps {
  jobs: Job[];
  clients: Client[];
  onAddJob: (job: Job) => void;
  onAddClient: (client: Client) => void;
}

type JobFilter = 'ALL' | 'ACTIVE' | 'DRAFTS' | 'COMPLETED' | 'HIGH_PRIORITY' | 'CANCELLED';

export const JobsList: React.FC<JobsListProps> = ({ jobs, clients, onAddJob, onAddClient }) => {
  const store = useContext(StoreContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<JobFilter>('ALL');
  
  // Use the specific business type from the user if available
  const userBusinessType = store?.currentUser.businessType || BusinessType.MOBILE_DETAILING;
  const isVehicleBusiness = userBusinessType === BusinessType.MOBILE_DETAILING;
  // If not detailing, default to property logic
  const isPropertyBusiness = !isVehicleBusiness; 

  const [formData, setFormData] = useState({
      clientId: '',
      title: '',
      description: '',
      date: '',
      time: '09:00',
      // Vehicle Data
      carYear: '',
      carMake: '',
      carModel: '',
      carColor: '',
      // Property Data
      homeSizeSqFt: '',
      homeType: 'Single Family',
      roofMaterial: '',
      notes: ''
  });

  // --- CLIENT CREATION STATE ---
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientFormData, setClientFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
      street: '',
      city: '',
      state: '',
      zip: ''
  });

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'ACTIVE') return job.status === JobStatus.SCHEDULED || job.status === JobStatus.IN_PROGRESS;
        if (activeFilter === 'DRAFTS') return job.status === JobStatus.DRAFT;
        if (activeFilter === 'COMPLETED') return job.status === JobStatus.COMPLETED;
        if (activeFilter === 'HIGH_PRIORITY') return job.priority === 'HIGH';
        if (activeFilter === 'CANCELLED') return job.status === JobStatus.CANCELLED;
        return true;
    });
  }, [jobs, activeFilter]);

  const groupedCancelledJobs = useMemo<Record<string, Job[]>>(() => {
      if (activeFilter !== 'CANCELLED') return {};
      const groups: Record<string, Job[]> = {};
      filteredJobs.forEach(job => {
          const reason = job.cancellationReason || 'Unspecified';
          let category = reason.split(':')[0].trim();
          if (!groups[category]) groups[category] = [];
          groups[category].push(job);
      });
      return groups;
  }, [filteredJobs, activeFilter]);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'DRAFT': return 'bg-slate-100 text-slate-600 border-slate-200 border-dashed dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default: return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600';
    }
  };

  const renderJobCard = (job: Job, index: number) => {
      const client = clients.find((c) => c.id === job.clientId);
      const statusStyle = getStatusStyles(job.status);
      const totalValue = job.items.reduce((acc, i) => acc + i.total, 0);
      const isEven = index % 2 === 0;

      return (
        <Link
            to={`/jobs/${job.id}`}
            key={job.id}
            className={`block p-5 transition-all duration-200 group border-b border-slate-100 dark:border-slate-700 last:border-0 ${isEven ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}
        >
            <div className="flex items-start justify-between gap-4">
            
                {/* Date Box - Desktop Only */}
                <div className={`hidden md:flex flex-col items-center justify-center w-14 h-14 rounded-xl border shrink-0 ${job.priority === 'HIGH' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}>
                    <span className="text-xs font-semibold uppercase">{new Date(job.start).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl font-bold">{new Date(job.start).getDate()}</span>
                </div>

                <div className="min-w-0 flex-1">
                    {/* Title Row */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-base sm:text-lg font-bold truncate ${job.status === JobStatus.CANCELLED ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{job.title}</h3>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${statusStyle}`}>
                                    {job.status.replace('_', ' ')}
                                </span>
                                {job.priority === 'HIGH' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> <span className="hidden sm:inline">Priority</span>
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* Mobile Price */}
                        <span className="block sm:hidden font-bold text-slate-900 dark:text-white text-sm">
                            ${totalValue > 0 ? totalValue.toLocaleString() : '0.00'}
                        </span>
                    </div>
                    
                    {/* Details Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">{client?.firstName} {client?.lastName}</span>
                        </div>
                        {/* Conditional Info based on Business Type */}
                        {job.vehicleDetails && isVehicleBusiness && (
                           <div className="flex items-center gap-1.5">
                              <Car className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                              <span>{job.vehicleDetails.year} {job.vehicleDetails.make} {job.vehicleDetails.model}</span>
                           </div>
                        )}
                        {/* Show property details if it's NOT a vehicle business, OR if it IS a vehicle business but has property details (flexibility) */}
                        {job.propertyDetails && !isVehicleBusiness && (
                           <div className="flex items-center gap-1.5">
                              <Home className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                              <span>{job.propertyDetails.homeType || 'Property'} {job.propertyDetails.homeSizeSqFt ? `• ${job.propertyDetails.homeSizeSqFt} sq ft` : ''}</span>
                           </div>
                        )}

                        {job.status === JobStatus.CANCELLED && job.cancellationReason ? (
                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                                <XCircle className="w-4 h-4" />
                                <span className="truncate max-w-[200px]" title={job.cancellationReason}>Reason: {job.cancellationReason}</span>
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <span className="truncate max-w-[200px]">{client?.properties.find(p => p.id === job.propertyId)?.address.city || 'No Location'}</span>
                            </div>
                        )}
                    </div>

                    {/* Mobile Footer: Date/Time */}
                    <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex sm:hidden items-center justify-between">
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                <span>{new Date(job.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                <span>{new Date(job.start).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</span>
                            </div>
                        </div>
                    </div>
                </div>
            
                {/* Desktop Right Side */}
                <div className="flex items-center gap-6 pl-2 hidden sm:flex">
                    <div className="text-right">
                        <span className="block text-lg font-bold text-slate-900 dark:text-white">${totalValue > 0 ? totalValue.toLocaleString() : '0.00'}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">Est. Value</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
            </div>
        </Link>
      );
  };

  const handleSubmit = () => {
      if (!formData.clientId || !formData.title || !formData.date) {
          alert("Please fill in required fields");
          return;
      }

      const client = clients.find(c => c.id === formData.clientId);
      if (!client) return;

      const start = new Date(`${formData.date}T${formData.time}`);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

      // Construct flexible job data based on business type
      const newJob: Job = {
          id: `job-${Date.now()}`,
          clientId: client.id,
          propertyId: client.properties[0].id,
          assignedTechIds: [],
          title: formData.title,
          description: formData.description,
          start: start.toISOString(),
          end: end.toISOString(),
          status: JobStatus.SCHEDULED,
          priority: 'MEDIUM',
          items: [],
          checklists: [
             { id: 'cl-1', label: 'Safety Check', isCompleted: false },
             { id: 'cl-2', label: 'Perform Service', isCompleted: false }
          ],
          photos: [],
          notes: formData.notes
      };

      // Conditionally add details based on business type
      if (isVehicleBusiness) {
          newJob.vehicleDetails = {
             year: formData.carYear || 'Unknown',
             make: formData.carMake || 'Vehicle',
             model: formData.carModel || '',
             color: formData.carColor || 'N/A',
             type: 'Sedan'
          };
      } else {
          // Default to property details for any non-vehicle business
          newJob.propertyDetails = {
              homeSizeSqFt: formData.homeSizeSqFt,
              homeType: formData.homeType as any,
              roofMaterial: formData.roofMaterial,
              notes: formData.notes
          };
      }

      onAddJob(newJob);
      setIsModalOpen(false);
      
      // Reset Form
      setFormData({ 
        clientId: '', title: '', description: '', date: '', time: '09:00',
        carYear: '', carMake: '', carModel: '', carColor: '',
        homeSizeSqFt: '', homeType: 'Single Family', roofMaterial: '', notes: ''
      });
  };

  // ... Client Creation Logic (same as before) ...
  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setClientFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateClient = () => {
      if (!clientFormData.firstName || !clientFormData.lastName) {
          alert("First and Last Name are required.");
          return;
      }

      const newClient: Client = {
          id: `client-${Date.now()}`,
          firstName: clientFormData.firstName,
          lastName: clientFormData.lastName,
          email: clientFormData.email,
          phone: clientFormData.phone,
          companyName: clientFormData.companyName,
          billingAddress: {
              street: clientFormData.street || '',
              city: clientFormData.city || '',
              state: clientFormData.state || '',
              zip: clientFormData.zip || ''
          },
          properties: [{
              id: `prop-${Date.now()}`,
              clientId: `client-${Date.now()}`,
              address: {
                  street: clientFormData.street || '',
                  city: clientFormData.city || '',
                  state: clientFormData.state || '',
                  zip: clientFormData.zip || ''
              },
              accessInstructions: 'Gate code: N/A'
          }],
          tags: ['New'],
          createdAt: new Date().toISOString(),
      };

      onAddClient(newClient);
      setFormData(prev => ({ ...prev, clientId: newClient.id }));
      setIsClientModalOpen(false);
      setClientFormData({
          firstName: '', lastName: '', email: '', phone: '',
          companyName: '', street: '', city: '', state: '', zip: ''
      });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Jobs</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                {isVehicleBusiness ? "Schedule and track detailing appointments." : "Manage projects and service calls."}
            </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" /> New Job
        </Button>
      </div>

      {/* Quick Filters Bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
         {[
            { id: 'ALL', label: 'All Jobs' },
            { id: 'ACTIVE', label: 'Active & Scheduled' },
            { id: 'DRAFTS', label: 'Drafts / Unassigned' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Canceled', icon: XCircle },
            { id: 'HIGH_PRIORITY', label: 'High Priority', icon: AlertCircle }
         ].map((filter) => (
             <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as JobFilter)}
                className={`
                    px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2
                    ${activeFilter === filter.id 
                        ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400'}
                `}
             >
                 {filter.icon && <filter.icon className="w-4 h-4" />}
                 {filter.label}
             </button>
         ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="flex flex-col">
          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No jobs found</h3>
                <p>Try adjusting your filters or create a new job.</p>
            </div>
          ) : (
            activeFilter === 'CANCELLED' ? (
                <div className="space-y-8 p-5">
                    {Object.entries(groupedCancelledJobs).map(([category, groupJobs]: [string, Job[]]) => (
                        <div key={category}>
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                <XCircle className="w-4 h-4 text-red-500" /> {category} ({groupJobs.length})
                            </h3>
                            <div className="space-y-2">
                                {groupJobs.map((job, i) => renderJobCard(job, i))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                filteredJobs.map((job, index) => renderJobCard(job, index))
            )
          )}
        </div>
      </div>

      {/* DYNAMIC CREATE JOB MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Job"
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>Create Job</Button>
            </>
        }
      >
          <div className="space-y-5 p-1">
              <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Client</label>
                  <div className="flex gap-2">
                      <select 
                        className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={formData.clientId}
                        onChange={(e) => setFormData(p => ({...p, clientId: e.target.value}))}
                      >
                          <option value="">Select Client...</option>
                          {clients.map(c => (
                              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                          ))}
                      </select>
                      <button 
                        onClick={() => setIsClientModalOpen(true)}
                        className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
                        title="Create New Client"
                      >
                          <UserPlus className="w-5 h-5" />
                      </button>
                  </div>
              </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Service Title</label>
                  <input 
                      placeholder={isVehicleBusiness ? "e.g. Full Interior Detail" : "e.g. Roof Repair"}
                      value={formData.title}
                      onChange={(e) => setFormData(p => ({...p, title: e.target.value}))}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
              </div>

              {/* DYNAMIC SECTION: VEHICLE VS PROPERTY */}
              {isVehicleBusiness ? (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Car className="w-4 h-4" /> Vehicle Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                             <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Year</label>
                             <input 
                                placeholder="2023"
                                value={formData.carYear}
                                onChange={(e) => setFormData(p => ({...p, carYear: e.target.value}))}
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Make</label>
                             <input 
                                placeholder="Toyota"
                                value={formData.carMake}
                                onChange={(e) => setFormData(p => ({...p, carMake: e.target.value}))}
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                             <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Model</label>
                             <input 
                                placeholder="Camry"
                                value={formData.carModel}
                                onChange={(e) => setFormData(p => ({...p, carModel: e.target.value}))}
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Color</label>
                             <input 
                                placeholder="Silver"
                                value={formData.carColor}
                                onChange={(e) => setFormData(p => ({...p, carColor: e.target.value}))}
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                      </div>
                  </div>
              ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Home className="w-4 h-4" /> Property Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                             <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Home Type</label>
                             <select
                                value={formData.homeType}
                                onChange={(e) => setFormData(p => ({...p, homeType: e.target.value}))}
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                             >
                                 <option value="Single Family">Single Family</option>
                                 <option value="Townhouse">Townhouse</option>
                                 <option value="Commercial">Commercial</option>
                                 <option value="Apartment">Apartment</option>
                             </select>
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Approx. Sq Ft</label>
                             <div className="relative">
                                <input 
                                    placeholder="2500"
                                    value={formData.homeSizeSqFt}
                                    onChange={(e) => setFormData(p => ({...p, homeSizeSqFt: e.target.value}))}
                                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none pl-8"
                                />
                                <Ruler className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                             </div>
                        </div>
                      </div>
                      {userBusinessType === BusinessType.ROOFING && (
                          <div className="mb-3">
                             <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Roof Material</label>
                             <input 
                                placeholder="Asphalt Shingle"
                                value={formData.roofMaterial}
                                onChange={(e) => setFormData(p => ({...p, roofMaterial: e.target.value}))}
                                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                      )}
                      <div>
                           <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Property Notes</label>
                           <input 
                              placeholder="Gate code, hazards, etc."
                              value={formData.notes}
                              onChange={(e) => setFormData(p => ({...p, notes: e.target.value}))}
                              className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                      </div>
                  </div>
              )}

              <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData(p => ({...p, description: e.target.value}))}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 h-24 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date</label>
                        <input 
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(p => ({...p, date: e.target.value}))}
                            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Time</label>
                        <input 
                            type="time"
                            value={formData.time}
                            onChange={(e) => setFormData(p => ({...p, time: e.target.value}))}
                            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>
          </div>
      </Modal>

      {/* QUICK ADD CLIENT MODAL (Unchanged but included for context) */}
      <Modal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        title="Quick Add Client"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsClientModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateClient}>Create Client</Button>
          </>
        }
      >
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">First Name</label>
              <input name="firstName" value={clientFormData.firstName} onChange={handleClientInputChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
              <input name="lastName" value={clientFormData.lastName} onChange={handleClientInputChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Doe" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input name="email" value={clientFormData.email} onChange={handleClientInputChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
              <input name="phone" value={clientFormData.phone} onChange={handleClientInputChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="(555) 123-4567" />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Property Address</h4>
            <div className="space-y-3">
               <input name="street" value={clientFormData.street} onChange={handleClientInputChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Street Address" />
               <div className="grid grid-cols-3 gap-3">
                 <input name="city" value={clientFormData.city} onChange={handleClientInputChange} className="col-span-1 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="City" />
                 <input name="state" value={clientFormData.state} onChange={handleClientInputChange} className="col-span-1 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="State" />
                 <input name="zip" value={clientFormData.zip} onChange={handleClientInputChange} className="col-span-1 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Zip" />
               </div>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};