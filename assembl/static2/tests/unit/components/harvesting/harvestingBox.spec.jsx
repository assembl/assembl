import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbHarvestingBox } from '../../../../js/app/components/harvesting/harvestingBox';
import * as fakeData from './fakeData';

describe('harvestingBox component', () => {
  it('should match harvestingBox snapshot', () => {
    const { extract } = fakeData;
    const props = {
      postId: '12345',
      extract: extract,
      index: 0,
      previousExtractId: '876876876',
      harvestingBoxPosition: 100,
      contentLocale: 'fr'
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});