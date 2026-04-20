import type { Map as MapLibreMap, RasterTileSource } from "maplibre-gl"
import {
  type AddProtocolAction,
  addProtocol,
  removeProtocol,
} from "maplibre-gl"
import type { Color } from "./tile-worker"

const CREPUSCULE_PROTOCOL_NAMESPACE_PATTERN = "crepuscule_protocol_<UNIQUE>"
const CREPUSCULE_SOURCE_ID_PATTERN = "crepuscule_source_<UNIQUE>"
const CREPUSCULE_LAYER_ID_PATTERN = "crepuscule_layer_<UNIQUE>"

type WorkerErrorPayload = {
  error: string
}

const isWorkerErrorPayload = (
  payload: unknown,
): payload is WorkerErrorPayload => {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "string"
  )
}

const createTileWorker = () => {
  return new Worker(new URL("./tile-worker.ts", import.meta.url), {
    type: "module",
    name: "crepuscule-tile-worker",
  })
}

export type CrepusculeOptions = {
  color?: Color
  opacity?: number
  date?: Date
  debug?: boolean
}

export type TransitionOptions = {
  duration?: number
  delay?: number
}

export type CrepusculeLiveOptions = CrepusculeOptions & {
  refreshIntervalMs?: number
  transitionDelayMs?: number
}

const defaultOptions: Required<CrepusculeOptions> = {
  color: [0, 0, 17],
  opacity: 0.7,
  date: new Date(),
  debug: false,
}

const defaultLiveOptions = {
  refreshIntervalMs: 30000,
  transitionDelayMs: 750,
}

export class Crepuscule {
  private readonly map: MapLibreMap
  private readonly color: Color
  private readonly debug: boolean

  private date: Date
  private targetOpacity: number
  private readonly protocolNamespace: string
  private tileUriPattern: string
  private readonly layerId: string
  private readonly sourceId: string
  private source: RasterTileSource | null = null
  private wasUnmounted = false

  constructor(map: MapLibreMap, options: CrepusculeOptions = {}) {
    const optionsWithDefault = {
      ...defaultOptions,
      ...options,
    }

    this.map = map
    this.color = optionsWithDefault.color.slice() as Color
    this.targetOpacity = optionsWithDefault.opacity
    this.date = optionsWithDefault.date
    this.debug = optionsWithDefault.debug

    const unique = (Math.random() + 1).toString(36).slice(2)

    this.protocolNamespace = CREPUSCULE_PROTOCOL_NAMESPACE_PATTERN.replace(
      "<UNIQUE>",
      unique,
    )

    this.tileUriPattern = this.buildTileUriPattern(this.date)
    this.layerId = CREPUSCULE_LAYER_ID_PATTERN.replace("<UNIQUE>", unique)
    this.sourceId = CREPUSCULE_SOURCE_ID_PATTERN.replace("<UNIQUE>", unique)

    if (map.loaded()) {
      this.init()
    } else {
      map.once("load", () => {
        if (!this.wasUnmounted) {
          this.init()
        }
      })
    }
  }

  private buildTileUriPattern(date: Date) {
    return `${this.protocolNamespace}://{z}-{x}-{y}-${+date}`
  }

  private readonly loadProtocolTile: AddProtocolAction = async (
    params,
    abortController,
  ) => {
    if (!params.url) {
      throw new Error("Missing URL in crepuscule tile request")
    }

    const path = params.url.split("://")[1] ?? ""
    const tileToken = path.split("/").at(-1)

    if (!tileToken) {
      throw new Error(`Invalid crepuscule tile URL: ${params.url}`)
    }

    const [z, x, y, timestamp] = tileToken.split("-").map(Number)

    if ([z, x, y, timestamp].some((value) => Number.isNaN(value))) {
      throw new Error(`Cannot parse crepuscule tile coordinates: ${tileToken}`)
    }

    const data = await this.generateTilePixelOnWorker(
      x,
      y,
      z,
      timestamp,
      abortController.signal,
    )

    return { data }
  }

  private async generateTilePixelOnWorker(
    x: number,
    y: number,
    z: number,
    timestamp: number,
    signal: AbortSignal,
  ): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException("The request was aborted", "AbortError"))
        return
      }

      const tileWorker = createTileWorker()

      const onAbort = () => {
        tileWorker.terminate()
        reject(new DOMException("The request was aborted", "AbortError"))
      }

      signal.addEventListener("abort", onAbort, { once: true })

      tileWorker.onerror = (event) => {
        signal.removeEventListener("abort", onAbort)
        tileWorker.terminate()
        reject(new Error(event.message || "Crepuscule worker failed"))
      }

      tileWorker.onmessage = (
        evt: MessageEvent<ArrayBuffer | WorkerErrorPayload>,
      ) => {
        signal.removeEventListener("abort", onAbort)
        tileWorker.terminate()

        if (evt.data instanceof ArrayBuffer) {
          resolve(evt.data)
          return
        }

        if (isWorkerErrorPayload(evt.data)) {
          reject(new Error(evt.data.error))
          return
        }

        reject(new Error("Unexpected worker response payload"))
      }

      tileWorker.postMessage({
        x,
        y,
        z,
        timestamp,
        color: this.color,
        debug: this.debug,
      })
    })
  }

  private init() {
    addProtocol(this.protocolNamespace, this.loadProtocolTile)

    this.map.addSource(this.sourceId, {
      type: "raster",
      tiles: [this.tileUriPattern],
      tileSize: 512,
    })

    this.source = this.map.getSource(this.sourceId) as RasterTileSource | null

    this.map.addLayer({
      id: this.layerId,
      type: "raster",
      source: this.sourceId,
      paint: {
        "raster-opacity-transition": { duration: 1000, delay: 0 },
        "raster-opacity": this.targetOpacity,
      },
    })
  }

  private applyOpacity(opacity: number, options: TransitionOptions = {}) {
    this.map.setPaintProperty(this.layerId, "raster-opacity-transition", {
      duration: 0,
      delay: 0,
      ...options,
    })

    this.map.setPaintProperty(this.layerId, "raster-opacity", opacity)
  }

  setOpacity(opacity: number, options: TransitionOptions = {}) {
    this.raiseIfUnmounted()
    this.targetOpacity = opacity
    this.applyOpacity(opacity, options)
  }

  hide(options: TransitionOptions = {}) {
    this.raiseIfUnmounted()
    this.applyOpacity(0, options)
  }

  show(options: TransitionOptions = {}) {
    this.raiseIfUnmounted()
    this.applyOpacity(this.targetOpacity, options)
  }

  setDate(date: Date) {
    this.raiseIfUnmounted()
    this.date = date
    this.tileUriPattern = this.buildTileUriPattern(date)
    this.source?.setTiles([this.tileUriPattern])
  }

  update() {
    this.raiseIfUnmounted()
    this.setDate(new Date())
  }

  unmount() {
    this.raiseIfUnmounted()

    if (this.map.getLayer(this.layerId)) {
      this.map.removeLayer(this.layerId)
    }

    if (this.map.getSource(this.sourceId)) {
      this.map.removeSource(this.sourceId)
    }

    removeProtocol(this.protocolNamespace)
    this.wasUnmounted = true
  }

  private raiseIfUnmounted() {
    if (this.wasUnmounted) {
      throw new Error(
        "This Crepuscule instance was unmounted and can no longer be used.",
      )
    }
  }
}

export class CrepusculeLive {
  private readonly opacity: number
  private readonly refreshIntervalMs: number
  private readonly transitionDelayMs: number

  private readonly crA: Crepuscule
  private readonly crB: Crepuscule
  private usingA: boolean
  private intervalId: ReturnType<typeof setInterval> | null
  private readonly map: MapLibreMap

  constructor(map: MapLibreMap, options: CrepusculeLiveOptions = {}) {
    const optionsWithDefault = {
      ...defaultOptions,
      ...options,
    }

    this.map = map
    this.opacity = optionsWithDefault.opacity
    this.refreshIntervalMs =
      options.refreshIntervalMs ?? defaultLiveOptions.refreshIntervalMs
    this.transitionDelayMs =
      options.transitionDelayMs ?? defaultLiveOptions.transitionDelayMs

    if (optionsWithDefault.debug) {
      this.crA = new Crepuscule(map, {
        ...optionsWithDefault,
        color: [70, 0, 0],
      })
      this.crB = new Crepuscule(map, {
        ...optionsWithDefault,
        opacity: 0,
        color: [0, 0, 70],
      })
    } else {
      this.crA = new Crepuscule(map, optionsWithDefault)
      this.crB = new Crepuscule(map, {
        ...optionsWithDefault,
        opacity: 0,
      })
    }

    this.usingA = true
    this.intervalId = null

    if (map.loaded()) {
      this.start()
    } else {
      map.once("load", () => {
        this.start()
      })
    }
  }

  start() {
    if (this.intervalId) {
      return
    }

    this.intervalId = setInterval(() => {
      this.swapLayer()
    }, this.refreshIntervalMs)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private swapLayer() {
    const toHide = this.usingA ? this.crA : this.crB
    const toShow = this.usingA ? this.crB : this.crA
    this.usingA = !this.usingA

    toShow.setDate(new Date())

    toHide.setOpacity(0, { duration: 0, delay: this.transitionDelayMs })
    toShow.setOpacity(this.opacity, {
      duration: 0,
      delay: this.transitionDelayMs,
    })

    this.map.triggerRepaint()
  }

  unmount() {
    this.stop()
    this.crA.unmount()
    this.crB.unmount()
  }
}
