"use client";

import { useState } from "react";
import { supabase } from "../supabase";
import { Trash2, ShieldAlert, Loader2, ArrowRight } from "lucide-react";

export default function DeleteAccount() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setLoading(true);

    try {
      // 1. Create the request in the database
      const { data, error } = await supabase
        .from("deletion_requests")
        .insert([{ email }])
        .select()
        .single();
      
      if (error) {
        // 🚨 THIS WILL SHOW THE EXACT DATABASE ERROR
        throw new Error(`Database Error: ${error.message}`);
      }

      // 2. Trigger the email API
      const res = await fetch("/api/delete-account/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: data.token }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Email Error: ${errorData.error || "Failed to send email"}`);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      // 🚨 THIS WILL SHOW YOU EXACTLY WHAT IS WRONG
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0514] text-white flex items-center justify-center p-6 font-sans">
      
      {/* 🚨 AMBIENT PURPLE GLOW 🚨 */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        
        {/* Header Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/30 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.2)]">
            <ShieldAlert className="w-10 h-10 text-purple-400" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
          Delete Account
        </h1>
        
        <p className="text-zinc-400 text-center mb-10 leading-relaxed">
          We're sorry to see you go. Enter your email address below. We will send you a secure link to confirm the permanent deletion of your account, data, and API keys.
        </p>

        {!success ? (
          <form onSubmit={handleRequest} className="bg-[#120a21]/80 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 md:p-8 shadow-2xl">
            <label className="block text-sm font-medium text-purple-300 mb-2">Account Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-[#0a0514] border border-purple-500/30 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-colors mb-6"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              {loading ? "Processing..." : "Request Deletion"}
            </button>
          </form>
        ) : (
          <div className="bg-[#120a21]/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-zinc-400 text-sm">
              We have sent a confirmation link to <strong className="text-white">{email}</strong>. Please click the link inside to finalize the deletion.
            </p>
          </div> 
        )}

        <p className="text-center text-xs text-zinc-500 mt-8">
          © 2026 Gyra · Genvia AI Company
        </p>
      </div>
    </main>
  );
}