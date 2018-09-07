// @flow
import type { ApolloClient } from 'react-apollo';
import LegalContentsQuery from '../../../graphql/LegalContents.graphql';
import { convertEntriesToRawContentState } from '../../../utils/draftjs';
import { convertEntries } from '../../form/utils';

import type { LegalContentsFormValues } from './types.flow';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy, locale: string) => {
  const { data } = await client.query({
    query: LegalContentsQuery,
    variables: { locale: locale },
    fetchPolicy: fetchPolicy
  });
  return data;
};

export const postLoadFormat = (data: LegalContentsQuery): LegalContentsFormValues => {
  const {
    legalNoticeEntries,
    termsAndConditionsEntries,
    cookiesPolicyEntries,
    privacyPolicyEntries,
    userGuidelinesEntries
  } = data.legalContents;
  return {
    legalNotice: legalNoticeEntries ? convertEntries(convertEntriesToRawContentState(legalNoticeEntries)) : {},
    termsAndConditions: termsAndConditionsEntries
      ? convertEntries(convertEntriesToRawContentState(termsAndConditionsEntries))
      : {},
    cookiesPolicy: cookiesPolicyEntries ? convertEntries(convertEntriesToRawContentState(cookiesPolicyEntries)) : {},
    privacyPolicy: privacyPolicyEntries ? convertEntries(convertEntriesToRawContentState(privacyPolicyEntries)) : {},
    userGuidelines: userGuidelinesEntries ? convertEntries(convertEntriesToRawContentState(userGuidelinesEntries)) : {}
  };
};