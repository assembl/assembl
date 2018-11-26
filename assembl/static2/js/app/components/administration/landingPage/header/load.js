// @flow
import type { ApolloClient } from 'react-apollo';

import DiscussionQuery from '../../../../graphql/DiscussionQuery.graphql';
import { convertEntriesToI18nValue, convertEntriesToI18nRichText } from '../../../form/utils';

export const load = async (client: ApolloClient, lang: String, fetchPolicy: FetchPolicy = 'cache-first') => {
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

export function postLoadFormat(data: Data): ResourcesValues {
  return {
    headerTitle: convertEntriesToI18nValue(data.discussion.titleEntries),
    headerSubtitle: convertEntriesToI18nRichText(data.discussion.subtitleEntries),
    headerButtonLabel: convertEntriesToI18nValue(data.discussion.buttonLabelEntries),
    headerImage: data.discussion.headerImage,
    headerLogoImage: data.discussion.logoImage,
    headerStartDate: data.discussion.debateStartDate || null,
    headerEndDate: data.discussion.debateEndDate || null
  };
}