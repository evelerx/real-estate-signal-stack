import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function GeoHeatmap({ geoData, scores }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!geoData || !scores?.length) return;

    const scoreMap = new Map(
      scores.map(s => [s.area, s.score])
    );

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const projection = d3.geoMercator()
      .fitSize([800, 600], geoData);

    const path = d3.geoPath(projection);

    const color = d3.scaleSequential(d3.interpolateRdYlGn)
      .domain([0, 1]);

    svg.selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("fill", d =>
        color(scoreMap.get(d.properties.area) ?? 0)
      )
      .attr("stroke", "#222")
      .attr("stroke-width", 0.6);

  }, [geoData, scores]);

  return <svg ref={ref} width={800} height={600} />;
}
