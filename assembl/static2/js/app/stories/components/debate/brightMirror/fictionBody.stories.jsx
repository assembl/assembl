// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text } from '@storybook/addon-knobs';
/* eslint-enable */

import FictionBody from '../../../../components/debate/brightMirror/fictionBody';
import type { FictionBodyType } from '../../../../components/debate/brightMirror/fictionBody';

export const defaultFictionBody: FictionBodyType = {
  title: 'Les émotifs',
  content: `
    <p><strong>Lorem Ipsum</strong> is simply dummy text of the printing and typesetting industry. Lorem Ipsum has
    been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
    scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
    electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of
    Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus
    PageMaker including versions of Lorem Ipsum.</p><p></p><p></p><div class="atomic-block" data-blocktype="atomic">
    <img class="attachment-image" src="http://localhost:6543/data/Discussion/2/documents/2417/data" alt=""
    title="one-piece-unlimited-cruise-sp-banner.jpg" data-id="2417" data-mimetype="image/jpeg"></div><p></p><p>
    <strong>Lorem Ipsum</strong> is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
    the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled
    it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting,
    remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem
    Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem
    Ipsum.</p><p></p><p><strong>Lorem Ipsum</strong> is simply dummy text of the printing and typesetting industry. Lorem
    Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type
    and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic
    typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing
    Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem
    Ipsum.</p><p></p><p></p><div class="atomic-block" data-blocktype="atomic"><img class="attachment-image"
    src="http://localhost:6543/data/Discussion/2/documents/2418/data" alt="" title="one-piece-unlimited-cruise-sp-banner.jpg"
    data-id="2418" data-mimetype="image/jpeg"></div><p></p><p><strong>Lorem Ipsum</strong> is simply dummy text of the printing
    and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown
    printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but
    also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release
    of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker
    including versions of Lorem Ipsum.</p>
  `
};

const noFictionBody: FictionBodyType = {
  ...defaultFictionBody,
  title: '',
  content: ''
};

const playgroundFictionBody = { ...defaultFictionBody };

storiesOf('FictionBody', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionBody {...defaultFictionBody} />))
  .add('no content ', withInfo()(() => <FictionBody {...noFictionBody} />))
  .add(
    'playground',
    withInfo()(() => (
      <FictionBody title={text('title', playgroundFictionBody.title)} content={text('content', playgroundFictionBody.content)} />
    ))
  );