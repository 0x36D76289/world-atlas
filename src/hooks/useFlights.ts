import { useEffect, useState } from "react"

export type FlightPoint = {
  id: string
  coordinates: [number, number]
  heading: number
  track?: number
  altitude: number
  speed: number
  timestamp: number
  path: [number, number, number][]
  timestamps: number[]
}

interface ApiFlight {
  id: string
  longitude: number
  latitude: number
  heading: number
  track?: number
  altitude: number
  groundSpeed?: number
}

export function useFlights(bounds?: string) {
  const [flights, setFlights] = useState<FlightPoint[]>([])

  useEffect(() => {
    if (!bounds) return

    let interval: NodeJS.Timeout
    const abortController = new AbortController()

    const fetchFlights = async () => {
      try {
        const res = await fetch(`/api/flights?bounds=${bounds}&details=false`, {
          signal: abortController.signal,
        })

        if (!res.ok) throw new Error("Erreur réseau")
        const data: ApiFlight[] = await res.json()

        const parsed: FlightPoint[] = data.map((f) => ({
          id: f.id,
          coordinates: [f.longitude, f.latitude],
          heading: f.heading,
          track: f.track,
          altitude: f.altitude,
          speed: f.groundSpeed || 250,
          timestamp: Date.now(),
          path: [],
          timestamps: [],
        }))

        setFlights(parsed)
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return
        console.error("Flights fetch error", e)
      }
    }

    fetchFlights()
    interval = setInterval(fetchFlights, 3000)

    return () => {
      clearInterval(interval)
      // Annule la requête en cours si les bounds changent
      abortController.abort()
    }
  }, [bounds])

  return flights
}
