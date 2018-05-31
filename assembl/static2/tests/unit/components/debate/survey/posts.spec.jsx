import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { Map } from 'immutable';

import { DumbPosts } from '../../../../../js/app/components/debate/survey/posts';

describe('FlatList component', () => {
  it('should match Posts with data snapshot', () => {
    const props = {
      updateContentLocaleMapping: () => null,
      defaultContentLocaleMapping: Map({ en: 'en' }),
      hasErrors: false,
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