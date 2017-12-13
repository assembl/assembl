import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import RelatedIdeas from '../../../../../../js/app/components/debate/common/post/relatedIdeas';

describe('RelatedIdeas component', () => {
  it('should render related ideas', () => {
    const props = {
      indirectIdeaContentLinks: [
        {
          idea: {
            id: 'foo',
            title: 'Foo'
          }
        },
        {
          idea: {
            id: 'bar',
            title: 'Bar'
          }
        }
      ]
    };
    const renderer = new ShallowRenderer();
    renderer.render(<RelatedIdeas {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});