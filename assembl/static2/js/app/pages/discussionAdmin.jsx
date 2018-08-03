// @flow
import React from 'react';
import { connect, type Dispatch, type MapStateToProps } from 'react-redux';
import { type Route, type Router } from 'react-router';
import { type ApolloClient, compose, graphql, withApollo } from 'react-apollo';
import { I18n } from 'react-redux-i18n';
import { type Map } from 'immutable';
import moment from 'moment';

import { languagePreferencesHasChanged, updateEditLocale } from '../actions/adminActions';
import ManageSectionsForm from '../components/administration/discussion/manageSectionsForm';
import LegalContentsForm from '../components/administration/discussion/legalContentsForm';
import TimelineForm from '../components/administration/discussion/timelineForm';
import LanguageSection from '../components/administration/discussion/languageSection';
import ManageProfileOptionsForm from '../components/administration/discussion/manageProfileOptionsForm';
import PersonnaliseInterface from '../components/administration/discussion/personnaliseInterface';
import { displayAlert } from '../utils/utilityManager';
import { convertEntriesToHTML } from '../utils/draftjs';
import SaveButton, { getMutationsPromises, runSerial } from '../components/administration/saveButton';
import createSectionMutation from '../graphql/mutations/createSection.graphql';
import updateSectionMutation from '../graphql/mutations/updateSection.graphql';
import deleteSectionMutation from '../graphql/mutations/deleteSection.graphql';
import updateLegalContentsMutation from '../graphql/mutations/updateLegalContents.graphql';
import updateDiscussionPreferenceQuery from '../graphql/mutations/updateDiscussionPreference.graphql';
import getDiscussionPreferenceLanguage from '../graphql/DiscussionPreferenceLanguage.graphql';
import ProfileFieldsQuery from '../graphql/ProfileFields.graphql';
import createTextFieldMutation from '../graphql/mutations/createTextField.graphql';
import updateTextFieldMutation from '../graphql/mutations/updateTextField.graphql';
import deleteTextFieldMutation from '../graphql/mutations/deleteTextField.graphql';
import updateDiscussionPhaseMutation from '../graphql/mutations/updateDiscussionPhase.graphql';
import createDiscussionPhaseMutation from '../graphql/mutations/createDiscussionPhase.graphql';
import deleteDiscussionPhaseMutation from '../graphql/mutations/deleteDiscussionPhase.graphql';
import { type LanguagePreferencesState } from '../reducers/adminReducer';
import { type State as ReduxState } from '../reducers/rootReducer';

type Section = Object;

const createVariablesForSectionMutation = section => ({
  type: section.type,
  url: section.url,
  order: section.order,
  titleEntries: section.titleEntries
});

const createVariablesForTextFieldMutation = textField => ({
  id: textField.id,
  order: textField.order,
  required: textField.required,
  hidden: textField.hidden,
  titleEntries: textField.titleEntries,
  options: textField.options
});

const createVariablesForDeleteSectionMutation = section => ({ sectionId: section.id });

const createVariablesForDeleteTextFieldMutation = textField => ({ id: textField.id });

const createVariablesForDiscussionPhaseMutation = (phase) => {
  if (phase.endIsBeforeStart) {
    return displayAlert('danger', I18n.t('administration.timelineAdmin.endIsBeforeStart'));
  }
  return {
    identifier: phase.identifier,
    isThematicsTable: phase.isThematicsTable,
    start: moment(phase.start, moment.ISO_8601),
    end: moment(phase.end, moment.ISO_8601),
    order: phase.order,
    titleEntries: phase.titleEntries
  };
};

const createVariablesForDeleteDiscussionPhaseMutation = phase => ({
  id: phase.id
});

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
  legalContents: Map,
  legalContentsHaveChanged: boolean,
  preferences: LanguagePreferencesState,
  refetchLegalContents: Function,
  refetchSections: Function,
  resetLanguagePreferenceChanged: Function,
  route: Route,
  router: Router,
  section: string,
  sections: Array<Section>,
  sectionsHaveChanged: boolean,
  updateDiscussionPreference: Function,
  updateLegalContents: Function,
  updateSection: Function,
  debateId: string,
  createTextField: Function,
  updateTextField: Function,
  deleteTextField: Function,
  profileOptionsHasChanged: boolean,
  refetchTextFields: Function,
  textFields: string,
  updateDiscussionPhase: Function,
  createDiscussionPhase: Function,
  deleteDiscussionPhase: Function,
  refetchTimeline: Function,
  phasesHaveChanged: boolean,
  phases: Array<Object>
};

type State = {
  refetching: boolean
};

class DiscussionAdmin extends React.Component<Props, State> {
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
    this.props.profileOptionsHasChanged ||
    this.props.legalContentsHaveChanged ||
    this.props.phasesHaveChanged;

  saveAction = () => {
    const {
      changeLocale,
      client,
      createSection,
      deleteSection,
      i18n,
      languagePreferenceHasChanged,
      legalContents,
      legalContentsHaveChanged,
      preferences,
      refetchLegalContents,
      refetchSections,
      resetLanguagePreferenceChanged,
      sections,
      sectionsHaveChanged,
      updateDiscussionPreference,
      updateLegalContents,
      updateSection,
      createTextField,
      updateTextField,
      deleteTextField,
      profileOptionsHasChanged,
      textFields,
      refetchTextFields,
      phases,
      phasesHaveChanged,
      refetchTimeline,
      updateDiscussionPhase,
      createDiscussionPhase,
      deleteDiscussionPhase,
      editLocale
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
      runSerial(mutationsPromises)
        .then(() => {
          this.setState({ refetching: true }, () => {
            refetchSections().then(() => {
              displayAlert('success', I18n.t('administration.sections.successSave'));
              this.setState({ refetching: false });
            });
          });
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }

    if (phasesHaveChanged) {
      const mutationPromises = getMutationsPromises({
        items: phases,
        variablesCreator: createVariablesForDiscussionPhaseMutation,
        deleteVariablesCreator: createVariablesForDeleteDiscussionPhaseMutation,
        createMutation: createDiscussionPhase,
        deleteMutation: deleteDiscussionPhase,
        updateMutation: updateDiscussionPhase,
        lang: editLocale
      });

      runSerial(mutationPromises)
        .then(() => {
          this.setState({ refetching: true }, () => {
            refetchTimeline().then(() => {
              displayAlert('success', I18n.t('administration.timelineAdmin.successSave'));
              this.setState({ refetching: false });
            });
          });
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }

    if (legalContentsHaveChanged) {
      const legalNoticeEntries = legalContents.get('legalNoticeEntries').toJS();
      const termsAndConditionsEntries = legalContents.get('termsAndConditionsEntries').toJS();
      const cookiesPolicyEntries = legalContents.get('cookiesPolicyEntries').toJS();
      const privacyPolicyEntries = legalContents.get('privacyPolicyEntries').toJS();
      const payload = {
        variables: {
          legalNoticeEntries: convertEntriesToHTML(legalNoticeEntries),
          termsAndConditionsEntries: convertEntriesToHTML(termsAndConditionsEntries),
          cookiesPolicyEntries: convertEntriesToHTML(cookiesPolicyEntries),
          privacyPolicyEntries: convertEntriesToHTML(privacyPolicyEntries)
        }
      };
      updateLegalContents(payload)
        .then(() => {
          this.setState({ refetching: true }, () => {
            refetchLegalContents().then(() => {
              displayAlert('success', I18n.t('administration.legalContents.successSave'));
              this.setState({ refetching: false });
            });
          });
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }

    if (profileOptionsHasChanged) {
      const mutationsPromises = getMutationsPromises({
        items: textFields,
        variablesCreator: createVariablesForTextFieldMutation,
        deleteVariablesCreator: createVariablesForDeleteTextFieldMutation,
        createMutation: createTextField,
        updateMutation: updateTextField,
        deleteMutation: deleteTextField,
        lang: i18n.locale,
        refetchQueries: [
          {
            query: ProfileFieldsQuery,
            variables: {
              lang: i18n.locale
            }
          }
        ]
      });

      runSerial(mutationsPromises).then(() => {
        this.setState({ refetching: true }, () => {
          refetchTextFields().then(() => {
            displayAlert('success', I18n.t('administration.profileOptions.successSave'));
            this.setState({ refetching: false });
          });
        });
      });
    }
  };

  render() {
    const { section } = this.props;
    const saveDisabled = !this.dataHaveChanged();
    // @TODO use final-form logic
    return (
      <div className="discussion-admin">
        {section !== '6' && <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />}
        {section === '1' && <LanguageSection {...this.props} />}
        {section === '2' && <ManageSectionsForm {...this.props} />}
        {section === '3' && <ManageProfileOptionsForm />}
        {section === '4' && <LegalContentsForm {...this.props} />}
        {section === '5' && <TimelineForm {...this.props} />}
        {section === '6' && <PersonnaliseInterface {...this.props} />}
      </div>
    );
  }
}

const mapStateToProps: MapStateToProps<ReduxState, *, *> = ({
  admin: {
    discussionLanguagePreferences,
    discussionLanguagePreferencesHasChanged,
    editLocale,
    legalContents,
    sections,
    profileOptions,
    timeline
  },
  i18n
}) => {
  const { sectionsById, sectionsHaveChanged, sectionsInOrder } = sections;
  const { phasesById, phasesHaveChanged } = timeline;
  const { profileOptionsHasChanged, textFieldsById } = profileOptions;
  const textFields = textFieldsById
    .map(textField => textField)
    .valueSeq()
    .toJS();
  textFields.forEach((field) => {
    const newField = field;
    if (field.options) {
      // convert options to array, and remove _hasChanged on option that is set by moveItemUp/Down.
      newField.options = Object.values(field.options).map(option => ({
        // $FlowFixMe error because option is typed mixed
        id: option.id,
        // $FlowFixMe error because option is typed mixed
        labelEntries: option.labelEntries,
        // $FlowFixMe error because option is typed mixed
        order: option.order
      }));
    }
  });

  return {
    editLocale: editLocale,
    i18n: i18n,
    preferences: discussionLanguagePreferences,
    languagePreferenceHasChanged: discussionLanguagePreferencesHasChanged,
    sectionsHaveChanged: sectionsHaveChanged,
    sections: sectionsById
      .map((section) => {
        const id = section.get('id');
        const currentOrder = section.get('order');
        const newOrder = sectionsInOrder.indexOf(id);
        let newSection = section.set('order', newOrder);
        if (currentOrder !== newOrder) {
          newSection = newSection.set('_hasChanged', true);
        }
        return newSection;
      }) // fix order of sections
      .valueSeq() // convert to array of Map
      .toJS(), // convert to array of objects
    legalContents: legalContents,
    legalContentsHaveChanged: legalContents.get('_hasChanged'),
    profileOptionsHasChanged: profileOptionsHasChanged,
    textFields: textFields,
    phases: phasesById
      .sortBy(phase => phase.get('order'))
      .valueSeq()
      .toJS(),
    phasesHaveChanged: phasesHaveChanged
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
  graphql(updateLegalContentsMutation, {
    name: 'updateLegalContents'
  }),
  graphql(createDiscussionPhaseMutation, {
    name: 'createDiscussionPhase'
  }),
  graphql(deleteDiscussionPhaseMutation, {
    name: 'deleteDiscussionPhase'
  }),
  graphql(updateDiscussionPhaseMutation, {
    name: 'updateDiscussionPhase'
  }),
  graphql(createTextFieldMutation, {
    name: 'createTextField'
  }),
  graphql(deleteTextFieldMutation, {
    name: 'deleteTextField'
  }),
  graphql(updateTextFieldMutation, {
    name: 'updateTextField'
  }),
  connect(mapStateToProps, mapDispatchToProps),
  withApollo
)(DiscussionAdmin);