"use client"

import { IconLayer } from "@deck.gl/layers"
import { MapboxOverlay } from "@deck.gl/mapbox"
import { useEffect, useRef } from "react"
import { useBounds } from "@/hooks/useBounds"
import { useFlights } from "@/hooks/useFlights"
import { useMapStore } from "@/store/mapStore"

const FEET_TO_METERS = 0.3048

export default function DeckOverlay() {
  const map = useMapStore((s) => s.map)
  const overlayRef = useRef<MapboxOverlay | null>(null)

  const bounds = useBounds()
  const flights = useFlights(bounds)

  useEffect(() => {
    if (!map) return

    const overlay = new MapboxOverlay({
      interleaved: true,
      layers: [],
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

  useEffect(() => {
    if (!overlayRef.current || !map) return

    overlayRef.current.setProps({
      layers: [
        new IconLayer({
          id: "flights",
          data: flights,

          getPosition: (d) => [
            d.coordinates[0],
            d.coordinates[1],
            d.altitude * FEET_TO_METERS,
          ],

          getAngle: (d) => {
            const angle = d.track ?? d.heading ?? 0
            return -angle
          },
          getIcon: () => ({
            url: "/plane.png",
            width: 128,
            height: 128,
            anchorY: 64,
          }),

          sizeScale: 0.3,

          getSize: (d) => {
            if (d.altitude > 10000) return 100
            if (d.altitude > 5000) return 70
            return 40
          },

          getColor: [255, 255, 255],

          billboard: false,
          parameters: { depthTest: false },
          pickable: true,
        }),
      ],
    })
  }, [flights, map])

  return null
}
