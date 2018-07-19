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
  moveLandingPageModuleUp
} from '../../../actions/adminActions/landingPage';

type Props = {
  modules: List<Map>,
  locale: string,
  modulesById: Map<string, Map>,
  moveModuleDown: Function,
  moveModuleUp: Function,
  toggleModule: Function
};

export const DumbManageModules = ({ modules, locale, modulesById, moveModuleDown, moveModuleUp, toggleModule }: Props) => (
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
          <SelectModulesForm lang={locale} modulesById={modulesById} toggleModule={toggleModule} />
        </div>
        <div className="column-right">
          <ModulesPreview modules={modules} moveModuleDown={moveModuleDown} moveModuleUp={moveModuleUp} />
        </div>
      </div>
    </div>
  </div>
);

const mapStateToProps = (state) => {
  const { enabledModulesInOrder, modulesById } = state.admin.landingPage;
  return {
    modules: enabledModulesInOrder.map(id => modulesById.get(id)),
    modulesById: modulesById
  };
};

const mapDispatchToProps = dispatch => ({
  moveModuleDown: id => dispatch(moveLandingPageModuleDown(id)),
  moveModuleUp: id => dispatch(moveLandingPageModuleUp(id)),
  toggleModule: id => dispatch(toggleLandingPageModule(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbManageModules);