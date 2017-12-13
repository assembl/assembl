// @flow

import React from 'react';
import { Link } from 'react-router';

import Search from '../search';
import Avatar from '../common/avatar';
import { getConnectedUserId } from '../../utils/globalFunctions';

type Props = {
  location: string,
  currentPhaseIdentifier: string,
  helpUrl: string,
  remainingWidth?: number
};

const shouldShow = (remainingWidth, breakPoint) => (typeof remainingWidth === 'number' ? remainingWidth > breakPoint : true);

const UserMenu = ({ location, currentPhaseIdentifier, helpUrl, remainingWidth }: Props) => (
  <div className="navbar-icons">
    {currentPhaseIdentifier !== 'survey' && (
      <div id="search">
        <Search />
      </div>
    )}
    {getConnectedUserId() &&
      helpUrl && (
        <Link to={helpUrl} target="_blank">
          <span className="assembl-icon-faq grey" />
        </Link>
      )}
    <Avatar location={location} showUsername={shouldShow(remainingWidth, 450)} />
  </div>
);

UserMenu.defaultProps = {
  remainingWidth: null
};

export default UserMenu;