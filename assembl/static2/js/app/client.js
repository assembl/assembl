import ApolloClient, { createNetworkInterface } from 'apollo-client';
// import { getDiscussionSlug } from './utils/globalFunctions';

const client = new ApolloClient({
  networkInterface: createNetworkInterface({ uri: 'http://localhost:3000/graphql' }),
  dataIdFromObject: o => o.id
  // networkInterface: createNetworkInterface({ uri: `${window.location.origin}/${getDiscussionSlug()}/graphql` })
});

export default client;