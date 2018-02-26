// @flow

import React from 'react';
import { Link } from 'react-router';

import Search from '../search';
import Avatar from '../common/avatar';
import { getConnectedUserId } from '../../utils/globalFunctions';
import { connectedUserIsExpert } from '../../utils/permissions';

type Props = {
  location: string,
  currentPhaseIdentifier: string,
  helpUrl: string,
  remainingWidth?: number
};

const shouldShowUsername = (remainingWidth, breakPoint) =>
  (typeof remainingWidth === 'number' ? remainingWidth > breakPoint : true);

const shouldShowExpertIcons = connectedUserIsExpert();

const handleHarvestingModeClick = () => {
  // TODO: activate harvesting mode (which probably means changing a property of application state)
};

const UserMenu = ({ location, currentPhaseIdentifier, helpUrl, remainingWidth }: Props) => (
  <div className="navbar-icons">
    {shouldShowExpertIcons && (
      <span className="assembl-icon-catch" onClick={handleHarvestingModeClick} role="button" tabIndex={0}>
        &nbsp;
      </span>
    )}
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
    <Avatar location={location} showUsername={shouldShowUsername(remainingWidth, 450)} />
  </div>
);

UserMenu.defaultProps = {
  remainingWidth: null
};

export default UserMenu;