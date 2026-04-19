export const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`

export const TERRAIN_SOURCE_URL =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
export const TERRAIN_ENCODING = "terrarium" as const
export const TERRAIN_MAX_ZOOM = 15

export const MAP_DEFAULTS = {
  center: [2.3488, 48.8534] as [number, number],
  zoom: 12,
  pitch: 45,
  bearing: 0,
}
