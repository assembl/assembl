// @flow
import isEqual from 'lodash/isEqual';
import type { ApolloClient } from 'react-apollo';
import range from 'lodash/range';

import type { ThemesAdminValues } from './types.flow';
import updateIdeasMutation from '../../../graphql/mutations/updateIdeas.graphql';
import { createSave, convertToEntries, convertRichTextToVariables, getFileVariable } from '../../form/utils';
import { MESSAGE_VIEW } from '../../../constants';

const getMessageColumnsVariables = (theme, client) => {
  if (!theme.multiColumns) {
    return [];
  }
  const checkedForm =
    theme.multiColumns && theme.multiColumns.radioButtons && theme.multiColumns.radioButtons.find(button => button.isChecked);
  let nbColumnsInForm = checkedForm ? checkedForm.size : theme.multiColumns.messageColumns.length;
  if (theme.messageViewOverride && theme.messageViewOverride.value !== MESSAGE_VIEW.messageColumns) {
    nbColumnsInForm = 0;
  }
  return theme.multiColumns.messageColumns && theme.multiColumns.messageColumns.length > 0
    ? range(0, nbColumnsInForm).map(async (index) => {
      const bodyVars = await (theme.multiColumns.messageColumns[index].columnSynthesis.body
        ? convertRichTextToVariables(theme.multiColumns.messageColumns[index].columnSynthesis.body, client)
        : Promise.resolve({ attachments: [], entries: [] }));
      const { entries: bodyEntries } = bodyVars;
      return {
        messageClassifier: theme.multiColumns.messageColumns[index].messageClassifier,
        titleEntries: convertToEntries(theme.multiColumns.messageColumns[index].title),
        nameEntries: convertToEntries(theme.multiColumns.messageColumns[index].name),
        color: theme.multiColumns.messageColumns[index].color,
        columnSynthesisSubject: theme.multiColumns.messageColumns[index].columnSynthesis.subject
          ? convertToEntries(theme.multiColumns.messageColumns[index].columnSynthesis.subject)
          : [],
        columnSynthesisBody: bodyEntries
      };
    })
    : [];
};

const getChildrenVariables = (client, thematic, initialTheme) =>
  (thematic.children
    ? thematic.children.map(async (t, idx) => {
      const order = idx + 1;
      const initialChild = initialTheme && initialTheme.children.find(theme => t.id === theme.id);
      const initialImg = initialChild ? initialChild.img : null;
      let announcement = null;
      if (t.announcement) {
        const bodyVars = await convertRichTextToVariables(t.announcement.body, client);
        const { attachments: bodyAttachments, entries: bodyEntries } = bodyVars;
        const titleEntries = convertToEntries(t.announcement.title);
        const quote = await (t.announcement.quote &&
          t.messageViewOverride &&
          t.messageViewOverride.value === MESSAGE_VIEW.survey
          ? convertRichTextToVariables(t.announcement.quote, client)
          : Promise.resolve({ attachments: [], entries: [] }));
        if (titleEntries.length > 0) {
          announcement = {
            titleEntries: titleEntries,
            bodyAttachments: bodyAttachments,
            bodyEntries: bodyEntries,
            quoteEntries: quote.entries
          };
        }
      }
      return {
        id: t.id.startsWith('-') ? null : t.id,
        messageViewOverride: t.messageViewOverride ? t.messageViewOverride.value : null,
        titleEntries: convertToEntries(t.title),
        descriptionEntries: t.description ? convertToEntries(t.description) : [],
        announcement: announcement,
        image: getFileVariable(t.img, initialImg),
        questions:
            t.questions &&
            t.questions.map(q => ({
              id: q.id.startsWith('-') ? null : q.id,
              titleEntries: convertToEntries(q.title)
            })),
        order: order,
        children: await Promise.all(getChildrenVariables(client, t, initialTheme)),
        messageColumns: await Promise.all(getMessageColumnsVariables(t, client))
      };
    })
    : []);

async function getIdeaInput(client, theme, initialTheme, order) {
  const initialImg = initialTheme ? initialTheme.img : null;
  let announcement = null;
  if (theme.announcement) {
    const bodyVars = await convertRichTextToVariables(theme.announcement.body, client);
    const { attachments: bodyAttachments, entries: bodyEntries } = bodyVars;
    const titleEntries = convertToEntries(theme.announcement.title);
    const quote = await (theme.announcement.quote &&
    theme.messageViewOverride &&
    theme.messageViewOverride.value === MESSAGE_VIEW.survey
      ? convertRichTextToVariables(theme.announcement.quote, client)
      : Promise.resolve({ attachments: [], entries: [] }));
    if (titleEntries.length > 0) {
      announcement = {
        titleEntries: titleEntries,
        bodyAttachments: bodyAttachments,
        bodyEntries: bodyEntries,
        quoteEntries: quote.entries
      };
    }
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
    children: await Promise.all(getChildrenVariables(client, theme, initialTheme)),
    messageColumns: await Promise.all(getMessageColumnsVariables(theme, client))
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