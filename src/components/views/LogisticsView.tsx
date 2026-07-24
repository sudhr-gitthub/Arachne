import React from "react";

export default function LogisticsView() {
  const fleet = [
    { plate: "KA-51-MD-9876", type: "Interceptor SUV", status: "Active", location: "Sector 4" },
    { plate: "MH-12-AS-1284", type: "Tactical Sedan", status: "Active", location: "North Range" },
    { plate: "DL-03-KS-4242", type: "Command Van", status: "Maintenance", location: "HQ Depot" },
    { plate: "KA-03-TR-9110", type: "Interceptor SUV", status: "Active", location: "Outer Ring" },
    { plate: "HR-26-BL-7700", type: "Cruiser", status: "Active", location: "East Gate" },
    { plate: "UP-16-AX-1234", type: "Cruiser", status: "Maintenance", location: "HQ Depot" },
  ];

  const armory = [
    { item: "Tactical Sidearms (Glock 19)", allocated: 82, total: 100, color: "from-blue-500 to-indigo-600" },
    { item: "Ballistic Shields (Level III)", allocated: 15, total: 20, color: "from-purple-500 to-pink-600" },
    { item: "Body Armor (Kevlar)", allocated: 95, total: 100, color: "from-emerald-500 to-teal-600" },
    { item: "Crowd Control Gear", allocated: 45, total: 80, color: "from-amber-500 to-orange-600" },
    { item: "Non-Lethal tasers", allocated: 58, total: 70, color: "from-cyan-500 to-blue-500" },
  ];

  const roster = [
    { name: "Insp. Vikram Malhotra", role: "Shift Commander", status: "On Duty" },
    { name: "SI Priya Sen", role: "Field Supervisor", status: "On Duty" },
    { name: "Officer Rahul Varma", role: "Patrol Unit A", status: "On Duty" },
    { name: "Officer Karen Singhal", role: "Patrol Unit B", status: "Standby" },
    { name: "Officer Rohan Joshi", role: "Logistics Dispatch", status: "On Duty" },
    { name: "Officer Amit Shah", role: "Armory Custodian", status: "On Duty" },
    { name: "SI Sanjay Dutt", role: "Surveillance Desk", status: "Standby" },
    { name: "Officer Neha Gupta", role: "Patrol Unit C", status: "Standby" },
  ];

  return (
    <div className="w-full glass-card rounded-xl p-6 border border-slate-800 flex flex-col gap-6 relative overflow-hidden min-h-[600px]">
      <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
      
      {/* Title */}
      <div className="relative z-10 border-b border-slate-800/80 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Logistics & Operations Center
          </h2>
          <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
            Module ID: LOG-SEC-3 // Realtime Resource Allocator
          </p>
        </div>
        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
      </div>

      {/* 3-Column Grid */}
      <div className="relative z-10 grid grid-cols-3 gap-6 flex-1">
        {/* Column 1: Fleet Status */}
        <div className="border border-slate-800/80 bg-slate-950/30 rounded-lg p-4 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-900 pb-2 flex items-center justify-between">
            <span>Fleet Status</span>
            <span className="text-[9px] font-mono text-slate-600">6 UNITS</span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {fleet.map((vehicle, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded border border-slate-900 bg-slate-950/50 hover:bg-slate-900/30 transition-colors"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold font-mono text-slate-200">{vehicle.plate}</span>
                  <span className="text-[10px] text-slate-500">{vehicle.type}</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        vehicle.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                      }`}
                    />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{vehicle.status}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-600">{vehicle.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Armory Deployment */}
        <div className="border border-slate-800/80 bg-slate-950/30 rounded-lg p-4 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-900 pb-2 flex items-center justify-between">
            <span>Armory Allocation</span>
            <span className="text-[9px] font-mono text-slate-600">LIVE</span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {armory.map((item, idx) => {
              const percent = Math.round((item.allocated / item.total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-300 truncate max-w-[180px]">{item.item}</span>
                    <span className="text-slate-500">
                      {item.allocated}/{item.total} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Shift Roster */}
        <div className="border border-slate-800/80 bg-slate-950/30 rounded-lg p-4 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-900 pb-2 flex items-center justify-between">
            <span>Shift Roster</span>
            <span className="text-[9px] font-mono text-slate-600">8 OFFC</span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {roster.map((person, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded border border-slate-900/50 bg-slate-950/30"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-300">{person.name}</span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">{person.role}</span>
                </div>
                <span
                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                    person.status === "On Duty"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-slate-800 text-slate-500 border-slate-700/30"
                  }`}
                >
                  {person.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
