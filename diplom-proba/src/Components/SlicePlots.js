import React, { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";

const dash = (idx) => (idx === 1 ? "solid" : "dot");  // разные штрихи

export default function SlicePlots({ xSlices, ySlices }) {
  const xDiv = useRef(null);
  const yDiv = useRef(null);

  useEffect(() => {
    if (!xSlices || !ySlices) return;

    // --- X‑сечения (фиксируем y) ---
    Plotly.newPlot(
      xDiv.current,
      xSlices.map((sl, i) => ({
        x: sl.x,
        y: sl.z,
        name: sl.label,
        mode: "lines",
        line: { color: "blue", dash: dash(i), width: 2 },
      })),
      {
        margin: { l: 40, r: 10, t: 10, b: 40 },
        xaxis: { title: "x" },
        yaxis: { title: "Δz" },
      },
      { responsive: true }
    );

    // --- Y‑сечения (фиксируем x) ---
    Plotly.newPlot(
      yDiv.current,
      ySlices.map((sl, i) => ({
        x: sl.x,
        y: sl.z,
        name: sl.label,
        mode: "lines",
        line: { color: "red",  dash: dash(i),  width: 2 },
      })),
      {
        margin: { l: 40, r: 10, t: 10, b: 40 },
        xaxis: { title: "y" },
        yaxis: { title: "Δz" },
      },
      { responsive: true }
    );
  }, [xSlices, ySlices]);

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div ref={xDiv} style={{ width: 350, height: 300 }} />
      <div ref={yDiv} style={{ width: 350, height: 300 }} />
    </div>
  );
}
