export default function PlaylistDetailLoading() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-6 sm:py-10 md:py-16 space-y-8 pb-36 animate-pulse">
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 p-6 sm:p-8">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl bg-gray-200 dark:bg-white/[0.06] shrink-0" />
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div className="h-8 w-48 bg-gray-200 dark:bg-white/[0.06] rounded-xl mx-auto sm:mx-0" />
          <div className="h-4 w-24 bg-gray-100 dark:bg-white/[0.03] rounded-lg mx-auto sm:mx-0" />
          <div className="flex gap-3 justify-center sm:justify-start">
            <div className="h-10 w-24 bg-gray-100 dark:bg-white/[0.04] rounded-full" />
            <div className="h-10 w-10 bg-gray-100 dark:bg-white/[0.04] rounded-full" />
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-gray-100 dark:border-white/10 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 dark:border-white/[0.03]">
            <div className="w-6 h-4 bg-gray-100 dark:bg-white/[0.04] rounded" />
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.04]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-gray-100 dark:bg-white/[0.04] rounded" />
              <div className="h-3 w-24 bg-gray-50 dark:bg-white/[0.02] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
