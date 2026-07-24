import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";

export default async function PublicCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (!company) notFound();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <PageHeader
        title={company.name}
        description={[company.industry, company.size].filter(Boolean).join(" · ") || undefined}
      />

      {company.description ? (
        <p className="text-sm text-muted-foreground">{company.description}</p>
      ) : null}

      <div className="flex flex-wrap gap-4 text-sm">
        {company.website ? (
          <a href={company.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {company.website}
          </a>
        ) : null}
      </div>

      {company.locations?.length ? (
        <Card>
          <CardContent className="flex flex-wrap gap-2">
            {company.locations.map((location) => (
              <Badge key={location} variant="outline">
                {location}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {company.benefits?.length ? (
        <Card>
          <CardContent className="flex flex-wrap gap-2">
            {company.benefits.map((benefit) => (
              <Badge key={benefit} variant="secondary">
                {benefit}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
