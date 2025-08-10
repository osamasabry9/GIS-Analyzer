export type Basemap = {
  id: string
  name: string
  dark?: boolean
  thumbnail: string
}


const GLYPHS_URL =
  process.env.NEXT_PUBLIC_MAPLIBRE_GLYPHS || "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf"

const OSM_TILE = process.env.NEXT_PUBLIC_OSM_TILES || "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const OPENTOPO_TILES = process.env.NEXT_PUBLIC_OPENTOPO_TILES?.split(",") || [
  "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
  "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
  "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
]
const ESRI_WORLD_IMAGERY =
  process.env.NEXT_PUBLIC_ESRI_WORLD_IMAGERY ||
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

export const basemaps: Basemap[] = [
  { id: "osm-light", name: "OSM Light", thumbnail: "/osm-streets-light-basemap-thumbnail.png" },
  { id: "osm-dark", name: "OSM Dark", dark: true, thumbnail: "/osm-dark-basemap-thumbnail.png" },
  { id: "terrain", name: "Terrain", thumbnail: "/terrain-raster-basemap-thumbnail.png" },
  { id: "satellite", name: "Satellite", thumbnail: "/placeholder-zrgvl.png" },
]

export function getBasemapStyle(id: string, isDark: boolean) {
  if (id === "satellite") {
    return {
      version: 8,
      glyphs: GLYPHS_URL,
      sources: {
        esri: {
          type: "raster",
          tiles: [ESRI_WORLD_IMAGERY],
          tileSize: 256,
          attribution:
            "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        },
      },
      layers: [{ id: "esri", type: "raster", source: "esri" }],
    } as const
  }

  if (id === "terrain") {
    return {
      version: 8,
      glyphs: GLYPHS_URL,
      sources: {
        opentopo: {
          type: "raster",
          tiles: OPENTOPO_TILES,
          tileSize: 256,
          attribution: "© OpenTopoMap contributors",
        },
      },
      layers: [{ id: "opentopo", type: "raster", source: "opentopo" }],
    } as const
  }

  if (id === "osm-dark" || (isDark && id === "osm-light")) {
    return {
      version: 8,
      glyphs: GLYPHS_URL,
      sources: {
        osm: {
          type: "raster",
          tiles: [OSM_TILE],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors",
        },
      },
      layers: [
        { id: "bg", type: "background", paint: { "background-color": "#0b0f14" } },
        {
          id: "osm",
          type: "raster",
          source: "osm",
          paint: {
            "raster-brightness-max": 0.8,
            "raster-saturation": -1,
            "raster-contrast": 0.2,
            "raster-opacity": 0.8,
          },
        },
      ],
    } as const
  }

  return {
    version: 8,
    glyphs: GLYPHS_URL,
    sources: {
      osm: {
        type: "raster",
        tiles: [OSM_TILE],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  } as const
}
