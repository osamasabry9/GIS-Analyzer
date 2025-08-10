"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useGIS } from "./gis-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FeatureCollection } from "geojson";
import { nanoid } from "nanoid";
import { gsap } from "gsap";
import {
  Loader2,
  Scissors,
  Combine,
  CrossIcon as Intersect,
  CircleDashed,
  Eraser,
} from "lucide-react";
import * as turf from "@turf/turf";
import { getSpatialService, proxy } from "@/lib/spatial-worker-client";
import { saveAs } from "file-saver";

type Op =
  | "buffer"
  | "intersection"
  | "union"
  | "clip"
  | "difference"
  | "simplify"
  | "pip";

const withTimeout = <T,>(
  p: Promise<T>,
  ms: number,
  label = "operation"
): Promise<T> =>
  Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(`${label} timed out. Worker may have failed to load.`)
          ),
        ms
      )
    ),
  ]);

// ---- Helper functions (stable, outside component) ----
const requiresBMap: Record<Op, boolean> = {
  buffer: false,
  simplify: false,
  intersection: true,
  union: true,
  clip: true,
  difference: true,
  pip: true,
};

const opMethodMap: Record<Op, string> = {
  buffer: "buffer",
  simplify: "simplify",
  pip: "pointInPolygon",
  intersection: "intersection",
  union: "union",
  clip: "clip",
  difference: "difference",
};

const uniqueName = (base: string, usedNames: string[]) => {
  const used = new Set(usedNames);
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base} #${i}`)) i++;
  return `${base} #${i}`;
};

export default function AnalysisPanel() {
  const { state, dispatch } = useGIS();
  const [op, setOp] = useState<Op>("buffer");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [distance, setDistance] = useState(5);
  const [units, setUnits] = useState<"meters" | "kilometers" | "miles">(
    "kilometers"
  );
  const [tolerance, setTolerance] = useState(0.001);
  const [resultName, setResultName] = useState("");
  const [loading, setLoading] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  // Cleanup mount state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const options = useMemo(
    () => [...state.layers, ...state.analysisResults],
    [state.layers, state.analysisResults]
  );
  const drawn = options.find((l) => l.name === "Drawn Features")?.id;

  // Default A to drawn features
  useEffect(() => {
    if (!a && drawn) setA(drawn);
  }, [a, drawn]);

  // Entry animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        x: 20,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    });
    return () => ctx.revert();
  }, []);

  const getNameById = useCallback(
    (id?: string) => options.find((l) => l.id === id)?.name || "—",
    [options]
  );

  const defaultName = useMemo(() => {
    const na = getNameById(a || drawn);
    const nb = getNameById(b);
    const symbols: Record<Op, string> = {
      buffer: `buffer(${na})`,
      union: `union(${na} ⊕ ${nb})`,
      intersection: `intersection(${na} ∩ ${nb})`,
      clip: `clip(${na} ⊗ ${nb})`,
      difference: `difference(${na} − ${nb})`,
      simplify: `simplify(${na})`,
      pip: `points-in-polygon(${na} ∈ ${nb})`,
    };
    return symbols[op] || "result";
  }, [op, a, b, drawn, getNameById]);

  const requiresB = requiresBMap[op];
  const canRun = Boolean((a || drawn) && (!requiresB || b));

  const results = useMemo(
    () => state.analysisResults.flatMap((l) => l.data.features),
    [state.analysisResults]
  );

  const exportResults = useCallback(() => {
    if (!results.length) return alert("No analysis results to export.");
    const geojson = { type: "FeatureCollection" as const, features: results };
    saveAs(
      new Blob([JSON.stringify(geojson, null, 2)], {
        type: "application/json",
      }),
      `analysis-results-${Date.now()}.geojson`
    );
  }, [results]);

  const handleProgress = useCallback((p: number) => {
    if (!mountedRef.current || !barRef.current) return;
    gsap.to(barRef.current, {
      width: `${p}%`,
      duration: 0.2,
      ease: "power1.out",
    });
  }, []);

  const run = async () => {
    const layerA = options.find((l) => l.id === (a || drawn || ""));
    const layerB = options.find((l) => l.id === b);
    if (!layerA) return alert("Select Input A (or draw something).");
    if (requiresB && !layerB) return alert("Select Input B");

    setLoading(true);
    try {
      if (barRef.current) gsap.set(barRef.current, { width: "0%" });

      const { api, mode } = await getSpatialService();
      const progressCb =
        mode === "worker" ? (proxy(handleProgress) as any) : handleProgress;
      const runWithPolicy = (label: string, task: Promise<FeatureCollection>) =>
        mode === "worker" ? withTimeout(task, 45000, label) : task;

      const method = opMethodMap[op];
      const args =
        op === "buffer"
          ? [layerA.data, distance, units, progressCb]
          : op === "simplify"
          ? [layerA.data, tolerance, false, progressCb]
          : [layerA.data, layerB!.data, progressCb];

      const result: FeatureCollection = await runWithPolicy(
        op,
        (api as any)[method](...args)
      );

      if (!result?.features.length)
        return alert(
          "No result features. Ensure inputs overlap and are compatible."
        );

      try {
        document.dispatchEvent(
          new CustomEvent("gis:fit", { detail: { bbox: turf.bbox(result) } })
        );
      } catch {}

      const finalName = uniqueName(
        (resultName.trim() || defaultName).replace(/\s+/g, " "),
        options.map((l) => l.name)
      );
      dispatch({
        type: "ADD_RESULT",
        layer: {
          id: `result-${nanoid(5)}`,
          name: finalName,
          data: result,
          visible: true,
          opacity: 1,
        },
      });

      setResultName("");
      if (barRef.current)
        gsap.to(barRef.current, {
          width: "100%",
          duration: 0.2,
          ease: "power1.out",
        });
    } catch (e: any) {
      console.error(e);
      alert(`Analysis error: ${e?.message || e}`);
    } finally {
      setLoading(false);
      setTimeout(
        () => barRef.current && gsap.set(barRef.current, { width: "0%" }),
        600
      );
    }
  };

  return (
    <div
      ref={ref}
      className="rounded-xl border p-3 bg-background/60 backdrop-blur"
    >
      <div className="text-xs text-muted-foreground mb-2">Spatial Analysis</div>
      <div className="relative mb-2 h-1 bg-muted rounded overflow-hidden">
        <div
          ref={barRef}
          className="h-full w-0 bg-purple-400"
        />
      </div>

      <div className="grid gap-3">
        {/* Operation */}
        <div className="grid gap-2">
          <Label>Operation</Label>
          <Select
            value={op}
            onValueChange={(v: Op) => setOp(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select operation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buffer">Buffer</SelectItem>
              <SelectItem value="intersection">Intersection</SelectItem>
              <SelectItem value="union">Union</SelectItem>
              <SelectItem value="clip">Clip</SelectItem>
              <SelectItem value="difference">Difference</SelectItem>
              <SelectItem value="simplify">Simplify</SelectItem>
              <SelectItem value="pip">Point in Polygon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Input A */}
        <div className="grid gap-2">
          <Label>Input A</Label>
          <Select
            value={a}
            onValueChange={setA}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select layer" />
            </SelectTrigger>
            <SelectContent>
              {options.map((l) => (
                <SelectItem
                  key={l.id}
                  value={l.id}
                >
                  {l.name} · {l.id.slice(0, 6)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input B */}
        {requiresB && (
          <div className="grid gap-2">
            <Label>Input B</Label>
            <Select
              value={b}
              onValueChange={setB}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select layer" />
              </SelectTrigger>
              <SelectContent>
                {options.map((l) => (
                  <SelectItem
                    key={l.id}
                    value={l.id}
                  >
                    {l.name} · {l.id.slice(0, 6)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Buffer options */}
        {op === "buffer" && (
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label>Distance</Label>
              <Input
                type="number"
                value={distance}
                min={0}
                onChange={(e) => setDistance(Number(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Units</Label>
              <Select
                value={units}
                onValueChange={(v: any) => setUnits(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meters">meters</SelectItem>
                  <SelectItem value="kilometers">kilometers</SelectItem>
                  <SelectItem value="miles">miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Simplify option */}
        {op === "simplify" && (
          <div className="grid gap-2">
            <Label>Tolerance</Label>
            <Input
              type="number"
              step="0.0001"
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value) || 0)}
            />
          </div>
        )}

        {/* Result name */}
        <div className="grid gap-2">
          <Label>Result name</Label>
          <Input
            placeholder={defaultName}
            value={resultName}
            onChange={(e) => setResultName(e.target.value)}
          />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={run}
            disabled={loading || !canRun}
            className="bg-purple-500 hover:bg-purple-400 text-white disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : op === "buffer" ? (
              <CircleDashed className="mr-2 h-4 w-4" />
            ) : op === "clip" ? (
              <Scissors className="mr-2 h-4 w-4" />
            ) : op === "union" ? (
              <Combine className="mr-2 h-4 w-4" />
            ) : op === "difference" ? (
              <Eraser className="mr-2 h-4 w-4" />
            ) : (
              <Intersect className="mr-2 h-4 w-4" />
            )}
            Run
          </Button>
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "CLEAR_RESULTS" })}
          >
            Clear Results
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={exportResults}
          disabled={!results.length}
        >
          Export Results
        </Button>
      </div>
    </div>
  );
}
