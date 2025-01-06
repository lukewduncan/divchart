class DivChart {
  static CONSTANTS = {
    DEFAULT_COLOR: '#2196F3',
    FONT_FAMILY: 'Arial',
    TITLE_FONT_SIZE: '16px',
    LABEL_FONT_SIZE: '12px',
    TOOLTIP_BACKGROUND: 'rgba(0, 0, 0, 0.8)',
    AXIS_COLOR: '#333',
    LABEL_COLOR: '#666',
    VALID_TYPES: ['line', 'bar', 'pie']
  };

  static defaultMargin = { 
    top: 40, 
    right: 20, 
    bottom: 30, 
    left: 40 
  };

  static observers = new Map();

  static init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeCharts());
    } else {
      this.initializeCharts();
    }
    this.setupMutationObserver();
  }

  static setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.dataset.divchart) {
            this.createChart(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  static initializeCharts() {
    document.querySelectorAll('[data-divchart]').forEach(element => {
      this.createChart(element);
    });
  }

  static getPixelRatio() {
    return window.devicePixelRatio || 1;
  }

  static cleanup(element) {
    const observerId = element.getAttribute('data-observer-id');
    if (observerId && this.observers.has(observerId)) {
      this.observers.get(observerId).disconnect();
      this.observers.delete(observerId);
    }
  }

  static createChart(element) {
    try {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const tooltip = document.createElement('div');
      tooltip.style.cssText = `
        position: absolute;
        display: none;
        background: ${this.CONSTANTS.TOOLTIP_BACKGROUND};
        color: white;
        padding: 8px;
        border-radius: 4px;
        font-size: ${this.CONSTANTS.LABEL_FONT_SIZE};
        font-family: ${this.CONSTANTS.FONT_FAMILY};
        pointer-events: none;
        z-index: 1000;
      `;
      
      this.setCanvasSize(canvas, element);

      const data = JSON.parse(element.dataset.divchartData || '[]');
      const type = element.dataset.divchart;
      const colors = JSON.parse(element.dataset.divchartColors || `["${this.CONSTANTS.DEFAULT_COLOR}"]`);
      const title = element.dataset.divchartTitle || '';

      if (!this.CONSTANTS.VALID_TYPES.includes(type)) {
        console.error(`Invalid chart type: ${type}. Must be one of: ${this.CONSTANTS.VALID_TYPES.join(', ')}`);
        return;
      }

      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const dataPoint = this.findDataPoint(ctx, type, data, x, y);
        
        if (dataPoint) {
          tooltip.style.display = 'block';
          tooltip.style.left = `${x + 10}px`;
          tooltip.style.top = `${y - 10}px`;
          tooltip.innerHTML = `
            <strong>${dataPoint.label || ''}</strong><br>
            Value: ${dataPoint.value}
          `;
        } else {
          tooltip.style.display = 'none';
        }
      });

      canvas.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });

      // Handle resize
      const observerId = Date.now().toString();
      element.setAttribute('data-observer-id', observerId);
      
      const observer = new ResizeObserver(() => {
        this.setCanvasSize(canvas, element);
        this.renderChart(ctx, { type, data, colors, title });
      });
      
      observer.observe(element);
      this.observers.set(observerId, observer);

      wrapper.appendChild(canvas);
      wrapper.appendChild(tooltip);
      element.innerHTML = '';
      element.appendChild(wrapper);
      this.renderChart(ctx, { type, data, colors, title });

    } catch (e) {
      console.error('Error creating chart:', e);
      return;
    }
  }

  static setCanvasSize(canvas, element) {
    const rect = element.getBoundingClientRect();
    const dpr = this.getPixelRatio();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    canvas.getContext('2d').scale(dpr, dpr);
  }

  static renderChart(ctx, options) {
    const { type, data, colors, title } = options;
    const width = ctx.canvas.width / this.getPixelRatio();
    const height = ctx.canvas.height / this.getPixelRatio();

    ctx.clearRect(0, 0, width, height);

    switch (type) {
      case 'line':
        this.drawLineChart(ctx, data, colors, { width, height });
        break;
      case 'bar':
        this.drawBarChart(ctx, data, colors, { width, height });
        break;
      case 'pie':
        this.drawPieChart(ctx, data, colors, { width, height });
        break;
    }

    if (title) {
      ctx.font = `${this.CONSTANTS.TITLE_FONT_SIZE} ${this.CONSTANTS.FONT_FAMILY}`;
      ctx.fillStyle = this.CONSTANTS.AXIS_COLOR;
      ctx.textAlign = 'center';
      ctx.fillText(title, width / 2, 30);
    }
  }

  static drawLineChart(ctx, data, colors, dimensions) {
    const { width, height } = dimensions;
    const margin = { ...this.defaultMargin };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = chartWidth / (data.length - 1);
    const yMax = Math.max(...data.map(d => d.value)) * 1.1;
    const yScale = chartHeight / yMax;

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = this.CONSTANTS.AXIS_COLOR;
    ctx.lineWidth = 1;

    // Y-axis
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    
    // X-axis
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Draw Y-axis labels
    ctx.fillStyle = this.CONSTANTS.LABEL_COLOR;
    ctx.font = `${this.CONSTANTS.LABEL_FONT_SIZE} ${this.CONSTANTS.FONT_FAMILY}`;
    ctx.textAlign = 'right';
    const ySteps = 5;

    const maxValue = Math.max(...data.map(d => d.value));
    const pow10 = Math.pow(10, Math.floor(Math.log10(maxValue)));
    const fraction = maxValue / pow10;
    
    let niceMax;
    if (fraction <= 1) niceMax = 1;
    else if (fraction <= 2) niceMax = 2;
    else if (fraction <= 5) niceMax = 5;
    else niceMax = 10;
    
    niceMax = niceMax * pow10;
          
    for (let i = 0; i <= ySteps; i++) {
      const value = (niceMax * i) / ySteps;
      const y = height - margin.bottom - ((value / niceMax) * chartHeight);
      ctx.fillText(Math.round(value), margin.left - 5, y + 4);
    }      

    // Draw X-axis labels
    ctx.textAlign = 'center';
    data.forEach((point, i) => {
      const x = margin.left + (i * xScale);
      ctx.fillText(point.label || i, x, height - margin.bottom + 15);
    });

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 2;

    data.forEach((point, i) => {
      const x = margin.left + (i * xScale);
      const y = height - margin.bottom - (point.value * yScale);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    data.forEach((point, i) => {
      const x = margin.left + (i * xScale);
      const y = height - margin.bottom - (point.value * yScale);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = colors[0];
      ctx.stroke();
    });
  }

  static drawBarChart(ctx, data, colors, dimensions) {
    const { width, height } = dimensions;
    const margin = { ...this.defaultMargin };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const barCount = data.length;
    const barWidth = (chartWidth / barCount) * 0.8;
    const barSpacing = (chartWidth / barCount) * 0.2;
    const yMax = Math.max(...data.map(d => d.value)) * 1.1;
    const yScale = chartHeight / yMax;

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = this.CONSTANTS.AXIS_COLOR;
    ctx.lineWidth = 1;

    // Y-axis
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    
    // X-axis
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Draw Y-axis labels
    ctx.fillStyle = this.CONSTANTS.LABEL_COLOR;
    ctx.font = `${this.CONSTANTS.LABEL_FONT_SIZE} ${this.CONSTANTS.FONT_FAMILY}`;
    ctx.textAlign = 'right';
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const value = (yMax * i) / ySteps;
      const y = height - margin.bottom - (value * yScale);
      ctx.fillText(Math.round(value), margin.left - 5, y + 4);
    }

    // Draw bars and X-axis labels
    data.forEach((point, i) => {
      const x = margin.left + (i * (barWidth + barSpacing));
      const barHeight = point.value * yScale;
      const y = height - margin.bottom - barHeight;

      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.strokeStyle = this.CONSTANTS.AXIS_COLOR;
      ctx.strokeRect(x, y, barWidth, barHeight);

      ctx.fillStyle = this.CONSTANTS.LABEL_COLOR;
      ctx.textAlign = 'center';
      ctx.fillText(point.label || i, x + barWidth / 2, height - margin.bottom + 15);
    });
  }

  static drawPieChart(ctx, data, colors, dimensions) {
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.5;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = -Math.PI / 2;

    data.forEach((item, i) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      const middleAngle = startAngle + sliceAngle / 2;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Calculate and draw percentage label
      const percentage = ((item.value / total) * 100).toFixed(1);
      const labelRadius = radius * 0.75;
      const labelX = centerX + Math.cos(middleAngle) * labelRadius;
      const labelY = centerY + Math.sin(middleAngle) * labelRadius;

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${this.CONSTANTS.LABEL_FONT_SIZE} ${this.CONSTANTS.FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${percentage}%`, labelX, labelY);

      // Draw legend
      const legendX = width - 120;
      const legendY = 40 + (i * 20);
      
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(legendX, legendY, 15, 15);
      
      ctx.fillStyle = this.CONSTANTS.LABEL_COLOR;
      ctx.textAlign = 'left';
      ctx.font = `${this.CONSTANTS.LABEL_FONT_SIZE} ${this.CONSTANTS.FONT_FAMILY}`;
      ctx.fillText(`${item.label}: ${percentage}%`, legendX + 20, legendY + 12);

      startAngle = endAngle;
    });
  }

  static findDataPoint(ctx, type, data, mouseX, mouseY) {
    const width = ctx.canvas.width / this.getPixelRatio();
    const height = ctx.canvas.height / this.getPixelRatio();
    const margin = { ...this.defaultMargin };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (type === 'pie') {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2.5;
      
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= radius) {
        let angle = Math.atan2(dy, dx);
        if (angle < 0) angle += 2 * Math.PI;
        angle = (angle + Math.PI / 2) % (2 * Math.PI);
        
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = 0;
        
        return data.find(item => {
          const sliceAngle = (item.value / total) * 2 * Math.PI;
          currentAngle += sliceAngle;
          return angle <= currentAngle;
        });
      }
    } else if (type === 'line') {
      const xScale = chartWidth / (data.length - 1);
      const yMax = Math.max(...data.map(d => d.value)) * 1.1;
      const yScale = chartHeight / yMax;

      return data.find((point, i) => {
        const x = margin.left + (i * xScale);
        const y = height - margin.bottom - (point.value * yScale);
        return Math.abs(x - mouseX) < 10 && Math.abs(y - mouseY) < 10;
      });
    } else if (type === 'bar') {
      const barCount = data.length;
      const barWidth = (chartWidth / barCount) * 0.8;
      const barSpacing = (chartWidth / barCount) * 0.2;
      const yMax = Math.max(...data.map(d => d.value)) * 1.1;
      const yScale = chartHeight / yMax;

      return data.find((point, i) => {
        const x = margin.left + (i * (barWidth + barSpacing));
        const barHeight = point.value * yScale;
        const y = height - margin.bottom - barHeight;
        
        return mouseX >= x && mouseX <= x + barWidth && 
                mouseY >= y && mouseY <= height - margin.bottom;
      });
    }
    
    return null;
  }
}

export default DivChart;
