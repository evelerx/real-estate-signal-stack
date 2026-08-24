import { useEffect, useMemo, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, NavigationControl, Popup } from "maplibre-gl";
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

const INDIA_STATES_GEOJSON_URL = "/india-states.geojson";
const EMPTY_GEOJSON = { type: "FeatureCollection", features: [] };
const INDIA_BOUNDS = [[67.5, 6], [98.5, 37.5]];

const STATE_ALIASES = {
  "andaman and nicobar": "andaman and nicobar islands",
  "dadra and nagar haveli": "dadra and nagar haveli and daman and diu",
  "daman and diu": "dadra and nagar haveli and daman and diu",
  "jammu and kashmir": "jammu and kashmir",
  "nct of delhi": "delhi",
  orissa: "odisha",
  pondicherry: "puducherry",
};

function normaliseStateName(value) {
  const normalised = String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return STATE_ALIASES[normalised] ?? normalised;
}

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
      properties: { id: row.id ?? row.name, name: row.name ?? "Area", city: row.city ?? "Unknown city", state: row.state ?? "", score: Number(row.score ?? 0), dataSource: row.data_source ?? "model_baseline", updatedAt: row.updated_at ?? "" },
    })),
  };
}

function getGeometryCenter(geometry) {
  if (!geometry?.coordinates) return null;
  let minLongitude = Infinity;
  let maxLongitude = -Infinity;
  let minLatitude = Infinity;
  let maxLatitude = -Infinity;

  const visit = (coordinates) => {
    if (!Array.isArray(coordinates)) return;
    if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
      const [longitude, latitude] = coordinates;
      minLongitude = Math.min(minLongitude, longitude);
      maxLongitude = Math.max(maxLongitude, longitude);
      minLatitude = Math.min(minLatitude, latitude);
      maxLatitude = Math.max(maxLatitude, latitude);
      return;
    }
    coordinates.forEach(visit);
  };

  visit(geometry.coordinates);
  if (!Number.isFinite(minLongitude) || !Number.isFinite(minLatitude)) return null;
  return [(minLongitude + maxLongitude) / 2, (minLatitude + maxLatitude) / 2];
}

function estimateSpatialScore(center, samples, fallbackScore) {
  if (!center || !samples.length) return fallbackScore;
  let weightedTotal = 0;
  let totalWeight = 0;
  samples.forEach(({ coordinates, score }) => {
    const averageLatitude = ((center[1] + coordinates[1]) / 2) * (Math.PI / 180);
    const longitudeDistance = (coordinates[0] - center[0]) * Math.cos(averageLatitude);
    const latitudeDistance = coordinates[1] - center[1];
    const distance = Math.sqrt((longitudeDistance ** 2) + (latitudeDistance ** 2));
    const weight = 1 / Math.max(distance, 0.35) ** 1.35;
    weightedTotal += score * weight;
    totalWeight += weight;
  });
  return totalWeight ? weightedTotal / totalWeight : fallbackScore;
}

function scoreToColor(score) {
  const stops = [
    [40, [29, 96, 122]],
    [58, [44, 165, 141]],
    [72, [211, 157, 55]],
    [90, [184, 75, 56]],
  ];
  const clamped = Math.max(stops[0][0], Math.min(stops.at(-1)[0], Number(score) || 0));
  const upperIndex = stops.findIndex(([stop]) => stop >= clamped);
  const [lowerScore, lowerColor] = stops[Math.max(0, upperIndex - 1)];
  const [upperScore, upperColor] = stops[Math.max(0, upperIndex)];
  const position = upperScore === lowerScore ? 0 : (clamped - lowerScore) / (upperScore - lowerScore);
  const color = lowerColor.map((value, index) => Math.round(value + ((upperColor[index] - value) * position)));
  return `rgb(${color.join(",")})`;
}

function fitIndia(map) {
  map.fitBounds(INDIA_BOUNDS, {
    padding: { top: 36, right: 42, bottom: 68, left: 42 },
    duration: 0,
    maxZoom: 4.65,
  });
}

function makeStateGeoJson(boundaries, rows) {
  if (!boundaries?.features) return EMPTY_GEOJSON;

  const scoreTotals = new globalThis.Map();
  rows.forEach((row) => {
    const state = normaliseStateName(row.state);
    const score = Number(row.score);
    if (!state || !Number.isFinite(score)) return;
    const current = scoreTotals.get(state) ?? { total: 0, count: 0 };
    scoreTotals.set(state, { total: current.total + score, count: current.count + 1 });
  });

  const marketSamples = rows
    .map((row) => ({ coordinates: getCoordinates(row), score: Number(row.score) }))
    .filter((sample) => Number.isFinite(sample.score));
  const nationalBaseline = marketSamples.length
    ? marketSamples.reduce((total, sample) => total + sample.score, 0) / marketSamples.length
    : 65;

  return {
    type: "FeatureCollection",
    features: boundaries.features.map((feature) => {
      const stateName = feature.properties?.ST_NM ?? feature.properties?.State_Name ?? "Unknown state";
      const matchingScore = scoreTotals.get(normaliseStateName(stateName));
      const hasDirectScore = Boolean(matchingScore);
      const score = hasDirectScore
        ? matchingScore.total / matchingScore.count
        : estimateSpatialScore(getGeometryCenter(feature.geometry), marketSamples, nationalBaseline);
      return {
        ...feature,
        properties: {
          ...feature.properties,
          stateName,
          score: Number(score.toFixed(1)),
          stateColor: scoreToColor(score),
          scoreCoverage: hasDirectScore ? "direct local-market average" : "spatial estimate from nearby market signals",
          hasDirectScore,
        },
      };
    }),
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
  const source = document.createElement("small");
  source.textContent = properties.dataSource === "live_provider" ? "Live provider data" : "Model baseline";
  node.append(title, location, score, source);
  return node;
}

function createStatePopupNode(properties) {
  const node = document.createElement("div");
  node.className = "density-popup";
  const title = document.createElement("strong");
  title.textContent = properties.stateName;
  const score = document.createElement("b");
  score.textContent = `${Number(properties.score).toFixed(1)} state signal`;
  const source = document.createElement("small");
  source.textContent = properties.scoreCoverage;
  node.append(title, score, source);
  return node;
}

function markerColor(score) {
  if (score >= 85) return "#b84b38";
  if (score >= 72) return "#d39d37";
  if (score >= 58) return "#2ca58d";
  return "#1d607a";
}

function refreshDensityMarkers(map, collection, markersRef, onSelectRef) {
  markersRef.current.forEach((marker) => marker.remove());
  markersRef.current = collection.features.map((feature) => {
    const element = document.createElement("div");
    const score = Number(feature.properties.score || 0);
    const size = Math.max(8, Math.min(18, 7 + score / 9));
    element.className = "density-map-marker";
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.backgroundColor = markerColor(score);
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", `${feature.properties.name}: ${score.toFixed(1)} score`);
    element.addEventListener("click", () => {
      new Popup({ closeButton: false, offset: 12 })
        .setLngLat([...feature.geometry.coordinates])
        .setDOMContent(createPopupNode(feature.properties))
        .addTo(map);
      onSelectRef.current?.(feature.properties);
    });
    return new Marker({ element, anchor: "center" }).setLngLat([...feature.geometry.coordinates]).addTo(map);
  });
}

export default function MapboxDensityMap({ rows = [], onSelect }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  const markersRef = useRef([]);
  const hasFittedStateViewRef = useRef(false);
  const [mapError, setMapError] = useState("");
  const [stateBoundaries, setStateBoundaries] = useState(null);
  const geoJson = useMemo(() => makeGeoJson(rows), [rows]);
  const stateGeoJson = useMemo(() => makeStateGeoJson(stateBoundaries, rows), [stateBoundaries, rows]);
  const geoJsonRef = useRef(geoJson);
  const stateGeoJsonRef = useRef(stateGeoJson);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    let cancelled = false;
    fetch(INDIA_STATES_GEOJSON_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Boundary request failed (${response.status})`);
        return response.json();
      })
      .then((data) => { if (!cancelled) setStateBoundaries(data); })
      .catch(() => {
        if (!cancelled) setMapError("State boundaries could not be loaded. The micro-market density layer is still available.");
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;
    const map = new MapLibreMap({
      container: mapContainerRef.current, style: BASEMAP_STYLE, center: [78.9629, 22.5937], zoom: 4.15, minZoom: 3.25, maxZoom: 14, attributionControl: true,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      readyRef.current = true;
      map.addSource("state-density", { type: "geojson", data: stateGeoJsonRef.current });
      map.addLayer({
        id: "state-density-fill", type: "fill", source: "state-density",
        paint: {
          "fill-color": ["get", "stateColor"],
          "fill-opacity": 0.66,
        },
      });
      map.addLayer({
        id: "state-density-outline", type: "line", source: "state-density",
        paint: { "line-color": "rgba(16, 55, 68, 0.72)", "line-width": 1.15, "line-opacity": 0.86 },
      });
      map.addSource("area-density", { type: "geojson", data: geoJsonRef.current });
      map.addLayer({
        id: "area-density-heat", type: "heatmap", source: "area-density", maxzoom: 11,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "score"], 40, 0.2, 100, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 4, 0.75, 9, 1.5],
          "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(15, 61, 46, 0)", 0.2, "#1f7a8c", 0.45, "#2fb7a0", 0.68, "#e3b44d", 0.9, "#c85d39"],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3.25, 54, 6, 48, 11, 58],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 11, 0.2],
        },
      });
      map.addLayer({
        id: "area-density-points", type: "circle", source: "area-density", minzoom: 3.25,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "score"], 40, 7, 100, 15],
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
      map.on("mouseenter", "state-density-fill", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "state-density-fill", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "state-density-fill", (event) => {
        const feature = event.features?.[0];
        if (!feature?.properties) return;
        new Popup({ closeButton: false, offset: 8 })
          .setLngLat(event.lngLat)
          .setDOMContent(createStatePopupNode(feature.properties))
          .addTo(map);
      });
      if (stateGeoJsonRef.current.features.length && !hasFittedStateViewRef.current) {
        fitIndia(map);
        hasFittedStateViewRef.current = true;
      }
      refreshDensityMarkers(map, geoJsonRef.current, markersRef, onSelectRef);
    });
    map.on("error", (event) => {
      const message = event.error?.message;
      if (message) setMapError(`Map layer error: ${message}`);
    });
    return () => { readyRef.current = false; hasFittedStateViewRef.current = false; markersRef.current.forEach((marker) => marker.remove()); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    geoJsonRef.current = geoJson;
    const source = readyRef.current ? mapRef.current?.getSource("area-density") : null;
    if (source) {
      source.setData(geoJson);
      refreshDensityMarkers(mapRef.current, geoJson, markersRef, onSelectRef);
      mapRef.current.triggerRepaint();
    }
  }, [geoJson]);

  useEffect(() => {
    stateGeoJsonRef.current = stateGeoJson;
    const source = readyRef.current ? mapRef.current?.getSource("state-density") : null;
    if (source) {
      source.setData(stateGeoJson);
      if (stateGeoJson.features.length && !hasFittedStateViewRef.current) {
        fitIndia(mapRef.current);
        hasFittedStateViewRef.current = true;
      }
      mapRef.current.triggerRepaint();
    }
  }, [stateGeoJson]);

  return (
    <div className="density-map-wrap">
      <div className="density-map" ref={mapContainerRef} aria-label="Area score density map of India" />
      <div className="density-map-legend" aria-label="State investment signal legend"><span>Lower signal</span><div className="density-map-ramp" /><span>Higher signal</span></div>
      {mapError && <p className="density-map-error" role="status">{mapError}</p>}
    </div>
  );
}
