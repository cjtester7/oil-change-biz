/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils.ts';
import { MOCK_CUSTOMERS, MOCK_SUGGESTIONS } from './constants.ts';
import { Customer, ServiceSuggestion } from './types.ts';

type View = 'dashboard' | 'intake' | 'reactivation' | 'status';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [suggestions, setSuggestions] = useState<ServiceSuggestion[]>(MOCK_SUGGESTIONS);

  const missedRevenue = useMemo(() => {
    return suggestions
      .filter(s => s.status === 'declined')
      .reduce((acc, curr) => acc + curr.price, 0);
  }, [suggestions]);

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
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="bg-orange-500 p-2 rounded-lg text-white">
            <TrendingUp size={20} />
          </div>
          <h1 className="font-bold text-lg tracking-tight">FranchiseGrow</h1>
        </div>

        <nav className="flex-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Main Menu</div>
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem id="intake" icon={UserPlus} label="Digital Intake" />
          <SidebarItem id="reactivation" icon={MessageSquare} label="Reactivation" />
          <SidebarItem id="status" icon={Clock} label="Wait Explorer" />
        </nav>

        <div className="pt-6 border-t border-gray-100 italic text-[11px] text-gray-400 text-center">
          Jiffy Lube #412 Dashboard
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
              <Dashboard missedRevenue={missedRevenue} suggestions={suggestions} customers={customers} />
            )}
            {currentView === 'intake' && (
              <IntakeView onAdd={(c) => setCustomers([...customers, c])} />
            )}
            {currentView === 'reactivation' && (
              <ReactivationView suggestions={suggestions} customers={customers} />
            )}
            {currentView === 'status' && (
              <StatusView />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Dashboard({ missedRevenue, suggestions, customers }: { missedRevenue: number, suggestions: ServiceSuggestion[], customers: Customer[] }) {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Daily Performance</h2>
          <p className="text-gray-500 mt-1">Real-time overview of missed opportunities and sales.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Status</div>
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Sync Active
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Missed Revenue" 
          value={`$${missedRevenue.toLocaleString()}`} 
          sub="Declined Upsells (30 Days)" 
          color="orange"
          icon={AlertCircle}
        />
        <StatCard 
          title="Customer Base" 
          value={customers.length.toString()} 
          sub="Active Profiles" 
          color="blue"
          icon={Users}
        />
        <StatCard 
          title="Follow-up Rate" 
          value="12%" 
          sub="+3% from last week" 
          color="green"
          icon={Send}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <ClipboardList size={20} className="text-orange-500" />
            Recent Missed Upsells
          </h3>
          <div className="space-y-4">
            {suggestions.filter(s => s.status === 'declined').slice(0, 4).map(s => (
              <div key={s.id} className="flex justify-between items-center p-4 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                <div>
                  <div className="font-medium">{s.serviceName}</div>
                  <div className="text-xs text-gray-500">Suggested to customer ID: {s.customerId}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${s.price}</div>
                  <button className="text-[10px] text-orange-600 font-bold uppercase tracking-wider hover:underline">Track Follow-up</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
            <TrendingUp size={32} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Sales Opportunity Analysis</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              By collecting just 50% more emails at checkout, you could unlock <strong>$12k/mo</strong> in automated reactivation revenue.
            </p>
            <button className="mt-6 px-6 py-3 bg-black text-white rounded-xl font-medium text-sm hover:translate-y-[-2px] transition-transform">
              View Strategy Report
            </button>
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
    green: "bg-green-50 border-green-100 text-green-600"
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

function IntakeView({ onAdd }: { onAdd: (c: Customer) => void }) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Simulate adding
    onAdd({ id: Math.random().toString(), name: 'New User', phone: '000-0000', email: '...', lastVisit: 'Today', vehicle: '...' });
    setTimeout(() => setSubmitted(false), 3000);
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
              <InputGroup label="Full Name" placeholder="e.g. Michael Scott" />
              <InputGroup label="Phone Number" placeholder="e.g. 555-0123" />
            </div>
            <InputGroup label="Email Address" placeholder="e.g. michael@dundermifflin.com" />
            <InputGroup label="Vehicle Tag / Model" placeholder="e.g. ABC-1234 (Silver SUV)" />
            
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-4">
              <input type="checkbox" className="mt-1" defaultChecked />
              <div className="text-xs text-gray-500 leading-relaxed">
                I agree to receive digital invoices and occasional service reminders via SMS/Email. 
                Capturing this data allows Jiffy Lube to personalize my maintenance schedule.
              </div>
            </div>

            <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
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

function InputGroup({ label, placeholder }: { label: string, placeholder: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400 ml-1">{label}</label>
      <input 
        type="text" 
        placeholder={placeholder}
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
  return (
    <div className="max-w-4xl mx-auto text-center space-y-12 py-10">
      <div>
        <h2 className="text-5xl font-black tracking-tighter mb-4">Live Bay Status</h2>
        <p className="text-xl text-gray-500">Know before you go. Real-time wait times for our walk-in customers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-10 bg-white rounded-3xl border border-gray-100 shadow-xl space-y-6 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} />
          </div>
          <div>
            <div className="text-4xl font-black">0 min</div>
            <div className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Bay 1 (Express)</div>
          </div>
          <div className="bg-green-500 h-2 w-full rounded-full" />
          <div className="text-xs font-medium text-green-600">Available for Walk-ins</div>
        </div>

        <div className="p-10 bg-white rounded-3xl border border-gray-100 shadow-xl space-y-6 text-center">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
            <Clock size={40} />
          </div>
          <div>
            <div className="text-4xl font-black">15 min</div>
            <div className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Bay 2 (Full Service)</div>
          </div>
          <div className="bg-orange-500 h-2 w-2/3 rounded-full" />
          <div className="text-xs font-medium text-orange-600">Finishing up oil change</div>
        </div>

        <div className="p-10 bg-white rounded-3xl border border-gray-100 shadow-xl space-y-6 text-center">
          <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <XCircle size={40} />
          </div>
          <div>
            <div className="text-4xl font-black">Offline</div>
            <div className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Bay 3 (Diagnostics)</div>
          </div>
          <div className="bg-gray-200 h-2 w-full rounded-full" />
          <div className="text-xs font-medium text-gray-400">Scheduled Maintenance</div>
        </div>
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
