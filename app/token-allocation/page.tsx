"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CheckIcon, AlertIcon, MedicalIcon, ArrowRightIcon } from "@/components/icons";

/** Token source options in spec order: affects priority for allocation, waitlist, and reallocation. */
const TOKEN_SOURCES: ReadonlyArray<{ value: "online_booking" | "walk_in" | "paid_priority" | "follow_up"; label: string }> = [
  { value: "online_booking", label: "Online Booking" },
  { value: "walk_in", label: "Walk-in (OPD desk)" },
  { value: "paid_priority", label: "Paid Priority" },
  { value: "follow_up", label: "Follow-up" },
] as const;

export default function TokenAllocationPage() {
  // --- Exact Logic Preserved ---
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Array<{ slotId: string; startTime: string; endTime: string; doctorId: string; availableTokens?: number; maxCapacity?: number }>>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    patientId: "",
    doctorId: "D1",
    slotTime: "",
    tokenSource: "walk_in" as const,
    name: "",
    phone: "",
    email: "",
  });

  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    tokenNumber?: string;
    estimatedTime?: string;
    waitlistPosition?: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);

  const loadSlots = useCallback(
    async (showLoading: boolean) => {
      if (showLoading) {
        setSlotsLoading(true);
        setSlotsError(null);
      }
      try {
        const res = await fetch(
          `/api/doctors/${form.doctorId}/slots?date=${encodeURIComponent(date)}`
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSlotsError(json.error ?? "Failed to load slots");
          setSlots([]);
          setForm((f) => ({ ...f, slotTime: "" }));
          return;
        }
        if (json.slots && Array.isArray(json.slots)) {
          const flat = json.slots.map((s: { slotId: string; startTime: string; endTime: string; availableTokens?: number; maxCapacity?: number }) => ({
            slotId: s.slotId,
            startTime: s.startTime,
            endTime: s.endTime,
            doctorId: form.doctorId,
            availableTokens: s.availableTokens,
            maxCapacity: s.maxCapacity,
          }));
          setSlots(flat);
          setSlotsError(null);
          setForm((f) => {
            const valid = flat.some((slot: { startTime: string }) => slot.startTime === f.slotTime);
            if (flat.length > 0 && (!f.slotTime || !valid)) {
              return { ...f, slotTime: flat[0].startTime };
            }
            if (flat.length === 0) return { ...f, slotTime: "" };
            return f;
          });
        } else {
          setSlots([]);
          setForm((f) => ({ ...f, slotTime: "" }));
        }
      } catch {
        setSlotsError("Failed to load slots");
        setSlots([]);
        setForm((f) => ({ ...f, slotTime: "" }));
      } finally {
        if (showLoading) setSlotsLoading(false);
      }
    },
    [date, form.doctorId]
  );

  useEffect(() => {
    loadSlots(true);
  }, [loadSlots]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/tokens/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.patientId || `P-${Date.now()}`,
          doctorId: form.doctorId,
          slotTime: form.slotTime,
          tokenSource: form.tokenSource,
          patientDetails:
            form.name || form.phone
              ? { name: form.name || "Patient", phone: form.phone || "N/A", email: form.email || undefined }
              : undefined,
        }),
      });
      const json = await res.json();
      setResult({
        success: json.success,
        message: json.message,
        tokenNumber: json.tokenNumber,
        estimatedTime: json.estimatedTime,
        waitlistPosition: json.waitlistPosition,
      });
      if (json.success) {
        loadSlots(false);
      }
    } catch (err) {
      setResult({
        success: false,
        message: String(err),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* Background Decor */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <MedicalIcon className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800 group-hover:text-teal-700 transition-colors">MedflowX</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {[
              { href: "/dashboard", label: "Dashboard" },
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

      <main className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Title Section */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 mb-4">
             <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
             <span className="text-xs font-bold uppercase tracking-wide text-teal-700">OPD Desk</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Allocate New Token</h1>
          <p className="text-slate-500 max-w-lg mx-auto text-lg">
            Generate appointments with intelligent slot management.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Allocation Details</h3>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Section 1: Doctor & Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Select Doctor</label>
                <div className="relative">
                  <select
                    value={form.doctorId}
                    onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-sm"
                  >
                    <option value="D1">Dr. Sharma (General Medicine)</option>
                    <option value="D2">Dr. Patel (Cardiology)</option>
                    <option value="D3">Dr. Singh (Orthopedics)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Appointment Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Section 2: Slot & Source */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex justify-between text-sm font-semibold text-slate-700">
                  <span>Available Slots</span>
                  {slotsLoading && <span className="text-teal-600 text-xs animate-pulse">Fetching availability...</span>}
                </label>
                <div className="relative">
                  <select
                    value={slotsLoading ? "" : form.slotTime}
                    onChange={(e) => setForm((f) => ({ ...f, slotTime: e.target.value }))}
                    disabled={slotsLoading || slots.length === 0}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
                    required
                  >
                    {slotsLoading ? (
                      <option value="">Loading schedules...</option>
                    ) : slotsError ? (
                      <option value="">Error loading slots</option>
                    ) : slots.length === 0 ? (
                      <option value="">No slots available for this date</option>
                    ) : (
                      slots.map((s) => {
                        const timeLabel = `${new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                        const avail = s.availableTokens != null ? ` (${s.availableTokens} left)` : "";
                        return (
                          <option key={s.slotId} value={s.startTime}>
                            {timeLabel}{avail}
                          </option>
                        );
                      })
                    )}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Token Source</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TOKEN_SOURCES.map((opt) => (
                    <label 
                      key={opt.value}
                      className={`
                        cursor-pointer text-center px-3 py-2 rounded-lg border text-xs font-medium transition-all
                        ${form.tokenSource === opt.value 
                          ? 'bg-teal-50 border-teal-200 text-teal-700 ring-1 ring-teal-500/20' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}
                      `}
                    >
                      <input 
                        type="radio" 
                        name="tokenSource" 
                        value={opt.value}
                        checked={form.tokenSource === opt.value}
                        onChange={(e) => setForm((f) => ({ ...f, tokenSource: e.target.value as any }))}
                        className="sr-only"
                      />
                      {opt.label.split(' ')[0]} {/* Shortened label for grid */}
                      <span className="block text-[10px] opacity-70 font-normal">{opt.label.split(' ').slice(1).join(' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: Patient Info (Optional) */}
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Patient Information (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Patient ID</label>
                    <input
                      type="text"
                      value={form.patientId}
                      onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
                      placeholder="e.g. P-001"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none text-sm"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none text-sm"
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium text-slate-700">Phone Number</label>
                 <input
                   type="text"
                   value={form.phone}
                   onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                   placeholder="+1 (555) 000-0000"
                   className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none text-sm"
                 />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold text-lg hover:bg-teal-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-600/20 hover:shadow-teal-600/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Allocate Token
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result Card */}
        {result && (
          <div className="mt-8 animate-fade-in-up">
            <div className={`rounded-2xl border p-8 shadow-lg ${result.success ? "bg-teal-50 border-teal-100" : "bg-white border-slate-200"}`}>
              
              {result.success ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-teal-800 mb-2">Token Allocated Successfully!</h3>
                  <p className="text-teal-600 mb-6">The appointment has been confirmed.</p>
                  
                  <div className="bg-white rounded-xl border border-teal-100 p-6 max-w-sm mx-auto shadow-sm">
                     <div className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Token Number</div>
                     <div className="text-5xl font-black text-slate-800 font-mono tracking-tighter mb-4">{result.tokenNumber}</div>
                     
                     {result.estimatedTime && (
                       <div className="pt-4 border-t border-slate-100">
                         <div className="text-xs text-slate-400 uppercase font-bold mb-1">Estimated Time</div>
                         <div className="text-sm font-semibold text-slate-700">
                            {new Date(result.estimatedTime).toLocaleString(undefined, {
                              weekday: 'short',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                   <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                    <AlertIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Slot Full - Added to Waitlist</h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">{result.message}</p>
                  
                  {result.waitlistPosition != null && (
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 inline-block">
                      <span className="text-slate-400 text-xs font-bold uppercase mr-2">Waitlist Position:</span>
                      <span className="text-xl font-black text-slate-800 font-mono">#{result.waitlistPosition}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}