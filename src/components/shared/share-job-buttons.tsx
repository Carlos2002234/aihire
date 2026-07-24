"use client";

import { useState } from "react";
import { Check, Link2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.63 10.53 20.66 2.5h-1.67l-6.11 6.98L7.99 2.5H2.5l7.37 10.73L2.5 21.5h1.67l6.45-7.37 5.15 7.37h5.49l-7.63-10.97Zm-2.28 2.6-.75-1.06L4.66 3.74h2.56l4.79 6.85.75 1.06 6.22 8.9h-2.56l-5.07-7.42Z" />
    </svg>
  );
}

function ShareJobButtons({ jobUrl, jobTitle }: { jobUrl: string; jobTitle: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(jobUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const encodedUrl = encodeURIComponent(jobUrl);
  const encodedTitle = encodeURIComponent(jobTitle);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon-sm" aria-label="Copiar link" onClick={handleCopy}>
        {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Compartir en LinkedIn"
        render={
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
        nativeButton={false}
      >
        <LinkedinIcon className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Compartir en X"
        render={
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
          />
        }
        nativeButton={false}
      >
        <XIcon className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Compartir por email"
        render={<a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} />}
        nativeButton={false}
      >
        <Mail className="size-4" />
      </Button>
    </div>
  );
}

export { ShareJobButtons };
