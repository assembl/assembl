import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import PostView from '../../../../../../js/app/components/debate/common/post/postView';
import { postProps } from './index.spec';

describe('PostView component', () => {
  it('should render a post in view mode', () => {
    const props = postProps;
    const renderer = new ShallowRenderer();
    renderer.render(<PostView {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});