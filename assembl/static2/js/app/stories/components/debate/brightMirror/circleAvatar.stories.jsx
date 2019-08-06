// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withKnobs, text, select } from '@storybook/addon-knobs';
/* eslint-enable */

import { IMG_AVATAR } from '../../../../constants';
import CircleAvatar from '../../../../components/debate/brightMirror/circleAvatar';
import type { CircleAvatarProps } from '../../../../components/debate/brightMirror/circleAvatar';

export const defaultCircleAvatar: CircleAvatarProps = {
  username: 'taryn-treutel',
  src: 'https://loremflickr.com/300/300'
};

export const customCircleAvatar: CircleAvatarProps = {
  ...defaultCircleAvatar,
  username: '',
  src: ''
};

const playground = {
  username: 'taryn-treutel',
  src: ['https://loremflickr.com/300/300', IMG_AVATAR]
};

storiesOf('CircleAvatar', module)
  .addDecorator(withKnobs)
  .add('default', () => <CircleAvatar {...defaultCircleAvatar} />)
  .add('no username', () => <CircleAvatar {...customCircleAvatar} />)
  .add('playground', () => (
    <CircleAvatar username={text('username', playground.username)} src={select('src', playground.src, playground.src[0])} />
  ));