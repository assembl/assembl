import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import HarvestingAnchor from '../../../../js/app/components/harvesting/harvestingAnchor';

describe('harvestingAnchor component', () => {
  const handleClickAnchorSpy = jest.fn(() => {});
  const handleMouseDownSpy = jest.fn(() => {});

  it('should match harvestingAnchor snapshot', () => {
    const props = {
      anchorPosition: { x: 100, y: 200 },
      handleClickAnchor: handleClickAnchorSpy,
      handleMouseDown: handleMouseDownSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingAnchor {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingAnchor snapshot when anchorPosition is undefined', () => {
    const props = {
      anchorPosition: undefined,
      handleClickAnchor: handleClickAnchorSpy,
      handleMouseDown: handleMouseDownSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingAnchor {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match harvestingAnchor snapshot when anchorPosition is empty', () => {
    const props = {
      anchorPosition: {},
      handleClickAnchor: handleClickAnchorSpy,
      handleMouseDown: handleMouseDownSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<HarvestingAnchor {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});