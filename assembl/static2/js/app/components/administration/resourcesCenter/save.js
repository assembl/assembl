// @flow
import difference from 'lodash/difference';
import isEqual from 'lodash/isEqual';
import type { ApolloClient } from 'react-apollo';

import { convertEntriesToHTML } from '../../../utils/draftjs';
import type { ResourcesValues } from './types.flow';
import { createSave, convertToEntries, getFileVariable } from '../../form/utils';
import createResourceMutation from '../../../graphql/mutations/createResource.graphql';
import updateResourceMutation from '../../../graphql/mutations/updateResource.graphql';
import deleteResourceMutation from '../../../graphql/mutations/deleteResource.graphql';
import updateResourcesCenterMutation from '../../../graphql/mutations/updateResourcesCenter.graphql';

function getResourcesCenterVariables(values) {
  return {
    titleEntries: convertToEntries(values.pageTitle),
    headerImage: getFileVariable(values.pageHeader)
  };
}

function getResourceVariables(resource, initialResource, order) {
  const initialDoc = initialResource ? initialResource.doc : null;
  const initialImg = initialResource ? initialResource.img : null;
  return {
    doc: getFileVariable(resource.doc, initialDoc),
    embedCode: resource.embedCode,
    image: getFileVariable(resource.img, initialImg),
    textEntries: convertEntriesToHTML(convertToEntries(resource.text)),
    titleEntries: convertToEntries(resource.title),
    order: order
  };
}

export const createMutationsPromises = (client: ApolloClient, lang: string) => (
  values: ResourcesValues,
  initialValues: ResourcesValues
) => {
  const allMutations = [];
  allMutations.push(() =>
    client.mutate({
      mutation: updateResourcesCenterMutation,
      variables: getResourcesCenterVariables(values)
    })
  );

  const initialIds = initialValues.resources.map(t => t.id);
  const currentIds = values.resources.map(t => t.id);
  const idsToDelete = difference(initialIds, currentIds);
  const idsToCreate = difference(currentIds, initialIds);

  const deleteMutations = idsToDelete.map(id => () =>
    client.mutate({
      mutation: deleteResourceMutation,
      variables: { resourceId: id }
    })
  );
  allMutations.push(...deleteMutations);

  const createUpdateMutations = values.resources.map((resource, idx) => {
    const initialResource = initialValues.resources.find(t => t.id === resource.id);
    const order = idx !== initialIds.indexOf(resource.id) ? idx + 1 : null;
    const variables = getResourceVariables(resource, initialResource, order);
    if (idsToCreate.indexOf(resource.id) > -1) {
      return () =>
        client.mutate({
          mutation: createResourceMutation,
          variables: {
            lang: lang,
            ...variables
          }
        });
    }

    const orderHasChanged = initialIds.indexOf(resource.id) !== currentIds.indexOf(resource.id);
    const hasChanged = orderHasChanged || !isEqual(initialResource, resource);
    if (hasChanged) {
      return () =>
        client.mutate({
          mutation: updateResourceMutation,
          variables: {
            id: resource.id,
            lang: lang,
            ...variables
          }
        });
    }

    return () => Promise.resolve();
  });

  allMutations.push(...createUpdateMutations);
  return allMutations;
};

export const save = createSave('administration.resourcesCenter.successSave');