import { useEffect, useState } from "react";
import GeoHeatmap from "../components/GeoHeatmap";
import { fetchAreaHeatmap } from "../services/heatmapService";

import geoData from "../assets/pune.geo.json"; // adjust path if needed

export default function Heatmap() {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    fetchAreaHeatmap({ city: "Pune" })
      .then(setScores)
      .catch(console.error);
  }, []);

  return <GeoHeatmap geoData={geoData} scores={scores} />;
}
