// @flow
import React from 'react';

type Props = {
  userId: ?(number | string),
  userName: ?string
};

class AvatarImage extends React.PureComponent<Props> {
  render() {
    const { userId, userName } = this.props;
    const src = userId ? `/user/id/${userId}/avatar/30` : '/static2/img/icons/avatar.png';
    return (
      <img
        src={src}
        width="30"
        height="30"
        alt={userName}
        onError={(e) => {
          const target = e.target;
          target.src = '/static2/img/icons/avatar.png';
        }}
      />
    );
  }
}

export default AvatarImage;