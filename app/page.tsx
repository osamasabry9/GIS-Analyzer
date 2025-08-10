import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Feature from "@/components/home/Feature";
import {
  Map,
  Settings,
  Zap,
  MapIcon,
  ChartBarIcon,
  CloudUploadIcon,
} from "lucide-react";
import "../styles/animations.css";

const features = [
  {
    icon: <MapIcon className="h-12 w-12 text-blue-600" />,
    title: "Interactive Mapping",
    desc: "Visualize geospatial data on interactive maps with multiple base layer options.",
  },
  {
    icon: <ChartBarIcon className="h-12 w-12 text-purple-600" />,
    title: "Spatial Analysis",
    desc: "Perform buffer, intersection, and union operations with real-time results.",
  },
  {
    icon: <Zap className="h-12 w-12 text-green-600" />,
    title: "Drawing Tools",
    desc: "Create points, lines, and polygons directly on the map with intuitive drawing tools.",
  },
  {
    icon: <CloudUploadIcon className="h-12 w-12 text-orange-600" />,
    title: "Data Upload",
    desc: "Upload GeoJSON files with drag & drop support and instant data validation.",
  },
];

export default function Page() {
  return (
    <main className="min-h-[100svh] bg-[radial-gradient(1000px_600px_at_20%_10%,rgba(0,255,170,0.08),transparent),radial-gradient(800px_400px_at_80%_0%,rgba(140,0,255,0.08),transparent)]">
      <section className="container mx-auto px-6 py-16 md:py-24 fade-in-up">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16 fade-in-up delay-1">
          <div className="flex items-center gap-2 mb-6">
            <Badge className="bg-emerald-600/20 text-emerald-300 border-emerald-500/30">
              New
            </Badge>
            <span className="text-xs text-muted-foreground">
              Integrated Frontend GIS Analyzer
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-mono">
            Visualize, Draw, and Analyze Geospatial Data in Your Browser
          </h1>

          <p className="mt-4 max-w-2xl text-muted-foreground md:text-lg">
            Futuristic, modular, and blazing-fast geospatial frontend with
            drawing, analysis, heatmaps, clustering, and animated UI.
          </p>

          <div className="mt-8 flex gap-4">
            <Button
              asChild
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
            >
              <Link href="/map">
                <Map className="mr-2 h-5 w-5" />
                Launch Map
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-purple-500/40 hover:bg-purple-500/10 bg-transparent"
            >
              <Link href="/settings">
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <Feature
              key={i}
              {...f}
              index={i}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
