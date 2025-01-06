import DivChart from './core.js';
import Chart from './Chart.jsx';

// Initialize for non-React usage
if (typeof window !== 'undefined') {
  window.DivChart = DivChart;
  DivChart.init();
}

export { Chart, DivChart };
