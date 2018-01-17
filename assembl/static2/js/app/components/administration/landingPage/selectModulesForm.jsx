import React from 'react';
import { compose, graphql } from 'react-apollo';

import { Checkbox, FormGroup } from 'react-bootstrap';
import LandingPageModuleTypes from '../../../graphql/LandingPageModuleTypes.graphql';
import withoutLoadingIndicator from '../../common/withoutLoadingIndicator';

export const DumbSelectModulesForm = ({ hasErrors, modulesByIdentifier, moduleTypes, toggleModule }) => {
  if (hasErrors) {
    return null;
  }

  return (
    <div className="select-modules-form">
      <FormGroup>
        {moduleTypes.map((moduleType) => {
          const module = modulesByIdentifier.get(moduleType.identifier);
          return (
            <Checkbox
              key={moduleType.identifier}
              checked={module && module.get('enabled')}
              onChange={() => toggleModule(moduleType.identifier)}
              disabled={moduleType.required}
            >
              {moduleType.title}
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