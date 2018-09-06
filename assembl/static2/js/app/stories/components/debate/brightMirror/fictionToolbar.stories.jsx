// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
/* eslint-enable */

import FictionToolbar from '../../../../components/debate/brightMirror/fictionToolbar';
import type { FictionToolbarProps } from '../../../../components/debate/brightMirror/fictionToolbar';

export const defaultFictionToolbar: FictionToolbarProps = {
  fictionId: 'azertyuiop',
  title: 'Red is dead',
  originalBody: 'Vous ne voulez pas un whisky d abord?',
  lang: 'fr',
  userCanEdit: true,
  userCanDelete: true,
  onModifyCallback: action('onModifyCallback'),
  onDeleteCallback: action('onDeleteCallback')
};

storiesOf('FictionToolbar', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionToolbar {...defaultFictionToolbar} />));