import Link from "next/link";
import { redirect } from "next/navigation";

import { createCompanyAction, updateCompanyAction } from "@/actions/recruiter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { CompanySearch } from "@/components/recruiter/company-search";
import { createClient } from "@/lib/supabase/server";

function textareaClassName() {
  return "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

export default async function RecruiterCompanyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: recruiterProfile } = await supabase
    .from("recruiter_profiles")
    .select("company_id, position")
    .eq("id", user.id)
    .maybeSingle();

  const company = recruiterProfile?.company_id
    ? (
        await supabase
          .from("companies")
          .select("*")
          .eq("id", recruiterProfile.company_id)
          .single()
      ).data
    : null;

  if (!company) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
        <PageHeader
          title="Tu compañía"
          description="Antes de publicar jobs necesitás crear tu compañía o unirte a una existente."
        />

        <Card>
          <CardHeader>
            <CardTitle>Unirme a una compañía existente</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanySearch />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crear una compañía nueva</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCompanyAction} className="flex flex-col gap-3">
              <Input name="name" placeholder="Nombre de la compañía" required />
              <Input name="position" placeholder="Tu puesto (ej. Head of Talent)" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="industry" placeholder="Industria" />
                <Input name="size" placeholder="Tamaño (ej. 11-50)" />
              </div>
              <Input name="website" placeholder="Sitio web" />
              <Input name="logoUrl" placeholder="URL del logo" />
              <Input name="locations" placeholder="Ubicaciones (separadas por coma)" />
              <Input name="benefits" placeholder="Beneficios (separados por coma)" />
              <textarea
                name="description"
                placeholder="Descripción"
                rows={3}
                className={textareaClassName()}
              />
              <Button type="submit" className="w-fit">
                Crear compañía
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <PageHeader
        title={company.name}
        description="Perfil de tu compañía — visible públicamente."
        actions={
          <Button variant="outline" render={<Link href={`/companies/${company.id}`} />} nativeButton={false}>
            Ver página pública
          </Button>
        }
      />

      <Card>
        <CardContent>
          <form action={updateCompanyAction} className="flex flex-col gap-3">
            <input type="hidden" name="companyId" value={company.id} />
            <Input name="name" placeholder="Nombre de la compañía" defaultValue={company.name} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="industry" placeholder="Industria" defaultValue={company.industry ?? ""} />
              <Input name="size" placeholder="Tamaño (ej. 11-50)" defaultValue={company.size ?? ""} />
            </div>
            <Input name="website" placeholder="Sitio web" defaultValue={company.website ?? ""} />
            <Input name="logoUrl" placeholder="URL del logo" defaultValue={company.logo_url ?? ""} />
            <Input
              name="locations"
              placeholder="Ubicaciones (separadas por coma)"
              defaultValue={company.locations?.join(", ") ?? ""}
            />
            <Input
              name="benefits"
              placeholder="Beneficios (separados por coma)"
              defaultValue={company.benefits?.join(", ") ?? ""}
            />
            <textarea
              name="description"
              placeholder="Descripción"
              rows={3}
              defaultValue={company.description ?? ""}
              className={textareaClassName()}
            />
            <Button type="submit" className="w-fit">
              Guardar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
