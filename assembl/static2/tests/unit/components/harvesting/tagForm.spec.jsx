import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbTagForm } from '../../../../js/app/components/harvesting/tagForm';

describe('Tag component', () => {
  it('should match the Tag form', () => {
    const props = {
      initialValue: { label: 'foo', value: 'fooid' },
      onCancel: jest.fn(() => {}),
      onSubmit: jest.fn(() => {})
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbTagForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});