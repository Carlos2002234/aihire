import Link from "next/link";
import { ClipboardCheck, Map as MapIcon, Mail, Target } from "lucide-react";

import { loginAction, signInWithOAuthAction } from "@/actions/auth";
import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel";
import { GithubIcon, GoogleIcon } from "@/components/auth/provider-icons";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FEATURES = [
  {
    icon: Target,
    title: "Matching con IA",
    description: "Encontrá roles que matcheen con tus skills y objetivos.",
  },
  {
    icon: ClipboardCheck,
    title: "Seguimiento de aplicaciones",
    description: "Mantené todo organizado y nunca te pierdas una actualización.",
  },
  {
    icon: MapIcon,
    title: "Roadmaps personalizados",
    description: "Recibí planes generados por IA para mejorar y destacar.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthMarketingPanel
        badge="Tu compañera de carrera con IA"
        headline="Encontrá la oportunidad"
        headlineAccent="correcta. Más rápido."
        subtitle="HireFlow te ayuda a descubrir mejores oportunidades, seguir tu progreso y conseguir el rol que buscás."
        features={FEATURES}
      />

      <div className="flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              H
            </span>
            <span className="font-heading text-base font-semibold text-foreground">HireFlow</span>
          </Link>

          <h1 className="font-heading text-2xl font-semibold text-foreground">Bienvenido de nuevo 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Iniciá sesión para continuar en tu cuenta.</p>

          {error ? (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          ) : null}

          <form action={loginAction} className="mt-6 flex flex-col gap-3">
            <Button
              type="submit"
              formAction={signInWithOAuthAction.bind(null, "google")}
              variant="outline"
              className="w-full justify-center gap-2"
            >
              <GoogleIcon className="size-4" />
              Continuar con Google
            </Button>
            <Button
              type="submit"
              formAction={signInWithOAuthAction.bind(null, "github")}
              variant="outline"
              className="w-full justify-center gap-2"
            >
              <GithubIcon className="size-4" />
              Continuar con GitHub
            </Button>

            <div className="my-1 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />o<div className="h-px flex-1 bg-border" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vos@ejemplo.com"
                  required
                  autoComplete="email"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="Tu contraseña"
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="mt-1 w-full">
              Iniciar sesión
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
