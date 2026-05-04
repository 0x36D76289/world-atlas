import { create } from "zustand"

interface MapState {
  map: maplibregl.Map | null
  center: [number, number]
  zoom: number
  terrainEnabled: boolean
  setMap: (map: maplibregl.Map | null) => void
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setTerrainEnabled: (enabled: boolean) => void
}

export const useMapStore = create<MapState>((set) => ({
  map: null,
  center: [47.018711, 12.34256],
  zoom: 12,
  terrainEnabled: false,
  setMap: (map) => set({ map }),
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setTerrainEnabled: (terrainEnabled) => set({ terrainEnabled }),
}))
