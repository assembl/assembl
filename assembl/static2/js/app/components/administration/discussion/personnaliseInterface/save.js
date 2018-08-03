// @flow
import type { ApolloClient } from 'react-apollo';
import { I18n } from 'react-redux-i18n';

import { displayAlert } from '../../../../utils/utilityManager';
import { runSerial } from '../../saveButton';
import type { PersonnaliseInterfaceValues } from './types.flow';
import updateDiscussionPreference from '../../../../graphql/mutations/createThematic.graphql';
import type { MutationsPromises, SaveStatus } from '../../../form/types.flow';

function getImageVariable(img) {
  // If favicon.externalUrl is an object, it means it's a File.
  // We need to send image: null if we didn't change the image.
  const variab = img && typeof img.externalUrl === 'object' ? img.externalUrl : null;
  return variab;
}

function getVariables(values) {
  return {
    title: values.title,
    favicon: getImageVariable(values.favicon)
  };
}

export const createMutationsPromises = (client: ApolloClient) => (values: PersonnaliseInterfaceValues) => {
  const variables = getVariables(values);
  const updateMutation = client.mutate({
    mutation: updateDiscussionPreference,
    variables: variables
  });
  return [updateMutation];
};

export const save = async (mutationsPromises: MutationsPromises): Promise<SaveStatus> => {
  let status = 'PENDING';
  await runSerial(mutationsPromises)
    .then(() => {
      status = 'OK';
      displayAlert('success', I18n.t('administration.successPersonnaliseInterface'));
    })
    .catch((error) => {
      status = 'KO';
      displayAlert('danger', error.message, false, 30000);
    });

  return status;
};