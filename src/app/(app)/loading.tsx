export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <span
        aria-label="Cargando"
        className="h-8 w-8 animate-spin rounded-full border-2 border-black/15 border-t-emerald-600 dark:border-white/15 dark:border-t-emerald-400"
      />
    </div>
  );
}
