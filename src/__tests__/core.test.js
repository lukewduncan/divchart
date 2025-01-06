import DivChart from '../core';

describe('DivChart', () => {
  beforeAll(() => {
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 200,
      height: 100,
      top: 0,
      left: 0,
      right: 200,
      bottom: 100
    }));

    global.ResizeObserver = class ResizeObserver {
      constructor(cb) {
        this.cb = cb;
      }
      observe() {
        // Simulate a resize observation
        this.cb([{ target: document.createElement('div') }]);
      }
      unobserve() {}
      disconnect() {}
    };
  });

  test('validates chart types', () => {
    expect(DivChart.CONSTANTS.VALID_TYPES).toContain('bar');
    expect(DivChart.CONSTANTS.VALID_TYPES).toContain('line');
    expect(DivChart.CONSTANTS.VALID_TYPES).toContain('pie');
  });

  test('sets canvas dimensions correctly', () => {
    const element = document.createElement('div');
    const canvas = document.createElement('canvas');
    
    DivChart.setCanvasSize(canvas, element);

    expect(canvas.style.width).toBe('200px');
    expect(canvas.style.height).toBe('100px');

    // Also test the actual canvas dimensions (accounting for pixel ratio)
    const pixelRatio = window.devicePixelRatio || 1;
    expect(canvas.width).toBe(200 * pixelRatio);
    expect(canvas.height).toBe(100 * pixelRatio);
  });

  test('creates chart with correct data attributes', () => {
    const element = document.createElement('div');
    const testData = [{ label: 'Test', value: 10 }];
    element.dataset.divchart = 'bar';
    element.dataset.divchartData = JSON.stringify(testData);
    element.dataset.divchartColors = JSON.stringify(['#000']);
    
    DivChart.createChart(element);
    
    expect(element.children.length).toBeGreaterThan(0);
    expect(element.querySelector('canvas')).toBeTruthy();
  });

  test('handles cleanup correctly', () => {
    const element = document.createElement('div');
    const testData = [{ label: 'Test', value: 10 }];
    element.dataset.divchart = 'bar';
    element.dataset.divchartData = JSON.stringify(testData);
    
    DivChart.createChart(element);
    const observerId = element.getAttribute('data-observer-id');
    
    DivChart.cleanup(element);
    expect(DivChart.observers.has(observerId)).toBeFalsy();
  });
});
