// @flow

import type { ApolloClient } from 'react-apollo';
import moment from 'moment';
import { createSave, convertToEntries, getFileVariable } from '../../../form/utils';
import updateDiscussion from '../../../../graphql/mutations/updateDiscussion.graphql';

export const save = createSave('administration.landingPage.successSave');

const createVariablesFromValues = values => ({
  titleEntries: convertToEntries(values.tile),
  subtitleEntries: convertToEntries(values.subtitle),
  buttonLabelEntries: convertToEntries(values.buttonLabel),
  headerImage: getFileVariable(values.headerImage),
  startDate: moment(values.headerStartDate.time, moment.ISO_8601),
  endDate: moment(values.headerEndDate.time, moment.ISO_8601)
});

export const createMutationsPromises = (client: ApolloClient) => values => () => [
  () =>
    client.mutate({
      mutation: updateDiscussion,
      variables: createVariablesFromValues(values)
    })
];