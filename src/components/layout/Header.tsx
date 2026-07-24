"use client";

import React from "react";
import { useAppStore, HeaderTab } from "@/store/useAppStore";

export default function Header() {
  const { role, setRole, activeHeaderTab, setActiveHeaderTab } = useAppStore();

  const handleTabClick = (e: React.MouseEvent, tab: HeaderTab) => {
    e.preventDefault();
    setActiveHeaderTab(tab);
  };

  return (
    <header className="fixed top-0 right-0 left-16 z-30 flex h-16 items-center justify-between border-b glass-card px-6">
      {/* Left side: Branding & Navigation */}
      <div className="flex items-center gap-8">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-white neon-text-primary">
            ARACHNE
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-blue-400">
            Advanced Command Intelligence
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {(["Command", "Logistics", "Surveillance"] as HeaderTab[]).map((tab) => {
            const isActive = activeHeaderTab === tab;
            return (
              <button
                key={tab}
                onClick={(e) => handleTabClick(e, tab)}
                className={`px-1 py-4 transition-colors cursor-pointer ${
                  isActive
                    ? "text-white border-b-2 border-blue-500 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right side: RBAC Toggle */}
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-slate-400">Role:</span>
        <div className="flex rounded-lg bg-slate-900/80 p-1 border border-slate-700/50">
          <button
            onClick={() => setRole("SHO")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
              role === "SHO"
                ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            SHO
          </button>
          <button
            onClick={() => setRole("Commissioner")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${
              role === "Commissioner"
                ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Commissioner
          </button>
        </div>
      </div>
    </header>
  );
}
