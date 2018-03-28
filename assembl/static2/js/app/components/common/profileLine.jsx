import React from 'react';
import { Translate } from 'react-redux-i18n';
import moment from 'moment';
import '../../../../css/components/profileLine.scss';
import AvatarImage from './avatarImage';

const ProfileLine = (props) => {
  const { userId, userName, creationDate, locale, modified } = props;
  return (
    <div className="profileLine">
      <div className="inline">
        <AvatarImage userId={userId} userName={userName} />
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