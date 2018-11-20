import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import Tag from '../../../../js/app/components/harvesting/tag';

describe('Tag component', () => {
  it('should match Tag snapshot', () => {
    const props = {
      contextId: '123456YETRZ',
      tag: { label: 'foo', value: 'fooid' },
      canRemove: true,
      remove: jest.fn(() => {}),
      updateTag: jest.fn(() => {}),
      onUpdate: jest.fn(() => {})
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<Tag {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should match Tag snapshot (user can\'t edit)', () => {
    const props = {
      contextId: '123456YETRZ',
      tag: { label: 'foo', value: 'fooid' },
      canRemove: false,
      remove: jest.fn(() => {}),
      updateTag: jest.fn(() => {}),
      onUpdate: jest.fn(() => {})
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<Tag {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});