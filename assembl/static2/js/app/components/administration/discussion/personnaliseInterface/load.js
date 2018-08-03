// @flow
import type { ApolloClient } from 'react-apollo';

import AllDiscussionPreferences from '../../../../graphql/DiscussionPreferencesQuery.graphql';
import type { PersonnaliseInterfaceValues } from './types.flow';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy) => {
  const { data } = await client.query({
    query: AllDiscussionPreferences,
    fetchPolicy: fetchPolicy
  });
  return data;
};

export function postLoadFormat(data: DiscussionPreferencesQuery): PersonnaliseInterfaceValues {
  const { discussionPreferences } = data;
  return {
    title: discussionPreferences && discussionPreferences.tabTitle,
    favicon: discussionPreferences && discussionPreferences.favicon
  };
}