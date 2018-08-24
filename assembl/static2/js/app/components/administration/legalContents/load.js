// @flow
import type { ApolloClient } from 'react-apollo';
import LegalContentsQuery from '../../../graphql/LegalContents.graphql';
import { convertEntriesToRawContentState } from '../../../utils/draftjs';
import { convertEntries } from '../../form/utils';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy, lang: string) => {
  const { data } = await client.query({
    query: LegalContentsQuery,
    variables: { lang: lang },
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
    legalNotice: legalNoticeEntries ? convertEntries(convertEntriesToRawContentState(legalNoticeEntries)) : null,
    termsAndConditions: termsAndConditionsEntries
      ? convertEntries(convertEntriesToRawContentState(termsAndConditionsEntries))
      : null,
    cookiesPolicy: cookiesPolicyEntries ? convertEntries(convertEntriesToRawContentState(cookiesPolicyEntries)) : null,
    privacyPolicy: privacyPolicyEntries ? convertEntries(convertEntriesToRawContentState(privacyPolicyEntries)) : null,
    userGuidelines: userGuidelinesEntries ? convertEntries(convertEntriesToRawContentState(userGuidelinesEntries)) : null
  };
};