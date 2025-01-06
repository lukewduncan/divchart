import React, { useEffect, useRef } from 'react';
import DivChart from './core';

const Chart = ({ type, data, colors, title, style, className }) => {
  const divRef = useRef(null);

  useEffect(() => {
    if (divRef.current) {
      divRef.current.dataset.divchart = type;
      divRef.current.dataset.divchartData = JSON.stringify(data);
      divRef.current.dataset.divchartColors = JSON.stringify(colors || ['#2196F3']);
      divRef.current.dataset.divchartTitle = title || '';
      
      DivChart.createChart(divRef.current);
    }

    return () => {
      if (divRef.current) {
        DivChart.cleanup(divRef.current);
      }
    };
  }, [type, data, colors, title]);

  return (
    <div
      ref={divRef}
      className={className}
      style={{ width: '600px', height: '400px', ...style }}
    />
  );
};

export default Chart;
