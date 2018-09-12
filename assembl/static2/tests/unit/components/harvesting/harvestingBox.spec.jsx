import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbHarvestingBox } from '../../../../js/app/components/harvesting/harvestingBox';
import * as fakeData from './fakeData';

describe('harvestingBox component', () => {
  const setExtractsBoxDisplaySpy = jest.fn(() => {});
  it('should match harvestingBox snapshot', () => {
    const { extract } = fakeData;
    const props = {
      postId: '12345',
      extract: extract,
      index: 0,
      previousExtractId: '876876876',
      harvestingAnchorPosition: { x: 100, y: 200 },
      contentLocale: 'fr',
      harvestingDate: 'il y a 5 jours',
      showNuggetAction: true,
      setExtractsBoxDisplay: setExtractsBoxDisplaySpy
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
      harvestingDate: 'il y a 5 jours',
      showNuggetAction: true,
      setExtractsBoxDisplay: setExtractsBoxDisplaySpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
  it('should match submitted harvestingBox without nugget action snapshot', () => {
    const { submittedExtract } = fakeData;
    const props = {
      postId: '12345',
      extract: submittedExtract,
      index: 0,
      previousExtractId: '876876876',
      harvestingAnchorPosition: { x: 100, y: 200 },
      contentLocale: 'fr',
      harvestingDate: 'il y a 5 jours',
      showNuggetAction: false,
      setExtractsBoxDisplay: setExtractsBoxDisplaySpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});