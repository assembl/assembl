import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbTokenTypeForm } from '../../../../../js/app/components/administration/voteSession/tokenTypeForm';

describe('tokenTypeForm component', () => {
  it('should render a TokenTypeForm component', () => {
    const handleTitleChangeSpy = jest.fn(() => {});
    const handleColorChangeSpy = jest.fn(() => {});
    const handleNumberChangeSpy = jest.fn(() => {});
    const props = {
      title: 'En faveur',
      color: '#00AA7B',
      number: 12,
      handleTitleChange: handleTitleChangeSpy,
      handleColorChange: handleColorChangeSpy,
      handleNumberChange: handleNumberChangeSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbTokenTypeForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});