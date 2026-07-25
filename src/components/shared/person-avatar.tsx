function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function PersonAvatar({
  name,
  avatarUrl,
  size = "size-8",
}: {
  name: string | null;
  avatarUrl?: string | null;
  size?: string;
}) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name ?? "Usuario"} className={`${size} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground`}
    >
      {initials(name)}
    </span>
  );
}

export { PersonAvatar, initials };
