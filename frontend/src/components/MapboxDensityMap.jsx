import { useEffect, useMemo, useRef, useState } from "react";
import { Map, NavigationControl, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./MapboxDensityMap.css";

const CITY_COORDINATES = {
  Ahmedabad: [72.5714, 23.0225], Surat: [72.8311, 21.1702], Vadodara: [73.1812, 22.3072],
  Mumbai: [72.8777, 19.076], Pune: [73.8567, 18.5204], Nagpur: [79.0882, 21.1458],
  Bhopal: [77.4126, 23.2599], Indore: [75.8577, 22.7196], Jaipur: [75.7873, 26.9124],
  Udaipur: [73.7125, 24.5854], Jodhpur: [73.0243, 26.2389], Lucknow: [80.9462, 26.8467],
  Noida: [77.391, 28.5355], Ghaziabad: [77.4538, 28.6692], Hyderabad: [78.4867, 17.385],
  Warangal: [79.5941, 17.9689], Panaji: [73.8278, 15.4909], Margao: [73.958, 15.2832],
  Bengaluru: [77.5946, 12.9716], Mysuru: [76.6394, 12.2958], Mangaluru: [74.856, 12.9141],
  Daman: [72.8328, 20.3974], Diu: [70.9874, 20.7144],
};

const BASEMAP_STYLE = {
  version: 8,
  sources: { openStreetMap: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "&copy; OpenStreetMap contributors" } },
  layers: [{ id: "open-street-map", type: "raster", source: "openStreetMap" }],
};

function hashValue(value) {
  return [...String(value)].reduce((total, char) => ((total << 5) - total + char.charCodeAt(0)) | 0, 0);
}

function getCoordinates(row) {
  const longitude = Number(row.longitude ?? row.lng ?? row.lon);
  const latitude = Number(row.latitude ?? row.lat);
  if (Number.isFinite(longitude) && Number.isFinite(latitude)) return [longitude, latitude];
  const city = CITY_COORDINATES[row.city] ?? [78.9629, 22.5937];
  const hash = Math.abs(hashValue(row.id ?? row.name));
  const angle = ((hash % 360) * Math.PI) / 180;
  const distance = 0.025 + ((hash % 7) * 0.008);
  return [city[0] + Math.cos(angle) * distance, city[1] + Math.sin(angle) * distance];
}

function makeGeoJson(rows) {
  return {
    type: "FeatureCollection",
    features: rows.map((row) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: getCoordinates(row) },
      properties: { id: row.id ?? row.name, name: row.name ?? "Area", city: row.city ?? "Unknown city", state: row.state ?? "", score: Number(row.score ?? 0) },
    })),
  };
}

function createPopupNode(properties) {
  const node = document.createElement("div");
  node.className = "density-popup";
  const title = document.createElement("strong");
  title.textContent = properties.name;
  const location = document.createElement("span");
  location.textContent = [properties.city, properties.state].filter(Boolean).join(", ");
  const score = document.createElement("b");
  score.textContent = `${Number(properties.score).toFixed(1)} score`;
  node.append(title, location, score);
  return node;
}

export default function MapboxDensityMap({ rows = [], onSelect }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  const [mapError, setMapError] = useState("");
  const geoJson = useMemo(() => makeGeoJson(rows), [rows]);
  const geoJsonRef = useRef(geoJson);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;
    const map = new Map({
      container: mapContainerRef.current, style: BASEMAP_STYLE, center: [78.9629, 22.5937], zoom: 4.15, minZoom: 3.25, maxZoom: 14, attributionControl: true,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      readyRef.current = true;
      map.addSource("area-density", { type: "geojson", data: geoJsonRef.current });
      map.addLayer({
        id: "area-density-heat", type: "heatmap", source: "area-density", maxzoom: 11,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "score"], 40, 0.2, 100, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 4, 0.75, 9, 1.5],
          "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(15, 61, 46, 0)", 0.2, "#1f7a8c", 0.45, "#2fb7a0", 0.68, "#e3b44d", 0.9, "#c85d39"],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 4, 22, 8, 42, 11, 58],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 11, 0.2],
        },
      });
      map.addLayer({
        id: "area-density-points", type: "circle", source: "area-density", minzoom: 5,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "score"], 40, 5, 100, 12],
          "circle-color": ["interpolate", ["linear"], ["get", "score"], 45, "#1d607a", 65, "#2ca58d", 80, "#d39d37", 95, "#b84b38"],
          "circle-stroke-color": "rgba(255, 255, 255, 0.9)", "circle-stroke-width": 1.25, "circle-opacity": 0.95,
        },
      });
      map.on("mouseenter", "area-density-points", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "area-density-points", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "area-density-points", (event) => {
        const feature = event.features?.[0];
        if (!feature?.geometry || feature.geometry.type !== "Point") return;
        const properties = feature.properties;
        new Popup({ closeButton: false, offset: 12 })
          .setLngLat([...feature.geometry.coordinates])
          .setDOMContent(createPopupNode(properties))
          .addTo(map);
        onSelectRef.current?.(properties);
      });
    });
    map.on("error", (event) => {
      if (!event.error?.message?.includes("source")) setMapError("The basemap could not be loaded. Area-density points remain available when the connection is restored.");
    });
    return () => { readyRef.current = false; map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    geoJsonRef.current = geoJson;
    const source = readyRef.current ? mapRef.current?.getSource("area-density") : null;
    if (source) source.setData(geoJson);
  }, [geoJson]);

  return (
    <div className="density-map-wrap">
      <div className="density-map" ref={mapContainerRef} aria-label="Area score density map of India" />
      <div className="density-map-legend" aria-label="Capital allocation score legend"><span>Lower signal</span><div className="density-map-ramp" /><span>Higher signal</span></div>
      {mapError && <p className="density-map-error" role="status">{mapError}</p>}
    </div>
  );
}
