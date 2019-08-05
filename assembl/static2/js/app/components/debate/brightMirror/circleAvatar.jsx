// @flow
import React from 'react';

import { IMG_AVATAR } from '../../../constants';

export type CircleAvatarProps = {
  /** Username related to the avatar */
  username: string,
  /** Source of the image */
  src: string
};

const noUsernameAlt: string = 'no-username';
const noUsernameAvatarSrc: string = IMG_AVATAR;

const CircleAvatar = ({ username, src }: CircleAvatarProps) => (
  <img
    className="circle-avatar"
    src={src || noUsernameAvatarSrc}
    alt={username ? `${username}-avatar` : `${noUsernameAlt}-avatar`}
  />
);

CircleAvatar.defaultProps = {
  username: '',
  src: ''
};

export default CircleAvatar;