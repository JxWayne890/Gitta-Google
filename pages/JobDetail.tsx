
import React, { useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Job, JobStatus, Client, BusinessType } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { CheckCircle, Camera, Clock, Calendar, ArrowLeft, AlertCircle, Car, XCircle, Home, Ruler } from 'lucide-react';
import { StoreContext } from '../store';

interface JobDetailProps {
  jobs: Job[];
  clients: Client[];
  onUpdateStatus: (id: string, status: JobStatus) => void;
}

const CANCELLATION_CATEGORIES = [
    "Client Cancelled",
    "Weather Issue",
    "Scheduling Conflict",
    "Technician Unavailable",
    "No Show",
    "Other"
];

export const JobDetail: React.FC<JobDetailProps> = ({ jobs, clients, onUpdateStatus }) => {
  const store = useContext(StoreContext);
  const { id } = useParams();
  const job = jobs.find((j) => j.id === id);
  const client = clients.find((c) => c.id === job?.clientId);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'photos'>('overview');
  
  // Cancellation State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelCategory, setCancelCategory] = useState<string>('');
  const [cancelNotes, setCancelNotes] = useState<string>('');

  if (!job || !client) return <div>Job not found</div>;

  const property = client.properties.find(p => p.id === job.propertyId);
  const onMyWayUser = store?.users.find(u => u.id === job.onMyWayBy);
  const isCurrentUserOnWay = store?.currentUser.id === job.onMyWayBy;
  const businessType = store?.currentUser.businessType || BusinessType.MOBILE_DETAILING;

  const handleStatusChange = (newStatus: JobStatus) => {
    onUpdateStatus(job.id, newStatus);
  };

  const handleOnMyWay = () => {
      if (store && !job.onMyWayBy) {
          store.markOnMyWay(job.id);
      }
  };

  const handleCancelJob = () => {
      if (store && cancelCategory) {
          const reasonText = cancelNotes.trim() ? `${cancelCategory}: ${cancelNotes}` : cancelCategory;
          store.cancelJob(job.id, reasonText);
          setIsCancelModalOpen(false);
          setCancelCategory('');
          setCancelNotes('');
      }
  };

  const getStatusBadge = (status: JobStatus) => {
    const colors = {
      SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
      DRAFT: 'bg-slate-50 text-slate-700 border-slate-200 border-dashed dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600',
      CANCELLED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[status]} uppercase tracking-wide`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <Link to="/jobs" className="mb-6 inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium text-sm transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Jobs
      </Link>

      {/* Cancelled Banner */}
      {job.status === JobStatus.CANCELLED && (
          <div className="mb-6 p-4 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-start gap-3">
              <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                  <p className="font-bold text-sm">Job Cancelled</p>
                  <p className="text-xs mt-1">Reason: <span className="font-medium">{job.cancellationReason || 'No reason provided'}</span></p>
              </div>
          </div>
      )}

      {/* On My Way Banner */}
      {onMyWayUser && job.status !== JobStatus.CANCELLED && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 ${isCurrentUserOnWay ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300' : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCurrentUserOnWay ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-amber-100 dark:bg-amber-900/50'}`}>
                  <Car className="w-5 h-5" />
              </div>
              <div className="flex-1">
                  <p className="font-bold text-sm">
                      {isCurrentUserOnWay ? 'You are on the way!' : `${onMyWayUser.name} is on the way to this job.`}
                  </p>
                  <p className="text-xs opacity-80">
                      Job claimed. Other team members can see this status.
                  </p>
              </div>
              {onMyWayUser.avatarUrl && (
                  <img src={onMyWayUser.avatarUrl} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" alt="User" />
              )}
          </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{job.title}</h1>
              {getStatusBadge(job.status)}
              {job.priority === 'HIGH' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold border bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 uppercase tracking-wide flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> High Priority
                  </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(job.start).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(job.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(job.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {job.status !== JobStatus.CANCELLED && job.status !== JobStatus.COMPLETED && (
                <Button variant="danger" onClick={() => setIsCancelModalOpen(true)} className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100 shadow-none">
                    Cancel Job
                </Button>
            )}

            {job.status === JobStatus.SCHEDULED && (
                <Button onClick={() => handleStatusChange(JobStatus.IN_PROGRESS)}>
                Start Job
                </Button>
            )}
            {job.status === JobStatus.IN_PROGRESS && (
                <Button onClick={() => handleStatusChange(JobStatus.COMPLETED)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Complete Job
                </Button>
            )}
            
            {job.status !== JobStatus.CANCELLED && job.status !== JobStatus.COMPLETED && (
                <Button 
                    variant={isCurrentUserOnWay ? 'primary' : 'outline'} 
                    onClick={handleOnMyWay}
                    disabled={!!job.onMyWayBy && !isCurrentUserOnWay}
                    className={isCurrentUserOnWay ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20 text-white' : 'dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700'}
                >
                    {job.onMyWayBy 
                        ? (isCurrentUserOnWay ? 'You\'re on the way' : `OTW: ${onMyWayUser?.name.split(' ')[0]}`) 
                        : 'On My Way'
                    }
                </Button>
            )}
          </div>
        </div>

        {/* Client Quick View */}
        <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
             <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Client</p>
                <Link to={`/clients/${client.id}`} className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition-colors">
                  {client.firstName} {client.lastName}
                </Link>
                <p className="text-sm text-slate-500 dark:text-slate-400">{client.phone}</p>
             </div>
             <div className="w-px h-10 bg-slate-200 dark:bg-slate-600 mx-6"></div>
             <div className="flex-[2]">
                 <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Location</p>
                 <div className="flex items-start justify-between">
                     <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {property ? (
                            <>{property.address.street}, {property.address.city}, {property.address.state} {property.address.zip}</>
                        ) : (
                            <span className="text-slate-400 italic">Location details unavailable</span>
                        )}
                     </p>
                     {property && <a href="#" className="text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:underline">Map</a>}
                 </div>
             </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-700 mb-8 px-4">
         {['overview', 'checklist', 'photos'].map(tab => (
             <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 font-medium text-sm capitalize border-b-2 transition-all ${
                    activeTab === tab 
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
             >
                 {tab}
             </button>
         ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-8 min-h-[400px]">
        
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* DYNAMIC ASSET CARD */}
            {job.vehicleDetails ? (
                <section className="bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
                    <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Car className="w-4 h-4" /> Vehicle Information
                    </h3>
                    <div className="flex gap-8">
                        <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Year</span>
                            <p className="font-bold text-slate-900 dark:text-white">{job.vehicleDetails.year}</p>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Make</span>
                            <p className="font-bold text-slate-900 dark:text-white">{job.vehicleDetails.make}</p>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Model</span>
                            <p className="font-bold text-slate-900 dark:text-white">{job.vehicleDetails.model}</p>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Color</span>
                            <p className="font-bold text-slate-900 dark:text-white">{job.vehicleDetails.color}</p>
                        </div>
                    </div>
                </section>
            ) : job.propertyDetails ? (
                <section className="bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
                    <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Home className="w-4 h-4" /> Property Details
                    </h3>
                    <div className="flex gap-8">
                        <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Type</span>
                            <p className="font-bold text-slate-900 dark:text-white">{job.propertyDetails.homeType}</p>
                        </div>
                        {job.propertyDetails.homeSizeSqFt && (
                            <div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Size</span>
                                <p className="font-bold text-slate-900 dark:text-white">{job.propertyDetails.homeSizeSqFt} sq ft</p>
                            </div>
                        )}
                        {job.propertyDetails.roofMaterial && (
                            <div>
                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Material</span>
                                <p className="font-bold text-slate-900 dark:text-white">{job.propertyDetails.roofMaterial}</p>
                            </div>
                        )}
                    </div>
                    {job.propertyDetails.notes && (
                        <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800">
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Notes</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{job.propertyDetails.notes}</p>
                        </div>
                    )}
                </section>
            ) : null}

            <section>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Description</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                    {job.description}
                </p>
                {property?.accessInstructions && (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-sm flex gap-3 items-start">
                        <div className="mt-0.5 font-bold">Note:</div>
                        <div>{property.accessInstructions}</div>
                    </div>
                )}
            </section>

            <section>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Line Items</h3>
                <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="p-4">Item</th>
                                <th className="p-4 text-right">Qty</th>
                                <th className="p-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {job.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="p-4 font-medium text-slate-900 dark:text-white">{item.description}</td>
                                    <td className="p-4 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                    <td className="p-4 text-right font-bold text-slate-900 dark:text-white">${item.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="space-y-3">
            {job.checklists.map((item) => (
                <label key={item.id} className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${item.isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                         {item.isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <input 
                        type="checkbox" 
                        defaultChecked={item.isCompleted}
                        className="hidden"
                    />
                    <span className={`font-medium ${item.isCompleted ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>{item.label}</span>
                </label>
            ))}
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {job.photos.map(photo => (
                    <div key={photo.id} className="aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 relative group shadow-sm">
                        <img src={photo.url} alt="Job" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <p className="text-white text-xs font-medium">{new Date(photo.uploadedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
                <button className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all gap-2">
                    <Camera className="w-8 h-8" />
                    <span className="text-sm font-medium">Add Photo</span>
                </button>
             </div>
          </div>
        )}

      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Job"
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)}>Keep Job</Button>
                <Button variant="danger" onClick={handleCancelJob} disabled={!cancelCategory}>Confirm Cancellation</Button>
            </>
        }
      >
          <div className="space-y-4 p-2">
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Are you sure you want to cancel <span className="font-bold text-slate-900 dark:text-white">{job.title}</span>? This action cannot be undone.
              </p>
              
              <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Reason Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                      {CANCELLATION_CATEGORIES.map(cat => (
                          <button
                              key={cat}
                              onClick={() => setCancelCategory(cat)}
                              className={`p-2 text-xs font-bold rounded-lg border transition-all ${
                                  cancelCategory === cat 
                                  ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 ring-1 ring-red-500' 
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-300'
                              }`}
                          >
                              {cat}
                          </button>
                      ))}
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Additional Notes {cancelCategory === 'Other' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea 
                      value={cancelNotes}
                      onChange={(e) => setCancelNotes(e.target.value)}
                      placeholder="Add details..."
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none h-24 resize-none"
                  />
              </div>
          </div>
      </Modal>
    </div>
  );
};
