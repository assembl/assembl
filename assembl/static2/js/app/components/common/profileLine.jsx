import React from 'react';
import { Translate } from 'react-redux-i18n';
import moment from 'moment';
import '../../../../css/components/profileLine.scss';

const ProfileLine = (props) => {
  const { userId, userName, creationDate, locale, modified } = props;
  const src = `/user/id/${userId}/avatar/30`;
  return (
    <div className="profileLine">
      <div className="inline">
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
      </div>
      <div className="user">
        <div className="creator">{userName}</div>
        {creationDate && (
          <div className="date">
            {moment(creationDate)
              .locale(locale)
              .fromNow()}
            {modified ? (
              <span>
                {' - '}
                <Translate value="debate.thread.postEdited" />
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

ProfileLine.defaultProps = {
  modified: false,
  creationDate: null
};

export default ProfileLine;