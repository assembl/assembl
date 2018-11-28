// @flow
import type { ApolloClient } from 'react-apollo';

import DiscussionQuery from '../../../../graphql/DiscussionQuery.graphql';
import { convertEntriesToI18nValue, convertEntriesToI18nRichText, convertISO8601StringToDateTime } from '../../../form/utils';

const _load = async (client: ApolloClient, lang: String, fetchPolicy: FetchPolicy = 'cache-first') => {
  const { data } = await client.query({
    query: DiscussionQuery,
    fetchPolicy: fetchPolicy,
    variables: {
      lang: lang
    }
  });
  return data;
};

// Returns a Promise
export const load = (client: ApolloClient, lang: String) => (fetchPolicy: FetchPolicy = 'cache-first') : Promise<*> => {
  console.log("loading...");
  return new Promise((resolve, reject) => {
    const data = Promise.resolve(client.query({
      query: DiscussionQuery,
      fetchPolicy: fetchPolicy,
      variables: {
        lang: lang
      }
    }));
    resolve(data);
  }).then(results => {
    if (results && !results.error) {
      return results.data
    }
    else throw Error(results.errors);
  });
};

type Data = DiscussionQuery;

export function postLoadFormat(data: Data): ResourcesValues {
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