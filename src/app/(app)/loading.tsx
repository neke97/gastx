/** Esqueleto de carga: insinúa la forma de la pantalla mientras llegan los datos. */
export default function Loading() {
  const bar = "animate-pulse rounded-2xl bg-black/[0.06] dark:bg-white/[0.07]";
  return (
    <div aria-label="Cargando" aria-busy className="mx-auto flex w-full max-w-xl flex-col gap-5 px-5 py-6">
      <div className={`${bar} h-8 w-40`} />
      <div className={`${bar} h-48 w-full rounded-[1.75rem]`} />
      <div className="flex gap-2.5">
        <div className={`${bar} h-16 flex-1`} />
        <div className={`${bar} h-16 flex-1`} />
        <div className={`${bar} h-16 flex-1`} />
      </div>
      <div className={`${bar} h-64 w-full`} />
    </div>
  );
}
