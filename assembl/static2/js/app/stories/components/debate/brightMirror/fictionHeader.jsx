// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, object } from '@storybook/addon-knobs';
/* eslint-enable */

import FictionHeader from '../../../../components/debate/brightMirror/fictionHeader';

// import existing storybook data
import { customCircleAvatar } from './circleAvatar';

export const customFictionHeader = {
  authorFullname: 'Helen Aguilar',
  publishedDate: '2018-07-09',
  circleAvatar: { ...customCircleAvatar }
};

const playgroundButton = {
  authorFullname: 'Helen Aguilar',
  publishedDate: '2018-07-09',
  circleAvatar: { ...customCircleAvatar }
};

storiesOf('FictionHeader', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionHeader />))
  .add('custom header', withInfo()(() => <FictionHeader {...customFictionHeader} />))
  .add(
    'playground',
    withInfo()(() => (
      <FictionHeader
        authorFullname={text('authorFullname', playgroundButton.authorFullname)}
        publishedDate={text('publishedDate', playgroundButton.publishedDate)}
        circleAvatar={object('circleAvatar', playgroundButton.circleAvatar)}
      />
    ))
  );