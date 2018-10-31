// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text } from '@storybook/addon-knobs';
/* eslint-enable */

import FictionBody from '../../../../components/debate/brightMirror/fictionBody';
import type { Props as FictionBodyProps } from '../../../../components/debate/brightMirror/fictionBody';

export const defaultFictionBody: FictionBodyProps = {
  ideaId: '0',
  id: '0',
  title: 'Les émotifs',
  content: `
    <p><strong>Lorem Ipsum</strong> is simply dummy text of the printing and typesetting industry. Lorem Ipsum has
    been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
    scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
    electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of
    Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus
    PageMaker including versions of Lorem Ipsum.</p><p></p><p></p><div class="atomic-block" data-blocktype="atomic">
    <img class="attachment-image" src="https://loremflickr.com/g/1100/400/paris" alt=""
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
    src="https://loremflickr.com/g/1100/400/brazil,rio" alt="" title="one-piece-unlimited-cruise-sp-banner.jpg"
    data-id="2418" data-mimetype="image/jpeg"></div><p></p><p><strong>Lorem Ipsum</strong> is simply dummy text of the printing
    and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown
    printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but
    also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release
    of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker
    including versions of Lorem Ipsum.</p>
  `,
  contentLocale: 'fr',
  lang: 'fr',
  extracts: [],
  dbId: 1,
  bodyMimeType: 'text/html',
  refetchPost: Function,
  userCanReply: false
};

const noFictionBody: FictionBodyProps = {
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
      <FictionBody
        id={text('id', playgroundFictionBody.id)}
        title={text('title', playgroundFictionBody.title)}
        content={text('content', playgroundFictionBody.content)}
        contentLocale={text('contentLocale', playgroundFictionBody.contentLocale)}
        lang={text('lang', playgroundFictionBody.lang)}
        extracts={playgroundFictionBody.extracts}
        dbId={playgroundFictionBody.dbId}
        bodyMimeType={playgroundFictionBody.bodyMimeType}
        refetchPost={playgroundFictionBody.refetchPost}
        ideaId={playgroundFictionBody.ideaId}
        userCanReply={playgroundFictionBody.userCanReply}
      />
    ))
  );