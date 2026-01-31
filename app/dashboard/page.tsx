"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MedicalIcon } from "@/components/icons";

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
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [data, setData] = useState<DoctorSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTokensSlotId, setExpandedTokensSlotId] = useState<string | null>(null);

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
      setData(
        DOCTOR_IDS.map((doctorId) => ({
          doctorId,
          doctorName: DOCTOR_NAMES[doctorId],
          slots: [],
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, [date]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchAll();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [date]);

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
              { href: "/token-allocation", label: "Allocate" },
              { href: "/waitlist", label: "Waitlist" },
              { href: "/simulation", label: "Simulation" },
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-2">OPD Dashboard</h1>
            <p className="text-white/50 text-xs sm:text-sm">Real-time slot occupancy and token allocation</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <label className="text-white/70 text-xs sm:text-sm font-medium shrink-0">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass rounded-lg px-3 sm:px-4 py-2 border border-white/20 text-white bg-white/5 focus:outline-none focus:border-white/40 transition flex-1 sm:flex-none min-w-0 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-6 sm:p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="mt-4 text-white/60 text-sm sm:text-base">Loading slots...</p>
          </div>
        ) : error ? (
          <div className="glass rounded-2xl p-6 sm:p-12 text-center border border-white/10">
            <p className="text-white/80 mb-4 text-sm sm:text-base">{error}</p>
            <button
              type="button"
              onClick={() => fetchAll()}
              className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-white/90 transition-all text-sm"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {data.map((doc, docIdx) => (
              <section 
                key={doc.doctorId} 
                className="glass rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden glow-hover animate-fade-in-up"
                style={{ animationDelay: `${docIdx * 100}ms` }}
              >
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-white/5">
                  <h2 className="text-base sm:text-xl font-bold flex items-center gap-2 sm:gap-3 truncate">
                    <span className="w-2 h-2 rounded-full bg-white/60 shrink-0" />
                    <span className="min-w-0 truncate">{doc.doctorName ?? doc.doctorId}</span>
                  </h2>
                </div>

                {/* Mobile: slot cards */}
                <div className="md:hidden divide-y divide-white/5">
                  {doc.slots.map((slot, idx) => {
                    const occupancyPercent = (slot.currentOccupancy / slot.maxCapacity) * 100;
                    return (
                      <div
                        key={slot.slotId}
                        className="px-4 py-3 sm:py-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-white/10 text-xs font-bold text-white/90">
                            {idx + 1}
                          </span>
                          <span className="text-white/80 font-mono text-xs">
                            {new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {" – "}
                            {new Date(slot.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-white transition-all duration-1000 ease-out"
                              style={{ width: `${occupancyPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-white/90 shrink-0">
                            {slot.currentOccupancy}/{slot.maxCapacity}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              slot.status === "delayed"
                                ? "bg-white/20 text-white border border-white/30"
                                : slot.status === "cancelled"
                                ? "bg-white/10 text-white/50 border border-white/10"
                                : "bg-white/10 text-white/80 border border-white/20"
                            }`}
                          >
                            {slot.status}
                          </span>
                          {slot.tokens.length > 0 && (
                            <span className="text-[10px] text-white/50">
                              {slot.tokens.length} token{slot.tokens.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {slot.waitlist.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white/80">
                              <span className="w-1 h-1 rounded-full bg-white/60" />
                              {slot.waitlist.length} waitlist
                            </span>
                          )}
                        </div>
                        {slot.tokens.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(expandedTokensSlotId === slot.slotId ? slot.tokens : slot.tokens.slice(0, 4)).map((t) => (
                              <span key={t.tokenNumber} className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono text-white/80 border border-white/20">
                                {t.tokenNumber}
                              </span>
                            ))}
                            {slot.tokens.length > 4 && (
                              <button
                                type="button"
                                onClick={() => setExpandedTokensSlotId((id) => (id === slot.slotId ? null : slot.slotId))}
                                className="px-1.5 py-0.5 text-[10px] font-medium text-white/70 hover:text-white border border-white/20 rounded hover:bg-white/10 transition-colors"
                              >
                                {expandedTokensSlotId === slot.slotId ? "Show less" : `View all (${slot.tokens.length})`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left p-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Slot</th>
                        <th className="text-left p-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Time</th>
                        <th className="text-left p-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Occupancy</th>
                        <th className="text-left p-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Status</th>
                        <th className="text-left p-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Tokens</th>
                        <th className="text-left p-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Waitlist</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.slots.map((slot, idx) => {
                        const occupancyPercent = (slot.currentOccupancy / slot.maxCapacity) * 100;
                        return (
                          <tr 
                            key={slot.slotId} 
                            className="border-b border-white/5 hover:bg-white/5 transition-all duration-300 animate-fade-in"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <td className="p-4 font-medium text-white/90" title={slot.slotId}>
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-white/10 text-xs font-bold">
                                {idx + 1}
                              </span>
                            </td>
                            <td className="p-4 text-white/80 font-mono text-sm">
                              {new Date(slot.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(slot.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-white transition-all duration-1000 ease-out"
                                    style={{ width: `${occupancyPercent}%`, animationDelay: `${idx * 100}ms` }}
                                  />
                                </div>
                                <span className="text-sm font-mono text-white/90 min-w-[3rem]">
                                  {slot.currentOccupancy}/{slot.maxCapacity}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  slot.status === "delayed"
                                    ? "bg-white/20 text-white border border-white/30"
                                    : slot.status === "cancelled"
                                    ? "bg-white/10 text-white/50 border border-white/10"
                                    : "bg-white/10 text-white/80 border border-white/20"
                                }`}
                              >
                                {slot.status}
                              </span>
                            </td>
                            <td className="p-4">
                              {slot.tokens.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {(expandedTokensSlotId === slot.slotId ? slot.tokens : slot.tokens.slice(0, 3)).map((t) => (
                                    <span key={t.tokenNumber} className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-white border border-white/20">
                                      {t.tokenNumber}
                                    </span>
                                  ))}
                                  {slot.tokens.length > 3 && (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedTokensSlotId((id) => (id === slot.slotId ? null : slot.slotId))}
                                      className="px-2 py-1 text-xs font-medium text-white/70 hover:text-white border border-white/20 rounded hover:bg-white/10 transition-colors whitespace-nowrap"
                                    >
                                      {expandedTokensSlotId === slot.slotId ? "Show less" : `View all (${slot.tokens.length})`}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-white/30">—</span>
                              )}
                            </td>
                            <td className="p-4">
                              {slot.waitlist.length > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-xs font-medium text-white/80 border border-white/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                  {slot.waitlist.length}
                                </span>
                              ) : (
                                <span className="text-white/30">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
