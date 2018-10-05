import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import EditPostButton from '../../../../../js/app/components/debate/common/editPostButton';

describe('EditPostButton component', () => {
  it('should render an edit post button', () => {
    const handleClickSpy = jest.fn();
    const props = {
      handleClick: handleClickSpy,
      linkClassName: 'my-custom-class'
    };
    const renderer = new ShallowRenderer();
    renderer.render(<EditPostButton {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});