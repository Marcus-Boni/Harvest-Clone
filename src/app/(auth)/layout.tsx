export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Mesh gradient */}
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  );
}
