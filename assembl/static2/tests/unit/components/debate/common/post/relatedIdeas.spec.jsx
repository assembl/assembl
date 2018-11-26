import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import RelatedIdeas from '../../../../../../js/app/components/debate/common/post/relatedIdeas';

describe('RelatedIdeas component', () => {
  it('should render related ideas', () => {
    const props = {
      relatedIdeasTitles: ['Super thematic', 'Fantastic thematic']
    };
    const renderer = new ShallowRenderer();
    renderer.render(<RelatedIdeas {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});