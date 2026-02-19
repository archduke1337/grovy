export default function Loading() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-5 md:px-10 lg:px-16 py-4 sm:py-6 md:py-8 space-y-8 sm:space-y-10 md:space-y-14 pb-36 min-h-dvh animate-pulse">
      {/* Hero skeleton */}
      <div className="pt-2 sm:pt-4 md:pt-8 space-y-6">
        <div className="space-y-3">
          <div className="h-12 sm:h-16 w-64 bg-gray-200 dark:bg-white/[0.06] rounded-2xl" />
          <div className="h-5 w-48 bg-gray-100 dark:bg-white/[0.03] rounded-xl" />
        </div>
        <div className="h-12 max-w-2xl bg-gray-100 dark:bg-white/[0.05] rounded-2xl" />
        <div className="flex gap-2">
          {[80, 70, 75, 85].map((w, i) => (
            <div key={i} className="h-8 rounded-full bg-gray-100 dark:bg-white/[0.04]" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="space-y-5">
        <div className="h-8 w-32 bg-gray-200 dark:bg-white/[0.06] rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-white/[0.03]" />
              <div className="space-y-1.5 px-0.5">
                <div className="h-4 w-3/4 bg-gray-100 dark:bg-white/[0.04] rounded-lg" />
                <div className="h-3 w-1/2 bg-gray-50 dark:bg-white/[0.02] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
