// @flow
import React from 'react';

type Props = {
  /** Optional avatar size (identical width and height) */
  size?: string,
  /** Optional username related to the avatar */
  username?: string,
  /** Optional source of the image */
  src?: string
};

const CircleAvatar = ({ size, username, src }: Props) => (
  <img
    className="circle-avatar"
    src={src}
    width={size}
    height={size}
    // $FlowFixMe Cannot coerce `username` to string because undefined [1] should not be coerced
    alt={`${username}-avatar`}
  />
);

CircleAvatar.defaultProps = {
  size: '34',
  username: 'no-username',
  src: '/static2/img/icons/avatar.png'
};

export default CircleAvatar;