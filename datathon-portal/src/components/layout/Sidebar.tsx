"use client";

import React from "react";
import { Map, Network, Database, Settings } from "lucide-react";
import { useApp, NavView } from "@/context/AppContext";
import { cn } from "@/lib/utils";

interface NavItem {
  view: NavView;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { view: "map", icon: Map, label: "Tactical Map" },
  { view: "network", icon: Network, label: "Network Graph" },
  { view: "database", icon: Database, label: "Database Explorer" },
  { view: "settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const { activeView, setActiveView } = useApp();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-16 bg-surface border-r border-slate-800 flex flex-col items-center py-6 z-30 shadow-xl transition-all duration-300">
      {/* Brand logo / mark */}
      <div className="mb-8 flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center border border-accent-blue/30 text-accent-blue font-bold text-sm">
          Ω
        </div>
      </div>

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col gap-4 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={cn(
                "relative group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 cursor-pointer",
                isActive 
                  ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/30 shadow-[0_0_12px_rgba(59,130,246,0.15)]" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
              title={item.label}
              aria-label={item.label}
            >
              <Icon className="w-5.5 h-5.5" />
              
              {/* Tooltip */}
              <span className="absolute left-16 scale-0 transition-all duration-150 rounded bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 group-hover:scale-100 shadow-md border border-slate-800 whitespace-nowrap z-40">
                {item.label}
              </span>

              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 w-1 h-6 rounded-r bg-accent-blue" />
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Status indicator bottom */}
      <div className="mt-auto">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      </div>
    </aside>
  );
}
