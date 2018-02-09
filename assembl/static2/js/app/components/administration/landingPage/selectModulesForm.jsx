import React from 'react';
import { compose, graphql } from 'react-apollo';
import { Checkbox, FormGroup } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';

import LandingPageModuleTypes from '../../../graphql/LandingPageModuleTypes.graphql';
import withoutLoadingIndicator from '../../common/withoutLoadingIndicator';
import Helper from '../../common/helper';

export const DumbSelectModulesForm = ({ hasErrors, modulesByIdentifier, moduleTypes, toggleModule }) => {
  if (hasErrors) {
    return null;
  }

  return (
    <div className="select-modules-form">
      <FormGroup>
        {moduleTypes.map((moduleType) => {
          const module = modulesByIdentifier.get(moduleType.identifier);
          const identifierLowerCase = moduleType.identifier.toLowerCase();
          return (
            <Checkbox
              key={moduleType.identifier}
              checked={module && module.get('enabled')}
              onChange={() => toggleModule(moduleType.identifier)}
              disabled={moduleType.required}
            >
              <Helper
                label={moduleType.title}
                helperUrl={`/static2/img/helpers/landing_page_admin/${identifierLowerCase}.png`}
                helperText={I18n.t(`administration.helpers.landingPage.${identifierLowerCase}`)}
              />
            </Checkbox>
          );
        })}
      </FormGroup>
    </div>
  );
};

export default compose(
  graphql(LandingPageModuleTypes, {
    props: ({ data }) => {
      if (data.loading) {
        return {
          loading: true
        };
      }

      if (data.error) {
        return {
          hasErrors: true,
          loading: false
        };
      }

      return {
        loading: data.loading,
        hasErrors: data.error,
        refetchModuleTypes: data.refetch,
        moduleTypes: data.landingPageModuleTypes
      };
    }
  }),
  withoutLoadingIndicator()
)(DumbSelectModulesForm);