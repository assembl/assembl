import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import DeletePostButton from '../../../../../../js/app/components/debate/common/deletePostButton';

describe('DeletePostButton component', () => {
  it('should render a delete post button', () => {
    const deletePostSpy = jest.fn();
    const props = {
      deletePost: deletePostSpy,
      postId: 'XYZ333',
      refetchQueries: [
        {
          query: 'dummyGraphqlQuery',
          variables: {
            lang: 'en'
          }
        }
      ]
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DeletePostButton {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});