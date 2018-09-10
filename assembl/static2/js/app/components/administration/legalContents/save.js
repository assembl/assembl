// @flow
import type { ApolloClient } from 'react-apollo';
import updateLegalContents from '../../../graphql/mutations/updateLegalContents.graphql';
import type { LegalContentsFormValues } from './types.flow';
import { createSave, convertRichTextToEntries } from '../../form/utils';

const getVariables = values => ({
  legalNoticeEntries: convertRichTextToEntries(values.legalNotice),
  termsAndConditionsEntries: convertRichTextToEntries(values.termsAndConditions),
  privacyPolicyEntries: convertRichTextToEntries(values.privacyPolicy),
  cookiesPolicyEntries: convertRichTextToEntries(values.cookiesPolicy),
  userGuidelinesEntries: convertRichTextToEntries(values.userGuidelines)
});

export const createMutationsPromises = (client: ApolloClient, locale: string) => (values: LegalContentsFormValues) => {
  const allMutations = [];
  const variables = getVariables(values);

  allMutations.push(() =>
    client.mutate({
      mutation: updateLegalContents,
      variables: {
        locale: locale,
        ...variables
      }
    })
  );

  return allMutations;
};

export const save = createSave('administration.legalContents.successSave');