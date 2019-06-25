// @flow
import type { ApolloClient } from 'react-apollo';

import DiscussionPreferences from '../../../../graphql/DiscussionPreferencesQuery.graphql';
import type { PersonalizeInterfaceValues } from './types.flow';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy) => {
  const { data } = await client.query({
    query: DiscussionPreferences,
    fetchPolicy: fetchPolicy
  });
  return data;
};

export function postLoadFormat(data: DiscussionPreferencesQueryQuery): PersonalizeInterfaceValues {
  const { discussionPreferences } = data;

  return {
    title: discussionPreferences && discussionPreferences.tabTitle,
    favicon: (discussionPreferences && discussionPreferences.favicon) || null,
    logo: (discussionPreferences && discussionPreferences.logo) || null,
    firstColor: (discussionPreferences && discussionPreferences.firstColor) || '',
    secondColor: (discussionPreferences && discussionPreferences.secondColor) || ''
  };
}