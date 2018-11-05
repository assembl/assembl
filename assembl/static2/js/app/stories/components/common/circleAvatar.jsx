// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, select } from '@storybook/addon-knobs';
/* eslint-enable */

import CircleAvatar from '../../../components/common/circleAvatar';
import { getIconPath } from '../../../utils/globalFunctions';

export const customCircleAvatar = {
  src: 'https://loremflickr.com/300/300'
};

const playground = {
  size: '34',
  username: 'bright-mirror-author',
  src: [getIconPath('avatar.png'), 'https://loremflickr.com/300/300']
};

storiesOf('CircleAvatar', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <CircleAvatar />))
  .add('custom image', withInfo()(() => <CircleAvatar src={customCircleAvatar.src} />))
  .add(
    'playground',
    withInfo()(() => (
      <CircleAvatar
        size={text('size', playground.size)}
        username={text('username', playground.username)}
        src={select('src', playground.src)}
      />
    ))
  );