// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text } from '@storybook/addon-knobs';
/* eslint-enable */

import FictionPreview from '../../../../components/debate/brightMirror/fictionPreview';
import type { FictionPreviewType } from '../../../../components/debate/brightMirror/fictionPreview';

export const customFictionPreview: FictionPreviewType = {
  title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis tincidunt dolor.',
  authorName: 'John Doe',
  creationDate: '01/01/2018',
  link: '/url/preview',
  color: '#b3e5fc'
};

const playgroundFictionPreview: FictionPreviewType = {
  title: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis tincidunt dolor.',
  authorName: 'John Doe',
  creationDate: '01/01/2018',
  link: '/url/preview',
  color: '#b3e5fc'
};

storiesOf('FictionPreview', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionPreview {...customFictionPreview} />))
  .add(
    'playground',
    withInfo()(() => (
      <FictionPreview
        title={text('title', playgroundFictionPreview.title)}
        authorName={text('author name', playgroundFictionPreview.authorName)}
        creationDate={text('creation date', playgroundFictionPreview.creationDate)}
        link={text('url', playgroundFictionPreview.link)}
        color={text('color', playgroundFictionPreview.color)}
      />
    ))
  );