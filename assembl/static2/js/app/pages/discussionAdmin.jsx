import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { I18n } from 'react-redux-i18n';

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

const createVariablesForSectionMutation = section => ({
  type: section.type,
  url: section.url,
  order: section.order,
  titleEntries: section.titleEntries
});

const createVariablesForDeleteSectionMutation = section => ({ sectionId: section.id });

class DiscussionAdmin extends React.Component {
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
        refetchSections();
        displayAlert('success', I18n.t('administration.sections.successSave'));
      });
    }

    if (legalNoticeAndTerms.get('hasChanged')) {
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
          refetchLegalNoticeAndTerms();
          displayAlert('success', I18n.t('administration.legalNoticeAndTerms.successSave'));
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }
  };

  render() {
    const { languagePreferenceHasChanged, legalNoticeAndTerms, section, sectionsHaveChanged } = this.props;
    const saveDisabled = !languagePreferenceHasChanged && !legalNoticeAndTerms.get('hasChanged') && !sectionsHaveChanged;
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

const mapStateToProps = ({
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

const mapDispatchToProps = dispatch => ({
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