// @flow
import type { ApolloClient } from 'react-apollo';
import { convertEntriesToHTML } from '../../../utils/draftjs';
import updateLegalContents from '../../../graphql/mutations/updateLegalContents.graphql';
import type { LegalContentsFormValues } from './types.flow';
import { createSave, convertToEntries } from '../../form/utils';

const getVariables = values => ({
  legalNoticeEntries: convertEntriesToHTML(convertToEntries(values.legalNotice)),
  termsAndConditionsEntries: convertEntriesToHTML(convertToEntries(values.termsAndConditions)),
  privacyPolicyEntries: convertEntriesToHTML(convertToEntries(values.privacyPolicy)),
  cookiesPolicyEntries: convertEntriesToHTML(convertToEntries(values.cookiesPolicy)),
  userGuidelinesEntries: convertEntriesToHTML(convertToEntries(values.userGuidelines))
});

export const createMutationsPromises = (client: ApolloClient, locale: string) => (
  values: LegalContentsFormValues
) => {
  const allMutations = [];
  const variables = getVariables(values);

  allMutations.push(() =>
    client.mutate({
      mutation: updateLegalContents,
      variables: {
        locale: locale,
        ...variables
      }
    }));

  return allMutations;
};

export const save = createSave('administration.legalContents.successSave');