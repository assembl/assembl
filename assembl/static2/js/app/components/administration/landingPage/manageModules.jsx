// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import type { List, Map } from 'immutable';
import { Button } from 'react-bootstrap';
import countBy from 'lodash/countBy';
import get from 'lodash/get';
import { displayModal, closeModal } from '../../../utils/utilityManager';
import ModulesPreview from './modulesPreview';
import SectionTitle from '../../administration/sectionTitle';
import SelectModulesForm from './selectModulesForm';
import {
  toggleLandingPageModule,
  moveLandingPageModuleDown,
  moveLandingPageModuleUp,
  createLandingPageModules
} from '../../../actions/adminActions/landingPage';
import { createRandomId } from '../../../utils/globalFunctions';

export type LandingPageModule = {
  defaultOrder: number,
  editableOrder: boolean,
  id: string,
  identifier: string,
  moduleId: string,
  required: boolean,
  title: string
};

type Props = {
  enabledModules: List<Map>,
  moduleTypes: Array<LandingPageModule>,
  locale: string,
  modulesById: Map<string, Map>,
  moveModuleDown: Function,
  moveModuleUp: Function,
  toggleModule: Function,
  createModule: Function
};

const MODULES_IDENTIFIERS = {
  header: 'HEADER',
  timeline: 'TIMELINE',
  chatbot: 'CHATBOT',
  topThematics: 'TOP_THEMATICS',
  tweets: 'TWEETS',
  contact: 'CONTACT',
  data: 'DATA',
  news: 'NEWS',
  partners: 'PARTNERS',
  introduction: 'INTRODUCTION',
  footer: 'FOOTER'
};

export const addCountSuffix = (modules: Array<LandingPageModule>): Array<LandingPageModule> => {
  // This function counts the occurencies of each module titles
  // and adds the count as a suffix if it has duplicates
  const titleCounts = countBy(modules, 'title');
  const duplicatesCurrentIndex = {};
  return modules.map((module) => {
    const { title } = module;
    if (titleCounts[title] > 1) {
      duplicatesCurrentIndex[title] = get(duplicatesCurrentIndex, title, 0) + 1;
      return { ...module, title: `${title} ${duplicatesCurrentIndex[title]}` };
    }
    return module;
  });
};

export const sortByTitle = (modules: Array<LandingPageModule>): Array<LandingPageModule> => {
  const newModules = [...modules];
  newModules.sort((a, b) => {
    if (a.title < b.title) return -1;
    if (a.title > b.title) return 1;
    return 0;
  });
  return newModules;
};

export const DumbManageModules = ({
  enabledModules,
  moduleTypes,
  locale,
  modulesById,
  moveModuleDown,
  moveModuleUp,
  toggleModule,
  createModule
}: Props) => {
  const displayConfirmationModal = () => {
    const body = <Translate value="administration.landingPage.manageModules.confirmationModal" />;
    const footer = [
      <Button key="cancel" id="cancel-deleting-button" onClick={closeModal} className="button-cancel button-dark">
        <Translate value="cancel" />
      </Button>,
      <Button
        key="add"
        id="confirm-add-tm-button"
        onClick={() => {
          createModule(enabledModules.size - 2);
          closeModal();
        }}
        className="button-submit button-dark"
      >
        <Translate value="validate" />
      </Button>
    ];
    const includeFooter = true;
    return displayModal(null, body, includeFooter, footer);
  };
  const textAndMultimediaIsChecked = enabledModules.some(
    module => module.getIn(['moduleType', 'identifier']) === MODULES_IDENTIFIERS.introduction
  );
  const updatedModuleTypes = sortByTitle(addCountSuffix(moduleTypes));
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
        <div className="two-columns-admin">
          <div className="column-left">
            <SelectModulesForm
              lang={locale}
              moduleTypes={updatedModuleTypes}
              modulesById={modulesById}
              toggleModule={toggleModule}
            />
            <div className="margin-xl">
              <Button
                className="button-submit button-dark"
                onClick={displayConfirmationModal}
                disabled={!textAndMultimediaIsChecked}
              >
                <Translate value="administration.landingPage.manageModules.textAndMultimediaBtn" />
              </Button>
            </div>
          </div>
          <div className="column-right">
            <ModulesPreview modules={enabledModules} moveModuleDown={moveModuleDown} moveModuleUp={moveModuleUp} />
          </div>
        </div>
      </div>
    </div>
  );
};
const mapStateToProps = (state) => {
  const { enabledModulesInOrder, modulesById, modulesInOrder } = state.admin.landingPage;
  return {
    enabledModules: enabledModulesInOrder.map(id => modulesById.get(id)),
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
  moveModuleUp: id => dispatch(moveLandingPageModuleUp(id)),
  toggleModule: id => dispatch(toggleLandingPageModule(id)),
  createModule: (nextOrder, identifier = 'INTRODUCTION') => {
    const newId = createRandomId();
    return dispatch(createLandingPageModules(newId, identifier, nextOrder));
  }
});
export default connect(mapStateToProps, mapDispatchToProps)(DumbManageModules);