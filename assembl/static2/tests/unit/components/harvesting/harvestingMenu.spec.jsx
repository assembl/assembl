import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import HarvestingMenu from '../../../../js/app/components/harvesting/harvestingMenu';
import * as fakeData from './fakeData';

describe('harvestingMenu component', () => {
  beforeAll(() => {
    window.getSelection = () => ({
      removeAllRanges: () => {}
    });
  });
  it('should match harvestingMenu snapshot', () => {
    const { extracts } = fakeData;
    const props = {
      extracts: extracts,
      postId: '1234',
      isHarvesting: true,
      harvestingAnchorPosition: { x: 100, y: 200 }
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingMenu {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
  it('should match harvestingMenu without nugget action snapshot', () => {
    const { extracts } = fakeData;
    const props = {
      extracts: extracts,
      postId: '1234',
      isHarvesting: true,
      showNuggetAction: false,
      harvestingAnchorPosition: { x: 100, y: 200 }
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingMenu {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});