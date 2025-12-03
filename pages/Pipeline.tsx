
import React, { useState, useMemo, useEffect } from 'react';
import { Job, Client, User, PipelineStage } from '../types';
import { 
  DollarSign, Calendar, User as UserIcon, Clock, AlertCircle, 
  CheckCircle2, FileText, PauseCircle, ChevronRight, ZoomIn, ZoomOut,
  Flame, Snowflake, Sun, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface PipelineProps {
  jobs: Job[];
  clients: Client[];
  users: User[];
  onUpdateStage: (jobId: string, stage: PipelineStage) => void;
}

// Temperature Configuration
// Gradient: Blue (Cold) -> Yellow (Warm) -> Orange (Hot) -> Red (Urgent) -> Green (Done)
const STAGES: { 
  id: PipelineStage; 
  label: string; 
  containerClass: string; 
  headerClass: string;
  accentClass: string;
  icon: React.ReactNode;
}[] = [
  { 
    id: 'LEAD', 
    label: 'Lead', 
    containerClass: 'bg-blue-50/50 border-blue-100', 
    headerClass: 'bg-blue-100 text-blue-700',
    accentClass: 'border-l-blue-500',
    icon: <Snowflake className="w-3 h-3 text-blue-400" />
  },
  { 
    id: 'ESTIMATE_SENT', 
    label: 'Estimate Sent', 
    containerClass: 'bg-sky-50/50 border-sky-100', 
    headerClass: 'bg-sky-100 text-sky-700',
    accentClass: 'border-l-sky-500',
    icon: <FileText className="w-3 h-3 text-sky-500" />
  },
  { 
    id: 'APPROVED', 
    label: 'Approved', 
    containerClass: 'bg-cyan-50/50 border-cyan-100', 
    headerClass: 'bg-cyan-100 text-cyan-700',
    accentClass: 'border-l-cyan-500',
    icon: <CheckCircle2 className="w-3 h-3 text-cyan-500" />
  },
  { 
    id: 'SCHEDULED', 
    label: 'Scheduled', 
    containerClass: 'bg-yellow-50/50 border-yellow-100', 
    headerClass: 'bg-yellow-100 text-yellow-700',
    accentClass: 'border-l-yellow-500',
    icon: <Calendar className="w-3 h-3 text-yellow-600" />
  },
  { 
    id: 'IN_PROGRESS', 
    label: 'In Progress', 
    containerClass: 'bg-orange-50/50 border-orange-100', 
    headerClass: 'bg-orange-100 text-orange-700',
    accentClass: 'border-l-orange-500',
    icon: <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
  },
  { 
    id: 'COMPLETED', 
    label: 'Completed', 
    containerClass: 'bg-red-50/50 border-red-100', 
    headerClass: 'bg-red-100 text-red-700',
    accentClass: 'border-l-red-500',
    icon: <Zap className="w-3 h-3 text-red-500 fill-red-500" />
  },
  { 
    id: 'INVOICED', 
    label: 'Invoiced', 
    containerClass: 'bg-rose-50/50 border-rose-100', 
    headerClass: 'bg-rose-100 text-rose-700',
    accentClass: 'border-l-rose-500',
    icon: <DollarSign className="w-3 h-3 text-rose-500" />
  },
  { 
    id: 'PAID', 
    label: 'Paid', 
    containerClass: 'bg-emerald-50/50 border-emerald-100', 
    headerClass: 'bg-emerald-100 text-emerald-700',
    accentClass: 'border-l-emerald-500',
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />
  },
  { 
    id: 'ON_HOLD', 
    label: 'On Hold', 
    containerClass: 'bg-slate-100/50 border-slate-200', 
    headerClass: 'bg-slate-200 text-slate-700',
    accentClass: 'border-l-slate-500',
    icon: <PauseCircle className="w-3 h-3 text-slate-500" />
  },
];

export const Pipeline: React.FC<PipelineProps> = ({ jobs, clients, users, onUpdateStage }) => {
  const [draggingJobId, setDraggingJobId] = useState<string | null>(null);
  
  // Initialize zoom level from local storage or default to 1
  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem('pipelineZoomLevel');
    return saved ? parseFloat(saved) : 1;
  });

  // Persist zoom level to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('pipelineZoomLevel', zoomLevel.toString());
  }, [zoomLevel]);

  // Group jobs by stage
  const columns = useMemo(() => {
    const grouped: Record<string, Job[]> = {};
    STAGES.forEach(stage => grouped[stage.id] = []);
    jobs.forEach(job => {
      const stage = job.pipelineStage || 'LEAD';
      if (grouped[stage]) grouped[stage].push(job);
      else grouped['LEAD'].push(job); // Fallback
    });
    return grouped;
  }, [jobs]);

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData('jobId', jobId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingJobId(jobId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: PipelineStage) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData('jobId');
    if (jobId) {
      onUpdateStage(jobId, stageId);
    }
    setDraggingJobId(null);
  };

  // Zoom Logic
  const BASE_WIDTH = 300;
  const columnWidth = Math.round(BASE_WIDTH * zoomLevel);
  
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setZoomLevel(parseFloat(e.target.value));
  };

  const stepZoom = (delta: number) => {
      setZoomLevel(prev => {
          const next = prev + delta;
          return Math.min(Math.max(next, 0.5), 1.5);
      });
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Pipeline Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 px-1 custom-scrollbar">
        <div className="flex h-full gap-4 pb-12" style={{ width: 'max-content' }}>
          {STAGES.map(stage => {
            const stageJobs = columns[stage.id] || [];
            const totalValue = stageJobs.reduce((sum, j) => sum + j.items.reduce((s, i) => s + i.total, 0), 0);

            return (
              <div 
                key={stage.id}
                className={`flex-shrink-0 rounded-xl flex flex-col border ${stage.containerClass} transition-all duration-300 ease-in-out`}
                style={{ width: `${columnWidth}px` }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column Header */}
                <div className={`p-3 rounded-t-xl border-b border-white/20 flex justify-between items-center ${stage.headerClass}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                        {stage.icon}
                        <span className="text-xs font-bold uppercase tracking-wider truncate">{stage.label}</span>
                        <span className="bg-white/50 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">{stageJobs.length}</span>
                    </div>
                    {totalValue > 0 && zoomLevel > 0.6 && (
                        <span className="text-[10px] font-bold opacity-80 shrink-0">${totalValue.toLocaleString()}</span>
                    )}
                </div>

                {/* Cards Container */}
                <div className="p-2 flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-[100px]">
                    {stageJobs.map(job => {
                        const client = clients.find(c => c.id === job.clientId);
                        const tech = users.find(u => u.id === job.assignedTechIds[0]);
                        const value = job.items.reduce((sum, i) => sum + i.total, 0);
                        
                        return (
                            <div
                                key={job.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, job.id)}
                                className={`
                                    bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-grab 
                                    hover:shadow-md transition-all group border-l-4 ${stage.accentClass}
                                    ${draggingJobId === job.id ? 'opacity-50' : 'opacity-100'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className={`font-bold text-slate-900 leading-tight ${zoomLevel < 0.7 ? 'text-xs' : 'text-sm'}`}>{job.title}</h4>
                                    {zoomLevel > 0.6 && (
                                        <Link to={`/jobs/${job.id}`} className="text-slate-300 hover:text-emerald-500 shrink-0 ml-2">
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                                
                                {zoomLevel > 0.6 && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                                        <UserIcon className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{client?.firstName} {client?.lastName}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {tech ? (
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0" title={tech.name}>
                                                {tech.avatarUrl ? (
                                                    <img src={tech.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                                                ) : (
                                                    <span className="text-[9px] font-bold text-slate-500">{tech.name[0]}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center shrink-0">
                                                <span className="text-[8px] text-slate-400">?</span>
                                            </div>
                                        )}
                                        {zoomLevel > 0.7 && (
                                            <div className="text-[10px] font-medium text-slate-400 truncate">
                                                {job.start ? format(new Date(job.start), 'MMM d') : 'No Date'}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                                        ${value.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Zoom Control */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-xl border border-slate-200/60 rounded-full px-4 py-2 flex items-center gap-4 z-30 transition-opacity duration-300 hover:opacity-100">
          <button 
            onClick={() => stepZoom(-0.1)}
            disabled={zoomLevel <= 0.5}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Zoom Out"
          >
              <ZoomOut className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3">
              <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.1" 
                  value={zoomLevel} 
                  onChange={handleZoomChange}
                  className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-xs font-bold text-slate-600 w-9 text-right tabular-nums">{Math.round(zoomLevel * 100)}%</span>
          </div>

          <button 
            onClick={() => stepZoom(0.1)}
            disabled={zoomLevel >= 1.5}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Zoom In"
          >
              <ZoomIn className="w-4 h-4" />
          </button>
      </div>
    </div>
  );
};
