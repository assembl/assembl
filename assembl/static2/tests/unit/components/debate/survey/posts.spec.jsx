import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { Map } from 'immutable';

import { DumbPosts } from '../../../../../js/app/components/debate/survey/posts';

describe('Posts component', () => {
  it('should display a flat list of posts', () => {
    const props = {
      updateContentLocaleMapping: () => null,
      defaultContentLocaleMapping: Map({ en: 'en' }),
      hasErrors: false,
      isModerating: false,
      posts: {
        edges: [
          {
            node: {
              title: 'Foobar'
            }
          }
        ]
      }
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbPosts {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});