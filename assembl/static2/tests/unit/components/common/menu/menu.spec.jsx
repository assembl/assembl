import React from 'react';
import renderer from 'react-test-renderer';

import { Menu, MenuItem } from '../../../../../js/app/components/common/menu';

describe('Menu component', () => {
  it('should match Menu snapshot', () => {
    const rendered = renderer
      .create(
        <Menu>
          <MenuItem title={<span>Foo</span>}>
            <Menu>
              <MenuItem title={<span>Sub Foo</span>} />
            </Menu>
          </MenuItem>
          <MenuItem title={<span>Bar</span>} />
        </Menu>
      )
      .toJSON();
    expect(rendered).toMatchSnapshot();
  });
  it('should match opened Menu snapshot', () => {
    const rendered = renderer
      .create(
        <Menu openedPath={[0, 0]}>
          <MenuItem title={<span>Foo</span>}>
            <Menu>
              <MenuItem title={<span>Sub Foo</span>} />
            </Menu>
          </MenuItem>
          <MenuItem title={<span>Bar</span>} />
        </Menu>
      )
      .toJSON();
    expect(rendered).toMatchSnapshot();
  });
});