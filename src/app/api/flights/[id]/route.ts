import { FlightRadar24API } from "flightradarapi"
import { type NextRequest, NextResponse } from "next/server"

const api = new FlightRadar24API()

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: "Flight ID manquant" }, { status: 400 })
  }

  try {
    const details = await api.getFlightDetails({ id } as never)

    if (!details || typeof details !== "object") {
      return NextResponse.json(
        { error: "Aucune donnée pour ce vol" },
        { status: 404 },
      )
    }

    const raw = details as Record<string, unknown>
    const trail = Array.isArray(raw.trail)
      ? (raw.trail as Record<string, number>[]).map((p) => ({
          lng: p.lng ?? p.longitude ?? 0,
          lat: p.lat ?? p.latitude ?? 0,
          alt: p.alt ?? p.altitude ?? 0,
          spd: p.spd ?? 0,
          ts: p.ts ?? 0,
          hd: p.hd ?? 0,
        }))
      : []

    return NextResponse.json({ ...raw, trail })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue"

    if (
      message.includes("520") ||
      message.includes("404") ||
      message.includes("400")
    ) {
      return NextResponse.json(
        { error: "Vol introuvable ou terminé", detail: message },
        { status: 404 },
      )
    }

    console.error(`[flights/${id}] Erreur:`, message)
    return NextResponse.json(
      { error: "Erreur serveur", detail: message },
      { status: 500 },
    )
  }
}
