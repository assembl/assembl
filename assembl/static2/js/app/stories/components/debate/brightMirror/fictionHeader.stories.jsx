// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withKnobs, text, object } from '@storybook/addon-knobs';
/* eslint-enable */

import FictionHeader from '../../../../components/debate/brightMirror/fictionHeader';
import type { FictionHeaderProps } from '../../../../components/debate/brightMirror/fictionHeader';

// import existing storybook data
import { defaultCircleAvatar } from './circleAvatar.stories';

export const defaultFictionHeader: FictionHeaderProps = {
  authorFullname: 'Helen Aguilar',
  publishedDate: '2018-07-09',
  displayedPublishedDate: 'August 8th, 2018',
  circleAvatar: { ...defaultCircleAvatar }
};

const playground = {
  ...defaultFictionHeader
};

storiesOf('FictionHeader', module)
  .addDecorator(withKnobs)
  .add('default', () => <FictionHeader {...defaultFictionHeader} />)
  .add('playground', () => (
    <FictionHeader
      authorFullname={text('authorFullname', playground.authorFullname)}
      publishedDate={text('publishedDate', playground.publishedDate)}
      displayedPublishedDate={text('displayedPublishedDate', playground.displayedPublishedDate)}
      circleAvatar={object('circleAvatar', playground.circleAvatar)}
    />
  ));