"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MedicalIcon } from "@/components/icons";

// --- Types matching your API response ---
interface WaitlistEntry {
  id: string;
  patientId: string;
  doctorId: string;
  tokenSource: string;
  priority: number;
  joinedAt: string;
  patientDetails?: {
    name?: string;
    phone?: string;
  };
}

const DOCTORS = [
  { id: "D1", name: "Dr. Sharma (General Medicine)" },
  { id: "D2", name: "Dr. Patel (Cardiology)" },
  { id: "D3", name: "Dr. Singh (Orthopedics)" },
];

export default function WaitlistPage() {
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // --- Fetch Logic ---
  const fetchWaitlist = useCallback(async () => {
    // Only show loading spinner on initial load, not background refreshes
    if (entries.length === 0) setLoading(true);
    
    try {
      // Constructs URL based on selected filter
      const url = selectedDoctor 
        ? `/api/waitlist?doctorId=${encodeURIComponent(selectedDoctor)}` 
        : "/api/waitlist";
        
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.waitlist) {
        setEntries(data.waitlist);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch waitlist", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctor]);

  // Initial fetch + Auto-refresh every 10s
  useEffect(() => {
    fetchWaitlist();
    const interval = setInterval(fetchWaitlist, 10000);
    return () => clearInterval(interval);
  }, [fetchWaitlist]);

  // --- UI Helpers ---
  const getPriorityStyles = (p: number) => {
    // Priority 1 = High (Paid), 2 = Medium, 3 = Low
    if (p === 1) return { badge: "bg-rose-50 text-rose-700 border-rose-100 ring-rose-500/20", dot: "bg-rose-500" };
    if (p === 2) return { badge: "bg-teal-50 text-teal-700 border-teal-100 ring-teal-500/20", dot: "bg-teal-500" };
    return { badge: "bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/20", dot: "bg-slate-400" };
  };

  const getWaitTime = (isoString: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(isoString).getTime()) / 60000);
    return `${diff} min${diff !== 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* Background Decor */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

    

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Page Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Live Waitlist</h1>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Real-time priority queue monitoring. Auto-refreshes every 10 seconds.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xs font-bold uppercase">Filter:</span>
               </div>
               <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="pl-16 pr-8 py-2 bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-50 rounded-lg transition-colors appearance-none min-w-[240px]"
              >
                <option value="">All Doctors</option>
                {DOCTORS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            
            <div className="w-px h-6 bg-slate-100" />

            <button 
              onClick={fetchWaitlist}
              className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
              title="Refresh List"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Waiting" value={entries.length} color="text-slate-800" />
          <StatCard label="High Priority" value={entries.filter(e => e.priority === 1).length} color="text-rose-600" />
          <StatCard label="Avg Wait Time" value="12m" subtext="approx" color="text-teal-600" />
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Updated</div>
             <div className="text-sm font-mono font-medium text-slate-600">{lastUpdated.toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Waitlist Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px]">
          {loading && entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400 gap-3">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
              <p className="text-sm font-medium">Fetching active queue...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">All Caught Up!</h3>
              <p className="text-sm text-slate-500">No patients currently in the waitlist.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Rank</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Priority / Source</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Time Waiting</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry, index) => {
                    const styles = getPriorityStyles(entry.priority);
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm border
                            ${index === 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-500 border-slate-200'}
                          `}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{entry.patientDetails?.name || `Guest Patient`}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {entry.patientId}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                             {entry.doctorId}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${styles.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${styles.dot}`} />
                              Priority {entry.priority}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide pl-1">
                              {entry.tokenSource.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-bold text-teal-600">
                            {getWaitTime(entry.joinedAt)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Since {new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Simple sub-component for stats
function StatCard({ label, value, subtext, color }: { label: string; value: string | number; subtext?: string; color: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-3xl font-black ${color} tracking-tight flex items-baseline gap-1`}>
        {value}
        {subtext && <span className="text-xs font-medium text-slate-400">{subtext}</span>}
      </div>
    </div>
  );
}