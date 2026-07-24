"use client";

import { useState } from "react";

import { previewRejectionFeedbackAction, rejectWithFeedbackAction } from "@/actions/feedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { REJECTION_REASONS, REJECTION_REASON_LABELS, type RejectionReason } from "@/lib/rejection-reasons";

interface FeedbackPreview {
  ai_message: string;
  strengths: string[];
  areas_to_improve: string[];
  missing_skills: string[];
}

const selectClassName =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
const textareaClassName = selectClassName;

function RejectApplicationModal({
  open,
  applicationId,
  jobId,
  onOpenChange,
  onRejected,
}: {
  open: boolean;
  applicationId: string;
  jobId: string;
  onOpenChange: (open: boolean) => void;
  onRejected: () => void;
}) {
  const [step, setStep] = useState<"form" | "preview">("form");
  const [reason, setReason] = useState<RejectionReason>(REJECTION_REASONS[0]);
  const [comment, setComment] = useState("");
  const [preview, setPreview] = useState<FeedbackPreview | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStep("form");
    setReason(REJECTION_REASONS[0]);
    setComment("");
    setPreview(null);
    setEditedMessage("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleGeneratePreview() {
    setLoading(true);
    setError(null);
    const { feedback, error: previewError } = await previewRejectionFeedbackAction(
      applicationId,
      reason,
      comment || null
    );
    setLoading(false);

    if (previewError || !feedback) {
      setError(previewError ?? "No se pudo generar el preview del feedback");
      return;
    }

    setPreview(feedback);
    setEditedMessage(feedback.ai_message);
    setStep("preview");
  }

  async function handleSend() {
    if (!preview) return;
    setLoading(true);
    setError(null);
    const { error: sendError } = await rejectWithFeedbackAction({
      applicationId,
      jobId,
      reason,
      recruiterComment: comment || null,
      aiMessage: editedMessage,
      strengths: preview.strengths,
      areasToImprove: preview.areas_to_improve,
      missingSkills: preview.missing_skills,
    });
    setLoading(false);

    if (sendError) {
      setError(sendError);
      return;
    }

    onRejected();
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar aplicación</DialogTitle>
          <DialogDescription>
            {step === "form"
              ? "Elegí la razón. La IA arma un feedback constructivo que vas a poder editar antes de enviarlo."
              : "Revisá y editá el mensaje si querés. El candidato va a ver esto junto con un roadmap personalizado."}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Razón de rechazo</label>
              <select
                className={selectClassName}
                value={reason}
                onChange={(e) => setReason(e.target.value as RejectionReason)}
              >
                {REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {REJECTION_REASON_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Comentario (opcional)</label>
              <textarea
                className={textareaClassName}
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Contexto adicional para la IA, no lo ve el candidato tal cual"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">Mensaje para el candidato</label>
              <textarea
                className={textareaClassName}
                rows={5}
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
              />
            </div>
            {preview?.strengths.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Fortalezas</p>
                <ul className="list-inside list-disc text-sm text-foreground">
                  {preview.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {preview?.areas_to_improve.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Áreas a mejorar</p>
                <ul className="list-inside list-disc text-sm text-foreground">
                  {preview.areas_to_improve.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          {step === "form" ? (
            <Button onClick={handleGeneratePreview} disabled={loading}>
              {loading ? "Generando..." : "Generar preview"}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("form")} disabled={loading}>
                Volver
              </Button>
              <Button onClick={handleSend} disabled={loading}>
                {loading ? "Enviando..." : "Enviar y rechazar"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { RejectApplicationModal };
