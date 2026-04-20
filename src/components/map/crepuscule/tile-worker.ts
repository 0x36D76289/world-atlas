export type Color = [number, number, number]

type TileWorkerPayload = {
  x: number
  y: number
  z: number
  timestamp: number
  color: Color
  debug: boolean
}

type WorkerScope = {
  addEventListener: (
    type: "message",
    listener: (evt: MessageEvent<TileWorkerPayload>) => void,
  ) => void
  postMessage: (message: unknown, transfer?: Transferable[]) => void
}

const workerScope = self as unknown as WorkerScope

const PI = Math.PI
const rad = PI / 180
const dayMs = 1000 * 60 * 60 * 24
const J1970 = 2440588
const J2000 = 2451545
const e = rad * 23.4397

function toJulian(timestamp: number) {
  return timestamp / dayMs - 0.5 + J1970
}

function toDays(timestamp: number) {
  return toJulian(timestamp) - J2000
}

function rightAscension(l: number, b: number) {
  return Math.atan2(
    Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e),
    Math.cos(l),
  )
}

function declination(l: number, b: number) {
  return Math.asin(
    Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l),
  )
}

function siderealTime(d: number, lw: number) {
  return rad * (280.16 + 360.9856235 * d) - lw
}

function solarMeanAnomaly(d: number) {
  return rad * (357.5291 + 0.98560028 * d)
}

function eclipticLongitude(meanAnomaly: number) {
  const center =
    rad *
    (1.9148 * Math.sin(meanAnomaly) +
      0.02 * Math.sin(2 * meanAnomaly) +
      0.0003 * Math.sin(3 * meanAnomaly))
  const perihelion = rad * 102.9372
  return meanAnomaly + center + perihelion + PI
}

function sunCoords(days: number) {
  const meanAnomaly = solarMeanAnomaly(days)
  const longitude = eclipticLongitude(meanAnomaly)

  return {
    dec: declination(longitude, 0),
    ra: rightAscension(longitude, 0),
  }
}

function getSunPosition(timestamp: number, lat: number, lng: number) {
  const lw = rad * -lng
  const phi = rad * lat
  const days = toDays(timestamp)
  const coords = sunCoords(days)
  const hourAngle = siderealTime(days, lw) - coords.ra

  return {
    altitude: Math.asin(
      Math.sin(phi) * Math.sin(coords.dec) +
        Math.cos(phi) * Math.cos(coords.dec) * Math.cos(hourAngle),
    ),
  }
}

function unitToLat(unit: number) {
  const thing1 = Math.exp(unit * 2 * PI)
  const thing2 = Math.atan(thing1) - PI / 4
  return (thing2 * 360) / PI
}

function pixelToLonLat(
  xInternal: number,
  yInternal: number,
  x: number,
  y: number,
  z: number,
  tileSize: number,
): [number, number] {
  const nbTilePerAxis = 2 ** z
  const mercUnitX = (1 / nbTilePerAxis) * (x + xInternal / tileSize)
  const mercUnitY = (1 / nbTilePerAxis) * (y + yInternal / tileSize)
  const lon = mercUnitX * 360 - 180
  const lat = unitToLat(1 - mercUnitY - 0.5)
  return [lon, lat]
}

async function generateTilePixel(
  tileX: number,
  tileY: number,
  tileZ: number,
  timestamp: number,
  color: Color,
  debug: boolean,
): Promise<ArrayBuffer> {
  const initialTileSize = 128
  const degreeMargin = 6
  const k = 4 / (degreeMargin / 2)
  const halfTileSize = Math.trunc(initialTileSize / 2)

  const probePositions = [
    { x: 0, y: 0 },
    { x: 0, y: initialTileSize - 1 },
    { x: initialTileSize - 1, y: initialTileSize - 1 },
    { x: initialTileSize - 1, y: 0 },
    { x: halfTileSize, y: halfTileSize },
    { x: halfTileSize, y: 0 },
    { x: halfTileSize, y: initialTileSize - 1 },
    { x: 0, y: halfTileSize },
    { x: initialTileSize - 1, y: halfTileSize },
  ]

  const probeAltitudes = probePositions.map((pos) => {
    const [lon, lat] = pixelToLonLat(
      pos.x,
      pos.y,
      tileX,
      tileY,
      tileZ,
      initialTileSize,
    )
    const { altitude } = getSunPosition(timestamp, lat, lon)
    return (altitude * 180) / PI
  })

  const allSameDay = probeAltitudes.every((altitude) => altitude > 0)
  const allSameNight = probeAltitudes.every(
    (altitude) => altitude < -degreeMargin,
  )

  const tileSize = allSameDay || allSameNight ? 2 : initialTileSize
  const nbPixel = tileSize * tileSize

  const canvas = new OffscreenCanvas(tileSize, tileSize)
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Unable to create 2D context for crepuscule tile")
  }

  const imageData = ctx.createImageData(tileSize, tileSize)
  const tilePixels = new Uint8ClampedArray(nbPixel * 4)

  for (let i = 0; i < nbPixel * 4; i += 4) {
    const xInternal = (i / 4) % tileSize
    const yInternal = Math.trunc(i / 4 / tileSize)

    const [lon, lat] = pixelToLonLat(
      xInternal,
      yInternal,
      tileX,
      tileY,
      tileZ,
      tileSize,
    )

    const { altitude } = getSunPosition(timestamp, lat, lon)
    const altitudeDeg = (altitude * 180) / PI
    const degreesBelowHorizon = -altitudeDeg

    if (debug) {
      if (altitudeDeg >= 0) {
        tilePixels[i + 3] = 0
      } else if (altitudeDeg < -6) {
        tilePixels[i + 3] = 255
      } else {
        tilePixels[i + 3] = 128
      }
    } else {
      tilePixels[i + 3] =
        255 *
        (1 / (1 + Math.exp(-k * (degreesBelowHorizon - degreeMargin / 2))))
    }

    tilePixels[i] = color[0]
    tilePixels[i + 1] = color[1]
    tilePixels[i + 2] = color[2]
  }

  imageData.data.set(tilePixels)
  ctx.putImageData(imageData, 0, 0)

  const blob = await canvas.convertToBlob()
  return blob.arrayBuffer()
}

workerScope.addEventListener(
  "message",
  async (evt: MessageEvent<TileWorkerPayload>) => {
    try {
      const { x, y, z, timestamp, color, debug } = evt.data
      const tileBuffer = await generateTilePixel(
        x,
        y,
        z,
        timestamp,
        color,
        debug,
      )
      workerScope.postMessage(tileBuffer, [tileBuffer])
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown crepuscule worker error"
      workerScope.postMessage({ error: message })
    }
  },
)
