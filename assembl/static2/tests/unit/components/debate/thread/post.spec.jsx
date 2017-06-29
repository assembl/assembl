import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { PostFolded } from '../../../../../js/app/components/debate/thread/post';

describe('PostFolded component', () => {
  it('should render an folded post uploader', () => {
    const renderer = new ShallowRenderer();
    const props = {
      creator: {
        name: 'John Doe'
      }
    };
    renderer.render(<PostFolded {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});