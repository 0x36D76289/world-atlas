import type maplibregl from "maplibre-gl"
import { useEffect, useState } from "react"
import { useMapStore } from "@/store/mapStore"

function getBoundsString(map: maplibregl.Map) {
  const b = map.getBounds()
  return `${b.getNorth()},${b.getSouth()},${b.getWest()},${b.getEast()}`
}

export function useBounds() {
  const map = useMapStore((s) => s.map)
  const [bounds, setBounds] = useState<string>("")

  useEffect(() => {
    if (!map) return

    const update = () => {
      setBounds(getBoundsString(map))
    }

    map.on("moveend", update)
    update()

    return () => {
      map.off("moveend", update)
    }
  }, [map])

  return bounds
}
