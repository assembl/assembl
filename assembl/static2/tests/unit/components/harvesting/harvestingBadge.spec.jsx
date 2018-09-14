import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import HarvestingBadge from '../../../../js/app/components/harvesting/harvestingBadge';

describe('harvestingBadge component', () => {
  it('should match harvestingBadge snapshot with extracts number', () => {
    const setExtractsBoxDisplaySpy = jest.fn(() => {});
    const props = {
      extractsNumber: 5,
      setExtractsBoxDisplay: setExtractsBoxDisplaySpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingBadge {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingBadge snapshot when extracts number is undefined', () => {
    const setExtractsBoxDisplaySpy = jest.fn(() => {});
    const props = {
      extractsNumber: undefined,
      setExtractsBoxDisplay: setExtractsBoxDisplaySpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingBadge {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});