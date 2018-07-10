// @flow
import difference from 'lodash/difference';
import type { ApolloClient } from 'react-apollo';
import { I18n } from 'react-redux-i18n';

import { convertEntriesToHTML } from '../../../utils/draftjs';
import { displayAlert } from '../../../utils/utilityManager';
import { runSerial } from '../saveButton';
import type { SurveyAdminValues } from './types.flow';
import createThematicMutation from '../../../graphql/mutations/createThematic.graphql';
import deleteThematicMutation from '../../../graphql/mutations/deleteThematic.graphql';
import updateThematicMutation from '../../../graphql/mutations/updateThematic.graphql';
import type { MutationsPromises, SaveStatus } from '../../form/types.flow';

function convertToEntries(valuesByLocale) {
  return Object.keys(valuesByLocale).map(locale => ({
    localeCode: locale,
    value: valuesByLocale[locale]
  }));
}

function getImageVariable(img, initialImg) {
  if (initialImg && !img) {
    return 'TO_DELETE';
  }

  // If thematic.img.externalUrl is an object, it means it's a File.
  // We need to send image: null if we didn't change the image.
  const variab = img && typeof img.externalUrl === 'object' ? img.externalUrl : null;
  return variab;
}

function getVideoVariable(video, initialVideo) {
  if (video === null || !video.present) {
    // pass {} to remove all video fields on server side
    return {};
  }

  const initialMediaFile = initialVideo && initialVideo.media && initialVideo.media.img;
  const mediaImg = video.media ? video.media.img : null;
  const mediaFile = getImageVariable(mediaImg, initialMediaFile);

  const videoV = {
    htmlCode: video.media ? video.media.htmlCode : '',
    mediaFile: mediaFile,
    titleEntries: video.title ? convertToEntries(video.title) : null,
    descriptionEntriesBottom: video.descriptionBottom ? convertEntriesToHTML(convertToEntries(video.descriptionBottom)) : null,
    descriptionEntriesSide: video.descriptionSide ? convertEntriesToHTML(convertToEntries(video.descriptionSide)) : null,
    descriptionEntriesTop: video.descriptionTop ? convertEntriesToHTML(convertToEntries(video.descriptionTop)) : null
  };
  return videoV;
}

function getVariables(theme, initialTheme, order) {
  const initialImg = initialTheme ? initialTheme.img : null;
  const initialVideo = initialTheme ? initialTheme.video : null;
  return {
    identifier: 'survey',
    titleEntries: convertToEntries(theme.title),
    image: getImageVariable(theme.img, initialImg),
    video: getVideoVariable(theme.video, initialVideo),
    questions:
      theme.questions &&
      theme.questions.map(q => ({
        id: q.id.startsWith('-') ? null : q.id,
        titleEntries: convertToEntries(q.title)
      })),
    order: order
  };
}

export const createMutationsPromises = (client: ApolloClient) => (
  values: SurveyAdminValues,
  initialValues: SurveyAdminValues
) => {
  const initialIds = initialValues.themes.map(t => t.id);
  const currentIds = values.themes.map(t => t.id);
  const idsToDelete = difference(initialIds, currentIds);
  const idsToCreate = difference(currentIds, initialIds);

  const allMutations = [];

  const deleteMutations = idsToDelete.map(id =>
    client.mutate({
      mutation: deleteThematicMutation,
      variables: { thematicId: id }
    })
  );
  allMutations.push(...deleteMutations);

  const createUpdateMutations = values.themes.map((theme, idx) => {
    const initialTheme = initialValues.themes.find(t => t.id === theme.id);
    const order = idx !== initialIds.indexOf(theme.id) ? idx + 1 : null;
    const variables = getVariables(theme, initialTheme, order);
    if (idsToCreate.indexOf(theme.id) > 0) {
      return client.mutate({
        mutation: createThematicMutation,
        variables: variables
      });
    }
    return client.mutate({
      mutation: updateThematicMutation,
      variables: {
        id: theme.id,
        ...variables
      }
    });
  });
  allMutations.push(...createUpdateMutations);
  return allMutations;
};

export const save = async (mutationsPromises: MutationsPromises): Promise<SaveStatus> => {
  let status = 'PENDING';
  await runSerial(mutationsPromises)
    .then(() => {
      status = 'OK';
      displayAlert('success', I18n.t('administration.successThemeCreation'));
    })
    .catch((error) => {
      status = 'KO';
      displayAlert('danger', error, false, 30000);
    });

  return status;
};