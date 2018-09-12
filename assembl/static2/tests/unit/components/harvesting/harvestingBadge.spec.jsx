import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import HarvestingBadge from '../../../../js/app/components/harvesting/harvestingBadge';

describe('harvestingBadge component', () => {
  it('should match harvestingBadge snapshot', () => {
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
});