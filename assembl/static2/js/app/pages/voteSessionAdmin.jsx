// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { I18n } from 'react-redux-i18n';
import type { List, Map } from 'immutable';

import PageForm from '../components/administration/voteSession/pageForm';
import ModulesSection from '../components/administration/voteSession/modulesSection';
import PropositionSection from '../components/administration/voteSession/propositionSection';
import Navbar from '../components/administration/navbar';
import SaveButton, { getMutationsPromises, runSerial } from '../components/administration/saveButton';
import updateVoteSessionMutation from '../graphql/mutations/updateVoteSession.graphql';
import deleteTokenVoteSpecificationMutation from '../graphql/mutations/deleteVoteSpecification.graphql';
import createTokenVoteSpecificationMutation from '../graphql/mutations/createTokenVoteSpecification.graphql';
import updateTokenVoteSpecificationMutation from '../graphql/mutations/updateTokenVoteSpecification.graphql';
import { convertEntriesToHTML } from '../utils/draftjs';
import { getPhaseId } from '../utils/timeline';
import { displayAlert } from '../utils/utilityManager';

type VoteSessionAdminProps = {
  editLocale: string,
  i18n: {
    locale: string
  },
  tokenModulesHaveChanged: boolean,
  refetchVoteSession: Function,
  section: string,
  timeline: Timeline,
  voteModules: List,
  voteSessionPage: Map<string, *>,
  updateVoteSession: Function,
  deleteTokenVoteSpecification: Function,
  createTokenVoteSpecification: Function,
  updateTokenVoteSpecification: Function
};

const createVariablesForDeleteTokenVoteSpecificationMutation = voteModule => ({ id: voteModule.id });

const createVariablesForTokenVoteSpecificationMutation = voteModules => ({
  voteSessionId: voteModules.voteSessionId,
  exclusiveCategories: voteModules.exclusiveCategories,
  instructionsEntries: voteModules.instructionsEntries,
  titleEntries: [],
  tokenCategories: voteModules.tokenCategories.map(t => ({
    titleEntries: t.titleEntries,
    color: t.color,
    totalNumber: t.totalNumber,
    typename: t.id
  }))
});

class VoteSessionAdmin extends React.Component<void, VoteSessionAdminProps, void> {
  saveAction = () => {
    const {
      i18n,
      tokenModulesHaveChanged,
      refetchVoteSession,
      timeline,
      voteModules,
      voteSessionPage,
      createTokenVoteSpecification,
      deleteTokenVoteSpecification,
      updateTokenVoteSpecification,
      updateVoteSession
    } = this.props;

    if (voteSessionPage.get('hasChanged')) {
      const titleEntries = voteSessionPage.get('titleEntries').toJS();
      const subTitleEntries = voteSessionPage.get('subTitleEntries').toJS();
      const instructionsSectionTitleEntries = voteSessionPage.get('instructionsSectionTitleEntries').toJS();
      const instructionsSectionContentEntries = voteSessionPage.get('instructionsSectionContentEntries').toJS();
      const propositionsSectionTitleEntries = voteSessionPage.get('propositionsSectionTitleEntries').toJS();
      const pageHeaderImage = voteSessionPage.get('headerImage').toJS();
      const headerImage = typeof pageHeaderImage.externalUrl === 'object' ? pageHeaderImage.externalUrl : null;
      const payload = {
        variables: {
          discussionPhaseId: getPhaseId(timeline, 'voteSession'),
          titleEntries: titleEntries,
          subTitleEntries: subTitleEntries,
          instructionsSectionTitleEntries: instructionsSectionTitleEntries,
          instructionsSectionContentEntries: convertEntriesToHTML(instructionsSectionContentEntries),
          propositionsSectionTitleEntries: propositionsSectionTitleEntries,
          headerImage: headerImage
        }
      };
      updateVoteSession(payload)
        .then(() => {
          refetchVoteSession();
          displayAlert('success', I18n.t('administration.voteSessionSuccess'));
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }

    if (tokenModulesHaveChanged) {
      if (voteSessionPage.get('id')) {
        const tokenModules = voteModules.filter(m => m.get('type') === 'tokens');
        const items = [];
        tokenModules.forEach((t) => {
          items.push({ ...t.toJS(), voteSessionId: voteSessionPage.get('id') });
        });
        const mutationsPromises = getMutationsPromises({
          items: items,
          variablesCreator: createVariablesForTokenVoteSpecificationMutation,
          deleteVariablesCreator: createVariablesForDeleteTokenVoteSpecificationMutation,
          createMutation: createTokenVoteSpecification,
          updateMutation: updateTokenVoteSpecification,
          deleteMutation: deleteTokenVoteSpecification,
          lang: i18n.locale
        });

        runSerial(mutationsPromises).then(() => {
          refetchVoteSession();
          displayAlert('success', I18n.t('administration.voteSessionSuccess'));
        });
      } else {
        displayAlert('warning', I18n.t('administration.saveFirstStep'));
      }
    }
  };

  render() {
    const { editLocale, tokenModulesHaveChanged, section, voteSessionPage } = this.props;
    const saveDisabled = !tokenModulesHaveChanged && !voteSessionPage.get('hasChanged');
    const currentStep = parseInt(section, 10);
    return (
      <div className="token-vote-admin">
        <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />
        {section === '1' && <PageForm editLocale={editLocale} />}
        {section === '2' && <ModulesSection />}
        {section === '3' && <PropositionSection />}
        {!isNaN(currentStep) && <Navbar currentStep={currentStep} totalSteps={3} phaseIdentifier="voteSession" />}
      </div>
    );
  }
}

const mapStateToProps = ({ admin: { editLocale, voteSession }, debate, i18n }) => {
  const { modulesById, modulesInOrder, tokenCategoriesById, tokenModulesHaveChanged } = voteSession;
  return {
    editLocale: editLocale,
    i18n: i18n,
    tokenModulesHaveChanged: tokenModulesHaveChanged,
    timeline: debate.debateData.timeline,
    voteModules: modulesInOrder.map(
      id =>
        (modulesById.getIn([id, 'tokenCategories'])
          ? modulesById
            .get(id)
            .set('tokenCategories', modulesById.getIn([id, 'tokenCategories']).map(t => tokenCategoriesById.get(t)))
          : [])
    ),
    voteSessionPage: voteSession.page
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(updateVoteSessionMutation, {
    name: 'updateVoteSession'
  }),
  graphql(deleteTokenVoteSpecificationMutation, {
    name: 'deleteTokenVoteSpecification'
  }),
  graphql(createTokenVoteSpecificationMutation, {
    name: 'createTokenVoteSpecification'
  }),
  graphql(updateTokenVoteSpecificationMutation, {
    name: 'updateTokenVoteSpecification'
  })
)(VoteSessionAdmin);