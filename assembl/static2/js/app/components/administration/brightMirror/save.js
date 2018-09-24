// @flow
import difference from 'lodash/difference';
import isEqual from 'lodash/isEqual';
import type { ApolloClient } from 'react-apollo';
import type { BrightMirrorAdminValues } from './types.flow';
import { PHASES } from '../../../constants';

import createThematicMutation from '../../../graphql/mutations/createThematic.graphql';
import deleteThematicMutation from '../../../graphql/mutations/deleteThematic.graphql';
import updateThematicMutation from '../../../graphql/mutations/updateThematic.graphql';
import { createSave, convertRichTextToEntries, convertToEntries, getFileVariable } from '../../form/utils';

function getVariables(theme, initialTheme, order, discussionPhaseId) {
  const initialImg = initialTheme ? initialTheme.img : null;
  return {
    discussionPhaseId: discussionPhaseId,
    messageViewOverride: PHASES.brightMirror,
    titleEntries: convertToEntries(theme.title),
    descriptionEntries: convertToEntries(theme.description),
    image: getFileVariable(theme.img, initialImg),
    announcement: {
      titleEntries: convertToEntries(theme.announcement.title),
      bodyEntries: convertRichTextToEntries(theme.announcement.body)
    },
    order: order
  };
}

export const createMutationsPromises = (client: ApolloClient, discussionPhaseId: ?string) => (
  values: BrightMirrorAdminValues,
  initialValues: BrightMirrorAdminValues
) => {
  const initialIds = initialValues.themes.map(t => t.id);
  const currentIds = values.themes.map(t => t.id);
  const idsToDelete = difference(initialIds, currentIds);
  const idsToCreate = difference(currentIds, initialIds);

  const allMutations = [];

  const deleteMutations = idsToDelete.map(id => () =>
    client.mutate({
      mutation: deleteThematicMutation,
      variables: { thematicId: id }
    })
  );
  allMutations.push(...deleteMutations);

  const createUpdateMutations = values.themes.map((theme, idx) => {
    const initialTheme = initialValues.themes.find(t => t.id === theme.id);
    const order = idx !== initialIds.indexOf(theme.id) ? idx + 1 : null;
    const variables = getVariables(theme, initialTheme, order, discussionPhaseId);
    if (idsToCreate.indexOf(theme.id) > -1) {
      return () =>
        client.mutate({
          mutation: createThematicMutation,
          variables: variables
        });
    }

    const orderHasChanged = initialIds.indexOf(theme.id) !== currentIds.indexOf(theme.id);
    const hasChanged = orderHasChanged || !isEqual(initialTheme, theme);
    if (hasChanged) {
      return () =>
        client.mutate({
          mutation: updateThematicMutation,
          variables: {
            id: theme.id,
            ...variables
          }
        });
    }

    return () => Promise.resolve();
  });

  allMutations.push(...createUpdateMutations);
  return allMutations;
};

export const save = createSave('administration.successThemeCreation');