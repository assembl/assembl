// @flow
import type { ApolloClient } from 'react-apollo';

import type { ResourcesValues } from './types.flow';
// import createResourceMutation from '../../../graphql/mutations/createResource.graphql';
// import updateResourceMutation from '../../../graphql/mutations/updateResource.graphql';
// import deleteResourceMutation from '../../../graphql/mutations/deleteResource.graphql';
// import updateResourcesCenterMutation from '../../../graphql/mutations/updateResourcesCenter.graphql';

export const createMutationsPromises = (client: ApolloClient) => (values: ResourcesValues, initialValues: ResourcesValues) => {
  // const initialIds = initialValues.themes.map(t => t.id);
  // const currentIds = values.themes.map(t => t.id);
  // const idsToDelete = difference(initialIds, currentIds);
  // const idsToCreate = difference(currentIds, initialIds);
  console.log('createMutationsPromises', client, values, initialValues); // eslint-disable-line
  return [() => new Promise(() => {})];
};

export function save() {
  return new Promise(() => {});
}