// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text } from '@storybook/addon-knobs';
/* eslint-enable */

import FictionCommentHeader from '../../../../components/debate/brightMirror/fictionCommentHeader';
import type { FictionCommentHeaderProps } from '../../../../components/debate/brightMirror/fictionCommentHeader';

export const defaultFictionCommentHeader: FictionCommentHeaderProps = {
  strongTitle: 'Prenez la parole !',
  title: 'Quels sujets sont abordés dans cette fiction ?',
  imgSrc: '/static2/img/illustration-mechanisme.png',
  imgAlt: 'illustration-mechanisme',
  subtitle: '6 messages'
};

const playgroundButton = {
  ...defaultFictionCommentHeader
};

storiesOf('FictionCommentHeader', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionCommentHeader {...defaultFictionCommentHeader} />))
  .add(
    'playground',
    withInfo()(() => (
      <FictionCommentHeader
        strongTitle={text('Strong title', playgroundButton.strongTitle)}
        title={text('Title', playgroundButton.title)}
        imgSrc={text('Image source', playgroundButton.imgSrc)}
        imgAlt={text('Image alt description', playgroundButton.imgAlt)}
        subtitle={text('Subtitle', playgroundButton.subtitle)}
      />
    ))
  );