// @flow
import difference from 'lodash/difference';
import isEqual from 'lodash/isEqual';
import type { ApolloClient } from 'react-apollo';

import type { SurveyAdminValues } from './types.flow';
import createThematicMutation from '../../../graphql/mutations/createThematic.graphql';
import deleteThematicMutation from '../../../graphql/mutations/deleteThematic.graphql';
import updateThematicMutation from '../../../graphql/mutations/updateThematic.graphql';
import { createSave, convertToEntries, convertRichTextToVariables, getFileVariable } from '../../form/utils';

async function getVideoVariable(client, video, initialVideo) {
  if (!video) {
    // pass {} to remove all video fields on server side
    return {};
  }

  const initialMediaFile = initialVideo && initialVideo.media && initialVideo.media.img;
  const mediaImg = video.media ? video.media.img : null;
  const mediaFile = getFileVariable(mediaImg, initialMediaFile);

  const descriptionBottomVariables = await convertRichTextToVariables(video.descriptionBottom);
  const { attachments: descriptionBottomAttachments, entries: descriptionEntriesBottom } = descriptionBottomVariables;
  const descriptionSideVariables = await convertRichTextToVariables(video.descriptionSide);
  const { attachments: descriptionSideAttachments, entries: descriptionEntriesSide } = descriptionSideVariables;
  const descriptionTopVariables = await convertRichTextToVariables(video.descriptionTop);
  const { attachments: descriptionTopAttachments, entries: descriptionEntriesTop } = descriptionTopVariables;

  const videoV = {
    htmlCode: video.media ? video.media.htmlCode : '',
    mediaFile: mediaFile,
    titleEntries: video.title ? convertToEntries(video.title) : null,
    descriptionBottomAttachments: descriptionBottomAttachments,
    descriptionSideAttachments: descriptionSideAttachments,
    descriptionTopAttachments: descriptionTopAttachments,
    descriptionEntriesBottom: descriptionEntriesBottom,
    descriptionEntriesSide: descriptionEntriesSide,
    descriptionEntriesTop: descriptionEntriesTop
  };
  return videoV;
}

const getChildrenVariables = (thematic, initialTheme) =>
  (thematic.children
    ? thematic.children.map((t) => {
      const initialChild = initialTheme && initialTheme.children.find(theme => t.id === theme.id);
      const initialImg = initialChild ? initialChild.img : null;
      return {
        titleEntries: convertToEntries(t.title),
        image: getFileVariable(t.img, initialImg),
        children: getChildrenVariables(t, initialChild)
      };
    })
    : []);

async function getVariables(client, theme, initialTheme, order, discussionPhaseId) {
  const initialImg = initialTheme ? initialTheme.img : null;
  const initialVideo = initialTheme ? initialTheme.video : null;
  return {
    discussionPhaseId: discussionPhaseId,
    titleEntries: convertToEntries(theme.title),
    image: getFileVariable(theme.img, initialImg),
    video: await getVideoVariable(client, theme.video, initialVideo),
    questions:
      theme.questions &&
      theme.questions.map(q => ({
        id: q.id.startsWith('-') ? null : q.id,
        titleEntries: convertToEntries(q.title)
      })),
    order: order,
    children: getChildrenVariables(theme, initialTheme)
  };
}

export const createMutationsPromises = (client: ApolloClient, discussionPhaseId: ?string) => (
  values: SurveyAdminValues,
  initialValues: SurveyAdminValues
) => {
  const initialIds = initialValues.themes.map(t => t.id);
  const currentIds = values.themes.map(t => t.id);
  const idsToDelete = difference(initialIds, currentIds);
  const idsToCreate = currentIds.filter(id => parseInt(id, 10) && parseInt(id, 10) < 0);

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
    if (idsToCreate.indexOf(theme.id) > -1) {
      return () =>
        getVariables(client, theme, initialTheme, order, discussionPhaseId).then(variables =>
          client.mutate({
            mutation: createThematicMutation,
            variables: variables
          })
        );
    }

    const orderHasChanged = initialIds.indexOf(theme.id) !== currentIds.indexOf(theme.id);
    const hasChanged = orderHasChanged || !isEqual(initialTheme, theme);
    if (hasChanged) {
      return () =>
        getVariables(client, theme, initialTheme, order, discussionPhaseId).then(variables =>
          client.mutate({
            mutation: updateThematicMutation,
            variables: {
              id: theme.id,
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

export const save = createSave('administration.successThemeCreation');