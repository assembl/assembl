// @flow
import type { ApolloClient } from 'react-apollo';
import isEqual from 'lodash/isEqual';
import { updateLegalContents } from '../../../actions/adminActions/legalContents';
import type { LegalContentsFormValues } from './types.flow';
import { createSave, convertToEntries } from '../../form/utils';

const getVariables = values => ({
  legalNoticeEntries: convertToEntries(values.legalNotice),
  termsAndConditionsEntries: convertToEntries(values.termsAndConditions),
  privacyPolicyEntries: convertToEntries(values.privacyPolicy),
  cookiesPolicyEntries: convertToEntries(values.cookiesPolicy),
  userGuidelinesEntries: convertToEntries(values.userGuidelines)
});

export const createMutation = (client: ApolloClient, lang: string) => (
  values: LegalContentsFormValues,
  initialValues: LegalContentsFormValues
) => {
  const allMutations = [];
  const variables = getVariables(values);
  allMutations.push(() =>
    client.mutate({
      mutation: updateLegalContents,
      variables: variables
    })
  );

  // const initialLegalNotice = initialValues.legalNotice;
  // const initialTermsAndConditions = initialValues.termsAndConditions;
  // const initialCookiesPolicy = initialValues.cookiesPolicy;
  // const initialPrivacyPolicy = initialValues.privacyPolicy;
  // const initialUserGuidelines = initialValues.userGuidelines;

  const createUpdateMutations = () => {
    const legalContentsHaveChanged = !isEqual(initialValues, values);
    if (legalContentsHaveChanged) {
      return () =>
        client.mutate({
          mutation: updateLegalContents,
          variables: variables
        });
    }

    return () => Promise.resolve();
  };

  allMutations.push(...createUpdateMutations);
  return allMutations;
};

export const save = createSave('administration.legalContents.successSave');