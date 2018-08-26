// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, date, object } from '@storybook/addon-knobs';
/* eslint-enable */

import FictionHeader from '../../../../components/debate/brightMirror/fictionHeader';
import type { FictionHeaderType } from '../../../../components/debate/brightMirror/fictionHeader';

// import existing storybook data
import { defaultCircleAvatar } from './circleAvatar.stories';

const defaultFictionHeader: FictionHeaderType = {
  authorFullname: 'Helen Aguilar',
  publishedDate: new Date('2018-07-09'),
  circleAvatar: { ...defaultCircleAvatar }
};

const playgroundButton = {
  ...defaultFictionHeader
};

// Convert knob date to regular date
// Check https://github.com/storybooks/storybook/tree/master/addons/knobs - date section for more info
const myDateKnob = (name, defaultValue) => {
  const stringTimestamp = date(name, defaultValue);
  return new Date(stringTimestamp);
};

storiesOf('FictionHeader', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionHeader {...defaultFictionHeader} />))
  .add(
    'playground',
    withInfo()(() => (
      <FictionHeader
        authorFullname={text('authorFullname', playgroundButton.authorFullname)}
        publishedDate={myDateKnob('publishedDate', playgroundButton.publishedDate)}
        circleAvatar={object('circleAvatar', playgroundButton.circleAvatar)}
      />
    ))
  );