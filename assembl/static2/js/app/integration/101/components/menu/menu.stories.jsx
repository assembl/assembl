// @flow
import React from 'react';
/* eslint-disable */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, boolean, select } from '@storybook/addon-knobs';
/* eslint-enable */

import { Menu, MenuItem } from '../../../../components/common/menu';

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
  );