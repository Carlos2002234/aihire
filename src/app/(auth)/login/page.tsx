import Link from "next/link";

import { loginAction, signInWithOAuthAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciá sesión</CardTitle>
          <CardDescription>Bienvenido de vuelta a HireFlow.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <form action={loginAction} className="flex flex-col gap-4">
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
              autoComplete="current-password"
            />

            <Button type="submit" className="w-full">
              Iniciar sesión
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
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Registrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
