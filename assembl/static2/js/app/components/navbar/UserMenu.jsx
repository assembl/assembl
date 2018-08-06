// @flow
import * as React from 'react';
import { Link } from 'react-router';

import Search from '../search';
import Avatar from '../common/avatar';
import { getConnectedUserId } from '../../utils/globalFunctions';
import { connectedUserIsExpert } from '../../utils/permissions';
import HarvestingButton from './harvestingButton';

type UserMenuProps = {
  location: string,
  helpUrl: string,
  remainingWidth?: number
};

const shouldShowUsername = (remainingWidth, breakPoint) =>
  (typeof remainingWidth === 'number' ? remainingWidth > breakPoint : true);

const shouldShowExpertIcons = connectedUserIsExpert();

const UserMenu = ({ location, helpUrl, remainingWidth }: UserMenuProps) => (
  <div className="navbar-icons">
    {shouldShowExpertIcons && <HarvestingButton />}
    <div id="search">
      <Search />
    </div>
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
  remainingWidth: null,
  themeId: ''
};

export default UserMenu;