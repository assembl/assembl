// @flow
import React from 'react';

export type CircleAvatarType = {
  /** Optional avatar size (identical width and height) */
  size?: string,
  /** Optional username related to the avatar */
  username?: string,
  /** Optional source of the image */
  src?: string
};

const circleAvatar = ({ size, username, src }: CircleAvatarType) => (
  <img className="circle-avatar" src={src} width={size} height={size} alt={`${(username: any)}-avatar`} />
);

circleAvatar.defaultProps = {
  size: '34',
  username: 'no-username',
  src: '/static2/img/icons/avatar.png'
};

export default circleAvatar;