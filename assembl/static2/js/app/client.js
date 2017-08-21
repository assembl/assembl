import { ApolloClient, IntrospectionFragmentMatcher } from 'react-apollo';
import { createNetworkInterface } from 'apollo-upload-client';
import { getDiscussionSlug } from './utils/globalFunctions';
import { getFullPath } from './utils/routeMap';
import fetch from 'isomorphic-fetch'; // eslint-disable-line

const myFragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData: {
    __schema: {
      types: [
        {
          kind: 'INTERFACE',
          name: 'IdeaInterface',
          possibleTypes: [{ name: 'Idea' }, { name: 'Thematic' }]
        }
      ]
    }
  }
});

const client = new ApolloClient({
  fragmentMatcher: myFragmentMatcher,
  networkInterface: createNetworkInterface({
    uri: getFullPath('graphql', { slug: getDiscussionSlug() }),
    opts: {
      addTypename: true,
      credentials: 'same-origin'
    }
  })
});

export default client;