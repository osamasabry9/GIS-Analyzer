"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { useGIS } from "./gis-provider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MousePointer2,
  Circle,
  Ruler,
  Shapes,
  Pencil,
  Trash2,
  Square,
} from "lucide-react";
import { gsap } from "gsap";

export default function DrawToolbar() {
  const { state, dispatch } = useGIS();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        x: -20,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "m")
        dispatch({ type: "SET_DRAWMODE", mode: "measure" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]);

  const Item = ({
    mode,
    icon,
    label,
  }: {
    mode: typeof state.drawMode;
    icon: React.ReactNode;
    label: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={state.drawMode === mode ? "default" : "outline"}
          onClick={() => dispatch({ type: "SET_DRAWMODE", mode })}
          aria-label={label}
          className={`w-full ${
            state.drawMode === mode
              ? "bg-emerald-500 text-black hover:bg-emerald-400"
              : ""
          }`}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <aside
        ref={ref}
        className="rounded-xl border border-gray-300 p-4 bg-white/80 backdrop-blur-md shadow-md w-full max-w-full"
        aria-label="Drawing toolbar"
      >
        <h3 className="text-md font-semibold text-gray-900 mb-3">
          Drawing Tools
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <Item
            mode="select"
            icon={<MousePointer2 className="h-5 w-5" />}
            label="Select"
          />
          <Item
            mode="point"
            icon={<Circle className="h-5 w-5" />}
            label="Point"
          />
          <Item
            mode="line"
            icon={<Pencil className="h-5 w-5" />}
            label="Line"
          />
          <Item
            mode="polygon"
            icon={<Shapes className="h-5 w-5" />}
            label="Polygon"
          />
          <Item
            mode="rectangle"
            icon={<Square className="h-5 w-5" />}
            label="Rectangle"
          />
          <Item
            mode="measure"
            icon={<Ruler className="h-5 w-5" />}
            label="Measure (M)"
          />
          <Button
            variant="outline"
            aria-label="Clear drawings"
            onClick={() =>
              document.dispatchEvent(new CustomEvent("gis:clear-draw"))
            }
            className="col-span-3 w-full flex justify-center"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
