// @flow

import type { ApolloClient } from 'react-apollo';
import { createSave, convertToEntries, getFileVariable, convertDateTimeToISO8601String } from '../../../form/utils';
import updateDiscussion from '../../../../graphql/mutations/updateDiscussion.graphql';

export const save = createSave('administration.landingPage.successSave');

const createVariablesFromValues = values => ({
  titleEntries: values.title ? convertToEntries(values.title) : null,
  subtitleEntries: values.subtitle ? convertToEntries(values.subtitle) : null,
  buttonLabelEntries: values.buttonLabel ? convertToEntries(values.buttonLabel) : null,
  headerImage: getFileVariable(values.headerImage),
  headerLogoImage: getFileVariable(values.headerLogoImage),
  startDate: convertDateTimeToISO8601String(values.headerStartDate),
  endDate: convertDateTimeToISO8601String(values.headerEndDate)
});

export const createMutationsPromises = (client: ApolloClient) => values => ([
  () => {
    client.mutate({
      mutation: updateDiscussion,
      variables: createVariablesFromValues(values)
    });
  }
]);