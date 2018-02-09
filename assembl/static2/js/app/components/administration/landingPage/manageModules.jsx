// @flow
import React from 'react';
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
  enabledModulesInOrder: List<Map>,
  locale: string,
  modulesByIdentifier: Map<string, Map>,
  moveModuleDown: Function,
  moveModuleUp: Function,
  toggleModule: Function
};

export const DumbManageModules = ({
  enabledModulesInOrder,
  locale,
  modulesByIdentifier,
  moveModuleDown,
  moveModuleUp,
  toggleModule
}: Props) => (
  <div className="admin-box">
    <SectionTitle
      title={I18n.t('administration.landingPage.manageModules.title')}
      annotation={I18n.t('administration.annotation')}
    />
    <div className="admin-content form-container">
      <p>
        <Translate value="administration.landingPage.manageModules.helper" />
      </p>
      <div className="two-columns-admin">
        <div className="column-left">
          <SelectModulesForm lang={locale} modulesByIdentifier={modulesByIdentifier} toggleModule={toggleModule} />
        </div>
        <div className="column-right">
          <ModulesPreview modules={enabledModulesInOrder} moveModuleDown={moveModuleDown} moveModuleUp={moveModuleUp} />
        </div>
      </div>
    </div>
  </div>
);

const mapStateToProps = (state) => {
  const { enabledModulesInOrder, modulesByIdentifier } = state.admin.landingPage;
  return {
    enabledModulesInOrder: enabledModulesInOrder.map(identifier => modulesByIdentifier.get(identifier)),
    modulesByIdentifier: modulesByIdentifier
  };
};

const mapDispatchToProps = dispatch => ({
  moveModuleDown: identifier => dispatch(moveLandingPageModuleDown(identifier)),
  moveModuleUp: identifier => dispatch(moveLandingPageModuleUp(identifier)),
  toggleModule: identifier => dispatch(toggleLandingPageModule(identifier))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbManageModules);