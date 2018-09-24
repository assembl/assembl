import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import MenuList from '../../../../../../js/app/components/debate/navigation/tables/menuList';

describe('MenuList component', () => {
  it('should match the MenuList', () => {
    const items = [
      {
        id: 'foo',
        parentId: 'root'
      },
      {
        id: 'bar',
        parentId: 'root'
      }
    ];
    const props = {
      identifier: 'survey',
      phaseId: 'phaseFoo',
      className: 'debate-class',
      rootItem: 'root',
      items: items
    };
    const renderer = new ShallowRenderer();
    renderer.render(<MenuList {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
  it('should match the sub-MenuList', () => {
    const items = [
      {
        id: 'foo',
        parentId: 'root'
      },
      {
        id: 'bar',
        parentId: 'root'
      }
    ];
    const props = {
      subMenu: true,
      identifier: 'survey',
      phaseId: 'phaseFoo',
      className: 'debate-class',
      rootItem: 'root',
      items: items
    };
    const renderer = new ShallowRenderer();
    renderer.render(<MenuList {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});