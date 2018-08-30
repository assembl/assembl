// @flow
import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import Search from '../search';
import Avatar from '../common/avatar';
import { getConnectedUserId } from '../../utils/globalFunctions';
import { connectedUserIsExpert } from '../../utils/permissions';
import { toggleHarvesting } from '../../actions/contextActions';

type IsHarvestingButtonProps = {
  isActive: boolean,
  handleClick: Function
};

const IsHarvestingButton = ({ isActive, handleClick }: IsHarvestingButtonProps) => (
  <span
    className={`is-harvesting-button assembl-icon-expert ${isActive ? 'active' : ''}`}
    onClick={handleClick}
    role="button"
    tabIndex={0}
    title={isActive ? I18n.t('harvesting.disableHarvestingMode') : I18n.t('harvesting.enableHarvestingMode')}
  >
    &nbsp;
  </span>
);

type UserMenuProps = {
  location: string,
  currentPhaseIdentifier: string,
  helpUrl: string,
  remainingWidth?: number,
  isHarvesting: boolean,
  themeId: ?string,
  handleIsHarvestingButtonClick: Function,
  loginData: ?Object
};

const shouldShowUsername = (remainingWidth, breakPoint) =>
  (typeof remainingWidth === 'number' ? remainingWidth > breakPoint : true);

const shouldShowExpertIcons = connectedUserIsExpert();

const UserMenu = ({
  location,
  currentPhaseIdentifier,
  helpUrl,
  remainingWidth,
  isHarvesting,
  handleIsHarvestingButtonClick,
  themeId,
  loginData
}: UserMenuProps) => (
  <div className="navbar-icons">
    {shouldShowExpertIcons &&
      themeId && <IsHarvestingButton isActive={isHarvesting} handleClick={handleIsHarvestingButtonClick} />}
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
    <Avatar
      location={location}
      showUsername={shouldShowUsername(remainingWidth, 450)}
      loginData={loginData}
    />
  </div>
);

UserMenu.defaultProps = {
  remainingWidth: null
};

const mapStateToProps = state => ({
  isHarvesting: state.context.isHarvesting
});

const mapDispatchToProps = dispatch => ({
  handleIsHarvestingButtonClick: () => {
    dispatch(toggleHarvesting());
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(UserMenu);