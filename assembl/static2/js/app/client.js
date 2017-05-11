import ApolloClient, { createNetworkInterface } from 'apollo-client';
import { getDiscussionSlug } from './utils/globalFunctions';
// Add fetch polyfill for IE 10
import fetch from 'isomorphic-fetch';  // eslint-disable-line

const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: `${window.location.origin}/${getDiscussionSlug()}/graphql`,
    opts: {
      credentials: 'same-origin'
    }
  })
});

export default client;