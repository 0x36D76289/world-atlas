export const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`

export const MAP_DEFAULTS = {
  center: [0, 0] as [number, number],
  zoom: 2,
  pitch: 45,
  bearing: 0,
}
