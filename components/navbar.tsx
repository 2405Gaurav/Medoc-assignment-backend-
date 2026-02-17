import React from "react";
import Link from "next/link";

const Navbar = () => {
  return (
    <header className="relative z-50 bg-white backdrop-blur-md border-b border-slate-100 sticky top-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        
        {/* Logo / Title */}
        <Link href="/">
        <h1 className="text-xl font-black tracking-tight text-slate-800">
          MEDOC-Assessment
        </h1>
        </Link>

        {/* Navigation Links */}
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
              className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Version Badge */}
        <span className="hidden sm:block text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">
          v1.0.4
        </span>
      </div>
    </header>
  );
};

export default Navbar;
