
# GIS Analyzer


**GIS Analyzer** is a cutting-edge, client-only Geographic Information System (GIS) web application built with **Next.js** and **TypeScript**. It empowers users to upload, visualize, draw, and perform sophisticated spatial analysis on geospatial data—all directly in the browser without any backend server.

### Key Highlights:
- **Data Upload:** Support for GeoJSON and zipped Shapefiles, enabling seamless import of custom spatial datasets.
- **Interactive Drawing:** Tools for creating points, lines, polygons, rectangles, and measurements using **Mapbox GL Draw**.
- **Advanced Spatial Analysis:** Powered by **Turf.js** and run within a **Comlink Web Worker** for smooth, off-main-thread processing of complex geospatial operations like buffering, clipping, and union.
- **Responsive UI:** Lazy loading of heavy components, cooperative yielding during long tasks, and automatic worker fallbacks ensure a fluid user experience even with large datasets.
- **Flexible Layer & Basemap Management:** Toggle layer visibility, adjust opacity, and switch between normal, heatmap, and cluster styles, plus multiple configurable basemaps (OSM, Terrain, Satellite).
- **Geocoding & Search:** Integrated **Photon geocoder** with fly-to animations and marker drop.
- **Smooth Animations:** UI polished with **GSAP** for professional-grade, performant visual effects.

### Technologies Used:
- **Next.js** (React framework for scalable web apps)
- **TypeScript** (type-safe JavaScript)
- **MapLibre GL** (open-source interactive maps)
- **Turf.js** (geospatial analysis library)
- **Comlink** (simplifies web worker communication)
- **GSAP** (animation library)
- **Mapbox GL Draw** (drawing tools on maps)

---

## 🚀 Current Features
- **Data Upload**
  - Upload GeoJSON and zipped Shapefile (`.zip` via shpjs).
- **Drawing Tools**
  - Point, Line, Polygon, Rectangle, and Measure overlay via Mapbox GL Draw.
- **Spatial Analysis**
  - Buffer, Intersection, Union, Clip, Difference, Simplify, Point-in-Polygon.
  - Geometry cleaning + containment fallbacks to reduce null results.
  - Worker “ping” health check with automatic inline fallback if worker is unavailable.
  - Animated progress bar with cooperative yielding for long jobs.
- **Layer Management**
  - Visibility, opacity, and style modes (normal | heatmap | cluster).
- **Additional Tools**
  - Time filter overlay.
  - Photon geocoding search with fly-to and marker drop.
  - Basemap switcher (OSM / Terrain / Satellite) with quick cycler.
- **Performance**
  - Fully client-side. Large datasets processed with yielding to keep UI responsive.
 

## Features with Screenshots


### 1. Home Screen

<img src="/screenshots/0_home.PNG" alt="Home Screen" width="900" />

The main landing page introduces GIS Analyzer’s core capabilities with a clean, user-friendly interface. Quick access buttons guide users to the Map viewer or Settings panel.

---

### 2. Interactive Map with Drawing Tools

<img src="/screenshots/3_map_point.PNG" alt="Map with Drawing Point" width="900" />

Draw precise points on the map, marking exact locations of interest with easy-to-use controls.

<img src="/screenshots/4_map_polygon.PNG" alt="Map with Polygon Drawing" width="900" />

Create complex polygon shapes to outline areas for detailed spatial analysis, such as land plots or zones.

---

### 3. Searching & Geocoding

<img src="/screenshots/2_map_search.PNG" alt="Map Search" width="900" />

Search locations globally using the Photon geocoder. The map flies smoothly to the result and drops a marker for quick identification.

---

### 4. Data Upload

<img src="/screenshots/5_map_upload.PNG" alt="Data Upload" width="900" />

Upload your own GeoJSON files or zipped Shapefiles to visualize and analyze your custom geospatial datasets instantly.

---

### 5. Spatial Analysis Tools

<img src="/screenshots/6_map_clip.PNG" alt="Map Clip" width="900" />

Use polygon clipping and difference operations to extract or exclude overlapping spatial areas precisely.

<img src="/screenshots/8_map_buffer.PNG" alt="Buffer Analysis" width="900" />

Create buffer zones around features to assess proximity, influence areas, or safety margins effectively.

---

### 6. Basemap and Style Switching

<img src="/screenshots/7_map_style.PNG" alt="Map Style Switching" width="900" />

Easily switch between multiple basemap styles such as OpenStreetMap, Terrain, and Satellite imagery to suit your visualization needs.

---

### 7. Settings Panel

<img src="/screenshots/9_setting.PNG" alt="Settings Panel" width="900" />

Customize application preferences and configure environment variables for tile servers and geocoding services.

---

## 📂 Project Structure (selected)

```

app/
  page.tsx                  # Landing page (Server Component)
  map/
    page.tsx                # Client-side map page with lazy-loaded panels
  settings/
    page.tsx                 # Settings page

components/
  header.tsx
  footer.tsx
  home/
    Feature.tsx
  gis/
    gis-provider.tsx         # Global GIS state provider
    map-container.tsx        # MapLibre map wrapper
    coordinate-display.tsx   # Mouse coordinates readout
    basemap-switcher.tsx     # Full basemap picker
    basemap-quick.tsx        # Quick basemap cycler
    draw-control.tsx         # Mapbox GL Draw integration
    draw-toolbar.tsx         # Drawing tool UI
    layers-panel.tsx         # Layer visibility/style controls
    upload-panel.tsx         # GeoJSON/Shapefile upload
    analysis-panel.tsx       # Spatial operations UI
    search-box.tsx           # Photon geocoding search
    time-slider.tsx          # Temporal filtering UI

lib/
  basemaps.ts                # Basemap config (env-driven)
  geo.ts                     # Data sanitization / cleaning
  geom-utils.ts              # Shared geometry helpers
  settings.ts
  spatial-fallback.ts        # Geometry fallback handlers
  spatial-worker-client.ts   # Worker communication

workers/
  spatial-worker.ts          # Comlink worker for Turf.js ops

public/
  data/
    sample-points.geojson
    sample-polygon.geojson
  basemap-thumbnails/        # Static preview images for basemaps

styles/
  animations.css             # Custom animations
  globals.css


````

---

## ⚙️ Setup

### Local Development

```bash
# Install dependencies
pnpm install   # or npm install

# Start dev server
pnpm dev       # or npm run dev

# Open in browser
# Navigate to http://localhost:3000/map
````

---

## 🌐 Environment Variables (optional)

| Variable                         | Default                                                       | Description     |
| -------------------------------- | ------------------------------------------------------------- | --------------- |
| `NEXT_PUBLIC_MAPLIBRE_GLYPHS`    | `https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf` | Glyphs endpoint |
| `NEXT_PUBLIC_OSM_TILES`          | `https://tile.openstreetmap.org/{z}/{x}/{y}.png`              | OSM tiles       |
| `NEXT_PUBLIC_OPENTOPO_TILES`     | Multiple OpenTopo URLs                                        | Terrain tiles   |
| `NEXT_PUBLIC_ESRI_WORLD_IMAGERY` | ESRI World Imagery URL                                        | Satellite tiles |
| `NEXT_PUBLIC_GEOCODER_URL`       | `https://photon.komoot.io/api/`                               | Geocoder API    |

> **Note:** These are read **client-side** (`NEXT_PUBLIC_*`) per Next.js rules. If not set, defaults are used.

---

## 🚀 Deployment & Live Demo

- **Live Demo:** [https://gis-analyzer.vercel.app/](https://gis-analyzer.vercel.app/)
- **Deployment Target:** Vercel as a static, client-only application
- **No Server Secrets:** The app relies solely on public OGC/tile service endpoints, eliminating the need for backend credentials or secrets
- **Architecture:** Built with Next.js following the latest **App Router** conventions, ensuring modern routing and optimized performance

---

## 📈 Performance Notes

* Heavy UI panels are **lazy-loaded** via `next/dynamic`
* Web Worker for spatial ops when available
* Inline fallback with microtask yielding keeps UI responsive
* Debounced & abortable geocoding requests
* Shared geometry helpers for better tree-shaking

---

## 🛠 Development Notes

* Code style: **ESLint + Prettier**
* Prefer pure utilities & typed imports
* Avoid `require` in client code

---

## 📜 License

MIT — free to use, modify, and distribute.


