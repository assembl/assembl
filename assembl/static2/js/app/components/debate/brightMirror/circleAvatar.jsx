// @flow
import React from 'react';

export type CircleAvatarType = {
  /** Username related to the avatar */
  username: string,
  /** Source of the image */
  src: string
};

const noUsernameAlt: string = 'no-username';
const noUsernameAvatarSrc: string = '/static2/img/icons/avatar.png';

const circleAvatar = ({ username, src }: CircleAvatarType) => (
  <img
    className="circle-avatar"
    src={src || noUsernameAvatarSrc}
    alt={username ? `${username}-avatar` : `${noUsernameAlt}-avatar`}
  />
);

export default circleAvatar;