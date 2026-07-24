"use client";

import { applyToJobAction } from "@/actions/applications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Resume {
  id: string;
  name: string;
}

interface Question {
  id: string;
  question: string;
}

function EasyApplyModal({
  jobId,
  resumes,
  questions,
}: {
  jobId: string;
  resumes: Resume[];
  questions: Question[];
}) {
  if (resumes.length === 0) {
    return (
      <Button variant="outline" render={<a href="/candidate/passport" />} nativeButton={false}>
        Subí un CV para aplicar
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>Aplicar</DialogTrigger>
      <DialogContent>
        <form action={applyToJobAction} className="flex flex-col gap-4">
          <input type="hidden" name="jobId" value={jobId} />
          <DialogHeader>
            <DialogTitle>Easy Apply</DialogTitle>
            <DialogDescription>Un clic y listo. Elegí tu CV y enviá.</DialogDescription>
          </DialogHeader>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-foreground">CV</legend>
            {resumes.map((resume, i) => (
              <label key={resume.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="resumeId"
                  value={resume.id}
                  defaultChecked={i === 0}
                  required
                />
                {resume.name}
              </label>
            ))}
          </fieldset>

          {questions.length ? (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-sm font-medium text-foreground">Preguntas</legend>
              {questions.map((q) => (
                <div key={q.id} className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground">{q.question}</label>
                  <textarea
                    name={`answer_${q.id}`}
                    rows={2}
                    className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  />
                </div>
              ))}
            </fieldset>
          ) : null}

          <DialogFooter>
            <Button type="submit" className="w-full sm:w-auto">
              Enviar aplicación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { EasyApplyModal };
