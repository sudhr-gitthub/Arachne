import { create } from "zustand";

export type Role = "SHO" | "Commissioner";
export type HeaderTab = "Command" | "Logistics" | "Surveillance";
export type SidebarTab = "Map" | "Network" | "Database" | "Settings";

interface AppState {
  role: Role;
  activeHeaderTab: HeaderTab;
  activeSidebarTab: SidebarTab;
  setRole: (role: Role) => void;
  setActiveHeaderTab: (tab: HeaderTab) => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: "SHO",
  activeHeaderTab: "Command",
  activeSidebarTab: "Map",
  setRole: (role) => set({ role }),
  setActiveHeaderTab: (activeHeaderTab) => set({ activeHeaderTab }),
  setActiveSidebarTab: (activeSidebarTab) => set({ activeSidebarTab }),
}));
