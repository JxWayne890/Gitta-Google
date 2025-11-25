
"use client";

import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { techIcon, createOrderedJobIcon } from '../utils/mapIcons';
import { Briefcase, Clock, MapPin, MessageCircle, ArrowRight, X, ChevronRight } from 'lucide-react';
import { Job, User, Client } from '../types';

interface MapViewProps {
  jobs?: Job[];
  users?: User[];
  clients?: Client[];
}

const MapView: React.FC<MapViewProps> = ({ jobs = [], users = [], clients = [] }) => {
  // Center coordinates for Lubbock, TX
  const center: [number, number] = [33.5779, -101.8552];
  
  const MAPTILER_KEY = '9wOCWt2fKzEDWWAC9p8B';
  const mapTilerUrl = `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;

  // State for route highlighting
  const [activeTechId, setActiveTechId] = useState<string | null>(null);

  // Filter technicians
  const technicians = useMemo(() => users.filter(u => u.role === 'TECHNICIAN'), [users]);

  // Filter only assigned jobs for the map
  const assignedJobs = useMemo(() => {
    return jobs.filter(job => job.assignedTechIds.length > 0 && job.status !== 'DRAFT' && job.status !== 'CANCELLED');
  }, [jobs]);

  // Helper to get Location for a Job
  const getJobLocation = (job: Job) => {
      const client = clients.find(c => c.id === job.clientId);
      const property = client?.properties.find(p => p.id === job.propertyId);
      // Fallback if lat/lng is missing in data (should be there from mockData now)
      if (property?.address.lat && property?.address.lng) {
          return { lat: property.address.lat, lng: property.address.lng, addressStr: `${property.address.street}, ${property.address.city}` };
      }
      return null;
  };

  // Calculate Routes & Sequences
  const { routes, jobSequences } = useMemo(() => {
    const techRoutes: Record<string, [number, number][]> = {};
    const sequences: Record<string, { order: number, isFirst: boolean, isLast: boolean }> = {};
    
    // 1. Group jobs by technician
    const groupedJobs: Record<string, Job[]> = {};
    
    assignedJobs.forEach(job => {
        const techId = job.assignedTechIds[0]; // Primary tech
        if (techId) {
            if (!groupedJobs[techId]) groupedJobs[techId] = [];
            groupedJobs[techId].push(job);
        }
    });

    // 2. Sort by time and generate routes
    Object.entries(groupedJobs).forEach(([techId, techJobs]) => {
        const sortedJobs = techJobs.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        
        const routePoints: [number, number][] = [];
        
        // Add Tech Starting Position if available
        const tech = users.find(u => u.id === techId);
        if (tech?.lat && tech?.lng) {
            routePoints.push([tech.lat, tech.lng]);
        }

        sortedJobs.forEach((job, index) => {
            const loc = getJobLocation(job);
            if (loc) {
                routePoints.push([loc.lat, loc.lng]);
                
                sequences[job.id] = {
                    order: index + 1,
                    isFirst: index === 0,
                    isLast: index === sortedJobs.length - 1 && sortedJobs.length > 1
                };
            }
        });

        if (routePoints.length > 0) {
            techRoutes[techId] = routePoints;
        }
    });

    return { routes: techRoutes, jobSequences: sequences };
  }, [assignedJobs, users, clients]);

  // Action Functions
  const openJobDetails = (jobId: string) => {
     // In real app: router.push(`/jobs/${jobId}`)
     console.log('Open job', jobId);
  };

  const messageTech = (techId: string) => {
      console.log(`Opening chat with technician: ${techId}`);
  };

  const handleMarkerClick = (techId: string | undefined) => {
      if (techId) setActiveTechId(techId);
  };

  // Helper for Status Styles
  const getJobStatusStyle = (status: string) => {
      switch(status) {
          case 'SCHEDULED': return 'bg-blue-50 text-blue-700 border-blue-200';
          case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-200';
          case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
          default: return 'bg-slate-50 text-slate-700 border-slate-200';
      }
  };

  return (
    <div className="w-full h-full bg-slate-100 relative z-0 rounded-xl overflow-hidden shadow-inner min-h-[600px]">
      <style>{`
        .jobber-popup .leaflet-popup-content-wrapper {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            padding: 0;
            overflow: hidden;
        }
        .jobber-popup .leaflet-popup-content {
            margin: 0;
            width: 320px !important;
        }
        .jobber-popup .leaflet-popup-tip {
            background: white;
        }
        .jobber-popup a.leaflet-popup-close-button {
            display: none;
        }
      `}</style>

      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url={mapTilerUrl}
          attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a>'
        />

        {/* Route Lines */}
        {Object.entries(routes).map(([techId, positions]) => {
            const isSelected = activeTechId === techId;
            const opacity = activeTechId ? (isSelected ? 0.8 : 0.1) : 0.5;
            const color = isSelected ? '#2563eb' : '#3b82f6'; 
            const weight = isSelected ? 4 : 3;

            return (
                <Polyline 
                    key={techId}
                    positions={positions}
                    pathOptions={{ 
                        color,
                        weight, 
                        opacity,
                        dashArray: isSelected ? undefined : '8, 6',
                        lineCap: 'round',
                        lineJoin: 'round'
                    }} 
                />
            );
        })}

        {/* Technician Markers */}
        {technicians.map((tech) => {
          if (!tech.lat || !tech.lng) return null;
          
          // Find current active job for tech
          const currentJob = assignedJobs.find(j => j.assignedTechIds.includes(tech.id) && j.status === 'IN_PROGRESS');

          return (
            <Marker 
                key={tech.id} 
                position={[tech.lat, tech.lng]} 
                icon={techIcon}
                eventHandlers={{
                    click: () => handleMarkerClick(tech.id)
                }}
            >
                <Popup className="jobber-popup" closeButton={false}>
                <div className="flex flex-col bg-white w-full font-sans">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3 relative">
                        <div className="relative">
                            <img src={tech.avatarUrl} alt={tech.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-emerald-500"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">{tech.name}</h3>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Technician</p>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <Briefcase className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">Current Activity</p>
                                <p className="text-sm font-medium text-slate-900">{currentJob ? currentJob.title : 'Available'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                        <button 
                            onClick={() => messageTech(tech.id)}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" /> Message
                        </button>
                    </div>
                </div>
                </Popup>
            </Marker>
          );
        })}

        {/* Job Markers */}
        {assignedJobs.map((job) => {
            const loc = getJobLocation(job);
            if (!loc) return null;

            const seq = jobSequences[job.id];
            const techId = job.assignedTechIds[0];
            const tech = users.find(u => u.id === techId);
            const isRouteSelected = activeTechId === techId;
            const opacity = activeTechId ? (isRouteSelected ? 1 : 0.5) : 1;
            
            if (!seq) return null;

            return (
                <Marker 
                    key={job.id} 
                    position={[loc.lat, loc.lng]} 
                    icon={createOrderedJobIcon(seq.order, seq.isFirst, seq.isLast, job.status)}
                    opacity={opacity}
                    eventHandlers={{
                        click: () => handleMarkerClick(techId)
                    }}
                >
                    <Popup className="jobber-popup" closeButton={false}>
                    <div className="flex flex-col bg-white w-full font-sans relative">
                        <div className="p-5 pb-3">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-100 text-slate-500 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-slate-200">
                                        {seq.order}
                                    </span>
                                    <h3 className="font-bold text-lg text-slate-900 leading-tight pr-6">{job.title}</h3>
                                </div>
                                <div className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 cursor-pointer pointer-events-none">
                                    <X className="w-5 h-5" /> 
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-2 text-sm text-slate-600 mb-4">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <span>{loc.addressStr}</span>
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${getJobStatusStyle(job.status)}`}>
                                    {job.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Time Window</p>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        {new Date(job.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                                    <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Technician</p>
                                    {tech ? (
                                        <div className="flex items-center gap-2">
                                            <img src={tech.avatarUrl} className="w-5 h-5 rounded-full" alt="" />
                                            <span className="text-sm font-medium text-slate-900 truncate">{tech.name.split(' ')[0]}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">Unassigned</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={() => openJobDetails(job.id)}
                                className="flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                            >
                                Details <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    </Popup>
                </Marker>
            );
        })}

      </MapContainer>

      {/* Legend Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
         <div className="bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-slate-200 max-w-xs">
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Map Legend</h4>
             <div className="space-y-2">
                 <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                     <div className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-sm"></div>
                     <span>Technicians</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                     <div className="w-3 h-3 rounded-full bg-emerald-600 border border-white shadow-sm flex items-center justify-center text-[8px] text-white">1</div>
                     <span>Start of Route</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                     <div className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-sm flex items-center justify-center text-[8px] text-white">2</div>
                     <span>Route Stop</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                     <div className="w-3 h-3 rounded-full bg-red-600 border border-white shadow-sm flex items-center justify-center text-[8px] text-white">3</div>
                     <span>End of Route</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                     <div className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-sm relative">
                        <div className="absolute -inset-1 rounded-full border border-amber-500 opacity-50"></div>
                     </div>
                     <span>Work In Progress</span>
                 </div>
                 {activeTechId && (
                     <div className="flex items-center gap-2 text-xs font-medium text-blue-600 pt-1 border-t border-slate-100 mt-1">
                        <div className="w-4 h-0.5 bg-blue-600"></div>
                        <span>Route: {users.find(u => u.id === activeTechId)?.name}</span>
                     </div>
                 )}
             </div>
         </div>
         {activeTechId && (
             <button 
                onClick={() => setActiveTechId(null)}
                className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg border border-slate-200 text-xs font-bold text-slate-600 hover:text-red-600 transition-colors"
             >
                 Clear Selection
             </button>
         )}
      </div>
    </div>
  );
};

export default MapView;
