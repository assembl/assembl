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
import LandingPageModulesQuery from '../../../graphql/LandingPageModulesQuery.graphql';
import updateLandingPageModule from '../../../graphql/mutations/updateLandingPageModule.graphql';
import deleteLandingPageModule from '../../../graphql/mutations/deleteLandingPageModule.graphql';
import createLandingPageModule from '../../../graphql/mutations/createLandingPageModule.graphql';
import { getDiscussionSlug } from '../../../utils/globalFunctions';
import AddModuleButton from './addModuleButton';
import { get } from '../../../utils/routeMap';
import { closeModal, displayModal } from '../../../utils/utilityManager';
import SaveButton from '../saveButton';

type Props = {
  client: ApolloClient,
  isOrdering: boolean,
  lang: string,
  modules: List<Map>,
  moveModuleDown: Function,
  moveModuleUp: Function,
  saveOrder: () => void,
  resetOrder: () => void
};

type ModuleInfo = {
  identifier: string,
  implemented: boolean, // if false, this type of module has not been implemented yet
  editSection?: string
};

export const MODULE_TYPES: Map<string, ModuleInfo> = {
  header: { editSection: 'editHeader', identifier: 'HEADER', implemented: true },
  timeline: { identifier: 'TIMELINE', implemented: true },
  chatbot: { identifier: 'CHATBOT' },
  topThematics: { identifier: 'TOP_THEMATICS', implemented: false },
  tweets: { identifier: 'TWEETS', implemented: false },
  contact: { identifier: 'CONTACT', implemented: false },
  data: { identifier: 'DATA', implemented: false },
  news: { identifier: 'NEWS', implemented: false },
  partners: { haveOrder: true, identifier: 'PARTNERS', implemented: false },
  textAndMultimedia: {
    editSection: 'editTextAndMultimedia',
    identifier: 'INTRODUCTION',
    implemented: true
  },
  footer: { identifier: 'FOOTER', implemented: true }
};

export function getModuleTypeInfo(identifier: string): ModuleInfo | null {
  // can't type moduleInfos as Array<ModuleInfo> cf https://github.com/facebook/flow/issues/2221
  const moduleInfos: Array<any> = Object.values(MODULE_TYPES);
  const moduleInfo: any | null = moduleInfos.find((m: any) => (!!m && m.identifier === identifier) || null);
  return moduleInfo;
}

function getEditSection(module: Map): string | null {
  const moduleType = module.getIn(['moduleType', 'identifier']);
  const moduleInfo = getModuleTypeInfo(moduleType);
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
    const { client, isOrdering, lang, modules, moveModuleDown, moveModuleUp, resetOrder, saveOrder } = this.props;

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

    const updateModuleEnabled = (module: Map): ((enabled: boolean) => void) | void => {
      if (!module.getIn(['moduleType', 'required'])) {
        return (enabled: boolean) => {
          client.mutate({
            mutation: updateLandingPageModule,
            variables: { id: module.get('id'), enabled: enabled },
            refetchQueries: refetchQueries
          });
        };
      }
      return undefined;
    };

    const removeModule = (module: Map): (() => void) | void => {
      if (module.getIn(['moduleType', 'identifier']) === MODULE_TYPES.textAndMultimedia.identifier) {
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

    const createTextAndMultimediaModule = (): Promise<any> => {
      const nextOrder = Math.max(...modules.map(module => module.get('order'))) + 1;
      return client.mutate({
        mutation: createLandingPageModule,
        variables: { typeIdentifier: MODULE_TYPES.textAndMultimedia.identifier, order: nextOrder, enabled: true },
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
              modules={modules}
              moveModuleDown={moveModuleDown}
              moveModuleUp={moveModuleUp}
              editModule={editModule}
              updateModuleEnabled={updateModuleEnabled}
              removeModule={removeModule}
              isOrdering={isOrdering}
            />
            {/* <Layouts /> */}
          </div>
          <div>
            <SaveButton
              btnId="reset-order-button"
              specificClasses="btn-danger"
              disabled={!isOrdering}
              saveAction={resetOrder}
              title="cancel"
            />
            <SaveButton
              btnId="save-order-button"
              disabled={!isOrdering}
              saveAction={saveOrder}
              title="administration.saveOrder"
            />
            <div id="save-order-button" />
            <div id="reset-order-button" />
            <hr />
            <AddModuleButton
              disabled={isOrdering}
              createModule={createTextAndMultimediaModule}
              buttonTitleTranslationKey="textAndMultimediaBtn"
            />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const { i18n: { locale }, admin: { landingPage: { isOrderingModules, modulesInOrder, modulesById } } } = state;
  return {
    isOrdering: isOrderingModules,
    lang: locale,
    modules: modulesInOrder.map(id => modulesById.get(id)),
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