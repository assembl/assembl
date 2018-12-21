import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import HarvestingMenu from '../../../../js/app/components/harvesting/harvestingMenu';
import * as fakeData from './fakeData';
import * as extractUtils from '../../../../js/app/utils/extract';

const extractBody = 'extract text';

extractUtils.getAnnotationData = jest.fn(() => ({
  body: extractBody,
  offsetEnd: 988,
  offsetStart: 973,
  xpathEnd: '//div[@id=\'start\']/',
  xpathStart: '//div[@id=\'end\']/'
}));

describe('harvestingMenu component', () => {
  beforeAll(() => {
    window.getSelection = () => ({
      removeAllRanges: () => {},
      toString: () => extractBody
    });
  });
  const { extracts } = fakeData;
  const setHarvestingBoxDisplaySpy = jest.fn(() => {});
  const handleClickAnchorSpy = jest.fn(() => {});
  const cancelHarvestingSpy = jest.fn(() => {});
  const refetchPostSpy = jest.fn(() => {});

  it('should match harvestingMenu snapshot when there are extracts', () => {
    const props = {
      extracts: extracts,
      postId: '123456',
      lang: 'fr',
      displayHarvestingBox: false,
      displayHarvestingAnchor: false,
      harvestingAnchorPosition: { x: 10, y: 10 },
      isAuthorAccountDeleted: false,
      showNuggetAction: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      handleClickAnchor: handleClickAnchorSpy,
      cancelHarvesting: cancelHarvestingSpy,
      refetchPost: refetchPostSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingMenu {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingMenu snapshot when there are no extracts', () => {
    const props = {
      extracts: [],
      postId: '123456',
      lang: 'fr',
      displayHarvestingBox: false,
      displayHarvestingAnchor: false,
      harvestingAnchorPosition: { x: 10, y: 10 },
      isAuthorAccountDeleted: false,
      showNuggetAction: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      handleClickAnchor: handleClickAnchorSpy,
      cancelHarvesting: cancelHarvestingSpy,
      refetchPost: refetchPostSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingMenu {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingMenu snapshot when extracts is undefined', () => {
    const props = {
      extracts: undefined,
      postId: '123456',
      lang: 'fr',
      displayHarvestingBox: false,
      displayHarvestingAnchor: false,
      harvestingAnchorPosition: { x: 10, y: 10 },
      isAuthorAccountDeleted: false,
      showNuggetAction: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      handleClickAnchor: handleClickAnchorSpy,
      cancelHarvesting: cancelHarvestingSpy,
      refetchPost: refetchPostSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingMenu {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingMenu snapshot when the harvesting box is visible', () => {
    const props = {
      extracts: extracts,
      postId: '123456',
      lang: 'fr',
      displayHarvestingBox: true,
      displayHarvestingAnchor: false,
      harvestingAnchorPosition: { x: 10, y: 10 },
      isAuthorAccountDeleted: false,
      showNuggetAction: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      handleClickAnchor: handleClickAnchorSpy,
      cancelHarvesting: cancelHarvestingSpy,
      refetchPost: refetchPostSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingMenu {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingMenu snapshot when the anchor to harvest is visible', () => {
    const props = {
      extracts: extracts,
      postId: '123456',
      lang: 'fr',
      displayHarvestingBox: false,
      displayHarvestingAnchor: true,
      harvestingAnchorPosition: { x: 10, y: 10 },
      isAuthorAccountDeleted: false,
      showNuggetAction: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      handleClickAnchor: handleClickAnchorSpy,
      cancelHarvesting: cancelHarvestingSpy,
      refetchPost: refetchPostSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingMenu {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingMenu snapshot when the author account is deleted', () => {
    const props = {
      extracts: extracts,
      postId: '123456',
      lang: 'fr',
      displayHarvestingBox: false,
      displayHarvestingAnchor: false,
      harvestingAnchorPosition: { x: 10, y: 10 },
      isAuthorAccountDeleted: true,
      showNuggetAction: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      handleClickAnchor: handleClickAnchorSpy,
      cancelHarvesting: cancelHarvestingSpy,
      refetchPost: refetchPostSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingMenu {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingMenu snapshot when nugget action is visible', () => {
    const props = {
      extracts: extracts,
      postId: '123456',
      lang: 'fr',
      displayHarvestingBox: false,
      displayHarvestingAnchor: false,
      harvestingAnchorPosition: { x: 10, y: 10 },
      isAuthorAccountDeleted: false,
      showNuggetAction: true,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      handleClickAnchor: handleClickAnchorSpy,
      cancelHarvesting: cancelHarvestingSpy,
      refetchPost: refetchPostSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingMenu {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});