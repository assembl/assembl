import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { getDiscussionSlug } from './utils/globalFunctions';

const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: `${window.location.origin}/${getDiscussionSlug()}/graphql`,
    opts: {
      credentials: 'same-origin'
    }
  }),
  dataIdFromObject: o => o.id
});

export default client;