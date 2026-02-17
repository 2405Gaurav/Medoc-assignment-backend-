"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MedicalIcon } from "@/components/icons";

// --- Types (Kept Exact) ---
interface Slot {
  slotId: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentOccupancy: number;
  status: string;
  tokens: Array<{ tokenNumber: string; patientId: string; tokenSource: string }>;
  waitlist: Array<{ patientId: string; tokenSource: string }>;
}

interface DoctorSlots {
  doctorId: string;
  doctorName?: string;
  slots: Slot[];
}

const DOCTOR_IDS = ["D1", "D2", "D3"];
const DOCTOR_NAMES: Record<string, string> = {
  D1: "Dr. Sharma (General Medicine)",
  D2: "Dr. Patel (Cardiology)",
  D3: "Dr. Singh (Orthopedics)",
};

export default function DashboardPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<DoctorSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTokensSlotId, setExpandedTokensSlotId] = useState<string | null>(null);

  // --- Fetch Logic (Kept Exact) ---
  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        DOCTOR_IDS.map(async (doctorId) => {
          const res = await fetch(
            `/api/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`,
            { cache: "no-store" }
          );
          const json = await res.json().catch(() => ({}));
          if (!res.ok) return { doctorId, slots: [] };
          return {
            doctorId,
            doctorName: DOCTOR_NAMES[doctorId],
            slots: json.slots ?? [],
          };
        })
      );
      setData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load slots");
      setData(DOCTOR_IDS.map((doctorId) => ({ doctorId, doctorName: DOCTOR_NAMES[doctorId], slots: [] })));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, [date]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") fetchAll();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [date]);

  // --- UI Helpers ---
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'delayed': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const calculateProgress = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="text-lg font-bold tracking-tight text-slate-800 group-hover:text-teal-700 transition-colors">Medoc-Assesment</span>
          </Link>
          <nav className="flex gap-6">
            {[
              { href: "/token-allocation", label: "Allocate" },
              { href: "/waitlist", label: "Waitlist" },
              { href: "/simulation", label: "Simulation" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">OPD Dashboard</h1>
            <p className="text-slate-500 text-sm">Real-time capacity monitoring and token distribution.</p>
          </div>
          
          <div className="w-full sm:w-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
            <span className="pl-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-50 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-lg border-transparent focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm h-48" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-2xl p-8 text-center border border-red-100">
            <div className="text-red-600 font-medium mb-2">System Error</div>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchAll()}
              className="px-4 py-2 bg-white text-red-600 text-sm font-semibold rounded-lg border border-red-200 hover:bg-red-50 transition-colors shadow-sm"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {data.map((doc) => (
              <div 
                key={doc.doctorId} 
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Doctor Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs shadow-sm">
                    {doc.doctorId}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{doc.doctorName}</h2>
                    <p className="text-xs text-slate-500 font-medium">{doc.slots.length} Slots Scheduled</p>
                  </div>
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 w-20">#</th>
                        <th className="px-6 py-3">Time Window</th>
                        <th className="px-6 py-3 w-1/4">Occupancy</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 w-1/3">Active Tokens</th>
                        <th className="px-6 py-3 text-right">Waitlist</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {doc.slots.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                            No slots allocated for this date.
                          </td>
                        </tr>
                      ) : (
                        doc.slots.map((slot, idx) => {
                          const progress = calculateProgress(slot.currentOccupancy, slot.maxCapacity);
                          const isFull = slot.currentOccupancy >= slot.maxCapacity;

                          return (
                            <tr key={slot.slotId} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4 text-slate-400 font-mono text-xs">{idx + 1}</td>
                              <td className="px-6 py-4 font-medium text-slate-700 tabular-nums">
                                {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                <span className="mx-2 text-slate-300">–</span>
                                {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-teal-500'}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-mono font-medium text-slate-600 w-12 text-right">
                                    {slot.currentOccupancy} / {slot.maxCapacity}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(slot.status)}`}>
                                  {slot.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5">
                                  {(expandedTokensSlotId === slot.slotId ? slot.tokens : slot.tokens.slice(0, 3)).map((t) => (
                                    <span 
                                      key={t.tokenNumber} 
                                      className="px-2 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-mono rounded shadow-sm"
                                      title={`Source: ${t.tokenSource}`}
                                    >
                                      {t.tokenNumber}
                                    </span>
                                  ))}
                                  {slot.tokens.length > 3 && (
                                    <button
                                      onClick={() => setExpandedTokensSlotId(expandedTokensSlotId === slot.slotId ? null : slot.slotId)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium rounded transition-colors"
                                    >
                                      {expandedTokensSlotId === slot.slotId ? "Collapse" : `+${slot.tokens.length - 3} more`}
                                    </button>
                                  )}
                                  {slot.tokens.length === 0 && <span className="text-slate-300 text-xs">–</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {slot.waitlist.length > 0 ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-full text-xs font-bold">
                                    {slot.waitlist.length}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-xs">–</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {doc.slots.map((slot) => {
                     const progress = calculateProgress(slot.currentOccupancy, slot.maxCapacity);
                     return (
                      <div key={slot.slotId} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                             <div className="text-sm font-semibold text-slate-800">
                               {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                             <div className="text-xs text-slate-400 mt-0.5">Duration: 30m</div>
                          </div>
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(slot.status)}`}>
                            {slot.status}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Capacity</span>
                            <span>{slot.currentOccupancy} / {slot.maxCapacity}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                                className={`h-full rounded-full ${progress >= 100 ? 'bg-amber-500' : 'bg-teal-500'}`} 
                                style={{ width: `${progress}%` }} 
                             />
                          </div>
                        </div>

                        {/* Footer info */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                           <div className="text-xs text-slate-500">
                             {slot.tokens.length} active tokens
                           </div>
                           {slot.waitlist.length > 0 && (
                             <div className="text-xs font-bold text-rose-600">
                               +{slot.waitlist.length} in queue
                             </div>
                           )}
                        </div>
                      </div>
                     );
                  })}
                  {doc.slots.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-sm">No slots found.</div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}