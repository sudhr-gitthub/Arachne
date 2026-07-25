import { create } from "zustand";

export type Role = "SHO" | "Commissioner" | "Analyst";
export type HeaderTab = "Command" | "Logistics" | "Surveillance";
export type SidebarTab = "Dashboard" | "Map" | "Network" | "Analytics" | "Predictions" | "Reports" | "Database" | "Settings";

interface UserProfile {
  email: string;
  name?: string;
  role: Role;
}

interface AppState {
  role: Role;
  activeHeaderTab: HeaderTab;
  activeSidebarTab: SidebarTab;
  token: string | null;
  user: UserProfile | null;
  
  setRole: (role: Role) => void;
  setActiveHeaderTab: (tab: HeaderTab) => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => {
  // Try to load initial token/user safely on client side
  let initialToken = null;
  let initialUser = null;
  if (typeof window !== "undefined") {
    initialToken = localStorage.getItem("arachne_token");
    const savedUser = localStorage.getItem("arachne_user");
    if (savedUser) {
      try {
        initialUser = JSON.parse(savedUser);
      } catch {
        initialUser = null;
      }
    }
  }

  return {
    role: initialUser?.role || "SHO",
    activeHeaderTab: "Command",
    activeSidebarTab: "Dashboard",
    token: initialToken,
    user: initialUser,

    setRole: (role) => set({ role }),
    setActiveHeaderTab: (activeHeaderTab) => set({ activeHeaderTab }),
    setActiveSidebarTab: (activeSidebarTab) => set({ activeSidebarTab }),
    
    setToken: (token) => {
      if (typeof window !== "undefined") {
        if (token) {
          localStorage.setItem("arachne_token", token);
        } else {
          localStorage.removeItem("arachne_token");
        }
      }
      set({ token });
    },
    
    setUser: (user) => {
      if (typeof window !== "undefined") {
        if (user) {
          localStorage.setItem("arachne_user", JSON.stringify(user));
          set({ user, role: user.role });
        } else {
          localStorage.removeItem("arachne_user");
          set({ user });
        }
      } else {
        set({ user });
      }
    },
    
    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("arachne_token");
        localStorage.removeItem("arachne_user");
      }
      set({ token: null, user: null, role: "SHO", activeSidebarTab: "Dashboard", activeHeaderTab: "Command" });
    }
  };
});
