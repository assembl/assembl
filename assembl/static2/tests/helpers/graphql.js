/* Helpers for tests involving graphql/apollo */
import ApolloClient from 'apollo-client';
import { addMockFunctionsToSchema } from 'graphql-tools';
import { mockNetworkInterfaceWithSchema } from 'apollo-test-utils';
import { buildClientSchema } from 'graphql';

import * as introspectionResult from './schema.json';

const schema = buildClientSchema(introspectionResult);

addMockFunctionsToSchema({ schema: schema });

const mockNetworkInterface = mockNetworkInterfaceWithSchema({ schema: schema });

export const client = new ApolloClient({
  networkInterface: mockNetworkInterface
});