import { ApolloClient, toIdValue, IntrospectionFragmentMatcher } from 'react-apollo';
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

// The object id retrieved is already unique, it's actually
// ObjectType:primaryKey encoded in base64, so we define our
// own dataIdFromObject instead of using the default one `${o.__typename}:o.id`.
// This allows us to define a custom resolver for the node query.
// for more info about customResolvers, read
// http://dev.apollodata.com/react/query-splitting.html

const dataIdFromObject = o => o.id;

const client = new ApolloClient({
  fragmentMatcher: myFragmentMatcher,
  dataIdFromObject: dataIdFromObject,
  customResolvers: {
    Query: {
      node: (_, args) => toIdValue(dataIdFromObject({ id: args.id }))
    }
  },
  networkInterface: createNetworkInterface({
    uri: getFullPath('graphql', { slug: getDiscussionSlug() }),
    opts: {
      credentials: 'same-origin'
    }
  })
});

export default client;