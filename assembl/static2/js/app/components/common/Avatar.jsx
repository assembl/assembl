import React from 'react';
import styled from 'styled-components';
import RoundedImg from './RoundedImg';

const RoundedImgWithMargin = styled(RoundedImg)`
  margin-right: 5px;
`;

const Avatar = (props) => {
  const { userId, userName } = props;
  const src = `/user/id/${userId}/avatar/30`;
  return (
    // <a
    //   href="#"
    //   className="avatar img-rounded sk-avatar"
    //   data-toggle="tooltip"
    //   data-placement="top"
    //   data-original-title={userName}
    // >
    <span>
      <RoundedImgWithMargin
        src={src}
        width="30"
        height="30"
        alt={userName}
        onError={(e) => { const target = e.target; target.src = '/static/img/icon/user.png'; }}
      />
      {userName}
    </span>
  );
};

export default Avatar;