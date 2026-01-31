"use client";

import Link from "next/link";
import { ClipboardIcon, LightningIcon, PlugIcon, ArrowRightIcon, MedicalIcon } from "@/components/icons";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col lg:h-screen lg:max-h-screen lg:overflow-hidden">
      {/* Animated grid background */}
      <div className="fixed inset-0 medical-grid opacity-30 pointer-events-none animate-shimmer" />
      
      {/* Floating orbs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <header className="relative z-10 border-b border-white/10 glass-dark flex-shrink-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <MedicalIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">MedflowX</h1>
          </div>
          <nav className="hidden md:flex gap-6">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/token-allocation", label: "Allocate" },
              { href: "/waitlist", label: "Waitlist" },
              { href: "/simulation", label: "Simulation" },
            ].map((item, idx) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/70 hover:text-white transition-all duration-300 text-sm font-medium relative group"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Single-page layout on desktop: main fills remaining height, no scroll */}
      <main className="relative z-10 flex-1 flex flex-col min-h-0 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Hero: compact on desktop so hero + cards fit in one viewport */}
        <div className="text-center flex-shrink-0 mb-6 lg:mb-8 animate-fade-in">
          <div className="inline-block mb-3 lg:mb-4 animate-slide-down">
            <span className="px-3 py-1.5 lg:px-4 lg:py-2 glass rounded-full text-xs font-medium text-white/80 border border-white/10 hover:border-white/20 transition-all duration-300">
              HOSPITAL OPD MANAGEMENT SYSTEM
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3 lg:mb-4 tracking-tight animate-fade-in" style={{ animationDelay: '200ms' }}>
            <span className="text-gradient inline-block">Elastic Capacity</span>
            <br />
            <span className="inline-block" style={{ animationDelay: '300ms' }}>Token Allocation</span>
          </h2>
          <p className="text-base lg:text-lg text-white/60 mb-6 lg:mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '400ms' }}>
            Advanced OPD token system with intelligent prioritization, real-time reallocation, and dynamic capacity management.
          </p>
          <div className="flex flex-wrap gap-3 justify-center animate-fade-in" style={{ animationDelay: '500ms' }}>
            <Link
              href="/dashboard"
              className="group px-6 py-3 lg:px-8 lg:py-4 bg-white text-black rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 glow-hover flex items-center gap-2 hover:scale-105"
            >
              View Dashboard
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/token-allocation"
              className="px-6 py-3 lg:px-8 lg:py-4 glass rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 border border-white/20 glow-hover hover:scale-105"
            >
              Allocate Token
            </Link>
          </div>
        </div>

        {/* Cards: flex-1 so they take remaining space; compact on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8 flex-1 min-h-0 content-start lg:content-center">
          <FeatureCard
            icon={<ClipboardIcon className="w-6 h-6 lg:w-7 lg:h-7" />}
            title="Token Sources"
            items={[
              "Online booking (priority 2)",
              "Walk-in (priority 3)",
              "Paid priority (priority 1)",
              "Follow-up (priority 2)",
            ]}
            delay={600}
          />
          <FeatureCard
            icon={<LightningIcon className="w-6 h-6 lg:w-7 lg:h-7" />}
            title="Core Features"
            items={[
              "Hard slot limits",
              "Dynamic reallocation",
              "Emergency insertion",
              "Delay propagation",
            ]}
            delay={700}
          />
          <FeatureCard
            icon={<PlugIcon className="w-6 h-6 lg:w-7 lg:h-7" />}
            title="API Endpoints"
            items={[
              "POST /api/tokens/allocate",
              "DELETE /api/tokens/:id/cancel",
              "POST /api/tokens/emergency-insert",
              "GET /api/doctors/:id/slots",
            ]}
            delay={800}
          />
        </div>

        <footer className="relative z-10 flex-shrink-0 py-4 text-center text-white/40 text-sm">
          By Yash Dhiman
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  items,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  delay?: number;
}) {
  return (
    <div 
      className="glass rounded-2xl p-6 lg:p-8 border border-white/10 hover:border-white/20 transition-all duration-300 glow-hover group relative overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Icon container with better styling */}
      <div className="relative z-10 mb-4 flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
        <div className="text-white/90 group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
      </div>
      
      {/* Title with better typography */}
      <h3 className="relative z-10 font-bold text-xl lg:text-2xl mb-5 text-white tracking-tight">{title}</h3>
      
      {/* Items list with improved spacing and styling */}
      <ul className="relative z-10 space-y-3 text-white/70 text-sm lg:text-base">
        {items.map((item, idx) => (
          <li 
            key={idx} 
            className="flex items-start gap-3 group-hover:text-white/90 transition-colors duration-300"
            style={{ transitionDelay: `${idx * 30}ms` }}
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/50 group-hover:bg-white/80 transition-colors duration-300 flex-shrink-0" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
