// src/store/mapStore.ts
import { create } from "zustand"

interface MapState {
  map: maplibregl.Map | null
  center: [number, number]
  zoom: number
  setMap: (map: maplibregl.Map | null) => void
  setCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
}

export const useMapStore = create<MapState>((set) => ({
  map: null,
  center: [2.3522, 48.8566], // Paris par défaut
  zoom: 10,

  setMap: (map) => set({ map }),
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
}))
