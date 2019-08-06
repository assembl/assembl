// @flow
import type { ApolloClient } from 'react-apollo';

import type { PersonalizeInterfaceValues } from './types.flow';
import updateDiscussionPreference from '../../../../graphql/mutations/updateDiscussionPreference.graphql';
import { getFileVariable, createSave } from '../../../form/utils';

function getVariables(values, initialValues) {
  const initialFavicon = initialValues ? initialValues.favicon : null;
  const initialLogo = initialValues ? initialValues.logo : null;
  return {
    tabTitle: values.title,
    favicon: getFileVariable(values.favicon, initialFavicon),
    logo: getFileVariable(values.logo, initialLogo),
    firstColor: values.firstColor,
    secondColor: values.secondColor
  };
}

export const createMutationsPromises = (client: ApolloClient) => (
  values: PersonalizeInterfaceValues,
  initialValues: PersonalizeInterfaceValues
) => {
  const updateMutation = () =>
    client.mutate({
      mutation: updateDiscussionPreference,
      variables: getVariables(values, initialValues)
    });
  return [updateMutation];
};

export const save = createSave('administration.personalizeInterface.success');