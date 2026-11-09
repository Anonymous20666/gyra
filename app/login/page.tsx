"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabase";
import GyraMark from "../components/GyraMark";

type AuthStep = "options" | "email" | "verify";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. OAuth Login (Google & X)
  const handleOAuth = async (provider: "google" | "twitter") => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  // 2. Handle Email Auth (Password or OTP)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    // First, try to sign in with password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // If sign in fails, try to sign them up
      if (signInError.message.includes("Invalid login credentials")) {
        const signUp = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUp.error) {
          setError(signUp.error.message);
        } else if (signUp.data?.session) {
          // Auto-confirm mode: session issued immediately, skip OTP step
          router.push("/dashboard");
        } else {
          // Email confirmation required: ask for the OTP
          setStep("verify");
        }
      } else {
        setError(signInError.message);
      }
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  // 3. Verify OTP (If you have email confirmation turned on)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      
      {/* Background subtle glow (Optional, keeps it premium) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-white/[0.02] blur-[120px] rounded-[100%] pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-center relative z-10">
        
        {/* Massive Logo */}
        <div className="mb-12">
          <GyraMark size={80} glow={false} animated={false} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 1: OPTIONS                            */}
        {/* ========================================== */}
        {step === "options" && (
          <div className="w-full flex flex-col animate-in fade-in duration-300">
            <h1 className="text-2xl font-semibold text-center mb-2">Welcome to Gyra.</h1>
            <p className="text-sm text-zinc-400 text-center mb-10">
              Your next idea starts here. Sign in to explore AI and build with the Gyra Developer Platform.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleOAuth("google")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#1c1c1c] hover:bg-[#2a2a2a] border border-white/5 text-white py-4 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Continue with Google
              </button>

              <button 
                onClick={() => handleOAuth("twitter")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#1c1c1c] hover:bg-[#2a2a2a] border border-white/5 text-white py-4 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                Continue with X
              </button>

              <button 
                onClick={() => setStep("email")}
                className="w-full flex items-center justify-center gap-3 bg-[#1c1c1c] hover:bg-[#2a2a2a] border border-white/5 text-white py-4 rounded-xl font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Continue with Email
              </button>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 2: EMAIL / PASSWORD                   */}
        {/* ========================================== */}
        {step === "email" && (
          <form onSubmit={handleEmailAuth} className="w-full flex flex-col animate-in slide-in-from-right-4 duration-300">
            <h1 className="text-2xl font-semibold text-center mb-2">Log in with email</h1>
            <p className="text-sm text-zinc-400 text-center mb-8">
              Enter your email and password to continue.
            </p>
            
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs text-zinc-400">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 outline-none focus:border-white/30 transition-colors pr-12"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-white text-black hover:bg-zinc-200 py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50 mb-4"
            >
              {loading ? "Authenticating..." : "Login"}
            </button>

            <button 
              type="button"
              onClick={() => setStep("options")}
              className="w-full text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Go back
            </button>
          </form>
        )}

        {/* ========================================== */}
        {/* STEP 3: VERIFY OTP                         */}
        {/* ========================================== */}
        {step === "verify" && (
          <form onSubmit={handleVerifyOtp} className="w-full flex flex-col animate-in slide-in-from-right-4 duration-300">
            <h1 className="text-2xl font-semibold text-center mb-3">Verify your email</h1>
            <p className="text-sm text-zinc-400 text-center mb-8">
              We've emailed a one-time code to <br/>
              <strong className="text-white">{email}</strong>.
            </p>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              required
              className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3.5 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-zinc-700 outline-none focus:border-white/30 transition-colors mb-6"
            />

            <button 
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-white text-black hover:bg-zinc-200 py-3.5 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Confirm email"}
            </button>
          </form>
        )}

        {/* Footer Terms */}
        <p className="text-[11px] text-zinc-500 text-center mt-12 max-w-xs leading-relaxed">
          By continuing, you agree to our <br className="sm:hidden"/>
          <Link href="/terms" className="underline hover:text-white transition-colors">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-white transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}