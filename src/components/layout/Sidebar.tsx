import React from "react";
import { Map, Network, Database, Settings } from "lucide-react";

export default function Sidebar() {
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
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors duration-200 cursor-pointer"
          title="Map View"
        >
          <Map className="h-5 w-5" />
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors duration-200 cursor-pointer"
          title="Network Graph"
        >
          <Network className="h-5 w-5" />
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors duration-200 cursor-pointer"
          title="Database Query"
        >
          <Database className="h-5 w-5" />
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors duration-200 cursor-pointer"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
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
