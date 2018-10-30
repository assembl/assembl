// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import moment from 'moment';

import '../../../../css/components/profileLine.scss';
import AvatarImage from './avatarImage';

type Props = {
  userId: ?(number | string),
  userName: ?string,
  creationDate: string,
  locale: string,
  modified: boolean
};

class ProfileLine extends React.PureComponent<Props> {
  static defaultProps = {
    modified: false,
    creationDate: null
  };

  render() {
    const { userId, userName, creationDate, locale, modified } = this.props;
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
  }
}

export default ProfileLine;