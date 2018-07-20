import React from 'react';
import { Checkbox, FormGroup } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';
import Helper from '../../common/helper';

export const DumbSelectModulesForm = ({ modulesById, moduleTypes, toggleModule }) => (
  <div className="select-modules-form">
    <FormGroup>
      {moduleTypes.map((moduleType) => {
        const module = modulesById.get(moduleType.id);
        const identifierLowerCase = moduleType.identifier.toLowerCase();
        return (
          <Checkbox
            key={moduleType.id}
            checked={(module && module.get('enabled')) || moduleType.required}
            onChange={() => (!moduleType.required ? toggleModule(moduleType.id) : null)}
          >
            <Helper
              classname="margin-left-20"
              label={moduleType.title || I18n.t('administration.landingPage.manageModules.textAndMultimedia')}
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