// @flow
import type { ApolloClient } from 'react-apollo';
import { I18n } from 'react-redux-i18n';

import { displayAlert } from '../../../../utils/utilityManager';
import { runSerial } from '../../saveButton';
import type { PersonnaliseInterfaceValues } from './types.flow';
import updateDiscussionPreference from '../../../../graphql/mutations/updateDiscussionPreference.graphql';
import type { MutationsPromises, SaveStatus } from '../../../form/types.flow';

function getFaviconVariable(favicon, initialFavicon) {
  if (initialFavicon && !favicon) {
    return 'TO_DELETE';
  }
  // If favicon.externalUrl is an object, it means it's a File.
  // We need to send favicon: null if we didn't change the favicon.
  const variab = favicon && typeof favicon.externalUrl === 'object' ? favicon.externalUrl : null;
  return variab;
}

function getVariables(values, initialValues) {
  const initialFavicon = initialValues ? initialValues.favicon : null;
  return {
    tabTitle: values.title,
    favicon: getFaviconVariable(values.favicon, initialFavicon)
  };
}

export const createMutationsPromises = (client: ApolloClient) => (
  values: PersonnaliseInterfaceValues,
  initialValues: PersonnaliseInterfaceValues
) => {
  const updateMutation = () =>
    client.mutate({
      mutation: updateDiscussionPreference,
      variables: getVariables(values, initialValues)
    });
  return [updateMutation];
};

export const save = async (mutationsPromises: MutationsPromises): Promise<SaveStatus> => {
  let status = 'PENDING';
  await runSerial(mutationsPromises)
    .then(() => {
      status = 'OK';
      displayAlert('success', I18n.t('administration.personnaliseInterface.success'));
    })
    .catch((error) => {
      status = 'KO';
      displayAlert('danger', error.message, false, 30000);
    });

  return status;
};