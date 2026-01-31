"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MedicalIcon } from "@/components/icons";

interface WaitlistEntry {
  id: string;
  patientId: string;
  doctorId: string;
  preferredSlotId: string | null;
  tokenSource: string;
  priority: number;
  joinedAt: string;
  patientDetails?: { name: string; phone: string };
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWaitlist() {
      setLoading(true);
      const url = doctorId
        ? `/api/waitlist?doctorId=${encodeURIComponent(doctorId)}`
        : "/api/waitlist";
      const res = await fetch(url);
      const json = await res.json();
      setEntries(json.waitlist ?? []);
      setLoading(false);
    }
    fetchWaitlist();
    const t = setInterval(fetchWaitlist, 10000);
    return () => clearInterval(t);
  }, [doctorId]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="fixed inset-0 medical-grid opacity-20 pointer-events-none" />
      
      <header className="relative z-10 border-b border-white/10 glass-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <MedicalIcon className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">MedflowX</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/token-allocation", label: "Allocate" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/70 hover:text-white transition-colors text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2">Waitlist</h1>
            <p className="text-white/50 text-sm">Real-time patient queue monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-white/70 text-sm font-medium">Filter by doctor</label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="glass rounded-lg px-4 py-2 border border-white/20 text-white bg-white/5 focus:outline-none focus:border-white/40 transition"
            >
              <option value="" className="bg-black">All doctors</option>
              <option value="D1" className="bg-black">Dr. Sharma</option>
              <option value="D2" className="bg-black">Dr. Patel</option>
              <option value="D3" className="bg-black">Dr. Singh</option>
            </select>
            <span className="text-white/40 text-xs hidden sm:inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
              Auto-refresh
            </span>
          </div>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="mt-4 text-white/60">Loading waitlist...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-white/10 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-white/60 text-lg">No patients on the waitlist</p>
            <p className="text-white/40 text-sm mt-2">All slots are currently available</p>
          </div>
        ) : (
          <div className="glass rounded-2xl border border-white/10 overflow-hidden glow-hover animate-fade-in-up">
            <div className="px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                  Active Waitlist ({entries.length})
                </h2>
                <span className="text-xs text-white/50 font-mono">Priority • FIFO</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left p-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Position</th>
                    <th className="text-left p-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Patient</th>
                    <th className="text-left p-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Doctor</th>
                    <th className="text-left p-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Source</th>
                    <th className="text-left p-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Priority</th>
                    <th className="text-left p-4 text-xs font-semibold text-white/60 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, idx) => (
                    <tr 
                      key={e.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <td className="p-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-white/10 text-sm font-bold border border-white/20">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-white/90">
                          {e.patientDetails?.name ?? e.patientId}
                        </div>
                        {e.patientDetails?.phone && (
                          <div className="text-xs text-white/50 mt-0.5">{e.patientDetails.phone}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded bg-white/10 text-xs font-medium border border-white/20">
                          {e.doctorId}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-medium border border-white/20 capitalize">
                          {e.tokenSource.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                          e.priority === 1 ? 'bg-white/20 text-white border border-white/30' :
                          e.priority === 2 ? 'bg-white/10 text-white/80 border border-white/20' :
                          'bg-white/5 text-white/60 border border-white/10'
                        }`}>
                          {e.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-white/70 font-mono">
                          {new Date(e.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-xs text-white/50 mt-0.5">
                          {new Date(e.joinedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
