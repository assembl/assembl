// @flow
import * as React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import UserPreferencesQuery from '../../graphql/UserPreferencesQuery.graphql';
import withoutLoadingIndicator from '../common/withoutLoadingIndicator';
import { updateContentLocaleByOriginalLocale } from '../../actions/contentLocaleActions';
import { toggleHarvesting } from '../../actions/contextActions';

// TODO generate the graphql_types.flow, I have an error :( and no time to resolve it
type Translation = {
  localeFrom: string,
  localeInto: string
};

type PreferencesType = {
  harvestingTranslation: Translation
};

type DataType = {
  user: {
    preferences: PreferencesType
  }
};
// end

type HarvestingButtonProps = {
  data: DataType,
  isActive: boolean,
  onClick: Function,
  updateByOriginalLocale: (from: string, into: string) => void
};

export class DumbHarvestingButton extends React.PureComponent<HarvestingButtonProps> {
  handleClick = () => {
    const { data, onClick, updateByOriginalLocale } = this.props;
    const translation = data.user.preferences.harvestingTranslation;
    if (translation) {
      updateByOriginalLocale(translation.localeFrom, translation.localeInto);
    }
    onClick();
  };

  render() {
    const { isActive } = this.props;
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

const mapStateToProps = state => ({
  isActive: state.context.isHarvesting,
  id: btoa(`AgentProfile:${state.context.connectedUserId}`)
});

const mapDispatchToProps = dispatch => ({
  onClick: () => {
    dispatch(toggleHarvesting());
  },
  updateByOriginalLocale: (from, into) => dispatch(updateContentLocaleByOriginalLocale(from, into))
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(UserPreferencesQuery, {
    options: () => ({ notifyOnNetworkStatusChange: true })
  }),
  withoutLoadingIndicator()
)(DumbHarvestingButton);