// @flow
import type { ApolloClient } from 'react-apollo';
import type { DatePickerValue } from './types.flow';
import DiscussionQuery from '../../../../graphql/DiscussionQuery.graphql';
import { convertEntriesToI18nValue, convertEntriesToI18nRichText, convertISO8601StringToDateTime } from '../../../form/utils';

export const load = async (
  client: ApolloClient,
  lang: string,
  fetchPolicy: FetchPolicy = 'cache-first'
) => {
  const { data } = await client.query({
    query: DiscussionQuery,
    fetchPolicy: fetchPolicy,
    variables: {
      lang: lang
    }
  });
  return data;
};

type Data = DiscussionQuery;

export function postLoadFormat(data: Data): DatePickerValue {
  return {
    headerTitle: convertEntriesToI18nValue(data.discussion.titleEntries),
    headerSubtitle: convertEntriesToI18nRichText(data.discussion.subtitleEntries),
    headerButtonLabel: convertEntriesToI18nValue(data.discussion.buttonLabelEntries),
    headerImage: data.discussion.headerImage,
    headerLogoImage: data.discussion.logoImage,
    headerStartDate: convertISO8601StringToDateTime(data.discussion.startDate),
    headerEndDate: convertISO8601StringToDateTime(data.discussion.endDate)
  };
}