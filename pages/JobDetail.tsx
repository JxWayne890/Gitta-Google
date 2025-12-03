
import React, { useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Job, JobStatus, Client } from '../types';
import { Button } from '../components/Button';
import { CheckCircle, Camera, Clock, Calendar, ArrowLeft, AlertCircle, Car } from 'lucide-react';
import { StoreContext } from '../store';

interface JobDetailProps {
  jobs: Job[];
  clients: Client[];
  onUpdateStatus: (id: string, status: JobStatus) => void;
}

export const JobDetail: React.FC<JobDetailProps> = ({ jobs, clients, onUpdateStatus }) => {
  const store = useContext(StoreContext);
  const { id } = useParams();
  const job = jobs.find((j) => j.id === id);
  const client = clients.find((c) => c.id === job?.clientId);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'photos'>('overview');

  if (!job || !client) return <div>Job not found</div>;

  const property = client.properties.find(p => p.id === job.propertyId);

  const handleStartJob = () => {
      // 1. Update Status
      onUpdateStatus(job.id, JobStatus.IN_PROGRESS);
      // 2. Auto Clock In (Feature Request)
      store?.clockIn(job.id);
  };

  const handleCompleteJob = () => {
      // 1. Update Status
      onUpdateStatus(job.id, JobStatus.COMPLETED);
      // 2. Auto Clock Out (Feature Request)
      store?.clockOut();
  };

  const getStatusBadge = (status: JobStatus) => {
    const colors = {
      SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
      IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
      COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      DRAFT: 'bg-slate-50 text-slate-700 border-slate-200 border-dashed',
      CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[status]} uppercase tracking-wide`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <Link to="/jobs" className="mb-6 inline-flex items-center text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Jobs
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{job.title}</h1>
              {getStatusBadge(job.status)}
              {job.priority === 'HIGH' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold border bg-red-100 text-red-700 border-red-200 uppercase tracking-wide flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> High Priority
                  </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-sm">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(job.start).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(job.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(job.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {job.status === JobStatus.SCHEDULED && (
                <Button onClick={handleStartJob}>
                Start Job
                </Button>
            )}
            {job.status === JobStatus.IN_PROGRESS && (
                <Button onClick={handleCompleteJob} className="bg-emerald-600 hover:bg-emerald-700">
                Complete Job
                </Button>
            )}
            <Button variant="outline" onClick={() => alert("Notification sent!")}>
                On My Way
            </Button>
          </div>
        </div>

        {/* Client Quick View */}
        <div className="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
             <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Client</p>
                <Link to={`/clients/${client.id}`} className="font-bold text-slate-900 hover:text-emerald-600 hover:underline transition-colors">
                  {client.firstName} {client.lastName}
                </Link>
                <p className="text-sm text-slate-500">{client.phone}</p>
             </div>
             <div className="w-px h-10 bg-slate-200 mx-6"></div>
             <div className="flex-[2]">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                 <div className="flex items-start justify-between">
                     <p className="text-sm text-slate-700 font-medium">
                        {property?.address.street}, {property?.address.city}, {property?.address.state} {property?.address.zip}
                     </p>
                     <a href="#" className="text-emerald-600 text-sm font-bold hover:underline">Map</a>
                 </div>
             </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-200 mb-8 px-4">
         {['overview', 'checklist', 'photos'].map(tab => (
             <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 font-medium text-sm capitalize border-b-2 transition-all ${
                    activeTab === tab 
                    ? 'border-emerald-500 text-emerald-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
             >
                 {tab}
             </button>
         ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 min-h-[400px]">
        
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {job.vehicleDetails && (
                <section className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                    <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Car className="w-4 h-4" /> Vehicle Information
                    </h3>
                    <div className="flex gap-8">
                        <div>
                            <span className="text-xs text-slate-500 uppercase">Year</span>
                            <p className="font-bold text-slate-900">{job.vehicleDetails.year}</p>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 uppercase">Make</span>
                            <p className="font-bold text-slate-900">{job.vehicleDetails.make}</p>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 uppercase">Model</span>
                            <p className="font-bold text-slate-900">{job.vehicleDetails.model}</p>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 uppercase">Color</span>
                            <p className="font-bold text-slate-900">{job.vehicleDetails.color}</p>
                        </div>
                    </div>
                </section>
            )}

            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Description</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                    {job.description}
                </p>
                {property?.accessInstructions && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-sm flex gap-3 items-start">
                        <div className="mt-0.5 font-bold">Note:</div>
                        <div>{property.accessInstructions}</div>
                    </div>
                )}
            </section>

            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Line Items</h3>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="p-4">Item</th>
                                <th className="p-4 text-right">Qty</th>
                                <th className="p-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {job.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="p-4 font-medium text-slate-900">{item.description}</td>
                                    <td className="p-4 text-right text-slate-600">{item.quantity}</td>
                                    <td className="p-4 text-right font-bold text-slate-900">${item.total}</td>
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
                <label key={item.id} className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${item.isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                         {item.isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <input 
                        type="checkbox" 
                        defaultChecked={item.isCompleted}
                        className="hidden"
                    />
                    <span className={`font-medium ${item.isCompleted ? 'text-emerald-900' : 'text-slate-700'}`}>{item.label}</span>
                </label>
            ))}
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {job.photos.map(photo => (
                    <div key={photo.id} className="aspect-square rounded-xl overflow-hidden border border-slate-100 relative group shadow-sm">
                        <img src={photo.url} alt="Job" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <p className="text-white text-xs font-medium">{new Date(photo.uploadedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
                <button className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all gap-2">
                    <Camera className="w-8 h-8" />
                    <span className="text-sm font-medium">Add Photo</span>
                </button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
