import { Briefcase, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-12">
      <PageHeader
        title="Design System"
        description="Página temporal de QA visual — Módulo 1. Todos los componentes base de HireFlow en un mismo lugar."
        actions={<Badge variant="outline">Dark mode first</Badge>}
      />

      <Section title="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Badges / estados">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Applied</Badge>
          <Badge variant="warning">Under review</Badge>
          <Badge variant="destructive">Rejected</Badge>
          <Badge variant="outline">Shortlisted</Badge>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="flex max-w-sm flex-col gap-3">
          <Input placeholder="Buscar jobs..." />
          <Input placeholder="Deshabilitado" disabled />
          <Input placeholder="Inválido" aria-invalid />
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Designer</CardTitle>
              <CardDescription>TechFlow · Remote · Full-time</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="success">95% match</Badge>
              <Badge variant="outline">$70k – $90k</Badge>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline" size="sm">
                Save
              </Button>
              <Button size="sm">View details</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recruiter dashboard</CardTitle>
              <CardDescription>
                Pipeline con AI summary por candidato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Score, años de experiencia, top skills y un gap. Nada más.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={Briefcase}
          title="Aún no tienes aplicaciones"
          description="Cuando apliques a un job, vas a poder seguir el estado de tu aplicación acá en tiempo real."
          action={
            <Button>
              <Search />
              Explorar jobs
            </Button>
          }
        />
      </Section>
    </main>
  );
}
