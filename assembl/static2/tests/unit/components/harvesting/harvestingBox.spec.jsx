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
      harvestingAnchorPosition: { x: 100, y: 200 },
      contentLocale: 'fr',
      harvestingDate: 'il y a 5 jours'
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
  it('should match submitted harvestingBox snapshot', () => {
    const { submittedExtract } = fakeData;
    const props = {
      postId: '12345',
      extract: submittedExtract,
      index: 0,
      previousExtractId: '876876876',
      harvestingAnchorPosition: { x: 100, y: 200 },
      contentLocale: 'fr',
      harvestingDate: 'il y a 5 jours'
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});