"use client";

import React from "react";
import { Map, Network, Database, Settings } from "lucide-react";
import { useAppStore, SidebarTab } from "@/store/useAppStore";

export default function Sidebar() {
  const { activeSidebarTab, setActiveSidebarTab } = useAppStore();

  const tabs: { id: SidebarTab; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "Map", title: "Map View", icon: Map },
    { id: "Network", title: "Network Graph", icon: Network },
    { id: "Database", title: "Database Query", icon: Database },
    { id: "Settings", title: "Settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center justify-between border-r glass-card py-4 text-slate-400">
      {/* Custom SVG Logo */}
      <div className="flex items-center justify-center">
        <svg
          className="h-8 w-8 text-primary animate-pulse"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="6, 6" />
          <path d="M50 15 L50 85 M15 50 L85 50" stroke="currentColor" strokeWidth="2" />
          <polygon points="50,35 65,50 50,65 35,50" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="50" r="6" fill="currentColor" />
        </svg>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSidebarTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSidebarTab(tab.id)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)] border border-blue-500/20"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
              title={tab.title}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </nav>

      {/* Profile Placeholder */}
      <div className="relative">
        <div className="h-10 w-10 rounded-full border border-blue-500/50 bg-slate-800 flex items-center justify-center font-bold text-blue-400 text-sm cursor-pointer hover:border-blue-400 transition-colors">
          JD
        </div>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 bg-green-500" />
      </div>
    </aside>
  );
}
