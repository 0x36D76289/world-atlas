import maplibregl from "maplibre-gl"
import { useEffect, useRef } from "react"
import { useMapStore } from "@/store/mapStore"
import { MAP_DEFAULTS, MAP_STYLE } from "../constants"

export function useMapInit(
  mapContainer: React.RefObject<HTMLDivElement | null>,
) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const { setMap, center, zoom, setCenter, setZoom } = useMapStore()
  const initialCenter = useRef(center)
  const initialZoom = useRef(zoom)

  // biome-ignore lint/correctness/useExhaustiveDependencies: mapContainer is a ref, intentionally excluded from deps
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE || "https://demotiles.maplibre.org/style.json",
      center: initialCenter.current || MAP_DEFAULTS.center || [0, 0],
      zoom: initialZoom.current || MAP_DEFAULTS.zoom || 2,
      pitch: MAP_DEFAULTS.pitch,
      bearing: MAP_DEFAULTS.bearing,
    })

    mapRef.current = map

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right",
    )

    if (navigator.geolocation) {
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserLocation: true,
        }),
        "top-right",
      )
    }

    map.addControl(
      new maplibregl.ScaleControl({ unit: "metric" }),
      "bottom-left",
    )

    map.on("moveend", () => {
      const newCenter = map.getCenter()
      if (typeof setCenter === "function")
        setCenter([newCenter.lng, newCenter.lat])
      if (typeof setZoom === "function") setZoom(map.getZoom())
    })

    map.on("load", () => {
      setMap?.(map)
    })

    map.on("styleimagemissing", (e) => {
      map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [setMap, setCenter, setZoom])
}
