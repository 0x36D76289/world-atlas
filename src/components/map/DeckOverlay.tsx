"use client"

import { ScatterplotLayer } from "@deck.gl/layers"
import { MapboxOverlay } from "@deck.gl/mapbox"
import { useEffect, useRef } from "react"
import { useMapStore } from "@/store/mapStore"

export default function DeckOverlay() {
  const map = useMapStore((s) => s.map)
  const overlayRef = useRef<MapboxOverlay | null>(null)

  useEffect(() => {
    if (!map) return

    const overlay = new MapboxOverlay({
      interleaved: true,
      layers: [
        new ScatterplotLayer({
          id: "scatter-example",
          data: [],
          getPosition: (d: { coordinates: [number, number] }) => d.coordinates,
          getRadius: 500,
          getFillColor: [255, 140, 0],
          opacity: 0.6,
        }),
      ],
    })

    map.addControl(overlay)
    overlayRef.current = overlay

    return () => {
      if (overlayRef.current) {
        map.removeControl(overlayRef.current)
        overlayRef.current = null
      }
    }
  }, [map])

  return null
}
