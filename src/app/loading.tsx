export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-md rounded-2xl border bg-card/90 p-8 text-center shadow-sm backdrop-blur-sm">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        <h2 className="text-xl font-semibold tracking-tight">Loading storefront</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We are preparing your page. This can take a few seconds on first load.
        </p>
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-foreground/40" />
        </div>
      </div>
    </div>
  );
}