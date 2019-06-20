// @flow
import React from 'react';

import { getIconPath } from '../../utils/globalFunctions';

type Props = {
  userId: ?(number | string),
  userName: ?string
};

class AvatarImage extends React.PureComponent<Props> {
  render() {
    const { userId, userName } = this.props;
    const avatarIcon = getIconPath('avatar.png');
    const src = userId ? `/user/id/${userId}/avatar/30` : avatarIcon;
    return (
      <img
        className="avatar-logo"
        src={src}
        width="30"
        height="30"
        alt={userName}
        onError={(e) => {
          const target = e.target;
          target.src = avatarIcon;
        }}
      />
    );
  }
}

export default AvatarImage;