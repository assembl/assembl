// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, boolean, select } from '@storybook/addon-knobs';
/* eslint-enable */

import { PublicationStates } from '../../../../constants';
import FictionPreview from '../../../../components/debate/brightMirror/fictionPreview';
import type { FictionPreviewProps } from '../../../../components/debate/brightMirror/fictionPreview';
import type { BrightMirrorFictionProps } from '../../../../pages/brightMirrorFiction';

const fictionMetaInfo: BrightMirrorFictionProps = {
  fictionId: 'his-name-s-forrest',
  phase: 'like-me',
  slug: 'i-named-him-after-his-daddy',
  themeId: 'he-got-a-daddy-named-forrest-too'
};

export const customFictionPreview: FictionPreviewProps = {
  id: '0',
  title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis tincidunt dolor.',
  authorName: 'John Doe',
  creationDate: '01/01/2018',
  link: '/url/preview',
  color: '#b3e5fc',
  originalBody: 'Origin body',
  refetchIdea: action('refetchIdea'),
  lang: 'fr',
  userCanEdit: true,
  userCanDelete: true,
  deleteFictionHandler: action('deleteFictionHandler'),
  publicationState: PublicationStates.PUBLISHED,
  fictionMetaInfo: fictionMetaInfo
};

storiesOf('FictionPreview', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionPreview {...customFictionPreview} />))
  .add(
    'playground',
    withInfo()(() => (
      <FictionPreview
        id={customFictionPreview.id}
        title={text('title', customFictionPreview.title)}
        authorName={text('author name', customFictionPreview.authorName)}
        creationDate={text('creation date', customFictionPreview.creationDate)}
        link={text('url', customFictionPreview.link)}
        color={text('color', customFictionPreview.color)}
        originalBody={text('original body', customFictionPreview.originalBody)}
        refetchIdea={customFictionPreview.refetchIdea}
        lang={text('original locale', customFictionPreview.lang)}
        userCanEdit={boolean('User can edit', customFictionPreview.userCanEdit)}
        userCanDelete={boolean('User can delete', customFictionPreview.userCanDelete)}
        deleteFictionHandler={customFictionPreview.deleteFictionHandler}
        publicationState={select('publicationState', PublicationStates, PublicationStates.PUBLISHED)}
        fictionMetaInfo={customFictionPreview.fictionMetaInfo}
      />
    ))
  );