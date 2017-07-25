import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { PostFolded } from '../../../../../js/app/components/debate/thread/post';

describe('PostFolded component', () => {
  it('should render a folded post', () => {
    const renderer = new ShallowRenderer();
    renderer.render(<PostFolded nbPosts={1} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
  it('should render several folded posts', () => {
    const renderer = new ShallowRenderer();
    renderer.render(<PostFolded nbPosts={3} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});