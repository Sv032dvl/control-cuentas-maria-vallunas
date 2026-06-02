import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      {/* Decoración suave de fondo */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--accent)_0%,_transparent_55%)] opacity-60"
      />

      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto size-14 rounded-2xl bg-primary/10 grid place-items-center text-primary text-2xl font-bold">
            MV
          </div>
          <CardTitle className="text-2xl">María Vallunas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Control de caja diario
          </p>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
