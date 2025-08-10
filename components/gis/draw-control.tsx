"use client"

import { useEffect, useMemo } from "react"
import { useControl, type ControlPosition } from "react-map-gl/maplibre"
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import DrawRectangle from "mapbox-gl-draw-rectangle-mode"

// A safe custom style set for MapLibre (no line-dasharray)
const drawStyles = [
  // Polygons - inactive fill
  {
    id: "gl-draw-polygon-fill-inactive",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"], ["!=", "active", "true"]],
    paint: {
      "fill-color": "#10b981",
      "fill-opacity": 0.15,
    },
  },
  // Polygons - active fill
  {
    id: "gl-draw-polygon-fill-active",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"], ["==", "active", "true"]],
    paint: {
      "fill-color": "#10b981",
      "fill-opacity": 0.25,
    },
  },
  // Polygons - inactive stroke
  {
    id: "gl-draw-polygon-stroke-inactive",
    type: "line",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"], ["!=", "active", "true"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#10b981", "line-width": 2 },
  },
  // Polygons - active stroke
  {
    id: "gl-draw-polygon-stroke-active",
    type: "line",
    filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"], ["==", "active", "true"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#10b981", "line-width": 2 },
  },
  // Lines - inactive
  {
    id: "gl-draw-line-inactive",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"], ["!=", "active", "true"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#a855f7", "line-width": 2 },
  },
  // Lines - active
  {
    id: "gl-draw-line-active",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"], ["==", "active", "true"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#a855f7", "line-width": 2 },
  },
  // Point features - inactive (actual point geometries, not vertices/midpoints)
  {
    id: "gl-draw-point-inactive",
    type: "circle",
    filter: [
      "all",
      ["==", "$type", "Point"],
      ["!=", "mode", "static"],
      ["!in", "meta", "midpoint", "vertex"],
      ["!=", "active", "true"],
    ],
    paint: { "circle-color": "#06b6d4", "circle-radius": 5, "circle-opacity": 0.9 },
  },
  // Point features - active
  {
    id: "gl-draw-point-active",
    type: "circle",
    filter: [
      "all",
      ["==", "$type", "Point"],
      ["!=", "mode", "static"],
      ["!in", "meta", "midpoint", "vertex"],
      ["==", "active", "true"],
    ],
    paint: { "circle-color": "#22d3ee", "circle-radius": 6, "circle-opacity": 1 },
  },
  // Vertex halos
  {
    id: "gl-draw-polygon-and-line-vertex-halo-active",
    type: "circle",
    filter: ["all", ["==", "meta", "vertex"], ["!=", "mode", "static"]],
    paint: { "circle-radius": 7, "circle-color": "#000000" },
  },
  // Vertices
  {
    id: "gl-draw-polygon-and-line-vertex-active",
    type: "circle",
    filter: ["all", ["==", "meta", "vertex"], ["!=", "mode", "static"]],
    paint: { "circle-radius": 5, "circle-color": "#10b981" },
  },
  // Midpoints (handles)
  {
    id: "gl-draw-midpoint",
    type: "circle",
    filter: ["all", ["==", "meta", "midpoint"], ["!=", "mode", "static"]],
    paint: { "circle-radius": 4, "circle-color": "#f59e0b" },
  },
  // Static features (after combine/lock)
  {
    id: "gl-draw-static",
    type: "line",
    filter: ["all", ["==", "mode", "static"], ["==", "$type", "LineString"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#64748b", "line-width": 2 },
  },
  {
    id: "gl-draw-static-polygon",
    type: "fill",
    filter: ["all", ["==", "mode", "static"], ["==", "$type", "Polygon"]],
    paint: { "fill-color": "#64748b", "fill-opacity": 0.2 },
  },
]

type Props = {
  position?: ControlPosition
  onReady?: (draw: MapboxDraw) => void
}

export default function DrawControl({ position = "top-left", onReady }: Props) {
  const modes = useMemo(() => {
    const base = (MapboxDraw as any).modes
    const rectMode = (DrawRectangle as any)?.default ?? (DrawRectangle as any)
    return rectMode ? { ...base, draw_rectangle: rectMode } : base
  }, [])

  const draw = useControl<MapboxDraw>(
    () =>
      new MapboxDraw({
        displayControlsDefault: false,
        modes,
        styles: drawStyles as any, // override default styles (no line-dasharray)
        controls: {
          point: false,
          line_string: false,
          polygon: false,
          trash: true,
          combine_features: false,
          uncombine_features: false,
        },
      }),
    { position },
  )

  useEffect(() => {
    onReady?.(draw)
  }, [draw, onReady])

  return null
}
