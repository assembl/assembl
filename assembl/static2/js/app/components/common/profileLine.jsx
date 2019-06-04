// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import moment from 'moment';
import classnames from 'classnames';

import '../../../../css/components/profileLine.scss';
import AvatarImage from './avatarImage';

type Props = {
  userId: ?(number | string),
  userName: ?string,
  creationDate?: string | null,
  locale?: string,
  modified?: boolean,
  userNameModerationClasses?: ?string
};

class ProfileLine extends React.PureComponent<Props> {
  static defaultProps = {
    modified: false,
    creationDate: null,
    userNameModerationClasses: null,
    locale: 'en'
  };

  render() {
    const { userId, userName, creationDate, locale, modified, userNameModerationClasses } = this.props;
    const userNameClasses = classnames('creator', userNameModerationClasses);
    return (
      <div className="profileLine">
        <div className="align-flex">
          <div>
            <AvatarImage userId={userId} userName={userName} />
          </div>
          <div className={userNameClasses}>{userName}</div>
          {creationDate &&
            locale && (
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