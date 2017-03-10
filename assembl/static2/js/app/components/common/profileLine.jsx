import React from 'react';
import '../../../../css/components/profileLine.scss';

const ProfileLine = (props) => {
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
    <span className="profileLine">
      <img
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

export default ProfileLine;