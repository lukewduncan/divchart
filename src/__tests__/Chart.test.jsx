import React from 'react';
import { render } from '@testing-library/react';
import Chart from '../Chart';

describe('Chart', () => {
  test('renders with correct data attributes', () => {
    const testData = [{ label: 'Test', value: 10 }];
    const { container } = render(
      <Chart 
        type="bar" 
        data={testData}
        title="Test Chart"
      />
    );

    const div = container.firstChild;
    expect(div).toHaveAttribute('data-divchart', 'bar');
    expect(div).toHaveAttribute('data-divchart-data', JSON.stringify(testData));
  });
});
