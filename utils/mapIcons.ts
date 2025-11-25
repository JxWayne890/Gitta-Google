
import L from 'leaflet';

// Custom Blue Icon for Technicians
export const techIcon = L.divIcon({
  className: 'tech-icon-marker',
  html: `
    <div class="relative group">
      <div class="w-10 h-10 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white transform transition-transform hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
      </div>
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-blue-600"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 42],
  popupAnchor: [0, -42]
});

// Custom Green Icon for Jobs (Legacy/Fallback)
export const jobIcon = L.divIcon({
  className: 'job-icon-marker',
  html: `
    <div class="relative group">
      <div class="w-10 h-10 bg-emerald-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white transform transition-transform hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      </div>
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-emerald-600"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 42],
  popupAnchor: [0, -42]
});

// Dynamic Ordered Job Icon
export const createOrderedJobIcon = (order: number, isFirst: boolean, isLast: boolean, status?: string) => {
  let bgClass = 'bg-blue-600';
  let borderHex = '#2563eb'; // blue-600

  if (isFirst) {
    bgClass = 'bg-emerald-600'; // Green for Start
    borderHex = '#059669'; // emerald-600
  } else if (isLast) {
    bgClass = 'bg-red-600'; // Red for End
    borderHex = '#dc2626'; // red-600
  }

  const isInProgress = status === 'IN_PROGRESS';
  
  // Animation layers: A pinging ring and a glowing pulse
  const animationLayer = isInProgress ? `
    <div class="absolute -inset-3 bg-amber-500/60 rounded-full animate-ping z-0"></div>
    <div class="absolute -inset-1 bg-amber-400/40 rounded-full animate-pulse z-0"></div>
    <div class="absolute -inset-[5px] border-2 border-dashed border-amber-500/50 rounded-full animate-[spin_8s_linear_infinite] z-0"></div>
  ` : '';

  return L.divIcon({
    className: 'ordered-job-icon',
    html: `
      <div class="relative group">
        ${animationLayer}
        <div class="w-8 h-8 ${bgClass} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm transform transition-transform hover:scale-110 z-10 relative">
          ${order}
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] z-10" style="border-top-color: ${borderHex}"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 34],
    popupAnchor: [0, -34]
  });
};
