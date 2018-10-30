// @flow
import React from 'react';

import { EMPTY_STRING } from '../../constants';
import { getIconPath } from '../../utils/globalFunctions';

type Props = {
  /** Optional avatar size (identical width and height) */
  size?: string,
  /** Optional username related to the avatar */
  username?: string,
  /** Optional source of the image */
  src?: string
};

const CircleAvatar = ({ size, username, src }: Props) => (
  <img className="circle-avatar" src={src} width={size} height={size} alt={username ? `${username}-avatar` : EMPTY_STRING} />
);

CircleAvatar.defaultProps = {
  size: '34',
  username: 'no-username',
  src: getIconPath('avatar.png')
};

export default CircleAvatar;