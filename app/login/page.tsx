"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-[8px] bg-[#1B3A6B] flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
          <span className="text-[#1B3A6B] font-semibold text-[15px] tracking-tight">
            Scholarship Mapper
          </span>
        </div>

        <div className="bg-white border border-[#E2DDD6] rounded-[8px] p-8">
          <h1 className="text-[#111827] font-semibold text-[18px] mb-1">Advisor sign in</h1>
          <p className="text-[#6B7280] text-[13px] mb-7">Access is limited to authorised advisors.</p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[13px] font-semibold text-[#374151]">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.ae"
                className="w-full h-9 px-3 rounded-[6px] border border-[#E2DDD6] bg-white text-[14px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[13px] font-semibold text-[#374151]">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 px-3 rounded-[6px] border border-[#E2DDD6] bg-white text-[14px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-[6px] bg-[#FAEAEA] border border-[#B03030]/20">
                <AlertCircle className="w-4 h-4 text-[#B03030] shrink-0" />
                <span className="text-[13px] text-[#B03030]">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 rounded-[6px] bg-[#1B3A6B] hover:bg-[#15305A] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#9CA3AF] mt-6">
          Contact your administrator to request access.
        </p>
      </div>
    </div>
  );
}
