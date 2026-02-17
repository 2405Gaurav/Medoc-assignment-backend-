"use client";

import { useState } from "react";
import Link from "next/link";
import { MedicalIcon, ArrowRightIcon } from "@/components/icons";

// --- Types (Kept Exact) ---
type Scenario = "normal_day" | "high_load" | "with_emergencies";

interface SimResult {
  scenario: string;
  events: Array<{ time: string; type: string; description: string; outcome?: string }>;
  summary: {
    totalAllocated: number;
    waitlistSize: number;
    completed: number;
    reallocations: number;
    slotCount: number;
  };
  slotUtilization: Array<{
    slotId: string;
    occupancy: number;
    maxCapacity: number;
    utilizationPercent: number;
  }>;
}

export default function SimulationPage() {
  const [scenario, setScenario] = useState<Scenario>("normal_day");
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSimulation() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/simulation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      const json = await res.json();
      if (res.ok) setResult(json);
      else setError(json.error ?? "Simulation failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run simulation");
    } finally {
      setLoading(false);
    }
  }

  // Helper for status badge colors in the table
  const getEventTypeColor = (type: string) => {
    if (type.includes('emergency')) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (type.includes('reallocate')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (type.includes('complete')) return 'bg-teal-50 text-teal-700 border-teal-100';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* Background Decor */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

  

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Simulation</h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Beta Feature</span>
          </div>
          <p className="text-slate-500 max-w-2xl text-sm">
            Run realistic scenarios to test system resilience against high load, emergencies, and cancellations.
          </p>
        </div>

        {/* Controls Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:flex-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Scenario</label>
              <div className="relative">
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value as Scenario)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-sm font-medium"
                >
                  <option value="normal_day">Normal Day (Balanced Load)</option>
                  <option value="high_load">High Load (Max Capacity)</option>
                  <option value="with_emergencies">Emergency Surge (Priority Interrupts)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            
            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Run Simulation</span>
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 mb-8 flex items-start gap-4">
             <div className="text-rose-500 mt-0.5">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <div>
               <h3 className="text-rose-800 font-bold mb-1">Simulation Failed</h3>
               <p className="text-rose-600 text-sm mb-3">{error}</p>
               <button onClick={() => { setError(null); runSimulation(); }} className="text-xs font-bold uppercase tracking-wider text-rose-700 hover:text-rose-900 underline decoration-rose-300 underline-offset-4">Retry</button>
             </div>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-fade-in-up">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
               <StatBox label="Allocated" value={result.summary.totalAllocated} iconPath="M12 4v16m8-8H4" color="text-teal-600" />
               <StatBox label="Waitlist" value={result.summary.waitlistSize} iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="text-amber-600" />
               <StatBox label="Completed" value={result.summary.completed} iconPath="M5 13l4 4L19 7" color="text-indigo-600" />
               <StatBox label="Reallocations" value={result.summary.reallocations} iconPath="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" color="text-rose-600" />
               <StatBox label="Total Slots" value={result.summary.slotCount} iconPath="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" color="text-slate-600" />
            </div>

            {/* Utilization Heatmap */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
               <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                 Slot Utilization Heatmap
               </h3>
               <div className="flex flex-wrap gap-2">
                  {result.slotUtilization.slice(0, 30).map((s) => {
                    // Color scale based on utilization
                    let bgClass = "bg-slate-50 border-slate-100 text-slate-400";
                    if (s.utilizationPercent > 0) bgClass = "bg-teal-50 border-teal-100 text-teal-600";
                    if (s.utilizationPercent > 50) bgClass = "bg-teal-100 border-teal-200 text-teal-700";
                    if (s.utilizationPercent > 90) bgClass = "bg-teal-500 border-teal-600 text-white";

                    return (
                      <div key={s.slotId} className={`w-12 h-12 rounded-lg border flex flex-col items-center justify-center text-[10px] font-bold ${bgClass}`} title={`Slot ${s.slotId}: ${s.utilizationPercent}%`}>
                         <span>{s.occupancy}/{s.maxCapacity}</span>
                      </div>
                    )
                  })}
               </div>
            </div>

            {/* Event Log Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Simulation Log</h3>
                  <span className="text-xs font-medium text-slate-500">{result.events.length} events recorded</span>
               </div>
               
               <div className="max-h-[500px] overflow-y-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                       <tr>
                          <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-24">Time</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Type</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider w-40 text-right">Outcome</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {result.events.map((ev, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-3 text-xs font-mono text-slate-500">{ev.time}</td>
                             <td className="px-6 py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getEventTypeColor(ev.type)}`}>
                                   {ev.type.replace(/_/g, ' ')}
                                </span>
                             </td>
                             <td className="px-6 py-3 text-sm text-slate-700">{ev.description}</td>
                             <td className="px-6 py-3 text-right">
                                {ev.outcome ? (
                                   <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                                      {ev.outcome.replace(/^Token /, '')}
                                   </span>
                                ) : (
                                   <span className="text-slate-300 text-xs">—</span>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

// Simple Stat Component
function StatBox({ label, value, iconPath, color }: { label: string; value: number; iconPath: string; color: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
       <div className={`w-8 h-8 mb-3 rounded-lg flex items-center justify-center bg-slate-50 text-slate-400`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
       </div>
       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
       <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  );
}