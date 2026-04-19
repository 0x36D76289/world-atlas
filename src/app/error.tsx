"use client"

import { AlertTriangle } from "lucide-react"
import { useEffect } from "react"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Erreur dans l'application :", error)
  }, [error])

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-950/50">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>

        <h2 className="mb-3 text-3xl font-semibold tracking-tight text-white">
          Oups, quelque chose s’est mal passé
        </h2>

        <p className="mb-8 text-zinc-400">
          Une erreur inattendue s’est produite lors du chargement de la carte.
          <br />
          Veuillez réessayer.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-white px-8 py-3 text-lg font-medium text-black transition hover:bg-zinc-200 active:scale-95"
          >
            Réessayer
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-zinc-700 px-8 py-3 text-lg font-medium text-white transition hover:bg-zinc-900"
          >
            Rafraîchir la page
          </button>
        </div>

        {/* Affichage optionnel de l'erreur en développement */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-10 text-left">
            <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-400">
              Détails techniques (dev only)
            </summary>
            <pre className="mt-3 overflow-auto rounded bg-zinc-950 p-4 text-left text-xs text-red-400">
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
