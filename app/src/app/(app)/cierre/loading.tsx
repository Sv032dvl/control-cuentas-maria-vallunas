export default function CierreLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <header className="space-y-2">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-7 w-64 rounded bg-muted" />
      </header>

      {/* Progress steps skeleton */}
      <div className="h-8 w-full rounded-lg bg-muted" />

      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
        <div className="space-y-2 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border bg-muted/50" />
          ))}
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="h-14 rounded border bg-muted/30" />
    </div>
  );
}
