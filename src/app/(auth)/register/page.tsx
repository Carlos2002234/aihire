import Link from "next/link";
import { ClipboardCheck, Map as MapIcon, Mail, Target, User } from "lucide-react";

import { registerAction, signInWithOAuthAction } from "@/actions/auth";
import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel";
import { GithubIcon, GoogleIcon } from "@/components/auth/provider-icons";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FEATURES = [
  {
    icon: Target,
    title: "Matches inteligentes",
    description: "Te conectamos con roles que matcheen con tu perfil.",
  },
  {
    icon: ClipboardCheck,
    title: "Seguí y mejorá",
    description: "Monitoreá tus aplicaciones y mejorá tus chances.",
  },
  {
    icon: MapIcon,
    title: "Guía de carrera con IA",
    description: "Roadmaps personalizados para ayudarte a crecer.",
  },
];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthMarketingPanel
        badge="Sumate a HireFlow"
        headline="Tu próxima oportunidad"
        headlineAccent="empieza acá."
        subtitle="Creá tu cuenta y accedé a herramientas con IA que te ayudan a conseguir trabajo más rápido."
        features={FEATURES}
      />

      <div className="flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              H
            </span>
            <span className="font-heading text-base font-semibold text-foreground">HireFlow</span>
          </Link>

          <h1 className="font-heading text-2xl font-semibold text-foreground">Creá tu cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Toda aplicación termina en entrevista, oferta o feedback útil.
          </p>

          {error ? (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          ) : null}

          <form action={registerAction} className="mt-6 flex flex-col gap-3">
            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="mb-1.5 text-sm font-medium text-foreground">Soy...</legend>
              <label className="has-checked:border-primary has-checked:bg-primary/10 has-checked:text-primary flex cursor-pointer items-center justify-center rounded-lg border border-input px-3 py-2 text-sm font-medium transition-colors">
                <input type="radio" name="role" value="candidate" defaultChecked className="sr-only" />
                Candidato
              </label>
              <label className="has-checked:border-primary has-checked:bg-primary/10 has-checked:text-primary flex cursor-pointer items-center justify-center rounded-lg border border-input px-3 py-2 text-sm font-medium transition-colors">
                <input type="radio" name="role" value="recruiter" className="sr-only" />
                Recruiter
              </label>
            </fieldset>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                Nombre completo
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Tu nombre completo"
                  required
                  className="pl-9"
                />
              </div>
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
                placeholder="Creá una contraseña"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">Al menos 8 caracteres.</p>
            </div>

            <Button type="submit" className="mt-1 w-full">
              Crear cuenta
            </Button>

            <div className="my-1 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />o<div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="submit"
              formAction={signInWithOAuthAction.bind(null, "google")}
              variant="outline"
              className="w-full justify-center gap-2"
            >
              <GoogleIcon className="size-4" />
              Registrarme con Google
            </Button>
            <Button
              type="submit"
              formAction={signInWithOAuthAction.bind(null, "github")}
              variant="outline"
              className="w-full justify-center gap-2"
            >
              <GithubIcon className="size-4" />
              Registrarme con GitHub
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
