"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { AlertCircle, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Credenziali non valide. Controlla email e password.");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-4">
      <div className="w-full max-w-md animate-slide-in-bottom">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold font-montserrat text-orange-600 mb-3 tracking-tighter drop-shadow-sm">
            JumpIn
          </h1>
          <p className="text-orange-900/40 font-bold uppercase tracking-[0.3em] text-[10px]">
            Digital Experience
          </p>
        </div>

        <GlassCard className={error ? "ring-2 ring-red-200/50" : ""}>
          <h2 className="text-2xl font-bold font-montserrat mb-8 text-gray-800">
            Accedi
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50/80 border border-red-100 flex items-center gap-3 text-red-600 animate-slide-in-top">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                className="w-full px-5 py-4 rounded-2xl glass-input placeholder:text-gray-300 text-base"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl glass-input placeholder:text-gray-300 text-base"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 rounded-2xl btn-primary-liquid flex items-center justify-center gap-2 group mt-6 disabled:opacity-70"
            >
              <span>{isLoading ? "Attendi..." : "Continua"}</span>
              {!isLoading && (
                <ChevronRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              )}
            </button>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-[1px] bg-orange-100/50"></div>
              <span className="text-[10px] text-orange-200 font-bold uppercase tracking-widest">
                Registrazione
              </span>
              <div className="flex-1 h-[1px] bg-orange-100/50"></div>
            </div>

            <p className="text-center text-sm text-gray-500 font-medium">
              Nuovo qui?{" "}
              <a
                href="/register"
                className="text-orange-600 font-bold hover:text-orange-700 underline-offset-4 decoration-orange-200/50 hover:underline transition-all"
              >
                Crea un account
              </a>
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
