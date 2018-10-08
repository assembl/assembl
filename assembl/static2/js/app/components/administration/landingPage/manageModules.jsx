// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import type { List, Map } from 'immutable';
import ModulesPreview from './modulesPreview';
import SectionTitle from '../../administration/sectionTitle';
import SelectModulesForm from './selectModulesForm';
import {
  toggleLandingPageModule,
  moveLandingPageModuleDown,
  moveLandingPageModuleUp,
  createLandingPageModule
} from '../../../actions/adminActions/landingPage';
import { createRandomId } from '../../../utils/globalFunctions';
import AddModuleButton from './addModuleButton';

export type LandingPageModuleType = {
  defaultOrder: number,
  editableOrder: boolean,
  id: string,
  identifier: string,
  moduleId: string,
  required: boolean,
  title: string
};

export type LandingPageModule = {
  configuration: Object,
  enabled: boolean,
  existsInDatabase: true,
  id: string,
  moduleType: LandingPageModule,
  order: number,
  subtitle: ?string,
  subtitleEntries: Array<LangstringEntries>,
  title: ?string,
  titleEntries: Array<LangstringEntries>
};

type Props = {
  enabledModules: List<Map>,
  moduleTypes: Array<LandingPageModuleType>,
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
  const numberOfTextAndMultimediaModules = moduleTypes.filter(
    moduleType => moduleType.identifier === MODULES_IDENTIFIERS.introduction
  ).length;

  const numberOfEnabledTextAndMultimediaModules = enabledModules.filter(
    module => module.getIn(['moduleType', 'identifier']) === MODULES_IDENTIFIERS.introduction
  ).size;
  const allTextAndMultimediaAreChecked = numberOfEnabledTextAndMultimediaModules === numberOfTextAndMultimediaModules;

  const updatedModuleTypes = sortByTitle(moduleTypes);

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
              <AddModuleButton
                numberOfDuplicatesModules={numberOfTextAndMultimediaModules}
                numberOfEnabledModules={enabledModules.size}
                createModule={createModule}
                allDuplicatesAreChecked={allTextAndMultimediaAreChecked}
                buttonTitleTranslationKey="textAndMultimediaBtn"
              />
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
  createModule: (nextOrder, numberOfDuplicatesModules, identifier = MODULES_IDENTIFIERS.introduction) => {
    const newId = createRandomId();
    return dispatch(
      createLandingPageModule(
        newId,
        identifier,
        numberOfDuplicatesModules,
        I18n.t('administration.landingPage.manageModules.textAndMultimedia'),
        nextOrder
      )
    );
  }
});
export default connect(mapStateToProps, mapDispatchToProps)(DumbManageModules);