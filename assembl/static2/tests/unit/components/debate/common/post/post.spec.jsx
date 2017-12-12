import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import FoldedPost from '../../../../../../js/app/components/debate/common/post/foldedPost';

describe('FoldedPost component', () => {
  it('should render a folded post', () => {
    const renderer = new ShallowRenderer();
    renderer.render(<FoldedPost nbPosts={1} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
  it('should render several folded posts', () => {
    const renderer = new ShallowRenderer();
    renderer.render(<FoldedPost nbPosts={3} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});