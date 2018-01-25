import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbTokenCategorieForm } from '../../../../../js/app/components/administration/voteSession/tokenCategorieForm';

describe('tokenTypeForm component', () => {
  it('should render a TokenCategorieForm component', () => {
    const handleTitleChangeSpy = jest.fn(() => {});
    const handleColorChangeSpy = jest.fn(() => {});
    const handleTotalNumberChangeSpy = jest.fn(() => {});
    const props = {
      title: 'En faveur',
      color: '#00AA7B',
      totalNumber: 12,
      handleTitleChange: handleTitleChangeSpy,
      handleColorChange: handleColorChangeSpy,
      handleTotalNumberChange: handleTotalNumberChangeSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbTokenCategorieForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});