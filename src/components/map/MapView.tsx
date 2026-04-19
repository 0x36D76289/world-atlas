"use client"

import { useRef } from "react"
import "maplibre-gl/dist/maplibre-gl.css"
import { useMapInit } from "./hooks/useMapInit"

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  useMapInit(mapContainer)

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
    </div>
  )
}
