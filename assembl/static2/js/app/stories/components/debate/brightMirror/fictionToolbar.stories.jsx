// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, boolean } from '@storybook/addon-knobs';
/* eslint-enable */

import FictionToolbar from '../../../../components/debate/brightMirror/fictionToolbar';
import { PublicationStates } from '../../../../constants';
import type { FictionToolbarProps } from '../../../../components/debate/brightMirror/fictionToolbar';

const fictionMetaInfo: BrightMirrorFictionProps = {
  fictionId: 'his-name-s-forrest',
  phase: 'like-me',
  slug: 'i-named-him-after-his-daddy',
  themeId: 'he-got-a-daddy-named-forrest-too'
};

export const defaultFictionToolbar: FictionToolbarProps = {
  fictionId: 'azertyuiop',
  fictionMetaInfo: fictionMetaInfo,
  lang: 'fr',
  onDeleteCallback: action('onDeleteCallback'),
  onModifyCallback: action('onModifyCallback'),
  originalBody: 'Vous ne voulez pas un whisky d abord?',
  publicationState: PublicationStates.PUBLISHED,
  title: 'Red is dead',
  userCanDelete: true,
  userCanEdit: true
};

const playground = {
  ...defaultFictionToolbar
};

storiesOf('FictionToolbar', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionToolbar {...defaultFictionToolbar} />))
  .add(
    'playground',
    withInfo()(() => (
      <FictionToolbar
        {...playground}
        userCanDelete={boolean('userCanDelete', playground.userCanDelete)}
        userCanEdit={boolean('userCanEdit', playground.userCanEdit)}
      />
    ))
  );