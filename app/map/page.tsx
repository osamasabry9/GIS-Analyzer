"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { GISProvider } from "@/components/gis/gis-provider";
import MapContainer from "@/components/gis/map-container";
import BasemapQuick from "@/components/gis/basemap-quick";
import CoordinateDisplay from "@/components/gis/coordinate-display";
import TimeSlider from "@/components/gis/time-slider";
import SearchBox from "@/components/gis/search-box";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelRight } from "lucide-react";
import Spinner from "@/components/ui/spinner";

const DrawToolbar = dynamic(() => import("@/components/gis/draw-toolbar"), {
  ssr: false,
});
const UploadPanel = dynamic(() => import("@/components/gis/upload-panel"), {
  ssr: false,
  loading: () => <Spinner />,
});
const LayersPanel = dynamic(() => import("@/components/gis/layers-panel"), {
  ssr: false,
});
const AnalysisPanel = dynamic(() => import("@/components/gis/analysis-panel"), {
  ssr: false,
  loading: () => <Spinner />,
});

export default function MapPage() {
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);

  return (
    <GISProvider>
      <div className="flex min-h-[100svh] flex-col">
        <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-[360px_1fr_360px]">
          <aside
            className={`border-r bg-background/80 backdrop-blur ${
              showLeft ? "block" : "hidden"
            } lg:block`}
          >
            <div className="h-full overflow-auto p-3 space-y-6">
              <SearchBox />
              <DrawToolbar />
              {showLeft && <UploadPanel />}
              <LayersPanel />
            </div>
          </aside>
          <section className="relative">
            <MapContainer />
            <CoordinateDisplay />
            <BasemapQuick />
            <TimeSlider />
            <div className="absolute top-3 right-3 z-[5] flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowLeft((s) => !s)}
                aria-label="Toggle left panel"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowRight((s) => !s)}
                aria-label="Toggle right panel"
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
          <aside
            className={`border-l bg-background/80 backdrop-blur ${
              showRight ? "block" : "hidden"
            } lg:block`}
          >
            <div className="h-full overflow-auto p-3 space-y-3">
              {showRight && <AnalysisPanel />}
            </div>
          </aside>
        </div>
      </div>
    </GISProvider>
  );
}
