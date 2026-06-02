import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/features/auth/login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-10 overflow-hidden min-h-screen">

      {/* ── Fondo gradiente de marca (crema cálido) ─────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, #fff3d4 0%, #fdf6ec 45%, #ffffff 100%)",
        }}
      />

      {/* ── Líneas decorativas del logo — fondo tenue ───────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center overflow-hidden"
      >
        <Image
          src="/logo-lineas.svg"
          alt=""
          width={700}
          height={960}
          priority
          className="opacity-[0.25] scale-150 select-none"
          style={{ objectFit: "contain" }}
        />
      </div>

      {/* ── Card de login ─────────────────────────────────────── */}
      <Card className="w-full max-w-sm shadow-2xl border border-[#D8A22F]/20 bg-white/72 backdrop-blur-md">
        <CardHeader className="text-center space-y-4 pt-8 pb-4">

          {/* Logo principal */}
          <div className="mx-auto">
            <Image
              src="/logo.svg"
              alt="María Vallunas"
              width={110}
              height={123}
              priority
              className="drop-shadow-md"
            />
          </div>

          <p className="text-sm text-[#5E3B3C]/80 max-md:text-[#5E3B3C] max-md:font-medium">
            Control de caja diario
          </p>

          {/* Separador decorativo dorado */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-[#D8A22F]/40" />
            <div className="size-1.5 rounded-full bg-[#D8A22F]" />
            <div className="h-px w-12 bg-[#D8A22F]/40" />
          </div>
        </CardHeader>

        <CardContent className="pb-8">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
