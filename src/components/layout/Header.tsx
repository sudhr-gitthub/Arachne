"use client";

import React from "react";
import { Shield, ShieldAlert, User } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export default function Header() {
  const { role, toggleRole } = useApp();

  return (
    <header className="fixed top-0 left-16 right-0 h-16 bg-surface/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 z-20 shadow-md">
      {/* Title */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-accent-blue" />
        <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase">
          KSP Intelligence Portal
        </h1>
      </div>

      {/* Role Toggle Switcher */}
      <div className="flex items-center gap-4">
        {/* Status display */}
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
            System Auth Mode
          </span>
          <span className={cn(
            "text-xs font-medium tracking-wide",
            role === "Commissioner" ? "text-accent-red font-semibold" : "text-emerald-400"
          )}>
            {role === "Commissioner" ? "Police Commissioner" : "Station House Officer"}
          </span>
        </div>

        {/* Action Toggle Button */}
        <button
          onClick={toggleRole}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 text-xs font-semibold cursor-pointer shadow-sm",
            role === "Commissioner"
              ? "bg-accent-red/10 border-accent-red/30 text-accent-red hover:bg-accent-red/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
              : "bg-accent-blue/10 border-accent-blue/30 text-accent-blue hover:bg-accent-blue/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]"
          )}
          title="Switch active user profile to simulate RBAC policies"
        >
          {role === "Commissioner" ? (
            <>
              <ShieldAlert className="w-4 h-4" />
              <span>Switch to SHO</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4" />
              <span>Switch to Commissioner</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
