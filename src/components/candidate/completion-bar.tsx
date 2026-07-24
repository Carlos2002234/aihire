function CompletionBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <span className="text-sm font-medium text-muted-foreground">{pct}%</span>
    </div>
  );
}

export { CompletionBar };
