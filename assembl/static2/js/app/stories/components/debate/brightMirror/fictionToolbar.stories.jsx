// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
/* eslint-enable */

import FictionToolbar from '../../../../components/debate/brightMirror/fictionToolbar';
import type { FictionToolbarProps } from '../../../../components/debate/brightMirror/fictionToolbar';

export const defaultFictionToolbar: FictionToolbarProps = {
  fictionId: 'azertyuiop',
  userCanDelete: true
};

storiesOf('FictionToolbar', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionToolbar {...defaultFictionToolbar} />));