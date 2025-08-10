"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import Map, {
  type MapRef,
  NavigationControl,
  Source,
  Layer,
  Marker,
} from "react-map-gl/maplibre";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import maplibregl from "maplibre-gl";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";
import { useGIS } from "./gis-provider";
import { getBasemapStyle } from "@/lib/basemaps";
import { cn } from "@/lib/utils";
import * as turf from "@turf/turf";
import DrawControl from "./draw-control";
import { gsap } from "gsap";

export default function MapContainer() {
  const { state, dispatch } = useGIS();
  const mapRef = useRef<MapRef>(null);
  const [draw, setDraw] = useState<MapboxDraw | null>(null);
  const lastViewRef = useRef(state.viewport);
  const hoverRef = useRef<{ lng: number; lat: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const [pin, setPin] = useState<{
    lng: number;
    lat: number;
    label?: string;
  } | null>(null);
  const progRef = useRef<HTMLDivElement>(null);

  // Memoize basemap style to avoid unnecessary reloads
  const style = useMemo(
    () => getBasemapStyle(state.basemapId, false),
    [state.basemapId]
  );

  // Keep last viewport for comparison
  useEffect(() => {
    lastViewRef.current = state.viewport;
  }, [state.viewport]);

  // Handle global flyTo and fitBounds events
  useEffect(() => {
    const onFly = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        lng: number;
        lat: number;
        zoom?: number;
        dropMarker?: boolean;
        name?: string;
      };
      const map = mapRef.current?.getMap();
      if (!map || !detail) return;
      if (progRef.current) {
        gsap.killTweensOf(progRef.current);
        gsap.set(progRef.current, { width: "0%" });
        gsap.to(progRef.current, {
          width: "100%",
          duration: 1,
          ease: "power2.out",
        });
      }
      if (detail.dropMarker)
        setPin({ lng: detail.lng, lat: detail.lat, label: detail.name });
      map.flyTo({
        center: [detail.lng, detail.lat],
        zoom: detail.zoom ?? 14,
        duration: 1000,
      });
    };
    const onFit = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        bbox: [number, number, number, number];
        options?: any;
      };
      const map = mapRef.current?.getMap();
      if (!map || !detail?.bbox) return;
      try {
        map.fitBounds(
          [
            [detail.bbox[0], detail.bbox[1]],
            [detail.bbox[2], detail.bbox[3]],
          ],
          { padding: 40, duration: 800, ...(detail.options || {}) }
        );
      } catch {}
    };
    document.addEventListener("gis:flyto", onFly as any);
    document.addEventListener("gis:fit", onFit as any);
    return () => {
      document.removeEventListener("gis:flyto", onFly as any);
      document.removeEventListener("gis:fit", onFit as any);
    };
  }, []);

  // Draw events binding
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !draw) return;

    const onDrawChange = () => {
      const fc = draw.getAll();
      const id = "drawn-features";
      if (fc && fc.features) {
        if (
          state.layers.some((l) => l.id === id) ||
          state.analysisResults.some((l) => l.id === id)
        ) {
          dispatch({
            type: "UPDATE_LAYER",
            id,
            patch: { data: fc, visible: true },
          });
        } else {
          dispatch({
            type: "ADD_LAYER",
            layer: {
              id,
              name: "Drawn Features",
              data: fc as any,
              visible: true,
              opacity: 1,
            },
          });
        }
        if (state.drawMode === "measure") {
          const f = fc.features[fc.features.length - 1];
          if (f) {
            let lengthKm = 0;
            let areaSqKm = 0;
            if (f.geometry.type === "LineString")
              lengthKm = turf.length(f as any, { units: "kilometers" });
            if (f.geometry.type === "Polygon")
              areaSqKm = turf.area(f as any) / 1e6;
            const el = document.getElementById("measure-readout");
            if (el)
              el.textContent =
                f.geometry.type === "LineString"
                  ? `${lengthKm.toFixed(3)} km`
                  : f.geometry.type === "Polygon"
                  ? `${areaSqKm.toFixed(3)} km²`
                  : "";
          }
        }
      }
    };

    map.on("draw.update", onDrawChange);
    map.on("draw.create", onDrawChange);
    map.on("draw.delete", onDrawChange);

    const onMapError = (ev: any) =>
      console.error("MapLibre error:", ev?.error || ev);
    map.on("error", onMapError);

    return () => {
      map.off("draw.update", onDrawChange);
      map.off("draw.create", onDrawChange);
      map.off("draw.delete", onDrawChange);
      map.off("error", onMapError);
    };
  }, [draw, dispatch, state.layers, state.analysisResults, state.drawMode]);

  // Clear draw globally
  useEffect(() => {
    const onClear = () => {
      draw?.deleteAll();
      const id = "drawn-features";
      if (
        state.layers.some((l) => l.id === id) ||
        state.analysisResults.some((l) => l.id === id)
      )
        dispatch({ type: "REMOVE_LAYER", id });
      const el = document.getElementById("measure-readout");
      if (el) el.textContent = "";
    };
    document.addEventListener("gis:clear-draw", onClear as any);
    return () => document.removeEventListener("gis:clear-draw", onClear as any);
  }, [dispatch, state.layers, state.analysisResults, draw]);

  // Manage draw modes & map interaction states
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !draw) return;

    const activate = (mode: string) => {
      draw.changeMode(mode);
      map.getCanvas().style.cursor = "crosshair";
      map.doubleClickZoom.disable();
      map.boxZoom.disable();
      map.dragPan.disable();
      map.getCanvas().focus();
    };

    if (state.drawMode === "select") {
      draw.changeMode("simple_select");
      map.getCanvas().style.cursor = "";
      map.doubleClickZoom.enable();
      map.boxZoom.enable();
      map.dragPan.enable();
    } else if (state.drawMode === "point") {
      activate("draw_point");
    } else if (state.drawMode === "line") {
      activate("draw_line_string");
    } else if (state.drawMode === "polygon" || state.drawMode === "measure") {
      activate("draw_polygon");
    } else if (state.drawMode === "rectangle") {
      activate("draw_rectangle");
    }
  }, [state.drawMode, draw]);

  // Optimize onMouseMove to throttle updates via requestAnimationFrame
  const onMouseMove = useCallback(
    (ev: any) => {
      const { lng, lat } = ev.lngLat;
      const prev = hoverRef.current;
      const round5 = (n: number) => Math.round(n * 1e5) / 1e5;
      if (
        prev &&
        round5(prev.lng) === round5(lng) &&
        round5(prev.lat) === round5(lat)
      )
        return;
      hoverRef.current = { lng, lat };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        dispatch({ type: "SET_HOVER", lngLat: { lng, lat } });
      });
    },
    [dispatch]
  );

  // Combine layers & analysisResults as sources only when changed
  const sources = useMemo(
    () => [...state.analysisResults, ...state.layers],
    [state.analysisResults, state.layers]
  );

  // Cleanup on unmount: cancel animation frames & reset map controls
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const map = mapRef.current?.getMap();
      if (map) {
        map.doubleClickZoom.enable();
        map.boxZoom.enable();
        map.dragPan.enable();
        map.getCanvas().style.cursor = "";
      }
    };
  }, []);

  // Memoize time filter for point layers
  const pointTimeFilter: any = useMemo(() => {
    if (!state.timeFilter) return undefined;
    return [">=", ["get", "timestamp"], state.timeFilter];
  }, [state.timeFilter]);

  return (
    <div
      className={cn(
        "h-[calc(100svh-3.5rem-3rem)] w-full",
        "outline outline-1 outline-emerald-500/20 relative"
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-transparent z-[6]">
        <div
          ref={progRef}
          className="h-full w-0 bg-emerald-400"
        ></div>
      </div>

      <Map
        ref={mapRef}
        mapLib={maplibregl as any}
        initialViewState={state.viewport}
        onMoveEnd={(e) => {
          const v = e.viewState;
          const p = lastViewRef.current;
          const changed =
            Math.abs(v.longitude - p.longitude) > 1e-6 ||
            Math.abs(v.latitude - p.latitude) > 1e-6 ||
            Math.abs(v.zoom - p.zoom) > 1e-3 ||
            Math.abs(v.bearing - p.bearing) > 1e-3 ||
            Math.abs(v.pitch - p.pitch) > 1e-3;

          if (changed) {
            lastViewRef.current = {
              longitude: v.longitude,
              latitude: v.latitude,
              zoom: v.zoom,
              bearing: v.bearing,
              pitch: v.pitch,
            };
            dispatch({ type: "SET_VIEWPORT", viewport: lastViewRef.current });
          }
        }}
        mapStyle={style as any}
        onMouseMove={onMouseMove}
        onLoad={() => {
          const map = mapRef.current?.getMap();
          if (!map) return;
          const nav = new maplibregl.NavigationControl({ showCompass: true });
          map.addControl(nav, "top-right");
        }}
      >
        <DrawControl onReady={setDraw} />
        <NavigationControl position="bottom-right" />

        {sources.map((layer) => {
          const srcProps = layer.clustered
            ? { cluster: true as const, clusterRadius: 50 }
            : {};
          return (
            <Source
              key={layer.id}
              id={layer.id}
              type="geojson"
              data={layer.data as any}
              {...srcProps}
            />
          );
        })}

        {sources.map((layer) =>
          layer.clustered ? (
            <Fragment key={`${layer.id}-clustered`}>
              <Layer
                id={`${layer.id}-clusters`}
                type="circle"
                source={layer.id}
                filter={["has", "point_count"]}
                paint={{
                  "circle-color": [
                    "step",
                    ["get", "point_count"],
                    "#00d1b2",
                    50,
                    "#7c3aed",
                    200,
                    "#111827",
                  ],
                  "circle-radius": [
                    "step",
                    ["get", "point_count"],
                    18,
                    50,
                    26,
                    200,
                    36,
                  ],
                  "circle-opacity": layer.visible ? layer.opacity : 0,
                }}
              />
              <Layer
                id={`${layer.id}-cluster-count`}
                type="symbol"
                source={layer.id}
                filter={["has", "point_count"]}
                layout={{
                  "text-field": "{point_count_abbreviated}",
                  "text-size": 12,
                  "text-font": ["Open Sans Regular"],
                }}
                paint={{ "text-color": "#ffffff" }}
              />
              <Layer
                id={`${layer.id}-unclustered`}
                type="circle"
                source={layer.id}
                filter={[
                  "all",
                  ["!", ["has", "point_count"]],
                  ...(pointTimeFilter ? [pointTimeFilter] : []),
                ]}
                paint={{
                  "circle-color": "#22d3ee",
                  "circle-radius": 5,
                  "circle-opacity": layer.visible ? layer.opacity : 0,
                }}
              />
            </Fragment>
          ) : layer.heatmap ? (
            <Layer
              key={`${layer.id}-heat`}
              id={`${layer.id}-heat`}
              type="heatmap"
              source={layer.id}
              filter={pointTimeFilter}
              paint={{
                "heatmap-weight": [
                  "interpolate",
                  ["linear"],
                  ["get", "mag"],
                  0,
                  0,
                  6,
                  1,
                ],
                "heatmap-intensity": 1,
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(33,102,172,0)",
                  0.2,
                  "rgb(103,169,207)",
                  0.4,
                  "rgb(209,229,240)",
                  0.6,
                  "rgb(253,219,199)",
                  0.8,
                  "rgb(239,138,98)",
                  1,
                  "rgb(178,24,43)",
                ],
                "heatmap-radius": 25,
                "heatmap-opacity": layer.visible ? layer.opacity : 0,
              }}
            />
          ) : (
            <Fragment key={`${layer.id}-base`}>
              <Layer
                id={`${layer.id}-fill`}
                type="fill"
                source={layer.id}
                filter={[
                  "match",
                  ["geometry-type"],
                  ["Polygon", "MultiPolygon"],
                  true,
                  false,
                ]}
                paint={{
                  "fill-color": "#22c55e",
                  "fill-opacity": (layer.visible ? layer.opacity : 0) * 0.25,
                  "fill-outline-color": "#22c55e",
                }}
              />
              <Layer
                id={`${layer.id}-line`}
                type="line"
                source={layer.id}
                filter={[
                  "match",
                  ["geometry-type"],
                  ["LineString", "MultiLineString"],
                  true,
                  false,
                ]}
                paint={{
                  "line-color": "#a855f7",
                  "line-width": 2,
                  "line-opacity": layer.visible ? layer.opacity : 0,
                }}
              />
              <Layer
                id={`${layer.id}-point`}
                type="circle"
                source={layer.id}
                filter={[
                  "all",
                  [
                    "match",
                    ["geometry-type"],
                    ["Point", "MultiPoint"],
                    true,
                    false,
                  ],
                  ...(pointTimeFilter ? [pointTimeFilter] : []),
                ]}
                paint={{
                  "circle-color": "#06b6d4",
                  "circle-radius": 4,
                  "circle-opacity": layer.visible ? layer.opacity : 0,
                }}
              />
            </Fragment>
          )
        )}

        {pin && (
          <Marker
            longitude={pin.lng}
            latitude={pin.lat}
            anchor="bottom"
          >
            <div className="relative">
              <div className="h-3 w-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/30" />
              {pin.label && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded bg-black/70 text-white">
                  {pin.label}
                </div>
              )}
            </div>
          </Marker>
        )}

        <div
          id="measure-readout"
          className="absolute bottom-4 left-4 z-[5] px-2 py-1 rounded bg-black/70 text-emerald-300 text-xs font-mono pointer-events-none"
        ></div>
      </Map>
    </div>
  );
}
