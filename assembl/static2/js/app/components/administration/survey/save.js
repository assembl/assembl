// @flow
import isEqual from 'lodash/isEqual';
import type { ApolloClient } from 'react-apollo';

import type { ThemesAdminValues } from './types.flow';
import updateIdeasMutation from '../../../graphql/mutations/updateIdeas.graphql';
import { createSave, convertToEntries, convertRichTextToVariables, getFileVariable } from '../../form/utils';

const getChildrenVariables = (client, thematic, initialTheme) =>
  (thematic.children
    ? thematic.children.map(async (t, idx) => {
      const order = idx + 1;
      const initialChild = initialTheme && initialTheme.children.find(theme => t.id === theme.id);
      const initialImg = initialChild ? initialChild.img : null;
      const bodyVars = await convertRichTextToVariables(t.announcement.body, client);
      const { attachments: bodyAttachments, entries: bodyEntries } = bodyVars;
      const announcementTitleEntries = convertToEntries(t.announcement.title);
      let announcement = null;
      if (announcementTitleEntries.length > 0) {
        announcement = {
          titleEntries: announcementTitleEntries,
          bodyAttachments: bodyAttachments,
          bodyEntries: bodyEntries
        };
      }
      return {
        id: t.id.startsWith('-') ? null : t.id,
        messageViewOverride: t.messageViewOverride ? t.messageViewOverride.value : null,
        titleEntries: convertToEntries(t.title),
        descriptionEntries: t.description ? convertToEntries(t.description) : [],
        announcement: announcement,
        image: getFileVariable(t.img, initialImg),
        order: order,
        children: getChildrenVariables(client, t, initialChild)
      };
    })
    : []);

async function getIdeaInput(client, theme, initialTheme, order) {
  const initialImg = initialTheme ? initialTheme.img : null;
  const bodyVars = await convertRichTextToVariables(theme.announcement.body, client);
  const { attachments: bodyAttachments, entries: bodyEntries } = bodyVars;
  const announcementTitleEntries = convertToEntries(theme.announcement.title);
  let announcement = null;
  if (announcementTitleEntries.length > 0) {
    announcement = {
      titleEntries: announcementTitleEntries,
      bodyAttachments: bodyAttachments,
      bodyEntries: bodyEntries
    };
  }
  return {
    id: theme.id.startsWith('-') ? null : theme.id,
    messageViewOverride: theme.messageViewOverride ? theme.messageViewOverride.value : null,
    titleEntries: convertToEntries(theme.title),
    descriptionEntries: theme.description ? convertToEntries(theme.description) : [],
    announcement: announcement,
    image: getFileVariable(theme.img, initialImg),
    questions:
      theme.questions &&
      theme.questions.map(q => ({
        id: q.id.startsWith('-') ? null : q.id,
        titleEntries: convertToEntries(q.title)
      })),
    order: order,
    children: await Promise.all(getChildrenVariables(client, theme, initialTheme))
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
  values: ThemesAdminValues,
  initialValues: ThemesAdminValues
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