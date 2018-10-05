// @flow
import * as React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { withRouter } from 'react-router';

import PreferencesQuery from '../../graphql/UserPreferencesQuery.graphql';
import manageErrorAndLoading from '../common/manageErrorAndLoading';
import { updateContentLocaleByOriginalLocale } from '../../actions/contentLocaleActions';
import { toggleHarvesting } from '../../actions/contextActions';
import { isHarvestable } from '../../utils/globalFunctions';

type HarvestingButtonProps = {
  data: UserPreferencesQuery,
  isActive: boolean,
  onClick: Function,
  updateByOriginalLocale: (from: string, into: string) => void,
  params: RouterParams
};

export class DumbHarvestingButton extends React.PureComponent<HarvestingButtonProps> {
  handleClick = () => {
    const { isActive, data, onClick, updateByOriginalLocale } = this.props;
    // $FlowFixMe
    const userPreferences = data.user && data.user.preferences;
    const translation = userPreferences && userPreferences.harvestingTranslation;
    if (!isActive && translation) {
      updateByOriginalLocale(translation.localeFrom, translation.localeInto);
    }
    onClick();
  };

  render() {
    const { isActive, params } = this.props;
    if (!isHarvestable(params)) {
      return null;
    }

    return (
      <span
        className={`is-harvesting-button assembl-icon-expert ${isActive ? 'active' : ''}`}
        onClick={this.handleClick}
        role="button"
        tabIndex={0}
        title={isActive ? I18n.t('harvesting.disableHarvestingMode') : I18n.t('harvesting.enableHarvestingMode')}
      >
        &nbsp;
      </span>
    );
  }
}

const mapStateToProps = ({ context: { isHarvesting, connectedUserIdBase64 } }) => ({
  isActive: isHarvesting,
  id: connectedUserIdBase64
});

const mapDispatchToProps = dispatch => ({
  onClick: () => {
    dispatch(toggleHarvesting());
  },
  updateByOriginalLocale: (from, into) => dispatch(updateContentLocaleByOriginalLocale(from, into))
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(PreferencesQuery, {
    options: () => ({ notifyOnNetworkStatusChange: true, fetchPolicy: 'network-only' })
  }),
  manageErrorAndLoading({ displayLoader: false }),
  withRouter
)(DumbHarvestingButton);