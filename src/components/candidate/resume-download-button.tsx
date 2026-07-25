"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { getResumeDownloadUrlAction } from "@/actions/candidate";
import { Button } from "@/components/ui/button";

function ResumeDownloadButton({ resumeId }: { resumeId: string }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const { url } = await getResumeDownloadUrlAction(resumeId);
    setPending(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Descargar CV"
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Download />}
    </Button>
  );
}

export { ResumeDownloadButton };
