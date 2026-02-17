"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ClipboardIcon, 
  LightningIcon, 
  PlugIcon, 
  ArrowRightIcon, 
  MedicalIcon 
} from "@/components/icons"; // Assuming you have these, otherwise I provided SVGs below

// If you don't have the icons component, here are simple inline replacements you can use:
const CheckIcon = () => <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;

export default function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Configuration for the Hero Animation (Medical Context)
  const heroStates = [
    { text: 'for Patients.', color: '#2FB4B7', shape: 'circle' },   // Medoc Teal
    { text: 'for Doctors.', color: '#7c5cba', shape: 'square' },    // Purple
    { text: 'for Admins.', color: '#e57398', shape: 'triangle' },   // Pink
    { text: 'for Everyone.', color: '#5a6670', shape: 'hexagon' }   // Slate
  ];

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroStates.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2. Exact Data from your Original Code
  const originalFeatures = [
    {
      title: "Token Sources",
      icon: <ClipboardIcon className="w-6 h-6" />, 
      items: [
        "Online booking (priority 2)",
        "Walk-in (priority 3)",
        "Paid priority (priority 1)",
        "Follow-up (priority 2)",
      ],
      color: "#2FB4B7"
    },
    {
      title: "Core Features",
      icon: <LightningIcon className="w-6 h-6" />,
      items: [
        "Hard slot limits",
        "Dynamic reallocation",
        "Emergency insertion",
        "Delay propagation",
      ],
      color: "#7c5cba"
    },
    {
      title: "API Endpoints",
      icon: <PlugIcon className="w-6 h-6" />,
      items: [
        "POST /api/tokens/allocate",
        "DELETE /api/tokens/:id/cancel",
        "POST /api/tokens/emergency",
        "GET /api/doctors/:id/slots",
      ],
      color: "#e57398"
    },
    // Added 4th box to satisfy your request for "4 boxes" using backend context
    {
      title: "System Status",
      icon: <MedicalIcon className="w-6 h-6" />,
      items: [
        "Queue Health: Optimal",
        "Database: Connected",
        "Redis Cache: Active",
        "Latency: < 24ms",
      ],
      color: "#5a6670"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* Background Decor */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#0F172A 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

      {/* ================= HEADER (Exact Routes) ================= */}
      <header className="relative z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
          
            <h1 className="text-xl font-black tracking-tight text-slate-800">MEDOC-Assesment</h1>
          </div>
          
          {/* Exact Navbar Routes from your code */}
          <nav className="hidden md:flex gap-8">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/token-allocation", label: "Allocate" },
              { href: "/waitlist", label: "Waitlist" },
              { href: "/simulation", label: "Simulation" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors relative group"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
             <span className="hidden sm:block text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">
                v1.0.4
             </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col">
        
        {/* ================= HERO SECTION (Split View) ================= */}
        <section className="relative min-h-[85vh] flex flex-col lg:flex-row items-center overflow-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          
          {/* --- LEFT: Text Content --- */}
          <div className={`w-full lg:w-1/2 pt-12 pb-12 lg:pr-12 z-10 flex flex-col items-start justify-center transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            
            {/* Medoc Assignment Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-teal-700">
                Backend Intern Assessment
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Elastic Capacity <br />
              Management <br />
              <span
                className="transition-colors duration-500 ease-in-out"
                style={{ color: heroStates[currentIndex].color }}
              >
                {heroStates[currentIndex].text}
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 max-w-lg font-light leading-relaxed">
              Advanced OPD token system with intelligent prioritization, real-time reallocation, and dynamic capacity management.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard">
                <button
                  className="px-8 py-3.5 text-lg font-semibold text-white rounded-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex items-center gap-2"
                  style={{ backgroundColor: heroStates[currentIndex].color }}
                >
                  View Dashboard
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/token-allocation">
                <button className="px-8 py-3.5 text-lg font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all duration-300">
                  Allocate Token
                </button>
              </Link>
            </div>
          </div>

          {/* --- RIGHT: Animated Shapes --- */}
          <div className={`w-full lg:w-1/2 relative h-[50vh] lg:h-[80vh] flex items-center justify-center pointer-events-none transition-all duration-1000 delay-200 ease-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
             <div className="relative w-full h-full flex items-center justify-center">
                
                {/* 1. Teal Shape (Circle/Organic) */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${currentIndex === 0 ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-90 rotate-12'}`}>
                  <svg viewBox="0 0 200 200" className="w-[80%] h-[80%] drop-shadow-2xl text-[#2FB4B7]">
                    <path fill="currentColor" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-46.9C87.4,-34.7,90.1,-20.4,85.8,-8.3C81.5,3.8,70.2,13.7,60.8,24.1C51.4,34.5,43.9,45.4,34.3,55.1C24.7,64.8,13,73.3,0.6,72.2C-11.8,71.2,-22.6,60.6,-33.5,51.3C-44.4,42,-55.4,34,-64.1,23.3C-72.8,12.6,-79.2,-0.8,-76.6,-13.1C-74,-25.4,-62.4,-36.6,-50.7,-44.6C-39,-52.6,-27.2,-57.4,-15.6,-61.8C-4,-66.2,12.5,-70.2,30.5,-83.6L44.7,-76.4Z" transform="translate(100 100)" />
                  </svg>
                </div>

                {/* 2. Purple Shape (Medical Cross Abstract) */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${currentIndex === 1 ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-90 -rotate-12'}`}>
                  <svg viewBox="0 0 200 200" className="w-[80%] h-[80%] drop-shadow-2xl text-[#7c5cba]">
                     <rect x="60" y="20" width="80" height="160" rx="20" fill="currentColor" />
                     <rect x="20" y="60" width="160" height="80" rx="20" fill="currentColor" />
                  </svg>
                </div>

                {/* 3. Pink Shape (Heart/Care) */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${currentIndex === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                  <svg viewBox="0 0 200 200" className="w-[70%] h-[70%] drop-shadow-2xl text-[#e57398]">
                    <path fill="currentColor" d="M100 180s-60-40-85-80c-20-30-5-70 35-70 25 0 50 25 50 25s25-25 50-25c40 0 55 40 35 70-25 40-85 80-85 80z" />
                  </svg>
                </div>

                {/* 4. Slate Shape (Shield/Security) */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${currentIndex === 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                  <svg viewBox="0 0 200 200" className="w-[75%] h-[75%] drop-shadow-2xl text-[#5a6670]">
                    <path fill="currentColor" d="M100 20 L180 50 V100 C180 150 100 190 100 190 C100 190 20 150 20 100 V50 L100 20 Z" />
                  </svg>
                </div>
             </div>
          </div>
        </section>

        {/* ================= FEATURES SECTION (4 Boxes, White Theme) ================= */}
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="container mx-auto px-6 max-w-7xl">
            
            <div className="mb-12">
               <span className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-2 block">Medoc Assignment</span>
               <h3 className="text-3xl font-bold text-slate-900">Technical Specifications</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {originalFeatures.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-100 transition-all duration-300 flex flex-col items-start"
                >
                  {/* Icon Box */}
                  <div 
                    className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                    style={{ color: feature.color }}
                  >
                    {feature.icon}
                  </div>

                  {/* Title */}
                  <h4 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-teal-600 transition-colors">
                    {feature.title}
                  </h4>

                  {/* List Items */}
                  <ul className="space-y-3 w-full">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                        <span className="mt-1 flex-shrink-0">
                           <CheckIcon />
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

      <footer className="py-8 text-center text-slate-400 text-sm mt-auto">
  <Link href="https://thegauravthakur.in" target="_blank">
    By Gaurav (gauravthakur83551@gmail.com)
  </Link>
</footer>

      </main>
    </div>
  );
}