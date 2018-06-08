import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbFlatList } from '../../../../js/app/components/common/flatList';

describe('FlatList component', () => {
  it('should match FlatList loading snapshot', () => {
    const props = {
      location: { hash: '' },
      networkStatus: 1
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbFlatList {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });

  it('should match FlatList with data snapshot', () => {
    const props = {
      location: { hash: '' },
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
    renderer.render(<DumbFlatList {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});