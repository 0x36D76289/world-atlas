"use client";

import { IconLayer, PathLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useEffect, useRef, useState } from "react";
import { useBounds } from "@/hooks/useBounds";
import { useFlights } from "@/hooks/useFlights";
import { useMapStore } from "@/store/mapStore";

const FEET_TO_METERS = 0.3048;

interface TrailPoint {
  lng?: number;
  longitude?: number;
  lat?: number;
  latitude?: number;
  alt?: number;
  altitude?: number;
}

export default function DeckOverlay() {
  const map = useMapStore((s) => s.map);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const bounds = useBounds();
  const flights = useFlights(bounds);

  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [hoveredFlightId, setHoveredFlightId] = useState<string | null>(null);
  const [flightTrail, setFlightTrail] = useState<[number, number, number][]>(
    [],
  );

  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedFlightId;

  useEffect(() => {
    if (!selectedFlightId) {
      setFlightTrail([]);
      return;
    }

    let isMounted = true;

    const fetchFlightDetails = async () => {
      try {
        const res = await fetch(`/api/flights/${selectedFlightId}`);

        if (!res.ok) {
          console.warn(
            `Détails du vol ${selectedFlightId} indisponibles (vol terminé ou hors de portée)`,
          );
          if (isMounted) setFlightTrail([]);
          return;
        }

        const data = await res.json();

        if (isMounted && Array.isArray(data.trail)) {
          const path: [number, number, number][] = data.trail.map(
            (point: TrailPoint) => [
              point.lng ?? point.longitude ?? 0,
              point.lat ?? point.latitude ?? 0,
              (point.alt ?? point.altitude ?? 0) * FEET_TO_METERS,
            ],
          );
          setFlightTrail(path);
        }
      } catch {
        console.error(
          `Erreur lors de la récupération des détails du vol ${selectedFlightId}`,
        );
      }
    };

    fetchFlightDetails();
    return () => {
      isMounted = false;
    };
  }, [selectedFlightId]);

  useEffect(() => {
    if (!map) return;

    const overlay = new MapboxOverlay({ interleaved: true, layers: [] });
    map.addControl(overlay);
    overlayRef.current = overlay;

    const handleMapClick = () => {
      if ((window as unknown as Record<string, boolean>).__deckClickConsumed) {
        (window as unknown as Record<string, boolean>).__deckClickConsumed =
          false;
        return;
      }
      setSelectedFlightId(null);
    };

    map.on("click", handleMapClick);

    return () => {
      map.removeControl(overlay);
      overlayRef.current = null;
      map.off("click", handleMapClick);
    };
  }, [map]);

  // Mise à jour des layers à chaque changement d'état
  useEffect(() => {
    if (!overlayRef.current || !map) return;

    overlayRef.current.setProps({
      layers: [
        new PathLayer({
          id: "flight-trail",
          data: flightTrail.length > 0 ? [{ path: flightTrail }] : [],
          getPath: (d) => d.path,
          getColor: [255, 140, 0, 220],
          getWidth: 4,
          widthMinPixels: 2,
          parameters: { depthTest: false },
        }),

        new IconLayer({
          id: "flights",
          data: flights,

          getPosition: (d) => [
            d.coordinates[0],
            d.coordinates[1],
            d.altitude * FEET_TO_METERS,
          ],

          getAngle: (d) => -(d.track ?? d.heading ?? 0),

          getIcon: () => ({
            url: "/plane.png",
            width: 128,
            height: 128,
            anchorY: 64,
          }),

          sizeScale: 0.3,
          getSize: () => 120,

          getColor: (d) =>
            d.id === selectedFlightId || d.id === hoveredFlightId
              ? [255, 140, 0]
              : [255, 255, 255],

          autoHighlight: false,
          billboard: false,
          parameters: { depthTest: true },
          pickable: true,
          updateTriggers: {
            getColor: [selectedFlightId, hoveredFlightId],
          },

          onHover: (info) => {
            setHoveredFlightId(info.object?.id ?? null);
            if (map.getCanvas()) {
              map.getCanvas().style.cursor = info.object ? "pointer" : "";
            }
          },

          onClick: (info) => {
            if (info.object) {
              setSelectedFlightId(info.object.id);
              (
                window as unknown as Record<string, boolean>
              ).__deckClickConsumed = true;
            } else if (selectedRef.current) {
              setSelectedFlightId(null);
            }
          },
        }),
      ],
    });
  }, [flights, map, selectedFlightId, hoveredFlightId, flightTrail]);

  return null;
}
