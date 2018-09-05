// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, object } from '@storybook/addon-knobs';
/* eslint-enable */

import { Menu, MenuItem } from '../../../../components/common/menu';

const openedPath = [0, 2, 1];

storiesOf('Menu', module)
  .addDecorator(withKnobs)
  .add(
    'default',
    withInfo()(() => (
      <Menu>
        <MenuItem title="Foo">
          <Menu>
            <MenuItem title="Sub Foo" />
          </Menu>
        </MenuItem>
        <MenuItem title="Bar" />
      </Menu>
    ))
  )
  .add(
    'opened',
    withInfo()(() => (
      <Menu openedPath={object('openedPath', openedPath)}>
        <MenuItem title="Foo">
          <Menu>
            <MenuItem title="Foo 1" />
            <MenuItem title="Foo 2" />
            <MenuItem title="Foo 3">
              <Menu>
                <MenuItem title="Foo 1.1" />
                <MenuItem title="Foo 1.2" />
                <MenuItem title="Foo 1.3" />
              </Menu>
            </MenuItem>
          </Menu>
        </MenuItem>
        <MenuItem title="Bar" />
      </Menu>
    ))
  );