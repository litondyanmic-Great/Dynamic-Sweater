import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Scissors, 
  AlertTriangle, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  ClipboardList,
  User,
  Menu,
  X,
  TrendingUp,
  Activity,
  ArrowRight,
  Trash2,
  Image as ImageIcon,
  Download,
  FileSpreadsheet,
  History,
  BarChart2,
  Layers,
  Calendar,
  Save,
  Clock,
  UserCheck,
  MapPin,
  Grid,
  Lock,
  Unlock,
  Play,
  Database,
  Loader,
  Wifi,
  CloudUpload,
  Check,
  RefreshCw,
  HardDrive,
  FileText,
  Table,
  Palette,
  Truck,
  Scroll,
  Eraser,
  Settings,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Siren,
  ShieldCheck,
  BarChart,
  Printer,
  Upload,
  Sparkles,
  Copy,
  Factory,
  Shirt,
  CheckSquare,
  Square
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs,
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  writeBatch
} from 'firebase/firestore';

// --- GEMINI API KEY ---
// Optional: set VITE_GEMINI_API_KEY in a .env file to enable the AI Daily Report feature.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

// --- FIREBASE INITIALIZATION ---
// Firebase is OPTIONAL. The app works fully standalone using browser localStorage
// (see usePersistentState below). If you want real-time cloud sync across devices,
// create a Firebase project and set the VITE_FIREBASE_CONFIG env var (JSON string)
// in a .env file. Without it, the app automatically runs in "Local Mode".
let app, auth, db, appId;
try {
  const rawConfig = import.meta.env.VITE_FIREBASE_CONFIG;
  if (rawConfig) {
    const firebaseConfig = JSON.parse(rawConfig);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = import.meta.env.VITE_APP_ID || 'default-app-id';
  } else {
    console.info("No Firebase config found — running in Local Mode (data saved to this browser only).");
  }
} catch (e) {
  console.warn("Firebase Init Error (Running in Local Mode):", e);
}

// --- CONFIGURATION ---
const COMPANY_LOGO = "/logo.png"; 

// --- CUSTOM HOOK: PERSISTENT STATE ---
const usePersistentState = (key, initialValue) => {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [state, setValue];
};

// --- HELPER: EXPORT TO CSV ---
const exportToCSV = (headers, rows, filename) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- STYLES ---
const marqueeStyle = `
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-marquee {
    animation: marquee 30s linear infinite;
  }
  .animate-marquee:hover {
    animation-play-state: paused;
  }
  /* Custom scrollbar for Traffic Table */
  .custom-scroll::-webkit-scrollbar {
      height: 8px;
      width: 8px;
  }
  .custom-scroll::-webkit-scrollbar-track {
      background: #f1f5f9;
  }
  .custom-scroll::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
  }
  .custom-scroll::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
  }
  
  @media print {
    aside, header, .no-print { display: none !important; }
    main { padding: 0; margin: 0; width: 100%; max-width: 100%; overflow: visible; }
    .print-break-inside { break-inside: avoid; }
    body { background-color: white; }
    .shadow-md, .shadow-sm { box-shadow: none !important; border: 1px solid #ccc; }
  }
`;

// --- CONSTANTS ---
const YARN_STAGES = ["Yarn Store", "Winding", "Knitting Stock"];

const PRODUCTION_STAGES = [
  "Knitting", "Linking", "Trimming", "Mending", "Light Check", "Wash", 
  "Final Light Check", "Iron", "Sewing", "Attachment", "PQC", "Final/Getup"
];

const BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const TRAFFIC_BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
const ZERO_THREAD_SECTIONS = ['Lot Pass', 'PQC', 'Final/Getup'];

const WORK_HOURS = [
  "08:00 - 09:00", "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", 
  "12:00 - 01:00", "02:00 - 03:00", "03:00 - 04:00", "04:00 - 05:00", 
  "05:00 - 06:00", "06:00 - 07:00", "Overtime"
];

const DEFECT_LISTS = {
  "Knitting": [
    "Needle Drop/Needle Mark", "Tension Loose/Tight", "Uneven Yarn Dyeing", 
    "Yarn Contramination (Not Visible Out Side-Minor)", "Puckering Yarn", 
    "Nylon Show'/Cotton Mising", "Color Shade/Dust Yarn", "Thick-thin Yarn/Wrong Yarn",
    "Starting Loose/Tight", "Sleeve Both Side Up/Down", "Measurement Problem", 
    "Side Up/Down", "Bottom & Cuff Rib Elastic Colour Shade", "Hole/Single Ply", "Oil Spot/Dirty Mark"
  ],
  "Linking": [
    "1) NEEDLE DROP OPEN SEAM RIB/CUFF", "2) BOTTOM / SLEEVE JOINT UPDOWN", "3) ARMHOLE/SHOULDER UPDOWN",
    "4) SKIP STITCH / FALSE STITCH UNEVEN", "5) POOR NECK SHAPE", "6) YARN/COLOR SHADE / STRIPE/COLOR",
    "7) POCKET JOINT UP-DOWN", "8) MEASUREMENT UPDOWN TENSION", "9) LOOSE / TIGHT NECK /PIPING/ SIZE",
    "10) MISTAKE MINIMUM NECK STITCH", "11) L. M. G."
  ],
  "Trimming": [
    "NEEDLE DROP", "TUCK MISSING/BURTUCK MISSING", "RIB CUFF/BOTOM UP DOWN", 
    "LOOSE YARN/ UNCUT", "WRONG MENDING", "HIDING MISSING", 
    "LINKING FALSE STITCH", "OIL/ DIRTY SPOT", "Others"
  ],
  "Mending": [
    "NEEDLE DROP", "TUCK MISSING/BURTUCK MISSING", "RIB CUFF/BOTOM UP DOWN", 
    "LOOSE YARN/ UNCUT", "WRONG MENDING", "HIDING MISSING", 
    "LINKING FALSE STITCH", "OIL/ DIRTY SPOT", "Others"
  ],
  "Light Check": [
    "NEEDLE DROP", "TUCK MISSING/BURTUCK MISSING", "RIB CUFF/BOTOM UP DOWN", 
    "LOOSE YARN/ UNCUT", "WRONG MENDING", "HIDING MISSING", 
    "LINKING FALSE STITCH", "OIL/ DIRTY SPOT", "Others"
  ],
  "Final Light Check": [
    "NEEDLE DROP", "TUCK MISSING/BURTUCK MISSING", "RIB CUFF/BOTOM UP DOWN", 
    "LOOSE YARN/ UNCUT", "WRONG MENDING", "HIDING MISSING", 
    "LINKING FALSE STITCH", "OIL/ DIRTY SPOT", "Others"
  ],
  "Wash": [
    "COLOR SHADE", "PUCKERING", "COLOR BLIDING", "CONTAMINATION/VISIBLE NYLON", 
    "DIRTY SPOT", "HANDFEEL PROBLEM", "OIL SPOT", "DYER HIGH/LOW", "CHEMICAL SPOT", "OTHERS"
  ],
  "Iron": [
    "NECK WIDTH (+ -)", "FRONT NECK DROP (+ -)", "SHOULDER PROBLEM (+ -)", 
    "ARMHOLE /NECK SHAPE POOR (+ -)", "BREAT PROBLEM (+ -)", "CHEST PROBLEM (+ -)", 
    "RIB / CUFF (+ -)", "BODY LENGTH (+ -)", "SLEEVE LENGTH (+ -)", 
    "CENTER FRONT (+ -)", "SLEEVE UP-DOWN", "OTHERS"
  ],
  "Sewing": [
    "OPEN STITCH", "SLANTED LABEL", "CONTRAST COLOR", "SKIP STITCH/BROKEN STITCH", 
    "OIL/DIRTY SPOT", "NECK TAP OPEN", "JOIN STITCH", "NEEDLE CUT", 
    "SIZE MISTAKE/STYLE MISTAKE", "COLOR MISTAKE", "MEASUREMENT PROBLEM", "OTHERS"
  ],
  "PQC": [
    "OIL/DIRTY SPOT", "TUCK PROBLEM", "DROP NEEDLE/HOLE", "KNOT/LOOSE YARN", 
    "LABEL OPEN STITCH/SLANTED", "NECK TAP OPEN", "WRONG MENDING", "NEEDLE COUNT", 
    "PULL OUT", "COLOR SHADE", "UN-CUT", "OTHERS"
  ],
  "Final/Getup": [
    "OIL/DIRTY SPOT", "BROKEN STITCH/OPEN SEAM", "DROP NEEDLE/HOLE", "KNOT/LOOSE YARN", 
    "LABEL OPEN STITCH/SLANTED", "NECK TAP OPEN", "RIB/CUFF UP-DOWN", "CONTRAST", 
    "PULL YARN", "POOR SHAPE", "UN-CUT", "OTHERS"
  ],
  "General": ["Uncut Thread", "Broken Stitch", "Stain", "Shading", "Measurement", "Fabric Hole", "Missing Label"]
};

const STAGE_COLORS = [
  'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-yellow-400', 
  'bg-lime-400', 'bg-green-400', 'bg-emerald-400', 'bg-teal-400',
  'bg-cyan-400', 'bg-sky-400', 'bg-blue-400', 'bg-indigo-400'
];

// Generate Users dynamically
const SECTION_USERS = PRODUCTION_STAGES.map((stage, index) => ({
  id: index + 10,
  email: `${stage.toLowerCase().replace(/ /g, '').replace('/', '')}@factory.com`,
  password: "123",
  role: "Section QI",
  name: `${stage} In-Charge`,
  assignedSection: stage
}));

const ALL_USERS = [
  { id: 1, email: "admin@factory.com", password: "Password123", role: "Admin", name: "System Admin", assignedSection: null },
  { id: 2, email: "yarnstore@factory.com", password: "123", role: "Yarn Manager", name: "Yarn Store", assignedSection: "Yarn Store" },
  ...SECTION_USERS
];

// --- Components ---

// *** Simple SVG Line Chart for Traffic ***
const TrafficLineChart = ({ data, color = "#2563eb", title }) => {
  // data: [{ week: 1, avg: 85 }, ...]
  const height = 300;
  const width = 800;
  const padding = 40;
  const graphHeight = height - padding * 2;
  const graphWidth = width - padding * 2;

  // Filter only weeks with data or at least show first 10
  let activeData = data.filter(d => d.avg > 0);
  if (activeData.length === 0) activeData = data.slice(0, 10); // Show initial range if empty

  // DYNAMIC SCALE LOGIC
  const maxDataVal = Math.max(...activeData.map(d => parseFloat(d.avg))) || 0;
  const maxVal = Math.ceil(maxDataVal * 1.1) || 10; // 10% buffer or default to 10
  
  const getX = index => padding + (index * (graphWidth / (Math.max(activeData.length, 10) - 1)));
  const getY = val => height - padding - ((val / maxVal) * graphHeight);

  const points = activeData.map((d, i) => `${getX(i)},${getY(d.avg)}`).join(' ');

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full overflow-x-auto">
       <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full min-w-[600px]">
          {title && (
             <text x={width/2} y={20} fontSize="14" fontWeight="bold" textAnchor="middle" fill="#334155">{title}</text>
          )}
          {/* Background Grid - Dynamic based on maxVal */}
          <g stroke="#e2e8f0" strokeWidth="1">
             {gridSteps.map(f => {
               const val = (maxVal * f);
               return (
                 <line key={val} x1={padding} y1={getY(val)} x2={width - padding} y2={getY(val)} />
               );
             })}
          </g>
          {/* Y Axis Labels - Dynamic */}
          <g fill="#94a3b8" fontSize="10" textAnchor="end">
             {gridSteps.map(f => {
               const val = (maxVal * f);
               return (
                 <text key={val} x={padding - 5} y={getY(val) + 3}>{val.toFixed(1)}%</text>
               );
             })}
          </g>
          {/* Line */}
          <polyline fill="none" stroke={color} strokeWidth="3" points={points} />
          {/* Points */}
          {activeData.map((d, i) => (
             <g key={i}>
                <circle cx={getX(i)} cy={getY(d.avg)} r="4" fill={color} stroke="#fff" strokeWidth="2" />
                <text x={getX(i)} y={getY(d.avg) - 10} fontSize="10" textAnchor="middle" fill="#1e293b" fontWeight="bold">
                  {d.avg > 0 ? d.avg + '%' : ''}
                </text>
                <text x={getX(i)} y={height - padding + 15} fontSize="10" textAnchor="middle" fill="#64748b">
                  W-{d.week}
                </text>
             </g>
          ))}
       </svg>
    </div>
  );
};


// *** Top Defects Card Component ***
const TopSectionDefectsCard = ({ section, defects, icon: Icon, colorClass }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition">
    <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <div className={`p-2 rounded-lg bg-opacity-10 ${colorClass}`}>
          <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        {section}
      </h3>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top 3 Defects</span>
    </div>
    <div className="space-y-3 flex-1">
      {defects.length > 0 ? (
        defects.map((d, i) => (
          <div key={i} className="flex justify-between items-center text-sm group">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className={`text-[10px] font-bold w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full ${i === 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                {i + 1}
              </span>
              <span className="truncate text-slate-600 font-medium group-hover:text-slate-900 transition" title={d.name}>{d.name}</span>
            </div>
            <span className={`font-bold ${i === 0 ? 'text-red-600' : 'text-slate-700'}`}>{d.count}</span>
          </div>
        ))
      ) : (
        <div className="text-center text-slate-400 text-xs py-6 flex flex-col items-center">
          <CheckCircle className="w-6 h-6 mb-2 text-slate-200" />
          No defects recorded
        </div>
      )}
    </div>
  </div>
);

// *** 3D Bar Chart Component ***
const DashboardDHUChart = ({ stages, productionData, selectedDate }) => {
  const [chartDate, setChartDate] = useState(new Date().toISOString().split('T')[0]);

  const dhuData = useMemo(() => {
    return stages.map((stage) => {
      let totalChecked = 0;
      let totalDefects = 0;
      productionData.forEach(log => {
        if (log.date === selectedDate && log.section === stage) {
           Object.values(log.hourlyData || {}).forEach(hourData => {
             totalChecked += (parseInt(hourData.checkQty) || 0);
             if (hourData.defects) {
                totalDefects += Object.values(hourData.defects).reduce((a, b) => a + (parseInt(b) || 0), 0);
             }
           });
        }
      });
      const dhu = totalChecked > 0 ? ((totalDefects / totalChecked) * 100).toFixed(2) : "0.00";
      return { name: stage, value: dhu };
    });
  }, [stages, selectedDate, productionData]);

  const maxDataValue = Math.max(...dhuData.map(d => parseFloat(d.value)));
  const maxValue = maxDataValue > 5 ? Math.ceil(maxDataValue + 1) : 6;
  const yAxisLabels = useMemo(() => {
    const labels = [];
    for (let i = maxValue; i >= 0; i--) { labels.push(i); }
    return labels;
  }, [maxValue]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            All Sections Daily DHU%
          </h3>
          <p className="text-xs text-slate-500 mt-1">Real-time quality performance based on QC inputs for {selectedDate}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 pr-2">
            <div className="w-2 h-2 bg-blue-500 rounded-sm"></div> Target: &lt; 3%
          </span>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="h-64 flex items-end justify-between gap-3 min-w-[800px] px-4 pb-2 border-b border-slate-200 relative">
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between text-xs text-slate-300 pb-8 pl-8">
            {yAxisLabels.map((val, idx) => (
              <div key={idx} className="border-t border-dashed border-slate-100 w-full relative">
                <span className="absolute -left-6 -top-2 w-4 text-right">{val}%</span>
              </div>
            ))}
          </div>
          <div className="w-8 flex-shrink-0"></div> 
          {dhuData.map((item, idx) => {
            const numValue = parseFloat(item.value);
            const heightPct = Math.min((numValue / maxValue) * 100, 100);
            const isTargetMet = numValue < 3;
            
            return (
              <div key={idx} className="group relative flex flex-col items-center flex-1 h-full justify-end z-10">
                <div className={`absolute -top-8 mb-1 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border pointer-events-none z-30 transition-all duration-500 ${heightPct > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${isTargetMet ? 'text-blue-700 bg-blue-50 border-blue-100' : 'text-red-700 bg-red-50 border-red-100'}`} style={{ bottom: `${heightPct}%`, top: 'auto', marginBottom: '8px' }}>
                  {item.value}%
                </div>
                <div className="relative w-full max-w-[40px] transition-all duration-700 ease-out hover:scale-105" style={{ height: `${heightPct}%` }}>
                  <div className={`absolute inset-0 rounded-t-sm z-20 shadow-lg ${isTargetMet ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-gradient-to-t from-red-600 to-red-400'}`}></div>
                  <div className={`absolute h-2 w-full -top-2 left-1 origin-bottom-left transform -skew-x-[45deg] z-10 rounded-tr-sm opacity-80 ${isTargetMet ? 'bg-blue-300' : 'bg-red-300'}`}></div>
                  <div className={`absolute w-2 h-full -right-2 -top-1 origin-top-left transform -skew-y-[45deg] z-10 rounded-br-sm opacity-60 ${isTargetMet ? 'bg-blue-800' : 'bg-red-800'}`}></div>
                </div>
                <div className="absolute -bottom-2 translate-y-full w-24 text-center">
                  <div className="text-[10px] font-bold text-slate-500 -rotate-45 origin-top-left text-left whitespace-nowrap overflow-visible pl-2 pt-2 hover:text-blue-600 transition-colors">
                    {item.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="h-16"></div>
      </div>
    </div>
  );
};

// *** Live Production Ticker ***
const LiveProductionTicker = ({ orders, stages }) => {
  const displayOrders = useMemo(() => {
    return orders.length > 0 ? [...orders, ...orders] : [];
  }, [orders]);

  if (displayOrders.length === 0) return null;

  return (
    <div className="mb-8 overflow-hidden relative group">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>
      
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Live Floor Status</h3>
      </div>
      <div className="flex gap-4 animate-marquee w-max hover:[animation-play-state:paused]">
        {displayOrders.map((order, idx) => {
            const totalStockYarn = (order.yarn_stock?.['yarn store'] || 0) + (order.yarn_stock?.['winding'] || 0) + (order.yarn_stock?.['knitting stock'] || 0);

            return (
              <div key={`${order.id}-${idx}`} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 w-[320px] flex-shrink-0 hover:shadow-lg transition flex flex-col">
                <div className="flex gap-4 mb-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={order.image} alt="style" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 truncate" title={order.style_no}>{order.style_no}</h4>
                    <p className="text-xs text-slate-500 truncate">{order.buyer}</p>
                    
                    {/* Color and Yarn Info */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {order.color && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">
                          <Palette className="w-3 h-3" /> {order.color}
                        </span>
                      )}
                      <span className="text-[10px] font-bold bg-blue-50 px-1.5 py-0.5 rounded text-blue-600 border border-blue-100">{order.qty} pcs</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto space-y-2 border-t pt-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex justify-between">
                    <span>Active Sections</span>
                    {totalStockYarn > 0 && <span className="text-green-600 font-bold">Yarn Stock: {totalStockYarn}lb</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {stages.map((stage) => {
                      const stageKey = stage.toLowerCase();
                      const qty = order.stages && order.stages[stageKey] ? order.stages[stageKey] : 0;
                      // SHOW ALL SECTIONS WITH QTY > 0
                      if (qty <= 0) return null; 
                      return (
                        <div key={stage} className="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-600 truncate max-w-[70px]" title={stage}>{stage}</span>
                          <span className="text-[10px] font-bold text-slate-800">{qty}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
        })}
      </div>
    </div>
  );
};

// --- AI REPORT MODAL ---
const AIReportModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;
  const { report, loading } = data;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
             <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-lg text-white">
               <Sparkles className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-lg text-slate-800">AI Daily Quality Report</h3>
               <p className="text-xs text-slate-500">Generated by Gemini AI</p>
             </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-48 gap-4 text-slate-400">
                <Loader className="w-10 h-10 animate-spin text-purple-500" />
                <p className="animate-pulse">Analyzing production data...</p>
             </div>
           ) : (
             <div className="prose prose-sm max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: report }}></div>
           )}
        </div>

        {!loading && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
            <button 
               onClick={() => navigator.clipboard.writeText(report.replace(/<[^>]*>?/gm, ''))} 
               className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 font-medium text-sm transition"
            >
               <Copy className="w-4 h-4" /> Copy Text
            </button>
            <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold text-sm transition">
               Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ... existing components (Login, DashboardCard, etc.) ...

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    const user = ALL_USERS.find(u => u.email === email && u.password === password);
    if (user) onLogin(user); else setError('Invalid credentials');
  };
  const fillCredentials = (type) => {
    if (type === 'admin') { setEmail('admin@factory.com'); setPassword('Password123'); }
    else if (type === 'yarn') { setEmail('yarnstore@factory.com'); setPassword('123'); }
    else if (type === 'linking') { setEmail('linking@factory.com'); setPassword('123'); }
  };
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-6 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg overflow-hidden border-4 border-blue-500">
             <img src={COMPANY_LOGO} alt="Factory Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white">Factory QMS</h1>
          <p className="text-blue-100">Quality Management System</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email ID</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
            <button type="submit" className="w-full bg-slate-900 text-white py-2 px-4 rounded-md hover:bg-slate-800 transition font-medium">Login</button>
          </form>
          <div className="mt-6 border-t pt-4">
            <p className="text-xs text-slate-400 text-center mb-2">Quick Login (Demo)</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => fillCredentials('admin')} className="text-xs bg-slate-100 hover:bg-slate-200 py-1 rounded">Admin</button>
              <button onClick={() => fillCredentials('yarn')} className="text-xs bg-slate-100 hover:bg-slate-200 py-1 rounded">Yarn Store</button>
              <button onClick={() => fillCredentials('linking')} className="text-xs bg-slate-100 hover:bg-slate-200 py-1 rounded">Linking</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm shadow-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
};

const StockTransferModal = ({ isOpen, onClose, order, stages, onTransfer, user, isSaving, onDeleteLog }) => {
  const [activeTab, setActiveTab] = useState('yarn'); // 'yarn' | 'production'
  
  // Yarn State
  const [yarnData, setYarnData] = useState({
    source: 'Supplier', // Supplier, Yarn Store, Winding
    destination: 'Yarn Store', // Yarn Store, Winding, Knitting Stock
    qty: 0,
    lotNo: '',
    supplierName: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Production State
  const [prodData, setProdData] = useState({
    fromStage: 'New Input', // Default to New Input
    toStage: stages[0],
    qty: 0
  });
  
  // Helpers for CSV Export
  const handleDownloadDetails = () => {
      const headers = [
        "PO No", "Style", "Buyer", "Color", "Order Qty", "Status",
        "Yarn Recv (Lb)", "Yarn Store Stock", "Winding Stock", "Knitting Stock",
        ...PRODUCTION_STAGES.map(s => `${s} (Pcs)`),
      ];
      
      const yarnRecv = order.yarn_logs?.reduce((sum, l) => sum + (l.qty || 0), 0) || 0;
      const prodCols = PRODUCTION_STAGES.map(s => order.stages?.[s.toLowerCase()] || 0);
      
      const row = [
          order.po_no, order.style_no, order.buyer, order.color || '-', order.qty, order.status,
          yarnRecv,
          order.yarn_stock?.['yarn store'] || 0,
          order.yarn_stock?.['winding'] || 0,
          order.yarn_stock?.['knitting stock'] || 0,
          ...prodCols
      ];
      
      exportToCSV(headers, [row], `Order_${order.po_no}_Details.csv`);
  };

  const isYarnUser = user?.role === 'Admin' || user?.role === 'Yarn Manager';

  // Helper to determine possible destinations based on source
  const getYarnDestinations = (source) => {
    if (source === 'Supplier') return ['Yarn Store'];
    if (source === 'Yarn Store') return ['Winding', 'Knitting Stock'];
    if (source === 'Winding') return ['Knitting Stock'];
    return [];
  };

  useEffect(() => {
    if (isOpen) {
        // Reset Logic
        setYarnData({
            source: 'Supplier',
            destination: 'Yarn Store',
            qty: 0,
            lotNo: '',
            supplierName: '',
            date: new Date().toISOString().split('T')[0]
        });
        setProdData({
            fromStage: 'New Input',
            toStage: stages[0],
            qty: 0
        });
    }
  }, [isOpen, stages]);

  if (!isOpen || !order) return null;

  const currentYarnStock = order.yarn_stock ? (order.yarn_stock[yarnData.source.toLowerCase()] || 0) : 0;
  
  // Logic for Current Production Stock display
  const currentProdStock = prodData.fromStage !== 'New Input' && order.stages && order.stages[prodData.fromStage.toLowerCase()] 
    ? order.stages[prodData.fromStage.toLowerCase()] 
    : 0;

  const handleYarnTransfer = () => {
      onTransfer({
          type: 'yarn',
          data: { ...yarnData, qty: parseInt(yarnData.qty) }
      });
  };

  const handleProdTransfer = () => {
      onTransfer({
          type: 'production',
          data: { ...prodData, qty: parseInt(prodData.qty) }
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <div>
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <Activity className="w-5 h-5 text-blue-600" /> Move Stock
              </h3>
              <p className="text-xs text-slate-500 mt-1">PO: <strong>{order.po_no}</strong> | Style: {order.style_no}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-red-500" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
            <button 
                onClick={() => setActiveTab('yarn')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'yarn' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                <Factory className="w-4 h-4" /> Yarn (Lb)
            </button>
            <button 
                onClick={() => setActiveTab('production')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'production' ? 'border-purple-600 text-purple-600 bg-purple-50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                <Shirt className="w-4 h-4" /> Production (Pcs)
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
            {/* Download Button inside Modal */}
            <div className="mb-4 flex justify-end">
                <button onClick={handleDownloadDetails} className="flex items-center gap-2 text-xs font-bold bg-green-50 text-green-700 px-3 py-1.5 rounded border border-green-100 hover:bg-green-100 transition">
                    <Download className="w-3 h-3" /> Download Details CSV
                </button>
            </div>

            {/* YARN TAB CONTENT */}
            {activeTab === 'yarn' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded text-xs text-blue-800 mb-4">
                        Manage Raw Material Flow (Lb). Does not affect Order Qty (Pcs).
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                            <input 
                                type="date" 
                                className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={yarnData.date}
                                onChange={e => setYarnData({...yarnData, date: e.target.value})}
                            />
                        </div>
                         {/* Only show Lot No if Receiving */}
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lot / Challan No</label>
                            <input 
                                type="text" 
                                className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Optional"
                                value={yarnData.lotNo}
                                onChange={e => setYarnData({...yarnData, lotNo: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">From</label>
                             <select 
                                className="w-full border rounded p-2 text-sm outline-none bg-slate-50"
                                value={yarnData.source}
                                onChange={e => {
                                    const newSource = e.target.value;
                                    const newDestOptions = getYarnDestinations(newSource);
                                    setYarnData({
                                        ...yarnData, 
                                        source: newSource, 
                                        destination: newDestOptions[0] || '' 
                                    });
                                }}
                             >
                                 <option value="Supplier">Supplier</option>
                                 <option value="Yarn Store">Yarn Store</option>
                                 <option value="Winding">Winding</option>
                             </select>
                             {yarnData.source !== 'Supplier' && (
                                 <p className="text-[10px] text-slate-400 mt-1 text-right">Stock: {currentYarnStock} lb</p>
                             )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 mt-4" />
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To</label>
                             <select 
                                className="w-full border rounded p-2 text-sm outline-none bg-slate-50"
                                value={yarnData.destination}
                                onChange={e => setYarnData({...yarnData, destination: e.target.value})}
                             >
                                 {getYarnDestinations(yarnData.source).map(d => (
                                     <option key={d} value={d}>{d}</option>
                                 ))}
                             </select>
                        </div>
                    </div>

                    {yarnData.source === 'Supplier' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Supplier Name</label>
                            <input 
                                type="text" 
                                className="w-full border rounded p-2 text-sm outline-none font-medium text-slate-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Supplier Name"
                                value={yarnData.supplierName}
                                onChange={e => setYarnData({...yarnData, supplierName: e.target.value})}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity (Lb)</label>
                        <input 
                            type="number" 
                            min="1"
                            className="w-full border rounded p-2 text-lg font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"
                            value={yarnData.qty}
                            onChange={e => setYarnData({...yarnData, qty: e.target.value})}
                        />
                    </div>

                    <button 
                        onClick={handleYarnTransfer}
                        disabled={isSaving || (yarnData.source !== 'Supplier' && yarnData.qty > currentYarnStock) || !yarnData.qty}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : 'Confirm Yarn Transfer'}
                    </button>
                    
                    {/* Recent Yarn Logs */}
                    {order.yarn_logs && order.yarn_logs.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Recent Supplier Receipts</p>
                            <div className="space-y-2 max-h-32 overflow-y-auto custom-scroll pr-1">
                                {order.yarn_logs.slice().reverse().map((log, i) => {
                                    // Calculate actual index in original array (reversed view)
                                    const originalIndex = order.yarn_logs.length - 1 - i;
                                    return (
                                        <div key={i} className="text-xs bg-slate-50 p-2 rounded border border-slate-100 flex justify-between items-center group">
                                            <div>
                                                <span className="font-bold text-slate-700">{log.supplier}</span>
                                                <span className="text-slate-400 block text-[10px]">{log.date} • Lot: {log.lot || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-blue-600">{log.qty} lb</span>
                                                <button 
                                                    onClick={() => onDeleteLog(originalIndex, log)}
                                                    className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition"
                                                    title="Delete Entry"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PRODUCTION TAB CONTENT */}
            {activeTab === 'production' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                     <div className="bg-purple-50 border border-purple-100 p-3 rounded text-xs text-purple-800 mb-4">
                        Update Production Status (Pcs). Use 'New Input' to start Knitting.
                    </div>

                    <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">From</label>
                             <select 
                                className="w-full border rounded p-2 text-sm outline-none bg-slate-50"
                                value={prodData.fromStage}
                                onChange={e => setProdData({...prodData, fromStage: e.target.value})}
                             >
                                 <option value="New Input">✨ New Input (Start)</option>
                                 {stages.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                             {prodData.fromStage !== 'New Input' && (
                                <p className="text-[10px] text-slate-400 mt-1 text-right">In Stock: {currentProdStock}</p>
                             )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 mt-4" />
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To</label>
                             <select 
                                className="w-full border rounded p-2 text-sm outline-none bg-slate-50"
                                value={prodData.toStage}
                                onChange={e => setProdData({...prodData, toStage: e.target.value})}
                             >
                                 {stages.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity (Pcs)</label>
                        <input 
                            type="number" 
                            min="1"
                            className="w-full border rounded p-2 text-lg font-bold text-purple-600 outline-none focus:ring-2 focus:ring-purple-500"
                            value={prodData.qty}
                            onChange={e => setProdData({...prodData, qty: e.target.value})}
                        />
                    </div>
                     
                    {prodData.toStage === 'Knitting' && prodData.fromStage === 'New Input' && (
                         <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                            Recording new Knitting Output (from Yarn).
                         </div>
                    )}

                    <button 
                        onClick={handleProdTransfer}
                        disabled={isSaving || (prodData.fromStage !== 'New Input' && prodData.qty > currentProdStock) || !prodData.qty}
                        className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : 'Update Production Stage'}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const CreateOrderModal = ({ isOpen, onClose, onCreate, isSaving }) => {
  const [formData, setFormData] = useState({ 
    po_no: '', 
    style_no: '', 
    style_desc: '', 
    buyer: '', 
    qty: '', 
    color: '', 
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=200' 
  });
  
  if (!isOpen) return null;
  return (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg flex items-center gap-2"><Package className="w-5 h-5 text-blue-500" /> Create Order</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-slate-500">PO Number</label><input className="w-full border p-2 rounded text-sm" value={formData.po_no} onChange={e => setFormData({...formData, po_no: e.target.value})} /></div>
            <div><label className="block text-xs text-slate-500">Buyer</label><input className="w-full border p-2 rounded text-sm" value={formData.buyer} onChange={e => setFormData({...formData, buyer: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-xs text-slate-500">Style No</label><input className="w-full border p-2 rounded text-sm" value={formData.style_no} onChange={e => setFormData({...formData, style_no: e.target.value})} /></div>
             <div><label className="block text-xs text-slate-500">Color (Optional)</label><input className="w-full border p-2 rounded text-sm font-bold text-purple-700 bg-purple-50" placeholder="e.g. Red" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-1">
             <div><label className="block text-xs text-slate-500">Order Qty (Pcs)</label><input type="number" className="w-full border p-2 rounded text-sm" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} /></div>
          </div>
          <div><label className="block text-xs text-slate-500">Description</label><input className="w-full border p-2 rounded text-sm" value={formData.style_desc} onChange={e => setFormData({...formData, style_desc: e.target.value})} /></div>
          
           {/* IMAGE UPLOAD FIELD */}
          <div>
             <label className="block text-xs font-medium text-slate-500 mb-1">Style Image</label>
             <div className="flex gap-2 items-center">
                <div className="w-16 h-16 bg-slate-100 rounded overflow-hidden flex-shrink-0 border border-slate-200">
                  {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-400 m-auto mt-5"/>}
                </div>
                <div className="flex-1">
                   <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 500000) {
                            alert("File too large. Use < 500KB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => setFormData({...formData, image: reader.result});
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>
             </div>
          </div>

          <button onClick={() => onCreate({...formData, qty: parseInt(formData.qty)})} disabled={isSaving} className="w-full bg-blue-600 text-white font-medium py-2 rounded-md flex justify-center gap-2">
            {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // App State - HYBRID: USE PERSISTENT LOCAL STORAGE
  const [defects, setDefects] = usePersistentState('factory_qms_defects', []);
  const [orders, setOrders] = usePersistentState('factory_qms_orders', []);
  const [productionData, setProductionData] = usePersistentState('factory_qms_prod', []);
  // Traffic Light state
  const [trafficView, setTrafficView] = useState('menu'); // 'menu', 'traffic', 'zero'
  const [trafficLights, setTrafficLights] = usePersistentState('factory_traffic_lights', {});
  const [trafficData, setTrafficData] = usePersistentState('factory_traffic_data',
    Array.from({ length: 52 }, (_, i) => ({ // Updated to 52 Weeks
      week: i + 1,
      date: '',
      values: Array(13).fill(null)
    }))
  );
  
  // --- ZERO THREAD STATE ---
  const [zeroThreadSection, setZeroThreadSection] = useState('PQC');
  const [zeroThreadDaily, setZeroThreadDaily] = usePersistentState('zero_thread_daily', []);
  const [zeroThreadWeekly, setZeroThreadWeekly] = usePersistentState('zero_thread_weekly', []);
  const [ztDailyInput, setZtDailyInput] = useState({ date: new Date().toISOString().split('T')[0], checkQty: '', loose: '', uncut: '' });
  const [ztWeeklyInput, setZtWeeklyInput] = useState({ week: '', percent: '' });
  
  // NEW: State for Zero Thread Filters and Auto Calc
  const [ztMonth, setZtMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [ztRange, setZtRange] = useState({ start: '', end: '' });

  // --- AI Report State ---
  const [aiReportOpen, setAiReportOpen] = useState(false);
  const [aiReportData, setAiReportData] = useState({ report: null, loading: false });

  // --- Reporting & DHU State ---
  const [reportMode, setReportMode] = useState('input'); // 'input' or 'summary'
  const [currentDHUEntry, setCurrentDHUEntry] = useState({ date: new Date().toISOString().split('T')[0], section: 'Linking', qiName: '', block: BLOCKS[0] });
  
  // NEW: State to hold ALL hourly data for the current day view
  const [dayData, setDayData] = useState({});

  const [dashboardDate, setDashboardDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  
  // --- DASHBOARD CONFIG STATE ---
  const [dashboardConfig, setDashboardConfig] = usePersistentState('factory_qms_config', {
    showStats: true,
    showTopDefects: true,
    showDHUChart: true,
    showTicker: true,
    showFloorStatus: true,
    showWeeklyTrend: true // Added weekly trend toggle
  });
  
  // Traffic Input State
  const [trafficInput, setTrafficInput] = useState({
      week: 0,
      date: new Date().toISOString().split('T')[0],
      blockIdx: 0,
      value: ''
  });

  // Selection State for Bulk Order Download
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // ... existing auth effects ...

  // Auth & Init
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('factory_qms_user');
      if (storedUser) setUser(JSON.parse(storedUser));
      
      if (auth) {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } else {
        setIsLoading(false); 
      }
    };
    initAuth();
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (u) => { if (u) setIsLoading(false); });
      return () => unsubscribe();
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('factory_qms_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('factory_qms_user');
  };

  // Data Sync
  useEffect(() => {
    if (isLoading || !db) return;
    const unsubOrders = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), (s) => setOrders(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubProd = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'production'), (s) => setProductionData(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubTraffic = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'traffic'), (s) => {
        if (!s.empty) {
            const data = s.docs[0].data();
            setTrafficLights(data.lights || {});
            if (data.trafficData) setTrafficData(data.trafficData);
            if (data.zeroThreadDaily) setZeroThreadDaily(data.zeroThreadDaily);
            if (data.zeroThreadWeekly) setZeroThreadWeekly(data.zeroThreadWeekly);
        }
    });
    return () => { unsubOrders(); unsubProd(); unsubTraffic(); };
  }, [isLoading]);

  // Sync dayData with productionData when selection changes
  useEffect(() => {
    const record = productionData.find(p => p.date === currentDHUEntry.date && p.section === currentDHUEntry.section && p.block === currentDHUEntry.block);
    if (record && record.hourlyData) {
      setDayData(record.hourlyData);
    } else {
      setDayData({});
    }
  }, [productionData, currentDHUEntry]);

  useEffect(() => {
    if (user && user.role !== 'Admin' && user.assignedSection) {
      setCurrentDHUEntry(prev => ({ ...prev, section: user.assignedSection }));
    }
  }, [user]);

  // Modals State
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Derived Stats (Top 3)
  const topDefectsMap = useMemo(() => {
    // Filter data by the selected dashboard Date
    const map = { "Knitting": {}, "Linking": {}, "Final/Getup": {} };
    productionData.forEach(record => {
      // Check if record matches selected date
      if (record.date === dashboardDate) {
        if (map[record.section] !== undefined) {
          Object.values(record.hourlyData || {}).forEach(hourData => {
            if (hourData.defects) {
              Object.entries(hourData.defects).forEach(([defect, qty]) => {
                map[record.section][defect] = (map[record.section][defect] || 0) + (parseInt(qty) || 0);
              });
            }
          });
        }
      }
    });
    const result = {};
    Object.keys(map).forEach(section => {
      const sorted = Object.entries(map[section])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));
      result[section] = sorted;
    });
    return result;
  }, [productionData, dashboardDate]);

  // Actions
  const handleCreateOrder = async (data) => {
    setIsSaving(true);
    const stages = {};
    PRODUCTION_STAGES.forEach(s => stages[s.toLowerCase()] = 0);
    const newId = crypto.randomUUID();
    
    // yarn_stock and yarn_logs for Lb management
    const yarn_stock = { "yarn store": 0, "winding": 0, "knitting stock": 0 };
    const yarn_logs = [];

    const newOrder = { id: newId, ...data, status: "Planning", yarn_stock, yarn_logs, stages, timestamp: new Date().toISOString() };
    
    setOrders([...orders, newOrder]);
    setIsCreateOrderOpen(false);
    setIsSaving(false);

    if (db) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', newId), newOrder);
  };

  const initiateDeleteOrder = (id) => setOrderToDelete(id);
  const confirmDeleteOrder = async () => {
    if (orderToDelete) {
      setOrders(orders.filter(o => o.id !== orderToDelete));
      setOrderToDelete(null);
      if (db) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', orderToDelete));
    }
  };

  const handleTransferStock = async (payload) => {
    // payload: { type: 'yarn' | 'production', data: { ... } }
    setIsSaving(true);
    
    const updatedOrders = orders.map(o => {
       if (o.id === selectedOrderForUpdate.id) {
         if (payload.type === 'yarn') {
             // Handle Yarn Transfer (Lb)
             const { source, destination, qty, lotNo, supplierName, date } = payload.data;
             const newYarnStock = { ...(o.yarn_stock || { "yarn store": 0, "winding": 0, "knitting stock": 0 }) };
             const newYarnLogs = [...(o.yarn_logs || [])];

             // Update Logs if Source is Supplier
             if (source === 'Supplier') {
                 newYarnLogs.push({
                     date: date,
                     supplier: supplierName || 'Unknown',
                     qty: qty,
                     lot: lotNo || '-'
                 });
             }

             // Update Stocks
             if (destination) {
                 const destKey = destination.toLowerCase();
                 newYarnStock[destKey] = (newYarnStock[destKey] || 0) + qty;
             }
             if (source !== 'Supplier') {
                 const sourceKey = source.toLowerCase();
                 newYarnStock[sourceKey] = Math.max(0, (newYarnStock[sourceKey] || 0) - qty);
             }

             return { ...o, yarn_stock: newYarnStock, yarn_logs: newYarnLogs };

         } else {
             // Handle Production Transfer (Pcs)
             const { fromStage, toStage, qty } = payload.data;
             const newStages = { ...o.stages };
             
             // Add to destination
             const toKey = toStage.toLowerCase();
             newStages[toKey] = (newStages[toKey] || 0) + qty;
             
             // Deduct from source if not new input
             if (fromStage !== 'New Input' && fromStage !== toStage) {
                 const fromKey = fromStage.toLowerCase();
                 newStages[fromKey] = Math.max(0, (newStages[fromKey] || 0) - qty);
             }

             return { ...o, stages: newStages };
         }
       }
       return o;
    });
    setOrders(updatedOrders);
    
    const targetOrder = updatedOrders.find(o => o.id === selectedOrderForUpdate.id);
    setSelectedOrderForUpdate(null);
    setIsSaving(false);

    if (db) {
      const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', selectedOrderForUpdate.id);
      const { id, ...orderData } = targetOrder; 
      await setDoc(orderRef, orderData, { merge: true });
    }
  };
  
  // NEW: Delete Yarn Log Handler
  const handleDeleteYarnLog = async (logIndex, logData) => {
    if (!selectedOrderForUpdate) return;
    if (!window.confirm("Delete this log? Stock from Yarn Store will be deducted.")) return;

    setIsSaving(true);
    const updatedOrders = orders.map(o => {
        if (o.id === selectedOrderForUpdate.id) {
            const newYarnLogs = [...o.yarn_logs];
            newYarnLogs.splice(logIndex, 1); // Remove log

            // Revert Stock (Deduct from Yarn Store because receipt increased it)
            const newYarnStock = { ...o.yarn_stock };
            newYarnStock['yarn store'] = Math.max(0, (newYarnStock['yarn store'] || 0) - logData.qty);

            return { ...o, yarn_logs: newYarnLogs, yarn_stock: newYarnStock };
        }
        return o;
    });

    setOrders(updatedOrders);
    const targetOrder = updatedOrders.find(o => o.id === selectedOrderForUpdate.id);
    
    // Update the local modal reference so UI updates immediately
    setSelectedOrderForUpdate(targetOrder);
    
    setIsSaving(false);

    if (db) {
        const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'orders', selectedOrderForUpdate.id);
        const { id, ...orderData } = targetOrder; 
        await setDoc(orderRef, orderData, { merge: true });
    }
  };

  const handleSaveDayData = async () => {
    setIsSaving(true);
    // Use the actual state values to find index
    const recordIndex = productionData.findIndex(p => p.date === currentDHUEntry.date && p.section === currentDHUEntry.section && p.block === currentDHUEntry.block);
    
    let updatedProdData = [...productionData];
    let newRecord = null;
    let isNew = false;

    if (recordIndex >= 0) {
      // Update existing
      const record = updatedProdData[recordIndex];
      updatedProdData[recordIndex] = { ...record, hourlyData: dayData, qiName: currentDHUEntry.qiName };
      newRecord = updatedProdData[recordIndex];
    } else {
      // Create New
      isNew = true;
      newRecord = {
        id: crypto.randomUUID(),
        date: currentDHUEntry.date, section: currentDHUEntry.section, block: currentDHUEntry.block, qiName: currentDHUEntry.qiName,
        hourlyData: dayData
      };
      updatedProdData.push(newRecord);
    }

    setProductionData(updatedProdData);
    setIsSaving(false);
    
    if (db) {
      try {
        if (!isNew && newRecord.id) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'production', newRecord.id), { hourlyData: newRecord.hourlyData, qiName: newRecord.qiName });
        } else {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'production'), newRecord);
        }
        alert("Saved successfully!");
      } catch (e) {
        console.error("Save error:", e);
        alert("Error saving to cloud. Data saved locally.");
      }
    } else {
        alert("Saved locally!");
    }
  };

  const handleDeleteDayData = async () => {
    if (!window.confirm("Are you sure you want to delete all data for this Date, Section & Block?")) return;
    
    setIsSaving(true);
    const record = productionData.find(p => p.date === currentDHUEntry.date && p.section === currentDHUEntry.section && p.block === currentDHUEntry.block);
    
    if (record) {
        // Remove from local state
        const updatedProd = productionData.filter(p => p.id !== record.id);
        setProductionData(updatedProd);
        setDayData({}); // Clear current view
        
        // Remove from Firebase
        if (db) {
            try {
               await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'production', record.id));
            } catch (error) {
               console.error("Delete failed:", error);
            }
        }
        alert("Record deleted successfully.");
    }
    setIsSaving(false);
  };

  const handleClearHourData = (hour) => {
    if (!window.confirm(`Clear all data for ${hour}?`)) return;
    setDayData(prev => {
        const newData = { ...prev };
        delete newData[hour]; 
        return newData;
    });
  };

  // --- TRAFFIC LIGHT LOGIC ---
  const handleSaveTrafficData = async () => {
      const { week, blockIdx, date, value } = trafficInput;
      if (!value) return;
      
      const newTrafficData = [...trafficData];
      if (!newTrafficData[week]) newTrafficData[week] = { week: week + 1, values: Array(13).fill(null), hasData: true };
      
      newTrafficData[week].values[blockIdx] = parseFloat(value);
      newTrafficData[week].date = date;
      newTrafficData[week].hasData = true;

      setTrafficData(newTrafficData);
      setTrafficInput({...trafficInput, value: ''});

      if (db) {
         await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'traffic', 'main'), { trafficData: newTrafficData }, { merge: true });
      }
  };
  
  const handleDownloadTrafficExcel = () => {
      const header = ["Week", "Date", ...TRAFFIC_BLOCKS.map(b => `Block ${b}`), "Weekly Average (%)"];
      const rows = trafficData.filter(r => r.hasData).map(row => {
           const validValues = row.values.filter(v => v !== null);
           const avg = validValues.length > 0 ? (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(2) : "0.00";
           return [`WEEK-${row.week}`, row.date || "N/A", ...row.values.map(v => v !== null ? v : "-"), `${avg}%`];
      });
      exportToCSV(header, rows, `Traffic_Light_Report_${new Date().toLocaleDateString()}.csv`);
  };

  // --- ZERO THREAD LOGIC ---
  const handleSaveZeroThreadDaily = async () => {
      const { date, checkQty, loose, uncut } = ztDailyInput;
      if(!date || !checkQty) return alert("Date and Check Qty required");
      
      const check = parseInt(checkQty);
      const defects = (parseInt(loose) || 0) + (parseInt(uncut) || 0);
      
      // Traffic Light Logic for Zero Thread
      let status = 'green';
      if(defects === 2) status = 'yellow';
      if(defects > 2) status = 'red';
      
      const newEntry = {
          id: crypto.randomUUID(),
          date,
          section: zeroThreadSection,
          check,
          defects,
          status,
          timestamp: new Date().toISOString()
      };
      
      const updatedDaily = [...zeroThreadDaily, newEntry];
      setZeroThreadDaily(updatedDaily);
      setZtDailyInput({ ...ztDailyInput, checkQty: '', loose: '', uncut: '' });
      
      if(db) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'traffic', 'main'), { zeroThreadDaily: updatedDaily }, { merge: true });
      }
  };

  // NEW: Calculate Weekly Average from Date Range
  const calculateRangeAvg = () => {
      if(!ztRange.start || !ztRange.end) return alert("Select start and end dates");
      const records = zeroThreadDaily.filter(d => d.date >= ztRange.start && d.date <= ztRange.end && d.section === zeroThreadSection);
      
      if(records.length === 0) {
          alert("No data found for this date range.");
          return;
      }

      const totalChecked = records.reduce((sum, r) => sum + (parseInt(r.check) || 0), 0);
      const totalDefects = records.reduce((sum, r) => sum + (parseInt(r.defects) || 0), 0);

      const avg = totalChecked > 0 ? ((totalDefects / totalChecked) * 100).toFixed(2) : 0;
      setZtWeeklyInput({ ...ztWeeklyInput, percent: avg });
  };

  const handleSaveZeroThreadWeekly = async () => {
     const { week, percent } = ztWeeklyInput;
     if(!week || !percent) return;
     
     const newEntry = {
         id: crypto.randomUUID(),
         section: zeroThreadSection,
         week: parseInt(week),
         percent: parseFloat(percent),
         timestamp: new Date().toISOString()
     };
     
     // Remove existing entry for same week/section if exists
     const filtered = zeroThreadWeekly.filter(w => !(w.week === parseInt(week) && w.section === zeroThreadSection));
     const updatedWeekly = [...filtered, newEntry];
     
     setZeroThreadWeekly(updatedWeekly);
     setZtWeeklyInput({ ...ztWeeklyInput, percent: '' });
     
     if(db) {
         await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'traffic', 'main'), { zeroThreadWeekly: updatedWeekly }, { merge: true });
     }
  };

  const handleDownloadZeroThreadCSV = () => {
     const records = zeroThreadDaily.filter(d => d.section === zeroThreadSection && d.date.startsWith(ztMonth));
     if(records.length === 0) return alert("No data to download for this month.");
     
     const header = ["Date", "Section", "Checked Qty", "Total Defects", "Status"];
     const rows = records.map(r => [r.date, r.section, r.check, r.defects, r.status.toUpperCase()]);
     exportToCSV(header, rows, `Zero_Thread_${zeroThreadSection}_${ztMonth}.csv`);
  };

  const handlePrintZeroThread = () => {
     window.print();
  };

  // --- AI REPORT LOGIC ---
  const handleGenerateReport = async () => {
    setAiReportOpen(true);
    setAiReportData({ report: null, loading: true });
    
    // 1. Gather Data for the selected report date
    const date = reportDate;
    const records = productionData.filter(p => p.date === date);
    
    if (records.length === 0) {
       setAiReportData({ report: `<p>No production data found for <strong>${date}</strong>. Please enter data first.</p>`, loading: false });
       return;
    }

    // 2. Prepare summary stats for AI
    let totalChecked = 0;
    let totalDefects = 0;
    const sectionStats = {};
    const defectCounts = {};

    records.forEach(rec => {
       if (!sectionStats[rec.section]) sectionStats[rec.section] = { checked: 0, defects: 0 };
       
       Object.values(rec.hourlyData || {}).forEach(h => {
          const c = parseInt(h.checkQty) || 0;
          const d = h.defects ? Object.values(h.defects).reduce((a,b)=>a+b,0) : 0;
          
          totalChecked += c;
          totalDefects += d;
          sectionStats[rec.section].checked += c;
          sectionStats[rec.section].defects += d;

          if (h.defects) {
             Object.entries(h.defects).forEach(([def, qty]) => {
                defectCounts[def] = (defectCounts[def] || 0) + qty;
             });
          }
       });
    });

    const dhu = totalChecked > 0 ? ((totalDefects/totalChecked)*100).toFixed(2) : 0;
    const topDefects = Object.entries(defectCounts).sort((a,b) => b[1] - a[1]).slice(0, 5).map(d => `${d[0]} (${d[1]})`).join(', ');

    // 3. Construct Prompt
    const prompt = `
      Act as a Quality Control Manager at Dynamic Sweater Industries Ltd. 
      Analyze this daily production data for ${date}:
      - Total Output Checked: ${totalChecked}
      - Total Defects Found: ${totalDefects}
      - Overall DHU: ${dhu}%
      - Top 5 Defects: ${topDefects}
      - Section Breakdown: ${JSON.stringify(sectionStats)}

      Write a professional daily quality report email summary. 
      - Start with an Executive Summary.
      - Highlight the Best Performing Section (lowest DHU) and Worst Performing Section (highest DHU).
      - List the critical defects that need immediate attention.
      - Provide 3 brief, actionable recommendations for the production team to improve quality tomorrow.
      
      Format the output as clean HTML using <h4>, <p>, <ul>, <li> tags. Do not use markdown code blocks.
    `;

    try {
      // 4. Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate report.";
      setAiReportData({ report: text, loading: false });

    } catch (error) {
      console.error("AI Error:", error);
      setAiReportData({ report: "<p>Error connecting to AI service. Please try again later.</p>", loading: false });
    }
  };

  // Helper to calculate daily summary for a section
  const getSectionStats = (section, date) => {
    const records = productionData.filter(p => p.section === section && p.date === date);
    let checked = 0;
    let defects = 0;
    records.forEach(r => {
       Object.values(r.hourlyData || {}).forEach(h => {
          checked += (h.checkQty || 0);
          if(h.defects) defects += Object.values(h.defects).reduce((a,b)=>a+b,0);
       });
    });
    return { checked, defects, dhu: checked > 0 ? ((defects/checked)*100).toFixed(2) : "0.00" };
  };

  // NEW: Download Report Handler (Single Section - Date Wise)
  const handleDownloadReport = (section, date) => {
    const records = productionData.filter(p => p.section === section && p.date === date);
    
    if (records.length === 0) {
      alert("No data found for this section and date.");
      return;
    }

    const defectList = DEFECT_LISTS[section] || DEFECT_LISTS["General"];
    const headers = ['Date', 'Section', 'Block', 'QI Name', 'Time', 'Checked Qty', ...defectList];
    
    const rows = [];
    records.forEach(record => {
      WORK_HOURS.forEach(hour => {
        const hData = record.hourlyData?.[hour];
        if (hData) {
          const row = [
            record.date,
            record.section,
            record.block,
            record.qiName || '',
            hour,
            hData.checkQty || 0
          ];
          
          defectList.forEach(d => {
            row.push(hData.defects?.[d] || 0);
          });
          
          rows.push(row);
        }
      });
    });

    if (rows.length === 0) {
      alert("No hourly data recorded for this selection.");
      return;
    }

    exportToCSV(headers, rows, `Report_${section}_${date}.csv`);
  };

  // NEW: Download Daily Report Handler (All Sections - Date Wise)
  const handleDownloadDailyReport = () => {
    const date = reportDate;
    const records = productionData.filter(p => p.date === date);
    
    if (records.length === 0) {
      alert("No data found for this date.");
      return;
    }

    const headers = ['Date', 'Section', 'Block', 'QI Name', 'Time', 'Checked Qty', 'Defect Name', 'Defect Qty'];
    const rows = [];

    records.forEach(record => {
      Object.entries(record.hourlyData || {}).forEach(([hour, hData]) => {
         const baseRow = [
           record.date,
           record.section,
           record.block,
           record.qiName || '',
           hour,
           hData.checkQty || 0
         ];
         
         let hasDefects = false;
         if (hData.defects) {
           Object.entries(hData.defects).forEach(([defect, qty]) => {
             if (parseInt(qty) > 0) {
               rows.push([...baseRow, defect, qty]);
               hasDefects = true;
             }
           });
         }
         
         if (!hasDefects && (parseInt(hData.checkQty) > 0)) {
            rows.push([...baseRow, 'None', 0]);
         }
      });
    });

    if (rows.length === 0) {
       alert("No detailed data to export.");
       return;
    }

    exportToCSV(headers, rows, `Full_Daily_Report_${date}.csv`);
  };

  // NEW: Bulk Order Download Handlers
  const handleSelectOrder = (id) => {
    setSelectedOrderIds(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id);
        return [...prev, id];
    });
  };

  const handleDownloadOrders = (ids = []) => {
      const ordersToDownload = ids.length > 0 
        ? orders.filter(o => ids.includes(o.id)) 
        : orders;

      if (ordersToDownload.length === 0) return alert("No orders available to download.");

      const headers = [
        "PO No", "Style", "Buyer", "Color", "Order Qty", "Status",
        "Yarn Recv (Lb)", "Yarn Store Stock", "Winding Stock", "Knitting Stock",
        ...PRODUCTION_STAGES.map(s => `${s} (Pcs)`),
      ];

      const rows = ordersToDownload.map(o => {
        const yarnRecv = o.yarn_logs?.reduce((sum, l) => sum + (l.qty || 0), 0) || 0;
        const prodCols = PRODUCTION_STAGES.map(s => o.stages?.[s.toLowerCase()] || 0);
        return [
          o.po_no, o.style_no, o.buyer, o.color || '-', o.qty, o.status,
          yarnRecv,
          o.yarn_stock?.['yarn store'] || 0,
          o.yarn_stock?.['winding'] || 0,
          o.yarn_stock?.['knitting stock'] || 0,
          ...prodCols
        ];
      });

      exportToCSV(headers, rows, `Orders_Export_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // --- Handlers for Matrix Input ---
  const handleMatrixCheckQty = (hour, val) => {
    setDayData(prev => ({
      ...prev,
      [hour]: {
        ...prev[hour],
        checkQty: parseInt(val) || 0
      }
    }));
  };

  const handleMatrixDefectQty = (hour, defectName, val) => {
    setDayData(prev => {
      const currentHourData = prev[hour] || { checkQty: 0, defects: {} };
      return {
        ...prev,
        [hour]: {
          ...currentHourData,
          defects: {
            ...currentHourData.defects,
            [defectName]: parseInt(val) || 0
          }
        }
      };
    });
  };

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400"><Loader className="w-10 h-10 animate-spin mb-4 text-blue-600" /><p>Connecting...</p></div>;
  if (!user) return <Login onLogin={handleLogin} />;

  const currentDefectList = DEFECT_LISTS[currentDHUEntry.section] || DEFECT_LISTS["General"];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <style>{marqueeStyle}</style>
      
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-full shadow-xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <img src={COMPANY_LOGO} alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight">Factory QMS</h2>
            <div className="flex items-center gap-1.5 mt-1">
               <div className={`relative flex h-2 w-2 ${db ? 'text-green-500' : 'text-amber-500'}`}>
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
               </div>
               <p className="text-xs text-slate-400 font-medium">{db ? 'Cloud Active' : 'Local Mode'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Package} label="Orders & Styles" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <SidebarItem icon={BarChart2} label="Reporting & DHU" active={activeTab === 'reporting'} onClick={() => setActiveTab('reporting')} />
          <SidebarItem icon={Siren} label="Traffic & Zero Thread" active={activeTab === 'traffic'} onClick={() => setActiveTab('traffic')} />
          {user.role === 'Admin' && (
            <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          )}
        </nav>
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 px-3 py-2">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${user.role === 'Admin' ? 'bg-red-500' : 'bg-blue-500'}`}>{user.name.charAt(0)}</div>
             <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{user.name}</p><p className="text-xs text-slate-400 truncate">{user.role}</p></div>
             <button onClick={handleLogout} className="text-slate-400 hover:text-white"><LogOut className="w-4 h-4" /></button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
          
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <header className="mb-8 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Overview</h1>
                  <p className="text-slate-500 mt-1">Real-time production quality insights.</p>
                </div>
                {/* GLOBAL DASHBOARD DATE PICKER */}
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase">Data For:</span>
                  <input 
                    type="date" 
                    value={dashboardDate} 
                    onChange={(e) => setDashboardDate(e.target.value)} 
                    className="text-sm font-medium text-slate-700 outline-none"
                  />
                </div>
              </header>

              {/* TOGGLEABLE COMPONENTS */}
              {dashboardConfig.showTopDefects && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                   <TopSectionDefectsCard section="Knitting" defects={topDefectsMap["Knitting"]} icon={Layers} colorClass="bg-blue-500" />
                   <TopSectionDefectsCard section="Linking" defects={topDefectsMap["Linking"]} icon={Layers} colorClass="bg-purple-500" />
                   <TopSectionDefectsCard section="Final/Getup" defects={topDefectsMap["Final/Getup"]} icon={Layers} colorClass="bg-green-500" />
                </div>
              )}

              {dashboardConfig.showDHUChart && (
                <div className="mt-8"><DashboardDHUChart stages={PRODUCTION_STAGES} productionData={productionData} selectedDate={dashboardDate} /></div>
              )}
              
              {dashboardConfig.showWeeklyTrend && (
                <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Weekly Average (%) Trend
                            </h3>
                             <p className="text-xs text-slate-500 mt-1">Traffic light performance over weeks</p>
                        </div>
                    </div>
                    <div className="h-64 w-full bg-[#fdf2e9] p-4 rounded-lg flex items-center justify-center">
                         <TrafficLineChart data={trafficData.map(d => ({ 
                             week: d.week, 
                             avg: d.values.filter(v => v !== null).length > 0 
                                  ? (d.values.reduce((a,b) => a+(b||0),0) / d.values.filter(v => v!==null).length).toFixed(2) 
                                  : 0 
                         }))} />
                    </div>
                </div>
              )}
              
              {dashboardConfig.showTicker && (
                <div className="mt-8"><LiveProductionTicker orders={orders} stages={PRODUCTION_STAGES} /></div>
              )}
              
              {dashboardConfig.showFloorStatus && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mt-6">
                   <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800">Live Production Floor</h3></div>
                   <div className="space-y-6">
                      {orders.map(order => (
                        <div key={order.id}>
                          <div className="flex justify-between mb-2"><span className="font-medium text-slate-700">{order.po_no} <span className="text-slate-400 text-sm">/ {order.style_no}</span></span><span className="text-sm font-bold text-slate-600">{order.stages && order.stages['final/getup'] ? Math.round((order.stages['final/getup'] / order.qty)*100) : 0}%</span></div>
                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            {PRODUCTION_STAGES.map((stage, idx) => {
                               const qty = order.stages?.[stage.toLowerCase()] || 0;
                               const width = (qty / order.qty) * 100;
                               if (width <= 0) return null;
                               return <div key={stage} className={`h-full ${STAGE_COLORS[idx % STAGE_COLORS.length]}`} style={{ width: `${width}%` }} title={`${stage}: ${qty}`} />;
                            })}
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div><h1 className="text-2xl font-bold text-slate-900">Orders & Styles</h1></div>
                <div className="flex gap-2">
                   {/* Bulk Actions */}
                   {selectedOrderIds.length > 0 && (
                       <div className="flex gap-2 items-center bg-blue-50 p-1 rounded-lg border border-blue-100">
                           <span className="text-xs font-bold text-blue-700 px-2">{selectedOrderIds.length} Selected</span>
                           <button onClick={() => handleDownloadOrders(selectedOrderIds)} className="text-xs bg-white text-blue-700 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100">Download Selected</button>
                           <button onClick={() => setSelectedOrderIds([])} className="text-xs text-slate-400 hover:text-slate-600 px-2">Clear</button>
                       </div>
                   )}
                   <button onClick={() => handleDownloadOrders([])} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-slate-50"><Download className="w-4 h-4"/> Download All</button>
                   {user.role === 'Admin' && (
                     <button onClick={() => setIsCreateOrderOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"><Plus className="w-4 h-4" /> New Order</button>
                   )}
                </div>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map(order => (
                   <div key={order.id} className={`bg-white rounded-xl shadow-sm border ${selectedOrderIds.includes(order.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-100'} overflow-hidden group hover:shadow-md transition relative`}>
                      {/* Selection Checkbox */}
                      <button 
                        onClick={() => handleSelectOrder(order.id)}
                        className="absolute top-2 left-2 z-10 bg-white/90 p-1 rounded shadow-sm"
                      >
                         {selectedOrderIds.includes(order.id) ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                      </button>

                      {user.role === 'Admin' && (
                        <button onClick={() => initiateDeleteOrder(order.id)} className="absolute top-2 right-2 z-10 p-2 bg-white/90 text-red-500 rounded-full shadow opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      )}
                      <div className="h-32 bg-slate-200 relative"><img src={order.image} className="w-full h-full object-cover" /></div>
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4"><div><h3 className="font-bold text-lg">{order.po_no}</h3><p className="text-sm text-slate-500">{order.buyer}</p></div><div className="text-right font-bold">{order.qty}</div></div>
                        
                        {/* Show Color and Yarn Info */}
                        <div className="mb-4 text-xs space-y-1">
                          {order.color && (
                            <div className="flex items-center gap-1.5 text-purple-700 font-medium">
                              <Palette className="w-3 h-3" /> Color: {order.color}
                            </div>
                          )}
                          {order.yarn_logs && order.yarn_logs.length > 0 && (
                            <div className="flex items-center gap-1.5 text-green-700 font-medium">
                               <Database className="w-3 h-3" /> 
                               Yarn Recv: {order.yarn_logs.reduce((acc, log) => acc + (log.qty || 0), 0)} lb
                            </div>
                          )}
                        </div>

                        <div className="border-t pt-3"><button onClick={() => setSelectedOrderForUpdate(order)} className="w-full bg-slate-800 text-white px-3 py-2 rounded text-sm hover:bg-slate-700 flex justify-center gap-2"><Activity className="w-3 h-3" /> Move / Update Stock</button></div>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          )}

          {/* Reporting */}
          {activeTab === 'reporting' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <header className="mb-4 flex justify-between items-end">
                <div>
                   <h1 className="text-3xl font-bold text-slate-900">Reporting & DHU</h1>
                   <p className="text-slate-500 mt-1">Manage daily production and view section reports.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                   <button onClick={() => setReportMode('input')} className={`px-4 py-2 text-sm font-medium rounded-md transition ${reportMode === 'input' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Bulk Input Sheet</button>
                   <button onClick={() => setReportMode('summary')} className={`px-4 py-2 text-sm font-medium rounded-md transition ${reportMode === 'summary' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>View Reports</button>
                </div>
              </header>

              {reportMode === 'input' ? (
                <>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
                    <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> Master Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="lg:col-span-1">
                         <label className="block text-xs font-medium text-slate-500 mb-1">QI Name</label>
                         <div className="relative">
                           <UserCheck className="absolute left-2 top-2 w-4 h-4 text-slate-400" />
                           <input 
                             type="text" 
                             placeholder="Inspector Name"
                             className="w-full pl-8 pr-2 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 bg-slate-50"
                             value={currentDHUEntry.qiName}
                             onChange={(e) => setCurrentDHUEntry({...currentDHUEntry, qiName: e.target.value})}
                           />
                         </div>
                      </div>
                      <div><label className="block text-xs text-slate-500 mb-1">Date</label><input type="date" className="w-full border rounded p-2 text-sm" value={currentDHUEntry.date} onChange={e => setCurrentDHUEntry({...currentDHUEntry, date: e.target.value})} /></div>
                      <div><label className="block text-xs text-slate-500 mb-1">Section</label><select className="w-full border rounded p-2 text-sm" value={currentDHUEntry.section} onChange={e => setCurrentDHUEntry({...currentDHUEntry, section: e.target.value})} disabled={user.role !== 'Admin' && user.assignedSection}>{PRODUCTION_STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                      <div><label className="block text-xs text-slate-500 mb-1">Block</label><select className="w-full border rounded p-2 text-sm" value={currentDHUEntry.block} onChange={e => setCurrentDHUEntry({...currentDHUEntry, block: e.target.value})}>{BLOCKS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                      
                      {/* ACTION BUTTONS (Save & Delete) */}
                      <div className="flex items-end gap-2">
                         <button 
                           onClick={handleDeleteDayData}
                           disabled={isSaving || !productionData.find(p => p.date === currentDHUEntry.date && p.section === currentDHUEntry.section && p.block === currentDHUEntry.block)}
                           className="bg-red-50 text-red-600 p-2 rounded hover:bg-red-100 disabled:opacity-50"
                           title="Delete Entire Record"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                         <button onClick={handleSaveDayData} disabled={isSaving} className="flex-1 bg-green-600 text-white py-2 rounded text-sm font-bold flex items-center justify-center gap-2">{isSaving ? <Loader className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} SAVE ALL</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-900 text-white">
                          <tr>
                            {/* Transposed Header: Top-Left empty, then Hours */}
                            <th className="p-3 sticky left-0 bg-slate-900 z-20 border-r border-slate-700 w-48">Defect / Hour</th>
                            {WORK_HOURS.map(hour => (
                               <th key={hour} className="p-3 text-center border-r border-slate-700 min-w-[80px] text-xs font-normal">
                                 {hour.split(' - ')[0]} 
                                 <button onClick={() => handleClearHourData(hour)} className="ml-1 text-slate-400 hover:text-white"><Eraser className="w-3 h-3 inline" /></button>
                               </th>
                            ))}
                            <th className="p-3 text-center bg-slate-800 w-24">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          
                          {/* Row 1: Checked Quantity */}
                          <tr className="bg-blue-50 font-bold">
                            <td className="p-3 sticky left-0 bg-blue-100 border-r border-blue-200 text-blue-900 z-10">
                              Total Checked
                            </td>
                            {WORK_HOURS.map(hour => (
                               <td key={hour} className="p-1 border-r border-blue-200 text-center">
                                 <input 
                                   type="number" 
                                   min="0"
                                   className="w-full bg-white border border-blue-300 rounded px-1 py-1 text-center text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                   value={dayData[hour]?.checkQty || ''}
                                   onChange={(e) => handleMatrixCheckQty(hour, e.target.value)}
                                   placeholder="0"
                                 />
                               </td>
                            ))}
                            <td className="p-3 text-center text-blue-900 bg-blue-100">
                               {WORK_HOURS.reduce((sum, h) => sum + (dayData[h]?.checkQty || 0), 0)}
                            </td>
                          </tr>

                          {/* Defect Rows */}
                          {currentDefectList.map((defect, i) => {
                             const rowTotal = WORK_HOURS.reduce((sum, h) => sum + (dayData[h]?.defects?.[defect] || 0), 0);
                             return (
                               <tr key={i} className="hover:bg-slate-50 transition-colors">
                                 <td className="p-3 sticky left-0 bg-white border-r border-slate-200 text-slate-600 text-xs font-medium z-10 truncate" title={defect}>
                                   {defect}
                                 </td>
                                 {WORK_HOURS.map(hour => (
                                   <td key={hour} className="p-1 border-r border-slate-100 text-center">
                                     <input 
                                       type="number" 
                                       min="0"
                                       className="w-full border border-slate-200 rounded px-1 py-1 text-center text-xs focus:border-red-500 focus:bg-red-50 outline-none"
                                       value={dayData[hour]?.defects?.[defect] || ''}
                                       onChange={(e) => handleMatrixDefectQty(hour, defect, e.target.value)}
                                       placeholder="-"
                                     />
                                   </td>
                                 ))}
                                 <td className="p-3 text-center font-bold text-red-600 bg-slate-50">
                                   {rowTotal > 0 ? rowTotal : '-'}
                                 </td>
                               </tr>
                             )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                     <div className="flex-1">
                       <label className="block text-xs font-medium text-slate-500 mb-1">Select Report Date</label>
                       <div className="relative">
                         <Calendar className="absolute left-2 top-2 w-4 h-4 text-slate-400" />
                         <input type="date" className="w-full pl-8 pr-2 py-2 border rounded-md text-sm" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
                       </div>
                     </div>
                     <div className="flex gap-2">
                       {/* AI REPORT BUTTON */}
                       <button 
                          onClick={handleGenerateReport} 
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition"
                       >
                          <Sparkles className="w-4 h-4" /> AI Summary
                       </button>

                       <button onClick={handleDownloadDailyReport} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4" /> Full Day CSV
                       </button>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {PRODUCTION_STAGES.map((stage) => {
                       const stats = getSectionStats(stage, reportDate);
                       if(user.role !== 'Admin' && user.assignedSection && user.assignedSection !== stage) return null;

                       return (
                         <div key={stage} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-bold text-slate-800 text-lg">{stage}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${parseFloat(stats.dhu) < 3 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{stats.dhu}% DHU</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                               <div className="bg-slate-50 p-2 rounded">
                                 <p className="text-xs text-slate-500">Checked</p>
                                 <p className="font-bold text-slate-900">{stats.checked}</p>
                               </div>
                               <div className="bg-red-50 p-2 rounded">
                                 <p className="text-xs text-red-500">Defects</p>
                                 <p className="font-bold text-red-900">{stats.defects}</p>
                               </div>
                            </div>
                            <button 
                              onClick={() => handleDownloadReport(stage, reportDate)}
                              className="w-full border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Download Report
                            </button>
                         </div>
                       )
                     })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Traffic Light & Zero Thread Tab */}
          {activeTab === 'traffic' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <header className="mb-8">
                 <h1 className="text-3xl font-bold text-slate-900">Traffic Light & Zero Thread</h1>
                 <p className="text-slate-500 mt-1">Select a module to proceed.</p>
               </header>
               
               {trafficView === 'menu' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <button 
                          onClick={() => setTrafficView('traffic')}
                          className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition flex flex-col items-center justify-center gap-4 group h-64"
                      >
                          <div className="p-6 bg-blue-50 rounded-full group-hover:scale-110 transition">
                              <Siren className="w-12 h-12 text-blue-600" />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-800">Traffic Light Flow</h2>
                          <p className="text-slate-500">Monitor QC Traffic Status</p>
                      </button>

                      <button 
                          onClick={() => setTrafficView('zero')}
                          className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition flex flex-col items-center justify-center gap-4 group h-64"
                      >
                          <div className="p-6 bg-green-50 rounded-full group-hover:scale-110 transition">
                               <ShieldCheck className="w-12 h-12 text-green-600" />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-800">Zero Thread Flow</h2>
                          <p className="text-slate-500">Manage Zero Thread Audits</p>
                      </button>
                  </div>
               )}

               {trafficView === 'traffic' && (
                  <div className="max-w-7xl mx-auto space-y-6">
                      <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-xl text-white shadow-lg">
                        <div>
                           <button onClick={() => setTrafficView('menu')} className="mb-2 text-slate-400 hover:text-white flex items-center gap-2 text-xs uppercase tracking-wider font-bold">
                              <ArrowRight className="w-3 h-3 rotate-180" /> Back
                           </button>
                           <h1 className="text-2xl font-bold italic">Trafic Light Project (Linking)</h1>
                           <p className="opacity-80 text-sm">Dynamic Scaling Graph & Report Section</p>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={handleDownloadTrafficExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition active:scale-95 text-sm font-bold">
                              <Download className="w-4 h-4" /> Download Excel
                           </button>
                           <div className="bg-slate-700 p-3 rounded-lg border border-slate-600 text-center">
                              <span className="text-xs font-bold uppercase block opacity-70">Logic</span>
                              <span className="text-[10px]">🟢 &ge;80% | 🟡 50-79% | 🔴 &lt;50%</span>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                         {/* Input Panel */}
                         <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-md border border-slate-200 h-fit">
                            <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                               <Activity className="w-4 h-4 text-blue-600"/> Data Input
                            </h2>
                            <div className="space-y-3">
                               <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Week</label>
                                  <select 
                                    className="w-full mt-1 p-2 bg-slate-50 border rounded-md outline-none text-sm"
                                    value={trafficInput.week}
                                    onChange={(e) => setTrafficInput({...trafficInput, week: parseInt(e.target.value)})}
                                  >
                                     {Array.from({length: 52}, (_, i) => (
                                       <option key={i} value={i}>Week {i + 1}</option>
                                     ))}
                                  </select>
                               </div>
                               <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                                  <input 
                                    type="date" 
                                    className="w-full mt-1 p-2 bg-slate-50 border rounded-md outline-none text-sm"
                                    value={trafficInput.date}
                                    onChange={(e) => setTrafficInput({...trafficInput, date: e.target.value})}
                                  />
                               </div>
                               <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Block</label>
                                  <select 
                                     className="w-full mt-1 p-2 bg-slate-50 border rounded-md outline-none text-sm"
                                     value={trafficInput.blockIdx}
                                     onChange={(e) => setTrafficInput({...trafficInput, blockIdx: parseInt(e.target.value)})}
                                  >
                                     {TRAFFIC_BLOCKS.map((b, i) => <option key={i} value={i}>Block {b}</option>)}
                                  </select>
                               </div>
                               <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Value (%)</label>
                                  <input 
                                     type="number" 
                                     className="w-full mt-1 p-2 bg-slate-50 border rounded-md outline-none text-sm"
                                     placeholder="e.g. 85.5"
                                     value={trafficInput.value}
                                     onChange={(e) => setTrafficInput({...trafficInput, value: e.target.value})}
                                  />
                               </div>
                               <button 
                                 onClick={handleSaveTrafficData}
                                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md transition shadow-md active:scale-95 text-sm"
                               >
                                  Update Data
                               </button>
                            </div>
                         </div>

                         {/* Chart Panel */}
                         <div className="lg:col-span-3 bg-white p-5 rounded-xl shadow-md border border-slate-200">
                             <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold text-slate-700">Weekly Average (%) Trend</h2>
                             </div>
                             <div className="h-80 w-full bg-[#fdf2e9] p-4 rounded-lg flex items-center justify-center">
                                <TrafficLineChart data={trafficData.map(d => ({ week: d.week, avg: d.values.reduce((a,b) => a+(b||0),0) / (d.values.filter(x=>x!==null).length||1) }))} />
                             </div>
                         </div>
                      </div>

                      {/* Data Table */}
                      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                         <div className="overflow-x-auto custom-scroll">
                            <table className="w-full text-[11px] text-left border-collapse min-w-[1200px]">
                               <thead>
                                  <tr className="bg-slate-100 text-slate-600 uppercase font-bold">
                                     <th className="py-2 px-4 border">Week</th>
                                     <th className="py-2 px-4 border">Date</th>
                                     {TRAFFIC_BLOCKS.map(b => <th key={b} className="py-2 px-2 border text-center">{b}</th>)}
                                     <th className="py-2 px-4 border text-center bg-blue-50 text-blue-700">Weighted AVG</th>
                                  </tr>
                               </thead>
                               <tbody>
                                  {trafficData.map((row, rIdx) => {
                                     const validValues = row.values.filter(v => v !== null);
                                     const avg = validValues.length > 0 ? (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(2) : 0;
                                     const avgColor = avg >= 80 ? 'bg-green-500 text-white' : avg >= 50 ? 'bg-yellow-400 text-slate-800' : avg > 0 ? 'bg-red-500 text-white' : 'bg-slate-50 text-slate-400';
                                     
                                     return (
                                       <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50">
                                          <td className="py-1.5 px-4 border font-bold text-slate-500 bg-slate-50">WEEK-{row.week}</td>
                                          <td className="py-1.5 px-4 border italic text-slate-400">{row.date || '-'}</td>
                                          {row.values.map((v, vIdx) => (
                                             <td key={vIdx} className="py-1.5 px-2 border text-center">{v !== null ? v + '%' : '-'}</td>
                                          ))}
                                          <td className={`py-1.5 px-4 border text-center font-bold ${avgColor}`}>
                                             {avg > 0 ? avg + '%' : '0.00%'}
                                          </td>
                                       </tr>
                                     )
                                  })}
                               </tbody>
                            </table>
                         </div>
                      </div>
                  </div>
               )}

               {trafficView === 'zero' && (
                   <div className="max-w-7xl mx-auto space-y-6">
                      <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-xl text-white shadow-lg">
                        <div>
                           <button onClick={() => setTrafficView('menu')} className="mb-2 text-slate-400 hover:text-white flex items-center gap-2 text-xs uppercase tracking-wider font-bold">
                              <ArrowRight className="w-3 h-3 rotate-180" /> Back
                           </button>
                           <h1 className="text-2xl font-bold italic">Zero Thread Audit Flow</h1>
                           <p className="opacity-80 text-sm">Automated Quality Compliance & Defect Tracking</p>
                        </div>
                        <div className="flex gap-3">
                           <div className="bg-slate-700 p-3 rounded-lg border border-slate-600 text-center">
                              <span className="text-xs font-bold uppercase block opacity-70">Logic</span>
                              <span className="text-[10px]">🟢 &le;1 Defect | 🟡 2 Defects | 🔴 &gt;2 Defects</span>
                           </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* INPUT COLUMN */}
                        <div className="lg:col-span-1 space-y-6">
                           
                           {/* DAILY INPUT CARD */}
                           <div className="bg-white p-5 rounded-xl shadow-md border border-slate-200">
                             <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                               <Activity className="w-4 h-4 text-green-600"/> Daily Audit Input
                             </h2>
                             <div className="space-y-3">
                               <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Section</label>
                                  <select 
                                    className="w-full mt-1 p-2 bg-slate-50 border rounded-md outline-none text-sm"
                                    value={zeroThreadSection}
                                    onChange={(e) => setZeroThreadSection(e.target.value)}
                                  >
                                    {ZERO_THREAD_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                               </div>
                               <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date</label>
                                  <input 
                                    type="date" 
                                    className="w-full mt-1 p-2 bg-slate-50 border rounded-md outline-none text-sm"
                                    value={ztDailyInput.date}
                                    onChange={(e) => setZtDailyInput({...ztDailyInput, date: e.target.value})}
                                  />
                               </div>
                               <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Check Qty (Pcs)</label>
                                  <input 
                                    type="number" 
                                    className="w-full mt-1 p-2 bg-slate-50 border rounded-md outline-none text-sm"
                                    placeholder="e.g. 150"
                                    value={ztDailyInput.checkQty}
                                    onChange={(e) => setZtDailyInput({...ztDailyInput, checkQty: e.target.value})}
                                  />
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                 <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Loose Thread</label>
                                    <input type="number" className="w-full mt-1 p-2 bg-slate-50 border rounded-md outline-none text-sm" placeholder="0" value={ztDailyInput.loose} onChange={(e) => setZtDailyInput({...ztDailyInput, loose: e.target.value})} />
                                 </div>
                                 <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Uncut Thread</label>
                                    <input type="number" className="w-full mt-1 p-2 bg-slate-50 border rounded-md outline-none text-sm" placeholder="0" value={ztDailyInput.uncut} onChange={(e) => setZtDailyInput({...ztDailyInput, uncut: e.target.value})} />
                                 </div>
                               </div>
                               <button onClick={handleSaveZeroThreadDaily} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-md transition shadow-md active:scale-95 text-sm mt-2">
                                  Save Audit
                               </button>
                             </div>
                           </div>

                           {/* WEEKLY INPUT CARD WITH AUTO CALC */}
                           <div className="bg-white p-5 rounded-xl shadow-md border border-slate-200">
                             <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                               <BarChart className="w-4 h-4 text-blue-600"/> Weekly Trend Input
                             </h2>
                             <div className="space-y-3">
                               <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Week No</label>
                                  <select className="w-full mt-1 p-2 bg-slate-50 border rounded-md outline-none text-sm" value={ztWeeklyInput.week} onChange={(e) => setZtWeeklyInput({...ztWeeklyInput, week: e.target.value})}>
                                     <option value="">Select Week</option>
                                     {Array.from({length: 52}, (_, i) => <option key={i+1} value={i+1}>Week {i+1}</option>)}
                                  </select>
                               </div>
                               
                               <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                   <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Auto Calculate Avg</p>
                                   <div className="grid grid-cols-2 gap-2 mb-2">
                                       <input type="date" className="w-full p-1 text-xs border rounded" value={ztRange.start} onChange={e => setZtRange({...ztRange, start: e.target.value})} />
                                       <input type="date" className="w-full p-1 text-xs border rounded" value={ztRange.end} onChange={e => setZtRange({...ztRange, end: e.target.value})} />
                                   </div>
                                   <button onClick={calculateRangeAvg} className="w-full bg-blue-100 text-blue-700 text-xs font-bold py-1 rounded hover:bg-blue-200">Auto Calc Avg</button>
                               </div>

                               <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Average %</label>
                                  <input type="number" step="0.01" className="w-full mt-1 p-2 bg-slate-50 border rounded-md outline-none text-sm" placeholder="e.g. 1.25" value={ztWeeklyInput.percent} onChange={(e) => setZtWeeklyInput({...ztWeeklyInput, percent: e.target.value})} />
                               </div>
                               <button onClick={handleSaveZeroThreadWeekly} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md transition shadow-md active:scale-95 text-sm">
                                  Update Trend
                               </button>
                             </div>
                           </div>

                        </div>

                        {/* DISPLAY COLUMN */}
                        <div className="lg:col-span-3 space-y-6">
                           
                           {/* DAILY DISPLAY BOARD */}
                           <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                  <h3 className="font-bold text-slate-800 text-lg">
                                    "0" Thread Rating Display Board - <span className="text-blue-600">{zeroThreadSection}</span>
                                  </h3>
                                  <div className="flex items-center gap-2">
                                     <span className="text-xs font-bold text-slate-400">Month:</span>
                                     <input type="month" className="border rounded p-1 text-sm font-medium text-slate-600 outline-none" value={ztMonth} onChange={e => setZtMonth(e.target.value)} />
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                 {zeroThreadDaily.filter(d => d.section === zeroThreadSection && d.date.startsWith(ztMonth))
                                    .sort((a,b) => new Date(a.date) - new Date(b.date))
                                    .map((entry, idx) => (
                                    <div key={idx} className="border border-slate-100 rounded-lg p-3 flex flex-col items-center justify-center gap-2 hover:shadow-md transition bg-slate-50">
                                       <span className="text-xs font-bold text-slate-500">{entry.date.split('-')[2]}</span>
                                       <div className={`w-8 h-8 rounded-full shadow-inner border-2 ${entry.status === 'green' ? 'bg-green-500 border-green-600' : entry.status === 'yellow' ? 'bg-yellow-400 border-yellow-500' : 'bg-red-500 border-red-600'}`}></div>
                                       <span className="text-[10px] text-slate-400">Defects: {entry.defects}</span>
                                    </div>
                                 ))}
                              </div>
                              {zeroThreadDaily.filter(d => d.section === zeroThreadSection && d.date.startsWith(ztMonth)).length === 0 && (
                                <div className="text-center text-slate-400 py-8 text-sm">No audit data recorded for {ztMonth} in this section.</div>
                              )}
                           </div>

                           {/* WEEKLY GRAPH */}
                           <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 text-lg">"0" Thread Project - {zeroThreadSection}</h3>
                              </div>
                              <div className="h-64 w-full bg-[#f0f9ff] p-4 rounded-lg flex items-center justify-center">
                                 <TrafficLineChart 
                                   data={Array.from({length: 52}, (_, i) => {
                                      const weekData = zeroThreadWeekly.find(w => w.week === i+1 && w.section === zeroThreadSection);
                                      return { week: i+1, avg: weekData ? weekData.percent : 0 };
                                   })} 
                                   color="#0ea5e9"
                                   title={`Weekly Trend (%)`}
                                 />
                              </div>
                           </div>

                           {/* REPORT & EXPORT SECTION */}
                           <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                              <div>
                                  <h4 className="font-bold text-slate-700">Report & Export</h4>
                                  <p className="text-xs text-slate-500">Download data or print visual reports</p>
                              </div>
                              <div className="flex gap-3">
                                  <button onClick={handleDownloadZeroThreadCSV} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                                      <FileSpreadsheet className="w-4 h-4" /> Download CSV
                                  </button>
                                  <button onClick={handlePrintZeroThread} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                                      <Printer className="w-4 h-4" /> Print Report
                                  </button>
                              </div>
                           </div>

                        </div>
                      </div>
                  </div>
               )}
             </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
             <div className="space-y-6 animate-in fade-in duration-300">
               <header className="mb-8">
                 <h1 className="text-3xl font-bold text-slate-900">Dashboard Settings</h1>
                 <p className="text-slate-500 mt-1">Configure visibility of dashboard widgets.</p>
               </header>
               <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden max-w-2xl">
                 <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Layers className="w-5 h-5"/></div>
                         <div><h3 className="font-medium text-slate-900">Top 3 Defects Cards</h3><p className="text-xs text-slate-500">Show top defects by section</p></div>
                       </div>
                       <button onClick={() => setDashboardConfig({...dashboardConfig, showTopDefects: !dashboardConfig.showTopDefects})} className={`p-2 rounded-full transition ${dashboardConfig.showTopDefects ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-100'}`}>
                         {dashboardConfig.showTopDefects ? <ToggleRight className="w-8 h-8"/> : <ToggleLeft className="w-8 h-8"/>}
                       </button>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><BarChart2 className="w-5 h-5"/></div>
                         <div><h3 className="font-medium text-slate-900">Daily DHU Graph</h3><p className="text-xs text-slate-500">Show 3D Bar Chart</p></div>
                       </div>
                       <button onClick={() => setDashboardConfig({...dashboardConfig, showDHUChart: !dashboardConfig.showDHUChart})} className={`p-2 rounded-full transition ${dashboardConfig.showDHUChart ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-100'}`}>
                         {dashboardConfig.showDHUChart ? <ToggleRight className="w-8 h-8"/> : <ToggleLeft className="w-8 h-8"/>}
                       </button>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><TrendingUp className="w-5 h-5"/></div>
                         <div><h3 className="font-medium text-slate-900">Weekly Trend Graph</h3><p className="text-xs text-slate-500">Show weekly performance trend</p></div>
                       </div>
                       <button onClick={() => setDashboardConfig({...dashboardConfig, showWeeklyTrend: !dashboardConfig.showWeeklyTrend})} className={`p-2 rounded-full transition ${dashboardConfig.showWeeklyTrend ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-100'}`}>
                         {dashboardConfig.showWeeklyTrend ? <ToggleRight className="w-8 h-8"/> : <ToggleLeft className="w-8 h-8"/>}
                       </button>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Activity className="w-5 h-5"/></div>
                         <div><h3 className="font-medium text-slate-900">Live Status Ticker</h3><p className="text-xs text-slate-500">Show scrolling order status</p></div>
                       </div>
                       <button onClick={() => setDashboardConfig({...dashboardConfig, showTicker: !dashboardConfig.showTicker})} className={`p-2 rounded-full transition ${dashboardConfig.showTicker ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-100'}`}>
                         {dashboardConfig.showTicker ? <ToggleRight className="w-8 h-8"/> : <ToggleLeft className="w-8 h-8"/>}
                       </button>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><LayoutDashboard className="w-5 h-5"/></div>
                         <div><h3 className="font-medium text-slate-900">Floor Status Grid</h3><p className="text-xs text-slate-500">Show active order cards</p></div>
                       </div>
                       <button onClick={() => setDashboardConfig({...dashboardConfig, showFloorStatus: !dashboardConfig.showFloorStatus})} className={`p-2 rounded-full transition ${dashboardConfig.showFloorStatus ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-100'}`}>
                         {dashboardConfig.showFloorStatus ? <ToggleRight className="w-8 h-8"/> : <ToggleLeft className="w-8 h-8"/>}
                       </button>
                    </div>
                 </div>
               </div>
             </div>
          )}

        </div>
      </main>

      {/* Modals */}
      <AIReportModal isOpen={aiReportOpen} onClose={() => setAiReportOpen(false)} data={aiReportData} />
      <CreateOrderModal isOpen={isCreateOrderOpen} onClose={() => setIsCreateOrderOpen(false)} onCreate={handleCreateOrder} isSaving={isSaving} />
      <StockTransferModal isOpen={!!selectedOrderForUpdate} onClose={() => setSelectedOrderForUpdate(null)} order={selectedOrderForUpdate} stages={PRODUCTION_STAGES} onTransfer={handleTransferStock} user={user} isSaving={isSaving} onDeleteLog={handleDeleteYarnLog} />
      <ConfirmationModal isOpen={!!orderToDelete} onClose={() => setOrderToDelete(null)} onConfirm={confirmDeleteOrder} title="Delete Order" message="Permanently delete this order from the cloud database?" />
    </div>
  );
}

// --- Sub-components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

const StatusBadge = ({ status }) => {
  const styles = {
    'Passed': 'bg-green-100 text-green-700 border-green-200',
    'Defective': 'bg-red-100 text-red-700 border-red-200',
    'Pending QC': 'bg-amber-100 text-amber-700 border-amber-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};
