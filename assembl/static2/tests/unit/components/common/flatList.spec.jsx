import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import FlatList from '../../../../js/app/components/common/flatList';

describe('FlatList component', () => {
  it('should match FlatList loading snapshot', () => {
    const props = {
      networkStatus: 1
    };
    const renderer = new ShallowRenderer();
    renderer.render(<FlatList {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });

  it('should match FlatList with data snapshot', () => {
    const props = {
      items: {
        pageInfo: {
          endCursor: 'item_id',
          hasNextPage: false
        },
        edges: [
          {
            node: {
              title: 'Foobar'
            }
          }
        ]
      },
      ListItem: node => <div>{node.title}</div>
    };
    const renderer = new ShallowRenderer();
    renderer.render(<FlatList {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});