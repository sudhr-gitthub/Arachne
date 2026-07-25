"use client";
import { API_BASE_URL } from "@/services/api/config";


import React, { useState, useEffect } from "react";
import { useAppStore, HeaderTab } from "@/store/useAppStore";
import { LogOut, User, Bell, CheckCircle } from "lucide-react";

export default function Header() {
  const { token, user, role, activeHeaderTab, setActiveHeaderTab, logout } = useAppStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNotifs = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`{API_BASE_URL}/api/v1/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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

      {/* Right side: User Profile & Logout */}
      <div className="flex items-center gap-4">
        
        {/* Notification Bell and Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Notification Center"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2.5 w-72 rounded-xl border border-slate-800 bg-slate-950/95 shadow-xl glass-card backdrop-blur-md p-4 z-50 text-slate-200 font-mono text-[10px]">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                <span className="font-bold text-white uppercase tracking-wider">Active Broadcast Alerts</span>
                <span className="text-[8px] text-slate-500">{notifications.length} total</span>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-2.5 scrollbar-thin">
                {notifications.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No active broadcasts logged.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        notif.is_read
                          ? "bg-slate-900/30 border-slate-900 text-slate-500"
                          : "bg-blue-950/10 border-blue-950/40 text-slate-200 hover:border-blue-500/50"
                      }`}
                    >
                      <p className="leading-relaxed">{notif.message}</p>
                      <div className="flex justify-between items-center mt-1.5 text-[8px] text-slate-500">
                        <span>{new Date(notif.created_at).toLocaleTimeString()}</span>
                        {!notif.is_read && (
                          <span className="text-blue-400 font-bold hover:underline flex items-center gap-0.5">
                            <CheckCircle className="h-2.5 w-2.5" /> MARK READ
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="flex flex-col text-right font-mono hidden sm:flex">
            <span className="text-xs font-bold text-slate-200">{user.name || user.email}</span>
            <span className="text-[9px] uppercase text-blue-400 font-bold tracking-widest">
              LEVEL: {role}
            </span>
          </div>
        )}

        <button
          onClick={() => logout()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-950/10 hover:bg-red-600 hover:text-white text-red-400 text-xs font-bold font-mono transition-all cursor-pointer"
          title="Disconnect Node"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">DISCONNECT</span>
        </button>
      </div>
    </header>
  );
}
