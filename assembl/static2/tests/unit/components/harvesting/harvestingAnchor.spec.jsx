import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import HarvestingAnchor from '../../../../js/app/components/harvesting/harvestingAnchor';

describe('harvestingAnchor component', () => {
  it('should match harvestingAnchor snapshot', () => {
    const props = {
      harvestingMenuPosition: 100
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingAnchor {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});