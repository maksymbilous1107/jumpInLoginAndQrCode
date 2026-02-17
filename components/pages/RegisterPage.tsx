"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { RIMINI_SCHOOLS } from "@/constants";
import { ChevronRight, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dob: "",
    school: RIMINI_SCHOOLS[0].value,
    customSchool: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const school =
      formData.school === "altro" ? formData.customSchool : formData.school;

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setError("Errore nella creazione dell'account.");
      setIsLoading(false);
      return;
    }

    // 2. Create profile in Supabase
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      school,
      dob: formData.dob,
      last_checkin: null,
    });

    if (profileError) {
      setError("Errore nel salvataggio del profilo: " + profileError.message);
      setIsLoading(false);
      return;
    }

    // 3. Sync to Google Sheets via API route
    try {
      const sheetsRes = await fetch("/api/sheets/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          school,
          dob: formData.dob,
        }),
      });

      if (!sheetsRes.ok) {
        console.error("Google Sheets sync failed:", await sheetsRes.text());
      }
    } catch (err) {
      console.error("Google Sheets sync error:", err);
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-4">
      <div className="w-full max-w-md animate-slide-in-right py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-montserrat text-orange-600 tracking-tighter drop-shadow-sm">
            Nuovo Account
          </h1>
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mt-1">
            Benvenuto in JumpIn
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50/80 border border-red-100 flex items-center gap-3 text-red-600 animate-slide-in-top max-w-md mx-auto">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-xs font-bold leading-tight">{error}</p>
          </div>
        )}

        <GlassCard>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-2xl glass-input text-sm"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                  Cognome
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-2xl glass-input text-sm"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                Email
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-2xl glass-input text-sm"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                Scuola
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 rounded-2xl glass-input text-sm appearance-none cursor-pointer"
                  value={formData.school}
                  onChange={(e) =>
                    setFormData({ ...formData, school: e.target.value })
                  }
                >
                  {RIMINI_SCHOOLS.map((s) => (
                    <option key={s.value} value={s.value} className="bg-white">
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-orange-400">
                  <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
            </div>

            {formData.school === "altro" && (
              <div className="animate-slide-in-top">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">
                  Specifica Scuola
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-2xl glass-input text-sm"
                  value={formData.customSchool}
                  onChange={(e) =>
                    setFormData({ ...formData, customSchool: e.target.value })
                  }
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                Data di Nascita
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 rounded-2xl glass-input text-sm"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Min. 8 caratteri"
                className="w-full px-4 py-3 rounded-2xl glass-input text-sm placeholder:text-gray-300"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 rounded-2xl btn-primary-liquid font-bold mt-6 disabled:opacity-70 transition-all"
            >
              {isLoading ? "Creazione in corso..." : "Registrati ora"}
            </button>

            <p className="text-center text-sm text-gray-500 font-medium pt-4">
              Hai un account?{" "}
              <a
                href="/"
                className="text-orange-600 font-bold hover:underline"
              >
                Effettua l&apos;accesso
              </a>
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
