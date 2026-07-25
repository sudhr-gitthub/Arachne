"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, fetchCurrentUser } from "@/services/api/authApi";
import { useAppStore } from "@/store/useAppStore";
import { ShieldAlert, KeyRound, Mail, User, Info } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { token, setToken, setUser } = useAppStore();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("SHO");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      router.push("/");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isRegister) {
        await registerUser(email, password, name, role);
        setSuccessMsg("Account registered successfully! You can now log in.");
        setIsRegister(false);
        setPassword("");
      } else {
        const tokenData = await loginUser(email, password);
        setToken(tokenData.access_token);
        
        // Fetch current user details
        const userData = await fetchCurrentUser(tokenData.access_token);
        setUser({
          email: userData.email,
          name: userData.name,
          role: userData.role,
        });

        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Dynamic Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c162d_1px,transparent_1px),linear-gradient(to_bottom,#0c162d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Authentication Box */}
      <div className="relative z-10 w-full max-w-md glass-card rounded-2xl p-8 border border-slate-800 shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col gap-6">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/30 mb-3 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <svg
              className="h-6 w-6 text-blue-500 animate-pulse"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" strokeDasharray="6, 6" />
              <path d="M50 15 L50 85 M15 50 L85 50" stroke="currentColor" strokeWidth="3" />
              <circle cx="50" cy="50" r="8" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white neon-text-primary uppercase">
            ARACHNE PORTAL
          </h1>
          <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mt-1">
            SECURE COMMAND NODE VERIFICATION
          </p>
        </div>

        {/* Diagnostic Status Box */}
        <div className="border border-slate-900 bg-slate-950/60 rounded-lg p-3.5 font-mono text-[10px] text-slate-500 flex flex-col gap-1">
          <div className="flex justify-between border-b border-slate-900 pb-1 mb-1">
            <span>SECURE_SHELL:</span>
            <span className="text-blue-400">ACTIVE</span>
          </div>
          <p>&gt; IP: RECORDED // PORT: 8000</p>
          <p>&gt; STATUS: awaiting_clearance_credentials</p>
        </div>

        {/* Message Alerts */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 font-medium font-sans animate-shake">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-400 font-medium font-sans">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Name Field (Register Only) */}
          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Operator Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspector John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
              Clearance Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="operator@arachne.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
              Cipher Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
              />
            </div>
          </div>

          {/* Role Select (Register Only) */}
          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Clearance Role Level
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer font-sans"
              >
                <option value="SHO">Station House Officer (SHO)</option>
                <option value="Commissioner">Commissioner (Admin)</option>
                <option value="Analyst">Clearance Analyst</option>
              </select>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-mono text-xs uppercase tracking-wider font-bold py-3.5 px-4 rounded-xl border border-blue-500/20 hover:border-blue-400 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? "INITIALIZING SECURE LINK..." : isRegister ? "Register Credentials" : "Decrypt & Enter Node"}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="text-center text-xs font-mono text-slate-500 border-t border-slate-900/60 pt-4 mt-1">
          {isRegister ? (
            <span>
              Already cleared?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg(null);
                }}
                className="text-blue-400 hover:text-blue-300 font-bold hover:underline cursor-pointer"
              >
                Enter Node
              </button>
            </span>
          ) : (
            <span>
              Request access clearance?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg(null);
                }}
                className="text-blue-400 hover:text-blue-300 font-bold hover:underline cursor-pointer"
              >
                Register
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
