"use client"

import maplibregl from "maplibre-gl"
import { useEffect, useRef } from "react"
import "maplibre-gl/dist/maplibre-gl.css"

import { useMapStore } from "@/store/mapStore"

const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  const { setMap, center, zoom, setCenter, setZoom } = useMapStore()

  const initialCenter = useRef(center)
  const initialZoom = useRef(zoom)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const newMap = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE || "https://demotiles.maplibre.org/style.json",
      center: initialCenter.current || [0, 0],
      zoom: initialZoom.current || 2,
      pitch: 45,
      bearing: 0,
    })

    mapRef.current = newMap

    newMap.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right",
    )

    newMap.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
      }),
      "top-right",
    )

    newMap.addControl(
      new maplibregl.ScaleControl({ unit: "metric" }),
      "bottom-left",
    )

    newMap.on("moveend", () => {
      if (!newMap) return

      const newCenter = newMap.getCenter()
      const newZoom = newMap.getZoom()

      if (typeof setCenter === "function")
        setCenter([newCenter.lng, newCenter.lat])
      if (typeof setZoom === "function") setZoom(newZoom)
    })

    newMap.on("load", () => {
      setMap?.(newMap)
      console.log("Carte initialisée avec succès")
    })

    newMap.on("styleimagemissing", (e) => {
      const emptyImage = { width: 1, height: 1, data: new Uint8Array(4) }
      newMap.addImage(e.id, emptyImage)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [setMap, setCenter, setZoom])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
    </div>
  )
}
