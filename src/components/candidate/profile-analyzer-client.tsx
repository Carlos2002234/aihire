"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Target } from "lucide-react";

import { analyzeProfileAction } from "@/actions/candidate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/shared/circular-progress";
import type { ProfileAnalysisOutput } from "@/lib/ai/prompts";

function tabForArea(area: string): string {
  const normalized = area.toLowerCase();
  if (normalized.includes("experiencia")) return "experience";
  if (normalized.includes("educac")) return "education";
  if (normalized.includes("skill")) return "skills";
  if (normalized.includes("certificac")) return "certifications";
  if (normalized.includes("proyecto")) return "projects";
  return "overview";
}

function scoreColor(score: number): string {
  if (score >= 75) return "var(--success)";
  if (score >= 45) return "var(--warning)";
  return "var(--destructive)";
}

function ProfileAnalyzerClient() {
  const [analysis, setAnalysis] = useState<ProfileAnalysisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAnalyze() {
    setError(null);
    startTransition(async () => {
      const result = await analyzeProfileAction();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setAnalysis(result.analysis);
    });
  }

  if (!analysis) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="flex flex-col items-start gap-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="font-medium text-foreground">Analizá tu Career Passport</p>
            <p className="mt-1 text-sm text-muted-foreground">
              La IA revisa tu headline, resumen, experiencia, educación, skills y certificaciones tal como están
              cargados hoy, y te dice concretamente qué mejorar para representarte mejor ante un recruiter.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleAnalyze} disabled={pending} className="gap-1.5">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Analizar mi perfil
          </Button>
          {pending && (
            <p className="text-xs text-muted-foreground">Esto puede tardar hasta un minuto...</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <CircularProgress value={analysis.completeness_score} color={scoreColor(analysis.completeness_score)} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Qué tan listo está tu perfil hoy</p>
            <p className="mt-1 text-sm text-muted-foreground">{analysis.overall_summary}</p>
          </div>
        </CardContent>
      </Card>

      {analysis.priority_actions.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Target className="size-4 text-primary" />
              Hacé esto primero
            </p>
            <ol className="flex flex-col gap-2">
              {analysis.priority_actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {analysis.strengths.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground">Lo que ya está bien logrado</p>
            <ul className="flex flex-col gap-2">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {analysis.improvement_areas.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm font-medium text-foreground">Qué mejorar</p>
            {analysis.improvement_areas.map((item, i) => (
              <div key={i} className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="w-fit gap-1">
                    <AlertCircle className="size-3" />
                    {item.area}
                  </Badge>
                  <Link
                    href={
                      tabForArea(item.area) === "overview"
                        ? "/candidate/passport"
                        : `/candidate/passport?tab=${tabForArea(item.area)}`
                    }
                    className="text-xs text-primary hover:underline"
                  >
                    Ir a mejorar →
                  </Link>
                </div>
                <p className="text-sm text-foreground">{item.issue}</p>
                <p className="text-sm text-muted-foreground">{item.suggestion}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button variant="outline" onClick={handleAnalyze} disabled={pending} className="w-fit gap-1.5">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Volver a analizar
      </Button>
    </div>
  );
}

export { ProfileAnalyzerClient };
