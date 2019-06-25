// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import type { List, Map } from 'immutable';
import { Button } from 'react-bootstrap';
import type { ApolloClient } from 'react-apollo';
import { compose, withApollo } from 'react-apollo';

import ModulesPreview from './modulesPreview';
import SectionTitle from '../../administration/sectionTitle';
import { moveLandingPageModuleDown, moveLandingPageModuleUp } from '../../../actions/adminActions/landingPage';
import { browserHistory } from '../../../router';
import deleteLandingPageModule from '../../../graphql/mutations/deleteLandingPageModule.graphql';
import createLandingPageModule from '../../../graphql/mutations/createLandingPageModule.graphql';
import { getDiscussionSlug } from '../../../utils/globalFunctions';
import AddModuleButton from './addModuleButton';
import { get } from '../../../utils/routeMap';
import { closeModal, displayModal } from '../../../utils/utilityManager';
import LandingPageModulesQuery from '../../../graphql/LandingPageModulesQuery.graphql';
import SaveButton from '../saveButton';

type Props = {
  client: ApolloClient,
  enabledModules: List<Map>,
  lang: string,
  moduleTypes: Array<LandingPageModuleType>,
  moveModuleDown: Function,
  moveModuleUp: Function,
  save: () => void,
  saveDisabled: boolean
};

type ModuleInfo = {
  identifier: string,
  editSection?: string
};

export const MODULES: Map<string, ModuleInfo> = {
  header: { identifier: 'HEADER', editSection: 'editHeader' },
  timeline: { identifier: 'TIMELINE' },
  chatbot: { identifier: 'CHATBOT' },
  topThematics: { identifier: 'TOP_THEMATICS' },
  tweets: { identifier: 'TWEETS' },
  contact: { identifier: 'CONTACT' },
  data: { identifier: 'DATA' },
  news: { identifier: 'NEWS' },
  partners: { identifier: 'PARTNERS' },
  introduction: { identifier: 'INTRODUCTION', editSection: 'editTextAndMultimedia' },
  footer: { identifier: 'FOOTER' }
};

function getEditSection(module: Map): string | null {
  const moduleType = module.getIn(['moduleType', 'identifier']);
  // can't type moduleInfos as Array<ModuleInfo> cf https://github.com/facebook/flow/issues/2221
  const moduleInfos: Array<any> = Object.values(MODULES);
  const moduleInfo: any | null = moduleInfos.find((m: any) => (!!m && m.identifier === moduleType) || null);
  return !!moduleInfo && !!moduleInfo.editSection ? moduleInfo.editSection : null;
}

export const sortByTitle = (modules: Array<LandingPageModuleType>): Array<LandingPageModuleType> => {
  const sortedModules = [...modules];
  sortedModules.sort((a, b) => {
    if (a.title < b.title) return -1;
    if (a.title > b.title) return 1;
    return 0;
  });
  let index = 0;
  sortedModules.forEach((module) => {
    if (module.identifier === 'HEADER') {
      index = sortedModules.indexOf(module);
      sortedModules.splice(index, 1);
      sortedModules.splice(0, 0, module);
    }
  });
  sortedModules.forEach((module) => {
    if (module.identifier === 'FOOTER') {
      index = sortedModules.indexOf(module);
      sortedModules.splice(index, 1);
      sortedModules.splice(sortedModules.length, 0, module);
    }
  });
  return sortedModules;
};

const navigateToModuleEdit = (module: Map): void => {
  const editSection = getEditSection(module);
  const moduleId = module.get('id');
  const query = { section: editSection, landingPageModuleId: moduleId };
  const url = get('administration', { slug: getDiscussionSlug() || '', id: 'landingPage' }, query);
  browserHistory.push(url);
};

export class DumbManageModules extends React.Component<Props> {
  render() {
    const { client, enabledModules, lang, moduleTypes, moveModuleDown, moveModuleUp, save, saveDisabled } = this.props;

    const numberOfTextAndMultimediaModules = moduleTypes.filter(
      moduleType => moduleType.identifier === MODULES.introduction.identifier
    ).length;

    const numberOfEnabledTextAndMultimediaModules = enabledModules.filter(
      module => module.getIn(['moduleType', 'identifier']) === MODULES.introduction.identifier
    ).size;
    const allTextAndMultimediaAreChecked = numberOfEnabledTextAndMultimediaModules === numberOfTextAndMultimediaModules;

    const editModule = (module: Map): (() => void) | void => {
      if (getEditSection(module)) {
        return () => navigateToModuleEdit(module);
      }
      return undefined;
    };

    const refetchQueries = [
      {
        query: LandingPageModulesQuery,
        variables: {
          lang: lang
        }
      }
    ];

    const removeModule = (module: Map): (() => void) | void => {
      if (module.getIn(['moduleType', 'identifier']) === MODULES.introduction.identifier) {
        return () => {
          const title = <Translate value="debate.confirmDeletionTitle" />;
          const body = <Translate value="debate.synthesis.confirmDeletionBody" />;
          const onClick = () => {
            client.mutate({
              mutation: deleteLandingPageModule,
              variables: { id: module.get('id') },
              refetchQueries: refetchQueries
            });
            closeModal();
            // if (onDeleteCallback) {
            //   onDeleteCallback();
            // }
          };
          const footer = [
            <Button key="cancel" onClick={closeModal} className="button-cancel button-dark">
              <Translate value="debate.confirmDeletionButtonCancel" />
            </Button>,
            <Button key="delete" onClick={onClick} className="button-submit button-dark">
              <Translate value="debate.confirmDeletionButtonDelete" />
            </Button>
          ];
          const includeFooter = true;
          displayModal(title, body, includeFooter, footer);
        };
      }
      return undefined;
    };

    const createTextAndMultimediaModule = (): void => {
      const nextOrder = Math.max(...enabledModules.map(module => module.get('order'))) + 1;
      client.mutate({
        mutation: createLandingPageModule,
        variables: { typeIdentifier: MODULES.introduction.identifier, order: nextOrder, enabled: true },
        refetchQueries: refetchQueries
      });
    };

    return (
      <div className="admin-box">
        <SectionTitle
          title={I18n.t('administration.landingPage.manageModules.title')}
          annotation={I18n.t('administration.annotation')}
        />
        <div className="admin-content form-container" style={{ maxWidth: '700px' }}>
          <p className="admin-paragraph">
            <Translate value="administration.landingPage.manageModules.helper" />
          </p>
          <div>
            <ModulesPreview
              modules={enabledModules}
              moveModuleDown={moveModuleDown}
              moveModuleUp={moveModuleUp}
              editModule={editModule}
              removeModule={removeModule}
            />
          </div>
          <div>
            <SaveButton btnId="save-order-button" disabled={saveDisabled} saveAction={save} title="administration.saveOrder" />
            <div id="save-order-button" />
            <AddModuleButton
              numberOfDuplicatesModules={numberOfTextAndMultimediaModules}
              numberOfEnabledModules={enabledModules.size}
              createModule={createTextAndMultimediaModule}
              allDuplicatesAreChecked={allTextAndMultimediaAreChecked}
              buttonTitleTranslationKey="textAndMultimediaBtn"
            />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const { i18n: { locale }, admin: { landingPage: { enabledModulesInOrder, modulesById, modulesInOrder } } } = state;
  return {
    enabledModules: enabledModulesInOrder.map(id => modulesById.get(id)),
    lang: locale,
    modulesById: modulesById,
    moduleTypes: modulesInOrder
      .map((id) => {
        let module = modulesById.get(id);
        module = module.setIn(['moduleType', 'moduleId'], id);
        return module.get('moduleType');
      })
      .toJS()
  };
};

const mapDispatchToProps = dispatch => ({
  moveModuleDown: id => dispatch(moveLandingPageModuleDown(id)),
  moveModuleUp: id => dispatch(moveLandingPageModuleUp(id))
});

export default compose(connect(mapStateToProps, mapDispatchToProps), withApollo)(DumbManageModules);