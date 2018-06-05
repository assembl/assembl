// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { type Route, type Router } from 'react-router';
import { I18n } from 'react-redux-i18n';

import { getEntryValueForLocale } from '../utils/i18n';
import ManageModules from '../components/administration/landingPage/manageModules';
import CustomizeHeader from '../components/administration/landingPage/customizeHeader';
import Navbar from '../components/administration/navbar';
import { displayAlert } from '../utils/utilityManager';
import SaveButton, { getMutationsPromises, runSerial } from '../components/administration/saveButton';
import landingPagePlugin from '../utils/administration/landingPage';
import updateDiscussionMutation from '../graphql/mutations/updateDiscussion.graphql';

type Props = {
  landingPageModules: Array<Object>,
  landingPageModulesHasChanged: boolean,
  refetchLandingPageModules: Function,
  route: Route,
  router: Router,
  section: string,
  editLocale: string,
  header: Object,
  pageHasChanged: boolean,
  page: Object,
  updateDiscussion: Function
};

type State = {
  refetching: boolean
};

class LandingPageAdmin extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      refetching: false
    };
  }

  componentDidMount() {
    this.props.router.setRouteLeaveHook(this.props.route, this.routerWillLeave);
  }

  componentWillUnmount() {
    this.props.router.setRouteLeaveHook(this.props.route, null);
  }

  routerWillLeave = () => {
    if (this.dataHaveChanged() && !this.state.refetching) {
      return I18n.t('administration.confirmUnsavedChanges');
    }

    return null;
  };

  getImageVariable = (img) => {
    const externalUrl = img ? img.externalUrl : null;
    if (externalUrl === 'TO_DELETE') {
      return externalUrl;
    }
    return typeof externalUrl === 'object' ? externalUrl : null;
  };

  saveAction = () => {
    const {
      landingPageModulesHasChanged,
      landingPageModules,
      refetchLandingPageModules,
      pageHasChanged,
      page,
      updateDiscussion
    } = this.props;
    displayAlert('success', `${I18n.t('loading.wait')}...`);
    if (landingPageModulesHasChanged) {
      const mutationsPromises = getMutationsPromises({
        items: landingPageModules,
        variablesCreator: landingPagePlugin.variablesCreator,
        createMutation: this.props[landingPagePlugin.createMutationName],
        updateMutation: this.props[landingPagePlugin.updateMutationName]
      });

      runSerial(mutationsPromises)
        .then(() => {
          refetchLandingPageModules().then(() => this.setState({ refetching: false }));
          displayAlert('success', I18n.t('administration.landingPage.successSave'));
        })
        .catch((error) => {
          displayAlert('danger', error, false, 30000);
        });
    }

    if (pageHasChanged) {
      updateDiscussion({
        variables: {
          titleEntries: page.titleEntries,
          subtitleEntries: page.subtitleEntries,
          buttonLabelEntries: page.buttonLabelEntries,
          headerImage: this.getImageVariable(page.headerImage),
          logoImage: this.getImageVariable(page.logoImage)
        }
      })
        .then(() => {
          displayAlert('success', I18n.t('administration.landingPage.successSave'));
        })
        .catch((error) => {
          displayAlert('danger', error.message);
        });
    }
  };

  dataHaveChanged = (): boolean => this.props.landingPageModulesHasChanged || this.props.pageHasChanged;

  render() {
    const { section } = this.props;
    const currentStep = parseInt(section, 10);
    const saveDisabled = !this.dataHaveChanged();
    return (
      <div className="landing-page-admin">
        <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />
        {section === '1' && <ManageModules {...this.props} />}
        {section === '2' && <CustomizeHeader {...this.props} />}
        {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={2} phaseIdentifier="landingPage" />}
      </div>
    );
  }
}

const mapStateToProps = ({ admin: { editLocale, landingPage } }) => {
  const { page } = landingPage;
  return {
    landingPageModulesHasChanged: landingPage.modulesHasChanged,
    landingPageModules: landingPage.modulesByIdentifier
      .map((module) => {
        const identifier = module.getIn(['moduleType', 'identifier']);
        const idx = landingPage.enabledModulesInOrder.indexOf(identifier);
        return module.set('order', idx + 1).set('_isNew', !module.get('existsInDatabase'));
      })
      .valueSeq()
      .toJS(),
    header: {
      title: getEntryValueForLocale(page.get('titleEntries'), editLocale, ''),
      subtitle: getEntryValueForLocale(page.get('subtitleEntries'), editLocale, ''),
      buttonLabel: getEntryValueForLocale(page.get('buttonLabelEntries'), editLocale, ''),
      headerImgMimeType: page.getIn(['headerImage', 'mimeType']),
      headerImgUrl: page.getIn(['headerImage', 'externalUrl']),
      headerImgTitle: page.getIn(['headerImage', 'title']),
      logoImgMimeType: page.getIn(['logoImage', 'mimeType']),
      logoImgUrl: page.getIn(['logoImage', 'externalUrl']),
      logoImgTitle: page.getIn(['logoImage', 'title'])
    },
    page: landingPage.page.toJS(),
    pageHasChanged: landingPage.pageHasChanged,
    editLocale: editLocale
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(landingPagePlugin.createMutation, {
    name: landingPagePlugin.createMutationName
  }),
  graphql(landingPagePlugin.updateMutation, {
    name: landingPagePlugin.updateMutationName
  }),
  graphql(updateDiscussionMutation, {
    name: 'updateDiscussion'
  })
)(LandingPageAdmin);