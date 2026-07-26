"use client";

import { useState, useTransition } from "react";
import { ArrowBigUp } from "lucide-react";

import { toggleUpvoteAction } from "@/actions/community";
import { cn } from "@/lib/utils";

function UpvoteButton({
  answerId,
  initialCount,
  initialUpvoted,
}: {
  answerId: string;
  initialCount: number;
  initialUpvoted: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [, startTransition] = useTransition();

  function handleClick() {
    const nextUpvoted = !upvoted;
    setUpvoted(nextUpvoted);
    setCount((c) => c + (nextUpvoted ? 1 : -1));

    startTransition(async () => {
      const result = await toggleUpvoteAction(answerId);
      if (!result.error) {
        setUpvoted(result.upvoted);
        setCount(result.count);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={upvoted}
      aria-label="Marcar como útil"
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        upvoted
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
      )}
    >
      <ArrowBigUp className={cn("size-4", upvoted && "fill-current")} />
      {count}
    </button>
  );
}

export { UpvoteButton };
