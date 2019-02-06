// @flow

import type { ApolloClient } from 'react-apollo';
import {
  createSave,
  convertToEntries,
  convertRichTextToVariables,
  getFileVariable,
  convertDateTimeToISO8601String
} from '../../../form/utils';
import type { DatePickerValue } from './types.flow';
import updateDiscussion from '../../../../graphql/mutations/updateDiscussion.graphql';

type UpdateDiscussion = updateDiscussion;

export const save = createSave('administration.landingPage.successSave');

const createVariablesFromValues = async (
  values: DatePickerValue,
  initialValues: DatePickerValue,
  client: ApolloClient
): Promise<UpdateDiscussion> => {
  const subTitlesVariables = values.headerSubtitle ? await convertRichTextToVariables(values.headerSubtitle, client) : null;
  return {
    titleEntries: values.headerTitle ? convertToEntries(values.headerTitle) : null,
    buttonLabelEntries: values.headerButtonLabel ? convertToEntries(values.headerButtonLabel) : null,
    headerImage: getFileVariable(values.headerImage, initialValues.headerImage),
    subtitleEntries: subTitlesVariables ? subTitlesVariables.entries : null,
    logoImage: getFileVariable(values.headerLogoImage, initialValues.headerImage),
    startDate: convertDateTimeToISO8601String(values.headerStartDate),
    endDate: convertDateTimeToISO8601String(values.headerEndDate)
  };
};

export const createMutationsPromises = (client: ApolloClient) => (
  values: UpdateDiscussion,
  initalValues: DatePickerValue
): Array<() => Promise<UpdateDiscussion>> => [
    () =>
      createVariablesFromValues(values, initalValues, client).then(variables =>
        client.mutate({
          mutation: updateDiscussion,
          variables: variables
        })
      )
  ];