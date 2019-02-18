// @flow
import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';

import BackIcon from '../../common/icons/backIcon/backIcon';

export type Props = {
  handleClick: Function,
  linkClassName: ?string
};

const BackButton = ({ handleClick, linkClassName }: Props) => (
  <Link className={linkClassName} onClick={handleClick}>
    <BackIcon className="blackIcon hidden-sm hidden-md hidden-lg" />
    <div className="share-button action-button hidden-xs">
      <div className="share-icon-container">
        <BackIcon className="whiteIcon" />
      </div>
      <div className="action-button-label">
        <Translate value="debate.back" />
      </div>
    </div>
  </Link>
);

export default BackButton;