// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
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

const playgroundButton = {
  ...defaultFictionHeader
};

storiesOf('FictionHeader', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionHeader {...defaultFictionHeader} />))
  .add(
    'playground',
    withInfo()(() => (
      <FictionHeader
        authorFullname={text('authorFullname', playgroundButton.authorFullname)}
        publishedDate={text('publishedDate', playgroundButton.publishedDate)}
        displayedPublishedDate={text('displayedPublishedDate', playgroundButton.displayedPublishedDate)}
        circleAvatar={object('circleAvatar', playgroundButton.circleAvatar)}
      />
    ))
  );