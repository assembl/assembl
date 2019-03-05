// @flow
import difference from 'lodash/difference';
import isEqual from 'lodash/isEqual';
import type { ApolloClient } from 'react-apollo';

import type { PhasesValues } from './type.flow';
import { createSave, convertToEntries, getFileVariable, convertDateTimeToISO8601String } from '../../../form/utils';
import createDiscussionPhaseMutation from '../../../../graphql/mutations/createDiscussionPhase.graphql';
import updateDiscussionPhaseMutation from '../../../../graphql/mutations/updateDiscussionPhase.graphql';
import deleteDiscussionPhaseMutation from '../../../../graphql/mutations/deleteDiscussionPhase.graphql';

async function getPhasesVariables(client, phase, initialPhase, order) {
  const initialImg = initialPhase ? initialPhase.image : null;
  return {
    image: getFileVariable(phase.img, initialImg),
    titleEntries: convertToEntries(phase.title),
    descriptionEntries: convertToEntries(phase.description),
    start: convertDateTimeToISO8601String(phase.headerStartDate),
    end: convertDateTimeToISO8601String(phase.headerEndDate),
    order: order
  };
}

export const createMutationsPromises = (client: ApolloClient, lang: string) => (
  values: PhasesValues,
  initialValues: PhasesValues
) => {
  const allMutations = [];
  allMutations.push(() =>
    client.mutate({
      mutation: updateDiscussionPhaseMutation,
      variables: getPhasesVariables(values)
    })
  );

  const initialIds = initialValues.phases.map(t => t.id);
  const currentIds = values.phases.map(t => t.id);
  const idsToDelete = difference(initialIds, currentIds);
  const idsToCreate = difference(currentIds, initialIds);

  const deleteMutations = idsToDelete.map(id => () =>
    client.mutate({
      mutation: deleteDiscussionPhaseMutation,
      variables: { resourceId: id }
    })
  );
  allMutations.push(...deleteMutations);

  const createUpdateMutations = values.phases.map((phase, idx) => {
    const initialPhase = initialValues.phases.find(t => t.id === phase.id);
    const order = idx !== initialIds.indexOf(phase.id) ? idx + 1 : null;
    if (idsToCreate.indexOf(phase.id) > -1) {
      return () =>
        getPhasesVariables(client, phase, initialPhase, order).then(variables =>
          client.mutate({
            mutation: createDiscussionPhaseMutation,
            variables: {
              lang: lang,
              ...variables
            }
          })
        );
    }

    const orderHasChanged = initialIds.indexOf(phase.id) !== currentIds.indexOf(phase.id);
    const hasChanged = orderHasChanged || !isEqual(initialPhase, phase);
    if (hasChanged) {
      return () =>
        getPhasesVariables(client, phase, initialPhase, order).then(variables =>
          client.mutate({
            mutation: updateDiscussionPhaseMutation,
            variables: {
              id: phase.id,
              lang: lang,
              ...variables
            }
          })
        );
    }

    return () => Promise.resolve();
  });

  allMutations.push(...createUpdateMutations);
  return allMutations;
};

export const save = createSave('administration.resourcesCenter.successSave');