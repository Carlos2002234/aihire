import Link from "next/link";

import { registerAction, signInWithOAuthAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Creá tu cuenta</CardTitle>
          <CardDescription>
            Toda aplicación termina en entrevista, oferta o feedback útil.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <form action={registerAction} className="flex flex-col gap-4">
            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="mb-1 text-sm font-medium text-foreground">
                Soy...
              </legend>
              <label className="has-checked:border-primary has-checked:bg-primary/10 has-checked:text-primary flex cursor-pointer items-center justify-center rounded-lg border border-input px-3 py-2 text-sm font-medium transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="candidate"
                  defaultChecked
                  className="sr-only"
                />
                Candidato
              </label>
              <label className="has-checked:border-primary has-checked:bg-primary/10 has-checked:text-primary flex cursor-pointer items-center justify-center rounded-lg border border-input px-3 py-2 text-sm font-medium transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="recruiter"
                  className="sr-only"
                />
                Recruiter
              </label>
            </fieldset>

            <Input name="fullName" placeholder="Nombre completo" required />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
            />
            <Input
              name="password"
              type="password"
              placeholder="Contraseña"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <Button type="submit" className="w-full">
              Crear cuenta
            </Button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              o continuá con
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="submit"
                formAction={signInWithOAuthAction.bind(null, "google")}
                variant="outline"
                className="w-full"
              >
                Google
              </Button>
              <Button
                type="submit"
                formAction={signInWithOAuthAction.bind(null, "github")}
                variant="outline"
                className="w-full"
              >
                GitHub
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
