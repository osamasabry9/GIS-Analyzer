"use client"

import type React from "react"
import { createContext, useContext, useMemo, useReducer } from "react"
import type { FeatureCollection } from "geojson"

export type DrawMode = "select" | "point" | "line" | "polygon" | "rectangle" | "measure"
export type AnalysisOp = "buffer" | "intersection" | "union" | "clip"

export interface LayerItem {
  id: string
  name: string
  data: FeatureCollection
  visible: boolean
  opacity: number
  clustered?: boolean
  heatmap?: boolean
  timeProperty?: string
}

export interface GISState {
  basemapId: string
  drawMode: DrawMode
  measurement: {
    enabled: boolean
    units: "meters" | "kilometers" | "miles"
  }
  layers: LayerItem[]
  analysisResults: LayerItem[]
  hoverLngLat?: { lng: number; lat: number }
  viewport: { longitude: number; latitude: number; zoom: number; bearing: number; pitch: number }
  timeFilter?: number
}

type Action =
  | { type: "SET_BASEMAP"; id: string }
  | { type: "SET_DRAWMODE"; mode: DrawMode }
  | { type: "SET_MEASUREMENT"; enabled: boolean }
  | { type: "SET_HOVER"; lngLat?: { lng: number; lat: number } }
  | { type: "SET_VIEWPORT"; viewport: GISState["viewport"] }
  | { type: "ADD_LAYER"; layer: LayerItem }
  | { type: "UPDATE_LAYER"; id: string; patch: Partial<LayerItem> }
  | { type: "REMOVE_LAYER"; id: string }
  | { type: "ADD_RESULT"; layer: LayerItem }
  | { type: "CLEAR_RESULTS" }
  | { type: "SET_TIMEFILTER"; time?: number }

const initialState: GISState = {
  basemapId: "osm-light",
  drawMode: "select",
  measurement: { enabled: false, units: "kilometers" },
  layers: [],
  analysisResults: [],
  viewport: { longitude: -98.5795, latitude: 39.8283, zoom: 3.5, bearing: 0, pitch: 0 },
  timeFilter: undefined,
}

function reducer(state: GISState, action: Action): GISState {
  switch (action.type) {
    case "SET_BASEMAP":
      return { ...state, basemapId: action.id }
    case "SET_DRAWMODE":
      return {
        ...state,
        drawMode: action.mode,
        measurement: { ...state.measurement, enabled: action.mode === "measure" },
      }
    case "SET_MEASUREMENT":
      return { ...state, measurement: { ...state.measurement, enabled: action.enabled } }
    case "SET_HOVER":
      return { ...state, hoverLngLat: action.lngLat }
    case "SET_VIEWPORT":
      return { ...state, viewport: action.viewport }
    case "ADD_LAYER":
      return { ...state, layers: [action.layer, ...state.layers] }
    case "UPDATE_LAYER": {
      const patchOne = (arr: LayerItem[]) => arr.map((l) => (l.id === action.id ? { ...l, ...action.patch } : l))
      return { ...state, layers: patchOne(state.layers), analysisResults: patchOne(state.analysisResults) }
    }
    case "REMOVE_LAYER":
      return { ...state, layers: state.layers.filter((l) => l.id !== action.id) }
    case "ADD_RESULT":
      return { ...state, analysisResults: [action.layer, ...state.analysisResults] }
    case "CLEAR_RESULTS":
      return { ...state, analysisResults: [] }
    case "SET_TIMEFILTER":
      return { ...state, timeFilter: action.time }
    default:
      return state
  }
}

const GISContext = createContext<{ state: GISState; dispatch: React.Dispatch<Action> } | null>(null)

export function GISProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <GISContext.Provider value={value}>{children}</GISContext.Provider>
}

export function useGIS() {
  const ctx = useContext(GISContext)
  if (!ctx) throw new Error("useGIS must be used within GISProvider")
  return ctx
}
