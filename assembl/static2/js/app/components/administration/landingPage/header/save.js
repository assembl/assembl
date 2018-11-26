// @flow

import type { ApolloClient } from 'react-apollo';
import { createSave, convertToEntries, getFileVariable } from '../../../form/utils';
import updateDiscussion from '../../../../graphql/mutations/updateDiscussion.graphql';

export const save = createSave('administration.landingPage.successSave');

const createVariablesFromValues = values => ({
  titleEntries: convertToEntries(values.tile),
  subtitleEntries: convertToEntries(values.subtitle),
  buttonLabelEntries: convertToEntries(values.buttonLabel),
  headerImage: getFileVariable(values.headerImage)
});

export const createMutationsPromises = (client: ApolloClient) => values => () => [
  () =>
    client.mutate({
      mutation: updateDiscussion,
      variables: createVariablesFromValues(values)
    })
];