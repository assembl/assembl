// @flow
import React from 'react';
import { connect, type Dispatch, type MapStateToProps } from 'react-redux';
import { type Route, type Router } from 'react-router';
import { type ApolloClient, compose, graphql, withApollo } from 'react-apollo';
import { I18n } from 'react-redux-i18n';
import { type Map } from 'immutable';

import { languagePreferencesHasChanged, updateEditLocale } from '../actions/adminActions';
import ManageSectionsForm from '../components/administration/discussion/manageSectionsForm';
import LegalNoticeAndTermsForm from '../components/administration/discussion/legalNoticeAndTermsForm';
import LanguageSection from '../components/administration/discussion/languageSection';
import { displayAlert } from '../utils/utilityManager';
import { convertEntriesToHTML } from '../utils/draftjs';
import SaveButton, { getMutationsPromises, runSerial } from '../components/administration/saveButton';
import createSectionMutation from '../graphql/mutations/createSection.graphql';
import updateSectionMutation from '../graphql/mutations/updateSection.graphql';
import deleteSectionMutation from '../graphql/mutations/deleteSection.graphql';
import updateLegalNoticeAndTermsMutation from '../graphql/mutations/updateLegalNoticeAndTerms.graphql';
import updateDiscussionPreferenceQuery from '../graphql/mutations/updateDiscussionPreference.graphql';
import getDiscussionPreferenceLanguage from '../graphql/DiscussionPreferenceLanguage.graphql';
import { type LanguagePreferencesState } from '../reducers/adminReducer';
import { type State as ReduxState } from '../reducers/rootReducer';

type Section = Object;

const createVariablesForSectionMutation = section => ({
  type: section.type,
  url: section.url,
  order: section.order,
  titleEntries: section.titleEntries
});

const createVariablesForDeleteSectionMutation = section => ({ sectionId: section.id });

type Props = {
  changeLocale: Function,
  client: ApolloClient,
  createSection: Function,
  deleteSection: Function,
  editLocale: string,
  i18n: {
    locale: string,
    translations: { [string]: string }
  },
  languagePreferenceHasChanged: boolean,
  legalNoticeAndTerms: Map,
  preferences: LanguagePreferencesState,
  refetchLegalNoticeAndTerms: Function,
  refetchSections: Function,
  resetLanguagePreferenceChanged: Function,
  route: Route,
  router: Router,
  section: string,
  sections: Array<Section>,
  sectionsHaveChanged: boolean,
  updateDiscussionPreference: Function,
  updateLegalNoticeAndTerms: Function,
  updateSection: Function,
  debateId: string
};

type State = {
  refetching: boolean
};

class DiscussionAdmin extends React.Component<void, Props, State> {
  props: Props;

  state: State;

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

  dataHaveChanged = () =>
    this.props.languagePreferenceHasChanged ||
    this.props.sectionsHaveChanged ||
    this.props.legalNoticeAndTerms.get('_hasChanged');

  saveAction = () => {
    const {
      changeLocale,
      client,
      createSection,
      deleteSection,
      i18n,
      languagePreferenceHasChanged,
      legalNoticeAndTerms,
      preferences,
      refetchLegalNoticeAndTerms,
      refetchSections,
      resetLanguagePreferenceChanged,
      sections,
      sectionsHaveChanged,
      updateDiscussionPreference,
      updateLegalNoticeAndTerms,
      updateSection
    } = this.props;
    displayAlert('success', `${I18n.t('loading.wait')}...`);

    if (languagePreferenceHasChanged) {
      const payload = {
        variables: {
          languages: preferences
        }
      };
      updateDiscussionPreference(payload).then(() => {
        client.query({
          query: getDiscussionPreferenceLanguage,
          variables: {
            inLocale: i18n.locale
          },
          fetchPolicy: 'network-only'
        });
        displayAlert('success', I18n.t('administration.successLanguagePreference'));
        changeLocale(i18n.locale);
      });
      resetLanguagePreferenceChanged();
    }

    if (sectionsHaveChanged) {
      const mutationsPromises = getMutationsPromises({
        items: sections,
        variablesCreator: createVariablesForSectionMutation,
        deleteVariablesCreator: createVariablesForDeleteSectionMutation,
        createMutation: createSection,
        updateMutation: updateSection,
        deleteMutation: deleteSection,
        lang: i18n.locale
      });

      runSerial(mutationsPromises).then(() => {
        this.setState({ refetching: true });
        refetchSections().then(() => this.setState({ refetching: false }));
        displayAlert('success', I18n.t('administration.sections.successSave'));
      });
    }

    if (legalNoticeAndTerms.get('_hasChanged')) {
      const legalNoticeEntries = legalNoticeAndTerms.get('legalNoticeEntries').toJS();
      const termsAndConditionsEntries = legalNoticeAndTerms.get('termsAndConditionsEntries').toJS();
      const payload = {
        variables: {
          legalNoticeEntries: convertEntriesToHTML(legalNoticeEntries),
          termsAndConditionsEntries: convertEntriesToHTML(termsAndConditionsEntries)
        }
      };
      updateLegalNoticeAndTerms(payload)
        .then(() => {
          this.setState({ refetching: true });
          refetchLegalNoticeAndTerms().then(() => this.setState({ refetching: false }));
          displayAlert('success', I18n.t('administration.legalNoticeAndTerms.successSave'));
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }
  };

  render() {
    const { section } = this.props;
    const saveDisabled = !this.dataHaveChanged();
    return (
      <div className="discussion-admin">
        <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />
        {section === '1' && <LanguageSection {...this.props} />}
        {section === '2' && <ManageSectionsForm {...this.props} />}
        {section === '3' && <LegalNoticeAndTermsForm {...this.props} />}
      </div>
    );
  }
}

const mapStateToProps: MapStateToProps<ReduxState, *, *> = ({
  admin: { discussionLanguagePreferences, discussionLanguagePreferencesHasChanged, editLocale, legalNoticeAndTerms, sections },
  i18n
}) => {
  const { sectionsById, sectionsHaveChanged, sectionsInOrder } = sections;
  return {
    editLocale: editLocale,
    i18n: i18n,
    preferences: discussionLanguagePreferences,
    languagePreferenceHasChanged: discussionLanguagePreferencesHasChanged,
    sectionsHaveChanged: sectionsHaveChanged,
    sections: sectionsById
      .map((section) => {
        const id = section.get('id');
        return section.set('order', sectionsInOrder.indexOf(id));
      }) // fix order of sections
      .valueSeq() // convert to array of Map
      .toJS(), // convert to array of objects
    legalNoticeAndTerms: legalNoticeAndTerms
  };
};

type MapDispatchToProps = Dispatch => { changeLocale: Function, resetLanguagePreferenceChanged: Function };
const mapDispatchToProps: MapDispatchToProps = dispatch => ({
  resetLanguagePreferenceChanged: () => {
    dispatch(languagePreferencesHasChanged(false));
  },
  changeLocale: (newLocale) => {
    dispatch(updateEditLocale(newLocale));
  }
});

export default compose(
  graphql(createSectionMutation, {
    name: 'createSection'
  }),
  graphql(deleteSectionMutation, {
    name: 'deleteSection'
  }),
  graphql(updateSectionMutation, {
    name: 'updateSection'
  }),
  graphql(updateDiscussionPreferenceQuery, {
    name: 'updateDiscussionPreference'
  }),
  graphql(updateLegalNoticeAndTermsMutation, {
    name: 'updateLegalNoticeAndTerms'
  }),
  connect(mapStateToProps, mapDispatchToProps),
  withApollo
)(DiscussionAdmin);