// @flow
import type { ApolloClient } from 'react-apollo';
import LegalContentsQuery from '../../../graphql/LegalContents.graphql';
import { convertEntriesToI18nRichText } from '../../form/utils';

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
    legalNotice: legalNoticeEntries ? convertEntriesToI18nRichText(legalNoticeEntries) : {},
    termsAndConditions: termsAndConditionsEntries ? convertEntriesToI18nRichText(termsAndConditionsEntries) : {},
    cookiesPolicy: cookiesPolicyEntries ? convertEntriesToI18nRichText(cookiesPolicyEntries) : {},
    privacyPolicy: privacyPolicyEntries ? convertEntriesToI18nRichText(privacyPolicyEntries) : {},
    userGuidelines: userGuidelinesEntries ? convertEntriesToI18nRichText(userGuidelinesEntries) : {}
  };
};