// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withKnobs, text, select } from '@storybook/addon-knobs';
/* eslint-enable */

import CircleAvatar from '../../../components/common/circleAvatar';
import { IMG_AVATAR } from '../../../constants';

export const customCircleAvatar = {
  src: 'https://loremflickr.com/300/300'
};

const playground = {
  size: '34',
  username: 'bright-mirror-author',
  src: [IMG_AVATAR, 'https://loremflickr.com/300/300']
};

storiesOf('CircleAvatar', module)
  .addDecorator(withKnobs)
  .add('default', () => <CircleAvatar />)
  .add('custom image', () => <CircleAvatar src={customCircleAvatar.src} />)
  .add('playground', () => (
    <CircleAvatar
      size={text('size', playground.size)}
      username={text('username', playground.username)}
      src={select('src', playground.src)}
    />
  ));