function CompanyAvatar({
  name,
  logoUrl,
  size = "size-11",
}: {
  name: string;
  logoUrl?: string | null;
  size?: string;
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className={`${size} rounded-lg object-cover`} />;
  }
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground`}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export { CompanyAvatar };
