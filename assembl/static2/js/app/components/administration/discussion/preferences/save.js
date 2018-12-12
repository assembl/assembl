// @flow
import type { ApolloClient } from 'react-apollo';
import UpdateDiscussionPreference from '../../../../graphql/mutations/updateDiscussionPreference.graphql';
import type { DiscussionPreferencesFormValues } from './types.flow';
import { createSave, convertCheckboxListValueToVariable } from '../../../form/utils';

const getVariables = async (client: ApolloClient, values: DiscussionPreferencesFormValues) => ({
  languages: convertCheckboxListValueToVariable(values.languages),
  withModeration: values.withModeration
});

export const createMutationsPromises = (client: ApolloClient) => (values: DiscussionPreferencesFormValues) => [
  () =>
    getVariables(client, values).then(variables =>
      client.mutate({
        mutation: UpdateDiscussionPreference,
        variables: {
          ...variables
        }
      })
    )
];

export const save = createSave('administration.successDiscussionPreference');