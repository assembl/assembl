import { ApolloClient, toIdValue, IntrospectionFragmentMatcher } from 'react-apollo';
import { UploadHTTPFetchNetworkInterface } from 'apollo-upload-client';
import * as Sentry from '@sentry/browser';

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

class DualUriNetworkInterface extends UploadHTTPFetchNetworkInterface {
  constructor(uri, mutationUri, opts) {
    super(uri, opts);
    this.queryUri = uri;
    this.mutationUri = mutationUri;
  }

  fetchFromRemoteEndpoint({ request, options }) {
    if (request.query.definitions.length && request.query.definitions[0].operation === 'mutation') {
      this._uri = this.mutationUri; // eslint-disable-line no-underscore-dangle
    } else {
      this._uri = this.queryUri; // eslint-disable-line no-underscore-dangle
    }
    return super.fetchFromRemoteEndpoint({ request: request, options: options });
  }
}

const queryUri = getFullPath('graphql', { slug: getDiscussionSlug() });
// TODO: get a separate Uri from globalFunctions
const mutationUri = queryUri;

let networkInterface;

if (queryUri === mutationUri) {
  networkInterface = new UploadHTTPFetchNetworkInterface(queryUri, { credentials: 'same-origin' });
} else {
  networkInterface = new DualUriNetworkInterface(queryUri, mutationUri, { credentials: 'same-origin' });
}

// trace every graphql operation in sentry
networkInterface.use([
  {
    applyMiddleware: function (req, next) {
      Sentry.addBreadcrumb({
        category: 'graphql',
        message: `GraphQL operation: ${req.request.operationName}`,
        data: {
          variables: req.request.variables
        },
        level: 'info'
      });

      next();
    }
  }
]);

const client = new ApolloClient({
  fragmentMatcher: myFragmentMatcher,
  dataIdFromObject: dataIdFromObject,
  customResolvers: {
    Query: {
      node: (_, args) => toIdValue(dataIdFromObject({ id: args.id }))
    }
  },
  networkInterface: networkInterface
});

export default client;