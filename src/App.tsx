/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Version: v7
 * Changes: Fully enabled real-time features. Dashboard now listens for 
 * live Firestore updates. Wait Explorer (StatusView) polls the Express API 
 * every 5s for bay status. Digital Intake now persists directly to Firestore.
 */

import React, { useState, useMemo, useEffect, createContext, useContext } from 'react';
import { 
  BarChart3, 
  Users, 
  Clock, 
  ClipboardList, 
  Send, 
  CheckCircle2, 
  XCircle, 
  LayoutDashboard,
  UserPlus,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  PieChart,
  Settings,
  ShoppingBag,
  ArrowRight,
  Calculator,
  RefreshCw,
  DollarSign,
  Globe,
  Star,
  Camera,
  Search,
  Filter,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils.ts';
import { MOCK_CUSTOMERS, MOCK_VISITS, SERVICE_MENU } from './constants.ts';
import { Customer, ServiceSuggestion, Visit } from './types.ts';
import { auth, db } from './lib/firebase.ts';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

/**
 * MOCK PERFORMANCE DATA for GBP PoC
 */
const GBP_MONTHLY_DATA = [
  { month: 'Jan', searches: 2100, actions: 120, reviews: 2 },
  { month: 'Feb', searches: 2400, actions: 155, reviews: 3 },
  { month: 'Mar', searches: 3200, actions: 210, reviews: 5 },
  { month: 'Apr', searches: 3800, actions: 290, reviews: 4 },
  { month: 'May', searches: 4200, actions: 340, reviews: 8 },
  { month: 'Jun', searches: 5100, actions: 420, reviews: 12 },
];

// --- Auth Context ---
const AuthContext = createContext<{
  user: FirebaseUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setPreview: () => void;
}>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  setPreview: () => {},
});

const useAuth = () => useContext(AuthContext);

type View = 'dashboard' | 'analytics' | 'intake' | 'reactivation' | 'status' | 'services' | 'pitch' | 'roi' | 'seo';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    // Handle authentication result from redirect flow
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        setUser(result.user);
      }
    }).catch((error) => {
      console.error("Redirect auth error:", error);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      // Try popup first
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.warn("Popup blocked or closed, falling back to redirect:", error);
      // Fallback to redirect if popup is blocked or fails
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, provider);
      } else {
        alert("Authentication error. Please check if popups are enabled or try again.");
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const setPreview = () => {
    setUser({
      uid: 'preview-guest',
      displayName: 'Preview Guest',
      email: 'guest@example.com',
      isAnonymous: true
    } as any);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setPreview }}>
      <MainApp />
    </AuthContext.Provider>
  );
}

function MainApp() {
  const { user, login, logout, setPreview } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [visits, setVisits] = useState<Visit[]>(MOCK_VISITS);

  const allSuggestions = useMemo(() => {
    return visits.flatMap(v => v.suggestions);
  }, [visits]);

  const missedRevenue = useMemo(() => {
    return allSuggestions
      .filter(s => s.status === 'declined')
      .reduce((acc, curr) => acc + curr.price, 0);
  }, [allSuggestions]);

  const oilOnlyRate = useMemo(() => {
    const total = visits.length;
    const oilOnly = visits.filter(v => v.isOilOnly).length;
    return total > 0 ? (oilOnly / total) * 100 : 0;
  }, [visits]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-orange-500 rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-2xl shadow-orange-500/20">
          <TrendingUp size={40} />
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-4 text-gray-900 leading-tight">Jiffy Lube<br/>FranchiseGrow</h1>
        <p className="text-gray-500 max-w-sm mb-10 leading-relaxed">
          The ultimate BI & reactivation engine for franchise profitability.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={login}
            className="flex items-center justify-center gap-3 w-full py-4 bg-black text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl shadow-black/20"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-gray-50 px-2 text-gray-400">or use for PoC</span></div>
          </div>

          <button 
            onClick={setPreview}
            className="flex items-center justify-center gap-3 w-full py-4 bg-orange-500/10 text-orange-600 border border-orange-200 rounded-2xl font-bold hover:bg-orange-500/20 transition-colors"
          >
            <User size={20} />
            Continue as Guest (No Login)
          </button>
          
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mt-4">
            <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
              <strong>Tip:</strong> If Google login fails, your browser may be blocking pop-ups. Guest mode is fully functional for PoC testing and requires no setup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const SidebarItem = ({ id, icon: Icon, label }: { id: View, icon: any, label: string }) => (
    <button
      onClick={() => setCurrentView(id)}
      className={cn(
        "flex items-center gap-3 px-4 py-3 w-full text-left transition-all rounded-lg mb-1",
        currentView === id 
          ? "bg-black text-white shadow-lg shadow-black/10" 
          : "text-gray-500 hover:bg-gray-100 hover:text-black"
      )}
    >
      <Icon size={18} />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-10 px-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <div className="bg-orange-500 p-2 rounded-lg text-white">
            <TrendingUp size={20} />
          </div>
          <h1 className="font-bold text-lg tracking-tight">FranchiseGrow</h1>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Operations</div>
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem id="intake" icon={UserPlus} label="Digital Intake" />
          <SidebarItem id="status" icon={Clock} label="Wait Explorer" />
          
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-8 mb-4 px-2">Growth & Strategy</div>
          <SidebarItem id="analytics" icon={BarChart3} label="Manager Reports" />
          <SidebarItem id="roi" icon={Calculator} label="ROI Calculator" />
          <SidebarItem id="seo" icon={Globe} label="Digital Dominance" />
          <SidebarItem id="reactivation" icon={MessageSquare} label="Reactivation" />
          <SidebarItem id="services" icon={ShoppingBag} label="Service Menu" />
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-8 mb-4 px-2">Manager Pitch</div>
          <SidebarItem id="pitch" icon={ArrowRight} label="Pitch Presentation" />
        </nav>

        <div className="pt-6 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
             <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
               <User size={16} />
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-xs font-bold truncate text-gray-900">{user.displayName || user.email}</div>
               <button 
                onClick={logout}
                className="text-[10px] text-gray-400 hover:text-orange-600 font-bold flex items-center gap-1"
               >
                 Sign Out <LogOut size={8} />
               </button>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentView === 'dashboard' && (
              <Dashboard missedRevenue={missedRevenue} suggestions={allSuggestions} oilOnlyRate={oilOnlyRate} />
            )}
            {currentView === 'analytics' && (
              <AnalyticsView visits={visits} oilOnlyRate={oilOnlyRate} missedRevenue={missedRevenue} />
            )}
            {currentView === 'intake' && (
              <IntakeView onAdd={(c) => setCustomers([...customers, c])} />
            )}
            {currentView === 'reactivation' && (
              <ReactivationView suggestions={allSuggestions} customers={customers} />
            )}
            {currentView === 'status' && (
              <StatusView />
            )}
            {currentView === 'services' && (
              <ServicesView menu={SERVICE_MENU} setView={setCurrentView} />
            )}
            {currentView === 'pitch' && (
              <PitchView />
            )}
            {currentView === 'roi' && (
              <ROIView />
            )}
            {currentView === 'seo' && (
              <SEOView />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Dashboard({ missedRevenue, suggestions, oilOnlyRate }: { missedRevenue: number, suggestions: ServiceSuggestion[], oilOnlyRate: number }) {
  const { user } = useAuth();
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    if (!user || user.uid === 'preview-guest') return;
    const q = query(collection(db, 'customers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomerCount(snapshot.size);
    }, (error) => {
      console.error("Dashboard error:", error);
    });
    return () => unsubscribe();
  }, [user]);
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Executive Summary</h2>
          <p className="text-gray-500 mt-1">Key metrics requested for the Assistant Manager pitch.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Store Health</div>
          <div className="flex items-center gap-2 text-orange-600 font-medium">
            <AlertCircle size={14} />
            High Revenue Leakage
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Potential Monthly Lift" 
          value={`$${missedRevenue.toLocaleString()}`} 
          sub="Uncollected High-Margin Upsells" 
          color="orange"
          icon={TrendingUp}
        />
        <StatCard 
          title="Oil-Change-Only Rate" 
          value={`${Math.round(oilOnlyRate)}%`} 
          sub="Customers skipping upsells" 
          color="blue"
          icon={ShoppingBag}
        />
        <StatCard 
          title="Digital Lead Capture" 
          value="0%" 
          sub="Current Paper Baseline" 
          color="gray"
          icon={Users}
        />
      </div>

      <div className="bg-orange-50 border border-orange-100 p-8 rounded-[2rem] flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 space-y-4">
          <div className="inline-block px-3 py-1 bg-orange-200 text-orange-700 text-[10px] font-black uppercase tracking-widest rounded-full">Problem Analysis</div>
          <h3 className="text-2xl font-bold">The "Missed Data" Problem</h3>
          <p className="text-orange-800/80 leading-relaxed">
            Every customer that walks in and declines a <strong>Fuel Injection Service ($129)</strong> or <strong>Radiator Flush ($190)</strong> is a lost lead. Without their phone or email, you cannot reactivate them later when they are ready.
          </p>
          <div className="flex gap-4">
            <div className="bg-white/50 p-4 rounded-xl border border-orange-200">
              <div className="text-orange-600 font-black text-xl">100%</div>
              <div className="text-[10px] font-bold uppercase text-orange-800/60">Paper Waste</div>
            </div>
            <div className="bg-white/50 p-4 rounded-xl border border-orange-200">
              <div className="text-orange-600 font-black text-xl">$0</div>
              <div className="text-[10px] font-bold uppercase text-orange-800/60">Follow-up Rev</div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl shadow-xl shadow-orange-900/5 space-y-4">
          <div className="text-sm font-bold">Solution: Digital Reactivation</div>
          <div className="space-y-3">
             <div className="h-2 bg-gray-100 rounded-full w-full" />
             <div className="h-2 bg-gray-100 rounded-full w-3/4" />
             <div className="h-2 bg-gray-100 rounded-full w-5/6" />
             <div className="pt-2 flex justify-between">
                <div className="text-[10px] text-gray-400">Database Growth</div>
                <div className="text-[10px] text-green-600 font-bold">+25% / mo</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, color, icon: Icon }: { title: string, value: string, sub: string, color: string, icon: any }) {
  const colors = {
    orange: "bg-orange-50 border-orange-100 text-orange-600",
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    green: "bg-green-50 border-green-100 text-green-600",
    gray: "bg-gray-50 border-gray-100 text-gray-600"
  };

  return (
    <div className={cn("p-8 rounded-2xl border transition-all hover:shadow-md", colors[color as keyof typeof colors])}>
      <div className="flex justify-between items-start mb-4">
        <div className="text-xs font-bold uppercase tracking-wider opacity-80">{title}</div>
        <Icon size={20} />
      </div>
      <div className="text-4xl font-black tracking-tight">{value}</div>
      <div className="text-sm mt-1 opacity-70">{sub}</div>
    </div>
  );
}

function AnalyticsView({ visits, oilOnlyRate, missedRevenue }: { visits: Visit[], oilOnlyRate: number, missedRevenue: number }) {
  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Manager's Performance Report</h2>
        <p className="text-gray-500 mt-1">Breakdown of visitor traffic and conversion health for this franchise location.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="font-bold flex items-center gap-2">
            <PieChart size={18} className="text-blue-500" />
            Service Mix Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-12 bg-gray-50 rounded-lg overflow-hidden flex">
                <div className="bg-orange-500 h-full" style={{ width: `${oilOnlyRate}%` }} />
                <div className="bg-blue-500 h-full flex-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-orange-50 rounded-xl">
                <div className="text-xs font-bold text-orange-800/60 uppercase tracking-widest mb-1">Oil Only</div>
                <div className="text-xl font-bold text-orange-600">{Math.round(oilOnlyRate)}%</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="text-xs font-bold text-blue-800/60 uppercase tracking-widest mb-1">Full Service</div>
                <div className="text-xl font-bold text-blue-600">{Math.round(100 - oilOnlyRate)}%</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 italic">
            Managers goal: Reduce "Oil Only" rate by 5% through digital education screens.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
           <h3 className="font-bold flex items-center gap-2">
            <Users size={18} className="text-purple-500" />
            Traffic Estimates
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <TrafficStat label="Avg Daily" value="32" unit="cars" />
            <TrafficStat label="Avg Weekly" value="214" unit="cars" />
            <TrafficStat label="Avg Monthly" value="890" unit="cars" />
          </div>
          <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
             <div className="font-bold text-purple-900 text-sm mb-1 uppercase tracking-tight">The "Nextdoor" Opportunity</div>
             <p className="text-xs text-purple-800/70">
               Neighbors on Nextdoor are actively searching for "fast oil change." Ranking #1 digitally could increase visitor traffic by <strong>15%</strong>.
             </p>
          </div>
        </div>
      </div>

      <div className="bg-black text-white p-10 rounded-[3rem] overflow-hidden relative">
        <div className="max-w-xl">
          <h3 className="text-4xl font-black mb-4">Total Opportunity: ${missedRevenue.toLocaleString()}</h3>
          <p className="text-gray-400 text-lg mb-8">
            This is the revenue currently walking out the door due to a lack of contact information for reactivation.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="border-l-4 border-orange-500 pl-4">
               <div className="text-xs font-bold uppercase text-gray-500">Filters</div>
               <div className="text-2xl font-bold font-mono">$110.00 avg</div>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
               <div className="text-xs font-bold uppercase text-gray-500">Flush/Inject</div>
               <div className="text-2xl font-bold font-mono">$159.00 avg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrafficStat({ label, value, unit }: { label: string, value: string, unit: string }) {
  return (
    <div className="text-center p-4">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] font-medium text-gray-500">{unit}</div>
    </div>
  );
}

function ServicesView({ menu, setView }: { menu: any[], setView: (v: View) => void }) {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Active Service Catalog</h2>
        <p className="text-gray-500 mt-1">Recommended service list and targeted profit margins.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menu.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={cn(
                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                item.margin === 'High' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              )}>
                {item.margin} Margin
              </div>
              <ShoppingBag size={14} className="text-gray-300 group-hover:text-black transition-colors" />
            </div>
            <h4 className="font-bold text-lg mb-1">{item.name}</h4>
            <div className="text-2xl font-mono font-black text-gray-900">${item.basePrice}</div>
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-xs">
              <span className="text-gray-400 italic">Commonly declined</span>
              <button className="text-orange-500 font-bold hover:underline py-1">Strategy Tips</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 text-white p-8 rounded-3xl mt-12">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Settings size={20} className="text-orange-500" />
          Manager Strategy: The "Bundle" Play
        </h3>
        <p className="text-gray-400 mb-8 max-w-2xl">
          Pitch the manager on an "All-Digital Bundle." When a customer does the digital sign-in, they automatically get 10% off a high-margin filter. This "buys" the store their contact information for life.
        </p>
        <div className="flex gap-4">
           <button 
            onClick={() => setView('roi')}
            className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
           >
            View ROI Calculator
           </button>
           <button className="px-6 py-3 border border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">Download Paper vs Digital PPT</button>
        </div>
      </div>
    </div>
  );
}

function ROIView() {
  const [traffic, setTraffic] = useState(900);
  const [captureRate, setCaptureRate] = useState(40);
  const [reactivationRate, setReactivationRate] = useState(5);
  const [avgTicket, setAvgTicket] = useState(120);

  const stats = useMemo(() => {
    const leadsByMo = (traffic * (captureRate / 100));
    const monthlyLift = leadsByMo * (reactivationRate / 100) * avgTicket;
    const yearlyLift = monthlyLift * 12;
    return { leadsByMo, monthlyLift, yearlyLift };
  }, [traffic, captureRate, reactivationRate, avgTicket]);

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">ROI Projection Engine</h2>
        <p className="text-gray-500 mt-1">Model the financial impact of digital intake and automated reactivation.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-bold flex items-center gap-2 text-gray-900">
              <Calculator size={18} className="text-orange-500" />
              Variables
            </h3>
            
            <SliderGroup 
              label="Monthly Traffic (Cars)" 
              value={traffic} 
              onChange={setTraffic} 
              min={100} 
              max={2000} 
              step={50}
              icon={Users}
            />
            
            <SliderGroup 
              label="Email Capture Rate (%)" 
              value={captureRate} 
              onChange={setCaptureRate} 
              min={0} 
              max={100} 
              step={5}
              icon={UserPlus}
            />

            <SliderGroup 
              label="Reactivation Success (%)" 
              value={reactivationRate} 
              onChange={setReactivationRate} 
              min={1} 
              max={20} 
              step={1}
              icon={RefreshCw}
            />

            <SliderGroup 
              label="Avg Service Value ($)" 
              value={avgTicket} 
              onChange={setAvgTicket} 
              min={40} 
              max={300} 
              step={10}
              icon={DollarSign}
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black text-white p-10 rounded-[2.5rem] flex flex-col justify-between h-64">
               <div>
                 <div className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-2">Monthly Revenue Lift</div>
                 <div className="text-5xl font-black tracking-tighter">${Math.round(stats.monthlyLift).toLocaleString()}</div>
               </div>
               <div className="text-gray-400 text-sm leading-tight">
                 Pure profit from customers who would have otherwise never returned for declined services.
               </div>
            </div>
            
            <div className="bg-orange-500 text-white p-10 rounded-[2.5rem] flex flex-col justify-between h-64 shadow-xl shadow-orange-500/20">
               <div>
                 <div className="text-orange-100 font-bold text-xs uppercase tracking-widest mb-2">Yearly Potential</div>
                 <div className="text-5xl font-black tracking-tighter">${Math.round(stats.yearlyLift).toLocaleString()}</div>
               </div>
               <div className="bg-white/20 p-4 rounded-2xl text-orange-50 text-sm">
                  Equivalent to <strong>+{Math.round(stats.yearlyLift / 85)}</strong> oil changes per year.
               </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
             <h3 className="font-bold text-xl mb-6">Database Growth Projection</h3>
             <div className="space-y-6">
                <div className="flex justify-between items-end">
                   <div>
                      <div className="text-4xl font-bold text-gray-900">{Math.round(stats.leadsByMo)}</div>
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">New Leads / Month</div>
                   </div>
                   <div className="text-right">
                      <div className="text-4xl font-bold text-gray-900">{Math.round(stats.leadsByMo * 12)}</div>
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Leads by Year 1</div>
                   </div>
                </div>
                <div className="h-4 bg-gray-50 rounded-full overflow-hidden flex">
                   <div className="bg-orange-500 w-1/4 h-full" />
                   <div className="bg-orange-400 w-1/4 h-full border-l border-white/20" />
                   <div className="bg-orange-300 w-1/4 h-full border-l border-white/20" />
                   <div className="bg-orange-200 w-1/4 h-full border-l border-white/20" />
                </div>
                <p className="text-sm text-gray-500 italic">
                  *Assumes consistent traffic volume. Real growth may be higher with local Nextdoor and GBP optimizations.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderGroup({ label, value, onChange, min, max, step, icon: Icon }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number, icon: any }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm">
        <label className="text-gray-500 font-medium flex items-center gap-2">
          <Icon size={14} className="text-gray-400" />
          {label}
        </label>
        <span className="font-black text-gray-900">{value}{label.includes('%') ? '%' : ''}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
      />
    </div>
  );
}

function SEOView() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 py-10 pb-32">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Digital Dominance Roadmap</h2>
          <p className="text-gray-500 mt-1">Strategy to rank #1 local search for "Fast Oil Change".</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest rounded border border-gray-200">
            <AlertCircle size={10} />
            Simulated Pitch Data
          </div>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Globe size={14} />
          SEO Strategy v1.0
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StrategyMetric label="Local Ranking" value="#4" target="#1" trend="up" />
        <StrategyMetric label="GBP Views" value="4.2k" target="10k" trend="up" />
        <StrategyMetric label="Nextdoor Leads" value="12" target="50" trend="up" />
        <StrategyMetric label="Review Velocity" value="2/mo" target="10/mo" trend="down" />
      </div>

      {/* GBP Performance Visualization (PoC) */}
      <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">GBP Performance Feed</h3>
            <p className="text-gray-500 text-sm">Real-time engagement trends from Google Search & Maps.</p>
          </div>
          <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-orange-100">
            PoC Preview Mode
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="h-[300px] w-full">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Search Impressions (Visualized)
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GBP_MONTHLY_DATA}>
                <defs>
                  <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#9ca3af'}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#9ca3af'}} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="searches" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSearches)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[300px] w-full">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              Customer Actions (Calls/Directions)
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={GBP_MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#9ca3af'}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#9ca3af'}} 
                />
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="actions" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Star size={24} /></div>
              Google Business Profile
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Google prioritizes businesses that are "active". If we update this profile weekly, we jump ahead of static competitors.
            </p>
            <ul className="space-y-4">
              <StepItem title="High-Res Bay Photos" desc="Upload 5 new photos of the shop floor every Sunday. Google loves 'recency'." />
              <StepItem title="Response Time < 4hrs" desc="Staff should respond to every review. Interaction = Ranking Boost." />
              <StepItem title="Google Q&A" desc="Seed common questions like 'Do you offer walk-ins?' with helpful staff answers." />
            </ul>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-xl text-orange-600"><Search size={24} /></div>
              Keyword Dominance
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              We need to 'own' the words people actually type into their phones while sitting in their driveway.
            </p>
            <ul className="space-y-4">
              <StepItem title="The '30 Min' Hook" desc="Use 'Fast 30-minute oil change' in the description. Speed is the primary search intent." />
              <StepItem title="Service-Specific SEO" desc="Add 'Fuel Injection Service' to the official GBP services list (not just 'Oil Change')." />
              <StepItem title="Geo-Local Tags" desc="Mention 'Serving [Neighborhood Name]' repeatedly in posts to win Near-Me searches." />
            </ul>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-xl text-purple-600"><Camera size={24} /></div>
              Nextdoor Authority
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Nextdoor is a trust engine. One recommendation here is worth 10 Google reviews in terms of direct referral.
            </p>
            <ul className="space-y-4">
              <StepItem title="Direct Nextdoor Ads" desc="Run 'First Time Neighbor' discounts ($10 off) targeted at the 5-mile zip code." />
              <StepItem title="Bay Status Updates" desc="Post real-time updates on Nextdoor: 'Quiet Sunday! 3 bays open for immediate service.'" />
              <StepItem title="Expert Q&A" desc="Host a monthly 'Ask a Mechanic' thread to build neighborhood trust." />
            </ul>
          </div>
        </div>
      </section>

      <div className="bg-black text-white p-12 rounded-[3.5rem] relative overflow-hidden flex flex-col md:flex-row gap-10 items-center">
        <div className="flex-1 space-y-6">
          <h3 className="text-4xl font-black italic">"The Secret Weapon: Live Wait Stats"</h3>
          <p className="text-gray-400 text-xl leading-relaxed">
            By embedding our <strong>Live Bay Status</strong> (Wait Explorer) directly onto the Google Business Profile, we give customers the one thing competitors can't: <strong>Certainty</strong>.
          </p>
          <div className="flex gap-4">
            <div className="bg-white/10 p-6 rounded-2xl border border-white/5">
              <div className="text-orange-500 font-black text-2xl">+45%</div>
              <div className="text-[10px] font-bold uppercase text-gray-400">Click-through Rate</div>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl border border-white/5">
              <div className="text-green-500 font-black text-2xl">-20%</div>
              <div className="text-[10px] font-bold uppercase text-gray-400">Customer Churn</div>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/3 bg-white p-8 rounded-3xl text-black space-y-6 shadow-2xl">
           <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">J</div>
              <div>
                <div className="font-bold">Jiffy Lube #412</div>
                <div className="flex text-orange-400"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div>
              </div>
           </div>
           <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-center">
              <div className="text-xs font-bold text-green-700">LIVE STATUS: 0 MIN WAIT</div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
           </div>
           <p className="text-[10px] text-gray-400">"This status block increases SEO authority by keeping users on our profile longer."</p>
           <button className="w-full py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest">Connect to GBP</button>
        </div>
      </div>
    </div>
  );
}

function StrategyMetric({ label, value, target, trend }: { label: string, value: string, target: string, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-bold flex items-center justify-center gap-2">
        {value}
        {trend === 'up' ? <TrendingUp size={16} className="text-green-500" /> : <div className="text-red-500 text-xs">▼</div>}
      </div>
      <div className="text-[10px] font-medium text-gray-500 mt-1">Target: {target}</div>
    </div>
  );
}

function StepItem({ title, desc }: { title: string, desc: string }) {
  return (
    <li className="space-y-1">
      <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
        <ChevronRight size={14} className="text-orange-500" />
        {title}
      </div>
      <div className="text-xs text-gray-500 leading-relaxed ml-5">{desc}</div>
    </li>
  );
}

function PitchView() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 py-10 pb-32">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest">
          Consulting Strategy Case
        </div>
        <h2 className="text-5xl font-black tracking-tighter">Strategic Store Growth</h2>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto italic">
          "The invisible leak: Why this Jiffy Lube location is losing $8k+ monthly in high-margin service revenue."
        </p>
      </header>

      {/* Slide 1: The Local Audit */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h3 className="text-3xl font-bold flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><AlertCircle size={24} /></div>
            The Digital Presence Audit
          </h3>
          <div className="space-y-4">
            <AuditItem 
              title="Google Business Profile (GBP)" 
              status="Needs Attention" 
              desc="Current search ranking for 'Oil Change' is Top 5, but lack of digital appointment links is driving traffic to competitors with online booking." 
            />
            <AuditItem 
              title="Nextdoor Neighborhood Sentiment" 
              status="High Opportunity" 
              desc="Local search volume on Nextdoor is up 18%. Neighbors prioritize 'fast' and 'friendly'—Jiffy Lube's 30-min service is a major competitive advantage if advertised." 
            />
            <AuditItem 
              title="Identity Capture" 
              status="Critical Failure" 
              desc="0% of customers currently receive digital follow-ups. Invoices are paper-based, losing the chance for 'service reactivation' campaigns." 
            />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 bg-red-50 text-red-600 font-black text-[10px] rounded-bl-2xl">REVENUE LEAK DETECTED</div>
          <div className="space-y-6">
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Neighbor Feedback (Simulated)</div>
            <div className="p-4 bg-gray-50 rounded-2xl italic text-gray-600 text-sm border-l-4 border-gray-200">
              "Great service at Jiffy Lube on Sunday, but I wish they had sent me a reminder about my air filter. I went to Pep Boys for it later because I forgot the price."
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl italic text-gray-600 text-sm border-l-4 border-gray-200">
              "Staff were friendly, but I had to wait for a paper slip. Why isn't this digital in 2026?"
            </div>
          </div>
        </div>
      </section>

      {/* Slide 2: The Math of Missed Upsells */}
      <section className="bg-gray-900 text-white p-12 rounded-[3.5rem] space-y-10">
        <div className="text-center space-y-2">
          <h3 className="text-3xl font-bold">The Math of Missing Data</h3>
          <p className="text-gray-400">Based on your visit: 100% friendy, 100% efficient, 0% lead capture.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 border border-gray-800 rounded-3xl bg-gray-800/20">
             <div className="text-4xl font-black text-orange-500 mb-2">900</div>
             <div className="text-sm font-bold uppercase tracking-widest text-gray-400">Monthly Visitors</div>
          </div>
          <div className="text-center p-6 border border-gray-800 rounded-3xl bg-gray-800/20">
             <div className="text-4xl font-black text-orange-500 mb-2">350</div>
             <div className="text-sm font-bold uppercase tracking-widest text-gray-400">Declined Upsells</div>
          </div>
          <div className="text-center p-6 border border-gray-800 rounded-3xl bg-gray-800/20">
             <div className="text-4xl font-black text-orange-500 mb-2">$8,500</div>
             <div className="text-sm font-bold uppercase tracking-widest text-gray-400">Uncollected Revenue</div>
          </div>
        </div>

        <div className="p-8 bg-black/40 rounded-3xl border border-gray-800">
           <h4 className="font-bold text-orange-400 mb-4 flex items-center gap-2">
             <TrendingUp size={18} />
             Reactivation Strategy
           </h4>
           <p className="text-gray-300 leading-relaxed italic">
             "If we capture just **40%** of those emails during intake, and reactivate **5%** through automated SMS, we add an extra **$1,400/month** of pure profit without spending a dime on new ads."
           </p>
        </div>
      </section>

      {/* Slide 3: The Pitch / Solution */}
      <section className="space-y-8">
        <h3 className="text-3xl font-bold text-center">The Next Steps for the ASM</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <PitchCard 
             step="01"
             title="Deploy Digital Intake"
             desc="Remove the paper sign. Use a tablet/QR code for check-in. Capture name, phone, and agreement for digital receipts."
          />
          <PitchCard 
             step="02"
             title="Automated Follow-ups"
             desc="24 hours after service, a 'Thank You' text. 3 weeks after, a 'Ready for that Air Filter?' reminder with a 10% coupon."
          />
          <PitchCard 
             step="03"
             title="GBP & Nextdoor Integration"
             desc="Update Google profile with 'Digital Fast Pass' link. Post weekly 'Bay Status' updates on Nextdoor to capture intent."
          />
          <PitchCard 
             step="04"
             title="Sales Training"
             desc="Enable the staff to say: 'I'll email you the quote for the Radiator Flush so you have it for later—no pressure today.'"
          />
        </div>
      </section>

      <footer className="pt-20 text-center">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-6 italic">Ready to present this to Jiffy Lube #412 Management?</p>
        <button 
          onClick={() => window.print()}
          className="px-10 py-5 bg-orange-600 text-white rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-2xl shadow-orange-900/20"
        >
          Generate PDF Proposal
        </button>
      </footer>
    </div>
  );
}

function AuditItem({ title, status, desc }: { title: string, status: string, desc: string }) {
  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-2">
      <div className="flex justify-between items-center">
        <div className="font-bold text-sm">{title}</div>
        <div className={cn(
          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
          status === 'Needs Attention' ? "bg-orange-100 text-orange-600" : 
          status === 'Critical Failure' ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
        )}>{status}</div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function PitchCard({ step, title, desc }: { step: string, title: string, desc: string }) {
  return (
    <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
      <div className="text-4xl font-black text-gray-200 group-hover:text-orange-100 transition-colors mb-4">{step}</div>
      <h4 className="text-xl font-bold mb-2">{title}</h4>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function IntakeView({ onAdd }: { onAdd: (c: Customer) => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicle: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      if (user.uid !== 'preview-guest') {
        const newDoc = {
          ...formData,
          uid: user.uid,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'customers'), newDoc);
      } else {
        // Mock delay for guest mode
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setSubmitted(true);
      
      onAdd({
        id: Math.random().toString(),
        ...formData,
        status: 'active',
        lastVisit: 'Just now',
        totalSpent: 0,
        visitCount: 1
      } as any);

      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', phone: '', vehicle: '' });
      }, 3000);
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving record to Firestore.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="text-center mb-10">
        <div className="inline-block p-4 bg-orange-100 text-orange-600 rounded-2xl mb-6">
          <UserPlus size={40} />
        </div>
        <h2 className="text-4xl font-black tracking-tight mb-4">Digital Check-in</h2>
        <p className="text-gray-500 text-lg">
          Replace the paper sign. Let customers sign up for digital invoices and loyalty rewards upon arrival.
        </p>
      </div>

      <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-xl relative overflow-hidden">
        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-20"
          >
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold">Profile Created!</h3>
            <p className="text-gray-500 italic">Digital invoice will be sent upon completion.</p>
          </motion.div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup 
                label="Full Name" 
                placeholder="e.g. Michael Scott" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
              <InputGroup 
                label="Phone Number" 
                placeholder="e.g. 555-0123" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                required 
              />
            </div>
            <InputGroup 
              label="Email Address" 
              placeholder="e.g. michael@dundermifflin.com" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              required 
            />
            <InputGroup 
              label="Vehicle Tag / Model" 
              placeholder="e.g. ABC-1234 (Silver SUV)" 
              value={formData.vehicle} 
              onChange={(e) => setFormData({...formData, vehicle: e.target.value})} 
              required 
            />
            
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-4">
              <input type="checkbox" className="mt-1" defaultChecked />
              <div className="text-xs text-gray-500 leading-relaxed">
                I agree to receive digital invoices and occasional service reminders via SMS/Email. 
                Capturing this data allows Jiffy Lube to personalize my maintenance schedule.
              </div>
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="animate-spin" /> : <ChevronRight />}
              Complete Digital Intake
            </button>
          </form>
        )}
      </div>

      <div className="mt-12 flex justify-center items-center gap-10 opacity-50 grayscale">
        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Jiffy_Lube_logo.svg" alt="Company Logo" className="h-8" />
      </div>
    </div>
  );
}

function InputGroup({ label, placeholder, value, onChange, required }: { 
  label: string, 
  placeholder: string, 
  value?: string, 
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">{label}</label>
      <input 
        type="text" 
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-gray-300"
      />
    </div>
  );
}

function ReactivationView({ suggestions, customers }: { suggestions: ServiceSuggestion[], customers: Customer[] }) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<ServiceSuggestion | null>(null);

  const getCustomer = (id: string) => customers.find(c => c.id === id);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Database Reactivation</h2>
        <p className="text-gray-500 mt-1">High-intent customers who declined preventative maintenance during their last visit.</p>
      </header>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Declined Service</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Value</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suggested At</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {suggestions.filter(s => s.status === 'declined').map(s => {
                const customer = getCustomer(s.customerId);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold">{customer?.name}</div>
                      <div className="text-xs text-gray-500">{customer?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                        {s.serviceName}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-orange-600">${s.price}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s.suggestedAt}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedSuggestion(s)}
                        className="flex items-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold rounded-lg hover:scale-105 transition-transform"
                      >
                        <MessageSquare size={14} />
                        Generate Outreach
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSuggestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-xl p-8 relative"
          >
            <button onClick={() => setSelectedSuggestion(null)} className="absolute right-6 top-6 text-gray-400 hover:text-black">
              <XCircle size={24} />
            </button>
            
            <h3 className="text-2xl font-bold mb-2">Smart Follow-up</h3>
            <p className="text-gray-500 text-sm mb-6">AI-drafted message for {getCustomer(selectedSuggestion.customerId)?.name}.</p>
            
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 font-serif text-lg leading-relaxed relative">
              <div className="absolute -top-3 left-6 px-2 bg-white text-[10px] font-black tracking-widest text-orange-500 border border-orange-200 rounded">DRAFT</div>
              "Hi {getCustomer(selectedSuggestion.customerId)?.name}, it's Alex from Jiffy Lube. It's been a month since your oil change—are you still looking to get that <strong>{selectedSuggestion.serviceName}</strong> ($ {selectedSuggestion.price}) handled? We have a bay open right now for walk-ins!"
            </div>

            <div className="flex gap-4 mt-8">
              <button className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                <Send size={18} />
                Send SMS
              </button>
              <button className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50">
                Email Instead
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatusView() {
  const [bays, setBays] = useState<any[]>([]);
  const [loadingBays, setLoadingBays] = useState(true);

  useEffect(() => {
    const fetchBays = async () => {
      try {
        const res = await fetch('/api/bays');
        const data = await res.json();
        setBays(data);
      } catch (err) {
        console.error("Failed to fetch bays:", err);
      } finally {
        setLoadingBays(false);
      }
    };
    fetchBays();
    const interval = setInterval(fetchBays, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto text-center space-y-12 py-10">
      <div>
        <h2 className="text-5xl font-black tracking-tighter mb-4">Live Bay Status</h2>
        <p className="text-xl text-gray-500">Know before you go. Real-time wait times for our walk-in customers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loadingBays ? (
          <div className="col-span-3 text-gray-400 font-bold animate-pulse">Scanning shop floor...</div>
        ) : (
          bays.map((bay) => (
            <div key={bay.id} className="p-10 bg-white rounded-3xl border border-gray-100 shadow-xl space-y-6 text-center">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
                bay.status === 'open' ? "bg-green-100 text-green-600" : 
                bay.status === 'occupied' ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"
              )}>
                {bay.status === 'open' ? <CheckCircle2 size={40} /> : 
                 bay.status === 'occupied' ? <Clock size={40} /> : <XCircle size={40} />}
              </div>
              <div>
                <div className="text-4xl font-black">{bay.timer || (bay.status === 'open' ? '0 min' : 'Offline')}</div>
                <div className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">{bay.name}</div>
              </div>
              <div className={cn(
                "h-2 w-full rounded-full",
                bay.status === 'open' ? "bg-green-500" : 
                bay.status === 'occupied' ? "bg-orange-500" : "bg-gray-200"
              )} />
              <div className={cn(
                "text-xs font-medium",
                bay.status === 'open' ? "text-green-600" : 
                bay.status === 'occupied' ? "text-orange-600" : "text-gray-400"
              )}>
                {bay.status === 'open' ? 'Available for Walk-ins' : 
                 bay.status === 'occupied' ? 'Service in Progress' : 'Out of Service'}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-black text-white p-12 rounded-[3rem] relative overflow-hidden text-left">
        <div className="relative z-10">
          <h3 className="text-3xl font-bold mb-4">First-Time Visit?</h3>
          <p className="text-gray-400 text-lg mb-8 max-w-md">
            Skip the paperwork. Scan the QR code at the entrance to pre-populate your service request.
          </p>
          <button className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg hover:scale-105 transition-transform flex items-center gap-3">
            <UserPlus />
            Pre-register Now
          </button>
        </div>
        <div className="absolute right-10 top-1/2 -translate-y-1/2 w-48 h-48 bg-white p-4 rounded-3xl hidden md:block">
           <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://jiffylube.com" 
              alt="QR Code" 
              className="w-full h-full"
           />
        </div>
      </div>
    </div>
  );
}

