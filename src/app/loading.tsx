// src/app/loading.tsx
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-8">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />

        <div className="space-y-1 text-center">
          <p className="text-xl font-semibold tracking-tight text-white">
            Atlas World
          </p>
          <p className="text-sm text-zinc-400">
            Chargement de la carte sombre...
          </p>
        </div>
      </div>
    </div>
  )
}
