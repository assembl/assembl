import { ApolloClient, toIdValue, IntrospectionFragmentMatcher } from 'react-apollo';
import { createNetworkInterface } from 'apollo-upload-client';
import * as Sentry from '@sentry/browser';
import Cookies from 'js-cookie';
import co from 'co';

import { getDiscussionSlug } from './utils/globalFunctions';
import { getFullPath } from './utils/routeMap';
import fetch from 'isomorphic-fetch'; // eslint-disable-line
import { getCSRFToken } from './utils/csrf';

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
const useCSRFProtection = document.getElementById('useCSRFProtection')
  ? document.getElementById('useCSRFProtection').value
  : 'false';

const networkInterface = createNetworkInterface({
  uri: getFullPath('graphql', { slug: getDiscussionSlug() }),
  opts: {
    credentials: 'same-origin'
  }
});

// trace every graphql operation in sentry
networkInterface.use([
  {
    applyMiddleware: function (req, next) {
      if (!req.options.headers) {
        req.options.headers = {}; // Create the header object if needed.
      }
      co(async () => {
        if (useCSRFProtection === 'true') {
          const responseToken = await getCSRFToken();
          if (responseToken.text === 'ok') {
            req.options.headers['X-XSRF-TOKEN'] = Cookies.get('_csrf');
          }
        }

        next();

        Sentry.addBreadcrumb({
          category: 'graphql',
          message: `GraphQL operation: ${req.request.operationName}`,
          data: {
            variables: req.request.variables
          },
          level: 'info'
        });
      });
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