"use client";

import React, { createContext, useContext, useState } from "react";

export type NavView = "map" | "network" | "database" | "settings";
export type UserRole = "SHO" | "Commissioner"; // SHO = Station House Officer

interface AppContextType {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  role: UserRole;
  toggleRole: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<NavView>("map");
  const [role, setRole] = useState<UserRole>("SHO");

  const toggleRole = () => {
    setRole((prev) => (prev === "SHO" ? "Commissioner" : "SHO"));
  };

  return (
    <AppContext.Provider value={{ activeView, setActiveView, role, toggleRole }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
