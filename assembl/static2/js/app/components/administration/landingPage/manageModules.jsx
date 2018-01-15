// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import type { Map } from 'immutable';

import ModulesPreview from './modulesPreview';
import SectionTitle from '../../administration/sectionTitle';
import SelectModulesForm from './selectModulesForm';
import { toggleLandingPageModule } from '../../../actions/adminActions/landingPage';

type Props = {
  locale: string,
  modulesByIdentifier: Map<string, Map>,
  toggleModule: Function
};

export const DumbManageModules = ({ locale, modulesByIdentifier, toggleModule }: Props) => {
  const enabledModulesInOrder = modulesByIdentifier
    .filter(value => value.get('enabled'))
    .sortBy(value => value.get('order'))
    .toArray();
  return (
    <div className="admin-box">
      <SectionTitle
        title={I18n.t('administration.landingPage.manageModules.title')}
        annotation={I18n.t('administration.annotation')}
      />
      <div className="admin-content form-container">
        <Translate value="administration.landingPage.manageModules.helper" />
        <div className="two-columns-admin">
          <div className="column-left">
            <SelectModulesForm lang={locale} modulesByIdentifier={modulesByIdentifier} toggleModule={toggleModule} />
          </div>
          <div className="column-right">
            <ModulesPreview modules={enabledModulesInOrder} />
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  modulesByIdentifier: state.admin.landingPage.modules
});

const mapDispatchToProps = dispatch => ({
  toggleModule: identifier => dispatch(toggleLandingPageModule(identifier))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbManageModules);