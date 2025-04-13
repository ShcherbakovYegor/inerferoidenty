// Plot3D.js
import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

const Plot3D = ({ plotData }) => {
  const plotDiv = useRef(null);

  useEffect(() => {
    if (plotDiv.current && plotData) {
      const layout = {
        scene: {
          // Равномерное масштабирование всех осей
          aspectmode: 'cube',
          xaxis: { title: 'X' },
          yaxis: { title: 'Y' },
          zaxis: { title: 'Z' },
          // Начальное положение камеры:
          camera: {
            eye: { x: 1.5, y: 1.5, z: 1.5 },
            center: { x: 0, y: 0, z: 0 },
            up: { x: 0, y: 0, z: 1 }
          }
        },
        margin: { l: 0, r: 0, t: 0, b: 0 }
      };

      const config = {
        responsive: true,
        scrollZoom: true,        // Масштабирование колесиком мыши
        displayModeBar: true     // Отображение панели инструментов
      };

      Plotly.newPlot(plotDiv.current, plotData, layout, config);
    }
  }, [plotData]);

  return <div ref={plotDiv} style={{ width: '600px', height: '600px' }} />;
};

export default Plot3D;
