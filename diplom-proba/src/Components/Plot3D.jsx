// Plot3D.js
import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

const Plot3D = ({ plotData }) => {
  const plotDiv = useRef(null);

  useEffect(() => {
    if (plotDiv.current && plotData) {
      const layout = {
        scene: {
          aspectmode: 'cube',
          xaxis: { title: 'X' },
          yaxis: { title: 'Y' },
          zaxis: { title: 'Z' },
          camera: {
            // "Вид сверху" (eye смотрит «сверху вниз» вдоль оси Z)
            eye: { x: 0, y: 0, z: 2 },     // z побольше, x/y=0
            center: { x: 0, y: 0, z: 0 },
            up: { x: 0, y: 1, z: 0 },      // направление "вверх" = ось Y
          }
        },
        margin: { l: 0, r: 0, t: 0, b: 0 }
      };

      const config = {
        responsive: true,
        scrollZoom: true,        
        displayModeBar: true     
      };

      Plotly.newPlot(plotDiv.current, plotData, layout, config);
    }
  }, [plotData]);

  return <div ref={plotDiv} style={{ width: '600px', height: '600px' }} />;
};

export default Plot3D;
