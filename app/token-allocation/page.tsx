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
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
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
              { href: "/waitlist", label: "Waitlist" },
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

      <main className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-3">Allocate Token</h1>
          <p className="text-white/50 mb-2">Request an OPD appointment token</p>
          <p className="text-white/40 text-sm">System handles delays (slot timing), cancellations (reallocation to waitlist), and emergency insertions.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 md:p-8 border border-white/10 space-y-6 glow-hover animate-fade-in-up">
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
              Patient ID <span className="text-white/40 font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={form.patientId}
              onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
              placeholder="P-001"
              className="w-full glass rounded-lg px-4 py-3 border border-white/20 text-white bg-white/5 placeholder:text-white/30 focus:outline-none focus:border-white/40 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
                Doctor
              </label>
              <select
                value={form.doctorId}
                onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
                className="w-full glass rounded-lg px-4 py-3 border border-white/20 text-white bg-white/5 focus:outline-none focus:border-white/40 transition"
              >
                <option value="D1" className="bg-black">Dr. Sharma (General Medicine)</option>
                <option value="D2" className="bg-black">Dr. Patel (Cardiology)</option>
                <option value="D3" className="bg-black">Dr. Singh (Orthopedics)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full glass rounded-lg px-4 py-3 border border-white/20 text-white bg-white/5 focus:outline-none focus:border-white/40 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
              Slot Time
            </label>
            <select
              value={slotsLoading ? "" : form.slotTime}
              onChange={(e) => setForm((f) => ({ ...f, slotTime: e.target.value }))}
              disabled={slotsLoading || slots.length === 0}
              className="w-full glass rounded-lg px-4 py-3 border border-white/20 text-white bg-white/5 focus:outline-none focus:border-white/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
              required
            >
              {slotsLoading ? (
                <option value="" className="bg-black">Loading slots...</option>
              ) : slotsError ? (
                <option value="" className="bg-black">{slotsError}</option>
              ) : slots.length === 0 ? (
                <option value="" className="bg-black">No slots available for this date</option>
              ) : (
                slots.map((s) => {
                  const timeLabel = `${new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                  const avail = s.availableTokens != null ? ` (${s.availableTokens} available)` : "";
                  return (
                    <option key={s.slotId} value={s.startTime} className="bg-black">
                      {timeLabel}{avail}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
              Token Source
            </label>
            <p className="text-white/50 text-xs mb-2">Determines priority when slots are full and for waitlist reallocation.</p>
            <select
              value={form.tokenSource}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  tokenSource: e.target.value as (typeof form)["tokenSource"],
                }))
              }
              className="w-full glass rounded-lg px-4 py-3 border border-white/20 text-white bg-white/5 focus:outline-none focus:border-white/40 transition"
            >
              {TOKEN_SOURCES.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-black">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
                Name <span className="text-white/40 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full glass rounded-lg px-4 py-3 border border-white/20 text-white bg-white/5 placeholder:text-white/30 focus:outline-none focus:border-white/40 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2 uppercase tracking-wider">
                Phone <span className="text-white/40 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full glass rounded-lg px-4 py-3 border border-white/20 text-white bg-white/5 placeholder:text-white/30 focus:outline-none focus:border-white/40 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 glow-hover flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span>Allocating...</span>
              </>
            ) : (
              <>
                <span>Allocate Token</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {result && (
          <div
            className={`mt-8 rounded-2xl border p-6 md:p-8 glow-hover ${
              result.success
                ? "glass border-white/20"
                : "glass-dark border-white/10"
            }`}
          >
            {result.success ? (
              <>
                <div className="flex items-center gap-3 mb-6 animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black animate-scale-in">
                    <CheckIcon className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-xl">Token Allocated</span>
                </div>
                {result.tokenNumber && (
                  <div className="mb-6">
                    <p className="text-sm text-white/50 mb-2 uppercase tracking-wider">Token Number</p>
                    <p className="text-4xl md:text-5xl font-black font-mono tracking-wider text-white">
                      {result.tokenNumber}
                    </p>
                  </div>
                )}
                {result.estimatedTime && (
                  <div className="mb-6 p-4 glass-dark rounded-lg border border-white/10">
                    <p className="text-sm text-white/50 mb-1 uppercase tracking-wider">Estimated Time</p>
                    <p className="text-lg font-semibold text-white">
                      {new Date(result.estimatedTime).toLocaleString(undefined, {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                )}
                <p className="text-sm text-white/60 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  Please proceed to the OPD desk with this token
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30 animate-scale-in">
                    <AlertIcon className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-xl">Added to Waitlist</span>
                </div>
                <p className="text-white/70 mb-4">{result.message}</p>
                {result.waitlistPosition != null && (
                  <div className="p-4 glass-dark rounded-lg border border-white/10">
                    <p className="text-sm text-white/50 mb-1 uppercase tracking-wider">Your Position</p>
                    <p className="text-2xl font-bold font-mono text-white">{result.waitlistPosition}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
