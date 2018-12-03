// @flow
import isEqual from 'lodash/isEqual';
import type { ApolloClient } from 'react-apollo';

import type { SurveyAdminValues } from './types.flow';
import updateIdeasMutation from '../../../graphql/mutations/updateIdeas.graphql';
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
        id: t.id.startsWith('-') ? null : t.id,
        titleEntries: convertToEntries(t.title),
        image: getFileVariable(t.img, initialImg),
        children: getChildrenVariables(t, initialChild)
      };
    })
    : []);

async function getIdeaInput(client, theme, initialTheme, order) {
  const initialImg = initialTheme ? initialTheme.img : null;
  const initialVideo = initialTheme ? initialTheme.video : null;
  return {
    id: theme.id.startsWith('-') ? null : theme.id,
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

function getIdeas(client, themes, initialThemes) {
  return themes.map(async (theme, idx) => {
    const initialTheme = initialThemes.find(t => t.id === theme.id);
    const order = idx + 1;
    return getIdeaInput(client, theme, initialTheme, order);
  });
}

export const createMutationsPromises = (client: ApolloClient, discussionPhaseId: ?string) => (
  values: SurveyAdminValues,
  initialValues: SurveyAdminValues
) => {
  const allMutations = [];
  let createUpdateMutation;
  const initialThemes = initialValues.themes;
  const hasChanged = !isEqual(initialThemes, values.themes);
  if (hasChanged) {
    createUpdateMutation = () =>
      Promise.all(getIdeas(client, values.themes, initialThemes)).then(ideas =>
        client.mutate({
          mutation: updateIdeasMutation,
          variables: {
            discussionPhaseId: discussionPhaseId,
            ideas: ideas
          }
        })
      );
  } else {
    createUpdateMutation = () => Promise.resolve();
  }

  allMutations.push(createUpdateMutation);
  return allMutations;
};

export const save = createSave('administration.successThemeCreation');