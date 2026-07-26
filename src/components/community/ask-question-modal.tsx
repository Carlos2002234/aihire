"use client";

import { Plus } from "lucide-react";

import { askQuestionAction } from "@/actions/community";
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
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/community/tag-input";

function textareaClassName() {
  return "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
}

function AskQuestionModal() {
  return (
    <Dialog>
      <DialogTrigger render={<Button className="gap-1.5" />}>
        <Plus className="size-4" />
        Hacer una pregunta
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form action={askQuestionAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Hacer una pregunta</DialogTitle>
            <DialogDescription>
              Preguntas concretas sobre carrera, certificaciones o procesos de contratación. Sin nombres de empresas
              ajenas a vos ni información personal de terceros.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Título</label>
            <Input name="title" placeholder="ej. ¿Debería sacar AZ-500 antes que SC-200?" required maxLength={200} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Detalle</label>
            <textarea
              name="body"
              placeholder="Dale contexto a tu pregunta: tu situación actual, qué ya intentaste, qué querés decidir..."
              rows={5}
              required
              className={textareaClassName()}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Tags</label>
            <TagInput name="tags" placeholder="ej. certificaciones, cloud, entrevistas" />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" name="isAnonymous" />
            Publicar como anónimo
          </label>

          <DialogFooter>
            <Button type="submit" className="w-full sm:w-auto">
              Publicar pregunta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { AskQuestionModal };
