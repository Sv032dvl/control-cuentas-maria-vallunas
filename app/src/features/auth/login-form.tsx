"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const loginFieldClass =
  "text-[#5E3B3C] placeholder:text-[#5E3B3C]/45 max-md:border-[#5E3B3C]/30 max-md:text-base max-md:placeholder:text-[#5E3B3C]/55";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const supabase = createClient();

    // 1. Iniciar sesión (el SDK guarda las cookies automáticamente)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("Email o contraseña incorrectos");
      setPending(false);
      return;
    }

    // 2. Obtener el rol para redirigir al destino correcto
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let target = next || "/cierre";

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        target = next || "/dashboard";
      }
    }

    // 3. Refrescar el router para que el middleware vea la sesión y redirigir
    router.refresh();
    router.push(target);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#5E3B3C] max-md:font-semibold">
          Correo
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          required
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          className={loginFieldClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-[#5E3B3C] max-md:font-semibold">
          Contraseña
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
            className={cn(loginFieldClass, "pr-10")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 size-8 text-[#5E3B3C]/65 hover:text-[#5E3B3C]"
            onClick={() => setShowPassword((v) => !v)}
            disabled={pending}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full h-11 text-base font-bold uppercase tracking-wide bg-[#D8A22F] text-[#5E3B3C] hover:bg-[#C49228] hover:text-[#5E3B3C] focus-visible:ring-[#D8A22F]/40"
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" /> Iniciando…
          </>
        ) : (
          "ENTRAR"
        )}
      </Button>
    </form>
  );
}
