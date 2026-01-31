"use client";

import { useState } from "react";
import Link from "next/link";
import { MedicalIcon, ArrowRightIcon } from "@/components/icons";

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

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="fixed inset-0 medical-grid opacity-20 pointer-events-none" />
      
      <header className="relative z-10 border-b border-white/10 glass-dark">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <MedicalIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-lg sm:text-xl font-bold truncate">MedflowX</span>
          </Link>
          <nav className="flex gap-3 sm:gap-4 md:gap-6 shrink-0">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/token-allocation", label: "Allocate" },
              { href: "/waitlist", label: "Waitlist" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/70 hover:text-white transition-colors text-xs sm:text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-3">OPD Day Simulation</h1>
          <p className="text-white/50 text-xs sm:text-sm">Run realistic scenarios with 3 doctors, multiple token sources, cancellations, and delays</p>
        </div>

        <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 mb-6 sm:mb-8 glow-hover">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <label className="block text-xs sm:text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">Scenario</label>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as Scenario)}
                className="w-full glass rounded-lg px-3 sm:px-4 py-2.5 border border-white/20 text-white bg-white/5 focus:outline-none focus:border-white/40 transition text-sm"
              >
                <option value="normal_day" className="bg-black">Normal day</option>
                <option value="high_load" className="bg-black">High load</option>
                <option value="with_emergencies" className="bg-black">With emergencies</option>
              </select>
            </div>
            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 glow-hover flex items-center justify-center gap-2 group min-h-[44px]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <span>Run Simulation</span>
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 mb-6 sm:mb-8 bg-white/5">
            <p className="text-white/90 font-medium mb-2 text-sm sm:text-base">Simulation failed</p>
            <p className="text-white/60 text-xs sm:text-sm">{error}</p>
            <button
              type="button"
              onClick={() => { setError(null); runSimulation(); }}
              className="mt-4 px-4 py-2.5 bg-white text-black rounded-lg font-semibold hover:bg-white/90 text-sm min-h-[44px]"
            >
              Retry
            </button>
          </div>
        )}
        {result && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[
              { label: "Total Allocated", value: result.summary.totalAllocated, icon: (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )},
              { label: "Waitlist Size", value: result.summary.waitlistSize, icon: (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              )},
              { label: "Completed", value: result.summary.completed, icon: (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )},
              { label: "Reallocations", value: result.summary.reallocations, icon: (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )},
              { label: "Slot Count", value: result.summary.slotCount, icon: (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )},
            ].map((stat, idx) => (
              <div 
                key={stat.label} 
                className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 glow-hover hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="text-white/80 mb-1.5 sm:mb-2">{stat.icon}</div>
                <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">{stat.label}</div>
                <div className="text-xl sm:text-2xl font-black tabular-nums">{stat.value}</div>
              </div>
            ))}
            </div>

            <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 glow-hover">
              <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/60 shrink-0" />
                Slot Utilization
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:flex xl:flex-wrap gap-2">
                {result.slotUtilization.slice(0, 20).map((s) => (
                  <div
                    key={s.slotId}
                    className="px-2.5 py-2 sm:px-3 sm:py-2 glass-dark rounded-lg border border-white/10 text-center min-w-0"
                  >
                    <div className="text-white/90 text-xs sm:text-sm font-mono font-semibold">{s.occupancy}/{s.maxCapacity}</div>
                    <div className="text-white/50 text-[10px] sm:text-xs mt-0.5">{s.utilizationPercent}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden glow-hover">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-white/5">
                <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/60 shrink-0" />
                  Events ({result.events.length})
                </h2>
              </div>
              <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[320px] table-fixed border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-white/10 bg-black/95 text-left">
                      <th className="p-3 sm:p-4 text-[10px] sm:text-xs font-semibold text-white/60 uppercase tracking-wider w-14 sm:w-20">Time</th>
                      <th className="p-3 sm:p-4 text-[10px] sm:text-xs font-semibold text-white/60 uppercase tracking-wider w-24 sm:w-32">Type</th>
                      <th className="p-3 sm:p-4 text-[10px] sm:text-xs font-semibold text-white/60 uppercase tracking-wider min-w-0">Description</th>
                      <th className="p-3 sm:p-4 text-[10px] sm:text-xs font-semibold text-white/60 uppercase tracking-wider w-32 sm:w-40">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.events.map((ev, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 sm:p-4 font-mono text-xs sm:text-sm text-white/80">{ev.time}</td>
                        <td className="p-3 sm:p-4">
                          <span className="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-white/10 text-[10px] sm:text-xs font-medium border border-white/20 capitalize">
                            {ev.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-white/70 text-xs sm:text-sm truncate">{ev.description}</td>
                        <td className="p-3 sm:p-4">
                          {ev.outcome ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/10 text-[10px] sm:text-xs font-mono font-semibold text-white border border-white/20 whitespace-nowrap">
                              {ev.outcome.replace(/^Token /, '')}
                            </span>
                          ) : (
                            <span className="text-white/30 text-xs">—</span>
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
