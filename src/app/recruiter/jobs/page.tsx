import Link from "next/link";
import { redirect } from "next/navigation";

import { createJobAction } from "@/actions/jobs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const STATUS_VARIANT: Record<
  Database["public"]["Tables"]["jobs"]["Row"]["status"],
  "secondary" | "success" | "outline"
> = {
  draft: "secondary",
  open: "success",
  closed: "outline",
};

const STATUS_LABEL: Record<Database["public"]["Tables"]["jobs"]["Row"]["status"], string> = {
  draft: "Borrador",
  open: "Publicado",
  closed: "Cerrado",
};

export default async function RecruiterJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: recruiterProfile } = await supabase
    .from("recruiter_profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!recruiterProfile?.company_id) redirect("/recruiter/company");

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, status, created_at")
    .eq("company_id", recruiterProfile.company_id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <PageHeader title="Jobs" description="Los jobs de tu compañía." />

      <Card>
        <CardContent>
          <form action={createJobAction} className="flex items-end gap-2">
            <Input name="title" placeholder="Título del nuevo job" required className="flex-1" />
            <Button type="submit">Crear</Button>
          </form>
        </CardContent>
      </Card>

      {jobs?.length ? (
        <ul className="flex flex-col gap-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/recruiter/jobs/${job.id}`}>
                <Card>
                  <CardContent className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{job.title}</span>
                    <Badge variant={STATUS_VARIANT[job.status]}>{STATUS_LABEL[job.status]}</Badge>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Todavía no creaste ningún job" />
      )}
    </main>
  );
}
