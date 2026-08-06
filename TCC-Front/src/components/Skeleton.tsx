// Esqueleto de carregamento.
//
// As telas buscavam dados sem sinalizar nada: o usuário via "Nenhum lançamento
// encontrado" por um instante e só depois a lista aparecia — parecia um erro.
// Com o esqueleto, o espaço já mostra o formato do que está por vir.

export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`relative block overflow-hidden rounded-md bg-ink-100 ${className}`}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </span>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Carregando" className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl border border-ink-100 p-3.5">
          <SkeletonLine className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-3.5 w-2/5" />
            <SkeletonLine className="h-3 w-1/4" />
          </div>
          <SkeletonLine className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
