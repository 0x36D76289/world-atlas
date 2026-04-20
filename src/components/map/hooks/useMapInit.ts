import maplibregl from "maplibre-gl"
import * as pmtiles from "pmtiles"
import { useEffect, useRef } from "react"
import { useMapStore } from "@/store/mapStore"
import {
  MAP_DEFAULTS,
  MAP_STYLE,
  TERRAIN_ENCODING,
  TERRAIN_MAX_ZOOM,
  TERRAIN_SOURCE_URL,
} from "../constants"
import { CrepusculeLive } from "../crepuscule/Crepuscule"

const protocol = new pmtiles.Protocol()
maplibregl.addProtocol("pmtiles", protocol.tile.bind(protocol))

export function useMapInit(
  mapContainer: React.RefObject<HTMLDivElement | null>,
) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const crepusculeRef = useRef<CrepusculeLive | null>(null)
  const { setMap, center, zoom, setCenter, setZoom } = useMapStore()
  const initialCenter = useRef(center)
  const initialZoom = useRef(zoom)

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE || "https://demotiles.maplibre.org/style.json",
      center: initialCenter.current || MAP_DEFAULTS.center,
      zoom: initialZoom.current || MAP_DEFAULTS.zoom,
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

      map.addSource("terrain", {
        type: "raster-dem",
        tiles: [TERRAIN_SOURCE_URL],
        tileSize: 256,
        encoding: TERRAIN_ENCODING,
        maxzoom: TERRAIN_MAX_ZOOM,
      })

      map.setTerrain(null)

      map.addControl(
        new maplibregl.TerrainControl({
          source: "terrain",
          exaggeration: 0.5,
        }),
        "top-right",
      )

      crepusculeRef.current = new CrepusculeLive(map, {
        color: [0, 0, 17],
        opacity: 0.58,
      })
    })

    map.on("styleimagemissing", (e) => {
      map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) })
    })

    return () => {
      crepusculeRef.current?.unmount()
      crepusculeRef.current = null
      setMap?.(null)
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [setMap, setCenter, setZoom, mapContainer.current])
}
