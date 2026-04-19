import { Home, Map as MapIcon } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-[#0a0a0a]">
      <div className="max-w-md text-center">
        {/* Icône principale */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-900">
          <MapIcon className="h-12 w-12 text-zinc-400" />
        </div>

        {/* Titre */}
        <h1 className="mb-3 text-6xl font-bold tracking-tighter text-white">
          404
        </h1>

        <h2 className="mb-6 text-2xl font-semibold text-zinc-200">
          Page non trouvée
        </h2>

        {/* Description */}
        <p className="mb-10 text-lg text-zinc-400">
          La page que vous recherchez n'existe pas ou a été déplacée.
          <br />
          Retournez sur la carte.
        </p>

        {/* Boutons d'action */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="group flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-lg font-medium text-black transition-all hover:bg-zinc-200 active:scale-[0.98]"
          >
            <Home className="h-5 w-5" />
            Retour à l'accueil
          </Link>

          <Link
            href="/map" // ou "/" si ta carte est sur la page d'accueil
            className="group flex items-center justify-center gap-3 rounded-xl border border-zinc-700 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-zinc-900 active:scale-[0.98]"
          >
            <MapIcon className="h-5 w-5" />
            Aller à la carte
          </Link>
        </div>

        {/* Texte supplémentaire */}
        <p className="mt-12 text-xs text-zinc-500">
          Atlas World • Carte sombre
        </p>
      </div>
    </div>
  )
}
