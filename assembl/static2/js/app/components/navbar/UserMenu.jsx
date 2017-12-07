// @flow

import React from 'react';
import { Link } from 'react-router';

import Search from '../search';
import Avatar from '../common/avatar';
import { getConnectedUserId } from '../../utils/globalFunctions';

type Props = {
  location: string,
  currentPhaseIdentifier: string,
  helpUrl: string
};

const UserMenu = ({ location, currentPhaseIdentifier, helpUrl }: Props) => (
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
    <Avatar location={location} />
  </div>
);

export default UserMenu;