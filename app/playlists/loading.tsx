export default function PlaylistsLoading() {
  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-6 sm:py-10 md:py-16 space-y-8 pb-36 animate-pulse">
      <div className="space-y-3">
        <div className="h-10 w-48 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
        <div className="h-5 w-32 bg-gray-100 dark:bg-zinc-900 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl sm:rounded-3xl bg-gray-100 dark:bg-zinc-900" />
        ))}
      </div>
    </div>
  );
}
