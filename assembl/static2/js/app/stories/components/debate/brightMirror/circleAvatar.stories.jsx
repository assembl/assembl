// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, select } from '@storybook/addon-knobs';
/* eslint-enable */

import CircleAvatar from '../../../../components/debate/brightMirror/circleAvatar';
import type { CircleAvatarType } from '../../../../components/debate/brightMirror/circleAvatar';

export const defaultCircleAvatar: CircleAvatarType = {
  username: 'taryn-treutel',
  src: 'https://loremflickr.com/300/300'
};

const customCircleAvatar: CircleAvatarType = {
  ...defaultCircleAvatar,
  username: '',
  src: ''
};

const playgroundButton = {
  username: 'taryn-treutel',
  src: ['https://loremflickr.com/300/300', '/static2/img/icons/avatar.png']
};

storiesOf('CircleAvatar', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <CircleAvatar {...defaultCircleAvatar} />))
  .add('no username', withInfo()(() => <CircleAvatar {...customCircleAvatar} />))
  .add(
    'playground',
    withInfo()(() => (
      <CircleAvatar
        username={text('username', playgroundButton.username)}
        src={select('src', playgroundButton.src, playgroundButton.src[0])}
      />
    ))
  );