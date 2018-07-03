import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbTokenCategoryForm } from '../../../../../js/app/components/administration/voteSession/tokenCategoryForm';

describe('tokenTypeForm component', () => {
  it('should render a TokenCategoryForm component', () => {
    const handleTitleChangeSpy = jest.fn(() => {});
    const handleColorChangeSpy = jest.fn(() => {});
    const handleTotalNumberChangeSpy = jest.fn(() => {});
    const props = {
      index: 1,
      title: 'En faveur',
      color: '#00AA7B',
      totalNumber: 12,
      handleTitleChange: handleTitleChangeSpy,
      handleColorChange: handleColorChangeSpy,
      handleTotalNumberChange: handleTotalNumberChangeSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbTokenCategoryForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});