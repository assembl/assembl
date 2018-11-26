import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbHarvestingBox } from '../../../../js/app/components/harvesting/harvestingBox';
import * as fakeData from './fakeData';

describe('harvestingBox component', () => {
  const { extracts } = fakeData;
  const setHarvestingBoxDisplaySpy = jest.fn(() => {});
  const cancelHarvestingSpy = jest.fn(() => {});
  const addPostExtractSpy = jest.fn(() => {});
  const updateExtractSpy = jest.fn(() => {});
  const confirmExtractSpy = jest.fn(() => {});
  const deleteExtractSpy = jest.fn(() => {});
  const refetchPostSpy = jest.fn(() => {});
  const toggleExtractsBoxSpy = jest.fn(() => {});
  it('should match harvestingBox snapshot when there are no extracts', () => {
    const props = {
      extracts: [],
      postId: '123456',
      contentLocale: 'fr',
      lang: 'fr',
      annotation: null,
      harvestingDate: '2018-04-29T16:28:27.324276+00:00',
      isAuthorAccountDeleted: false,
      showNuggetAction: false,
      displayHarvestingBox: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      cancelHarvesting: cancelHarvestingSpy,
      addPostExtract: addPostExtractSpy,
      updateExtract: updateExtractSpy,
      confirmExtract: confirmExtractSpy,
      deleteExtract: deleteExtractSpy,
      refetchPost: refetchPostSpy,
      toggleExtractsBox: toggleExtractsBoxSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingBox snapshot when there are extracts', () => {
    const props = {
      extracts: extracts,
      postId: '123456',
      contentLocale: 'fr',
      lang: 'fr',
      annotation: null,
      harvestingDate: '2018-04-29T16:28:27.324276+00:00',
      isAuthorAccountDeleted: false,
      showNuggetAction: false,
      displayHarvestingBox: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      cancelHarvesting: cancelHarvestingSpy,
      addPostExtract: addPostExtractSpy,
      updateExtract: updateExtractSpy,
      confirmExtract: confirmExtractSpy,
      deleteExtract: deleteExtractSpy,
      refetchPost: refetchPostSpy,
      toggleExtractsBox: toggleExtractsBoxSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingBox snapshot when there are extracts with active extract', () => {
    const props = {
      extracts: extracts,
      activeExtractIndex: 1,
      postId: '123456',
      contentLocale: 'fr',
      lang: 'fr',
      annotation: null,
      harvestingDate: '2018-04-29T16:28:27.324276+00:00',
      isAuthorAccountDeleted: false,
      showNuggetAction: false,
      displayHarvestingBox: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      cancelHarvesting: cancelHarvestingSpy,
      addPostExtract: addPostExtractSpy,
      updateExtract: updateExtractSpy,
      confirmExtract: confirmExtractSpy,
      deleteExtract: deleteExtractSpy,
      refetchPost: refetchPostSpy,
      toggleExtractsBox: toggleExtractsBoxSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingBox snapshot when extracts is undefined', () => {
    const props = {
      extracts: undefined,
      postId: '123456',
      contentLocale: 'fr',
      lang: 'fr',
      annotation: null,
      harvestingDate: '2018-04-29T16:28:27.324276+00:00',
      isAuthorAccountDeleted: false,
      showNuggetAction: false,
      displayHarvestingBox: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      cancelHarvesting: cancelHarvestingSpy,
      addPostExtract: addPostExtractSpy,
      updateExtract: updateExtractSpy,
      confirmExtract: confirmExtractSpy,
      deleteExtract: deleteExtractSpy,
      refetchPost: refetchPostSpy,
      toggleExtractsBox: toggleExtractsBoxSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingBox snapshot when selection is undefined', () => {
    const props = {
      extracts: extracts,
      postId: '123456',
      contentLocale: 'fr',
      lang: 'fr',
      annotation: null,
      harvestingDate: '2018-04-29T16:28:27.324276+00:00',
      isAuthorAccountDeleted: false,
      showNuggetAction: false,
      displayHarvestingBox: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      cancelHarvesting: cancelHarvestingSpy,
      addPostExtract: addPostExtractSpy,
      updateExtract: updateExtractSpy,
      confirmExtract: confirmExtractSpy,
      deleteExtract: deleteExtractSpy,
      refetchPost: refetchPostSpy,
      toggleExtractsBox: toggleExtractsBoxSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingBox snapshot when author account is deleted', () => {
    const props = {
      extracts: extracts,
      postId: '123456',
      contentLocale: 'fr',
      lang: 'fr',
      annotation: null,
      harvestingDate: '2018-04-29T16:28:27.324276+00:00',
      isAuthorAccountDeleted: true,
      showNuggetAction: false,
      displayHarvestingBox: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      cancelHarvesting: cancelHarvestingSpy,
      addPostExtract: addPostExtractSpy,
      updateExtract: updateExtractSpy,
      confirmExtract: confirmExtractSpy,
      deleteExtract: deleteExtractSpy,
      refetchPost: refetchPostSpy,
      toggleExtractsBox: toggleExtractsBoxSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingBox snapshot when nugget action is visible', () => {
    const props = {
      extracts: extracts,
      postId: '123456',
      contentLocale: 'fr',
      lang: 'fr',
      annotation: null,
      harvestingDate: '2018-04-29T16:28:27.324276+00:00',
      isAuthorAccountDeleted: false,
      showNuggetAction: true,
      displayHarvestingBox: false,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      cancelHarvesting: cancelHarvestingSpy,
      addPostExtract: addPostExtractSpy,
      updateExtract: updateExtractSpy,
      confirmExtract: confirmExtractSpy,
      deleteExtract: deleteExtractSpy,
      refetchPost: refetchPostSpy,
      toggleExtractsBox: toggleExtractsBoxSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingBox snapshot when the component is in harvesting mode', () => {
    const props = {
      extracts: extracts,
      postId: '123456',
      contentLocale: 'fr',
      lang: 'fr',
      annotation: null,
      harvestingDate: '2018-04-29T16:28:27.324276+00:00',
      isAuthorAccountDeleted: false,
      showNuggetAction: false,
      displayHarvestingBox: true,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      cancelHarvesting: cancelHarvestingSpy,
      addPostExtract: addPostExtractSpy,
      updateExtract: updateExtractSpy,
      confirmExtract: confirmExtractSpy,
      deleteExtract: deleteExtractSpy,
      refetchPost: refetchPostSpy,
      toggleExtractsBox: toggleExtractsBoxSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingBox snapshot with annotation', () => {
    const props = {
      postId: '123456',
      contentLocale: 'fr',
      lang: 'fr',
      annotation: {
        body: 'extract text',
        offsetEnd: 988,
        offsetStart: 973,
        xpathEnd: '//div[@id=\'start\']/',
        xpathStart: '//div[@id=\'end\']/'
      },
      isAuthorAccountDeleted: false,
      showNuggetAction: false,
      displayHarvestingBox: true,
      setHarvestingBoxDisplay: setHarvestingBoxDisplaySpy,
      cancelHarvesting: cancelHarvestingSpy,
      addPostExtract: addPostExtractSpy,
      updateExtract: updateExtractSpy,
      confirmExtract: confirmExtractSpy,
      deleteExtract: deleteExtractSpy,
      refetchPost: refetchPostSpy,
      toggleExtractsBox: toggleExtractsBoxSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbHarvestingBox {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});