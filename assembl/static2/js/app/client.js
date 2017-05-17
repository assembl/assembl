import ApolloClient from 'apollo-client';
import { createNetworkInterface } from 'apollo-upload-client';
import { getDiscussionSlug } from './utils/globalFunctions';
import { getFullPath } from './utils/routeMap';
import fetch from 'isomorphic-fetch';  // eslint-disable-line

const client = new ApolloClient({
  networkInterface: createNetworkInterface({
    uri: getFullPath('graphql', { slug: getDiscussionSlug() }),
    opts: {
      addTypename: true,
      credentials: 'same-origin'
    }
  })
});

export default client;