import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbIdeasTable } from '../../../../../../js/app/components/debate/navigation/tables/ideasTable';

describe('IdeasTable component', () => {
  it('should match the IdeasTable', () => {
    const data = {
      ideas: [
        {
          id: 'foo',
          parentId: 'root'
        },
        {
          id: 'bar',
          parentId: 'root'
        }
      ],
      rootIdea: {
        id: 'root'
      }
    };
    const props = {
      identifier: 'multiColumns',
      phaseId: 'phaseFoo',
      data: data
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbIdeasTable {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});