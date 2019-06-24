// @flow
import React from 'react';
import { Checkbox, FormGroup } from 'react-bootstrap';
import type { Map } from 'immutable';
import { I18n } from 'react-redux-i18n';
import Helper from '../../common/helper';

type Props = {
  modulesById: Map<Object>,
  moduleTypes: Array<LandingPageModuleType>,
  toggleModule: Function
};

export const DumbSelectModulesForm = ({ modulesById, moduleTypes, toggleModule }: Props) => (
  <div className="select-modules-form">
    <FormGroup>
      {moduleTypes.map((moduleType: LandingPageModuleType) => {
        const module = modulesById.get(moduleType.moduleId);
        const helperLabel = moduleType.title || I18n.t('administration.landingPage.manageModules.textAndMultimedia');
        const identifierLowerCase = moduleType.identifier.toLowerCase();
        return (
          <Checkbox
            key={moduleType.moduleId}
            checked={(module && module.get('enabled')) || moduleType.required}
            onChange={() => (!moduleType.required ? toggleModule(moduleType.moduleId) : null)}
          >
            <Helper
              classname="margin-left-20"
              label={helperLabel}
              helperUrl={`/static2/img/helpers/landing_page_admin/${identifierLowerCase}.png`}
              helperText={I18n.t(`administration.helpers.landingPage.${identifierLowerCase}`)}
            />
          </Checkbox>
        );
      })}
    </FormGroup>
  </div>
);

export default DumbSelectModulesForm;