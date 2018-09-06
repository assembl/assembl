// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, boolean } from '@storybook/addon-knobs';
/* eslint-enable */

import FictionPreview from '../../../../components/debate/brightMirror/fictionPreview';
import type { FictionPreviewProps } from '../../../../components/debate/brightMirror/fictionPreview';

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
  userCanDelete: true
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
      />
    ))
  );