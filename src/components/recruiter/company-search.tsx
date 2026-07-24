"use client";

import { useState, useTransition } from "react";

import { joinCompanyAction } from "@/actions/recruiter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface CompanyResult {
  id: string;
  name: string;
  industry: string | null;
}

function CompanySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [isPending, startTransition] = useTransition();

  async function handleChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("companies")
      .select("id, name, industry")
      .ilike("name", `%${value.trim()}%`)
      .limit(5);
    setResults(data ?? []);
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Buscar compañía por nombre..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
      />
      {results.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {results.map((company) => (
            <li
              key={company.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{company.name}</p>
                {company.industry ? (
                  <p className="text-xs text-muted-foreground">{company.industry}</p>
                ) : null}
              </div>
              <form
                action={(formData) => startTransition(() => joinCompanyAction(formData))}
              >
                <input type="hidden" name="companyId" value={company.id} />
                <Button type="submit" size="sm" variant="outline" disabled={isPending}>
                  Unirme
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export { CompanySearch };
