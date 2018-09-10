// @flow
import sortBy from 'lodash/sortBy';
import type { ApolloClient } from 'react-apollo';

import ThematicsQuery from '../../../graphql/ThematicsQuery.graphql';
import { convertEntriesToI18nValue, convertEntriesToI18nRichText } from '../../form/utils';
import type { FileValue } from '../../form/types.flow';
import { createRandomId } from '../../../utils/globalFunctions';
import type { MediaValue, SurveyAdminValues, ThemeValue } from './types.flow';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy) => {
  const { data } = await client.query({
    query: ThematicsQuery,
    variables: { identifier: 'survey' },
    fetchPolicy: fetchPolicy
  });
  return data;
};

type Video = {
  htmlCode: ?string,
  mediaFile: ?FileValue
};
export function convertMedia(video: Video): MediaValue {
  return {
    htmlCode: video.htmlCode || '',
    img: video.mediaFile || null
  };
}

export function getEmptyThematic(): ThemeValue {
  return {
    id: createRandomId(),
    img: null,
    questions: [],
    title: {},
    video: {
      media: null,
      title: {},
      descriptionBottom: {},
      descriptionSide: {},
      descriptionTop: {}
    }
  };
}

export function postLoadFormat(data: ThematicsQueryQuery): SurveyAdminValues {
  if (!data.thematics || data.thematics.length === 0) {
    return {
      themes: [getEmptyThematic()]
    };
  }

  return {
    themes: sortBy(data.thematics, 'order').map(t => ({
      id: t.id,
      img: t.img,
      questions:
        t.questions.map(q => ({
          id: q.id,
          title: convertEntriesToI18nValue(q.titleEntries)
        })) || [],
      title: convertEntriesToI18nValue(t.titleEntries),
      video: {
        media: t.video ? convertMedia(t.video) : null,
        title: t.video ? convertEntriesToI18nValue(t.video.titleEntries) : {},
        descriptionBottom: t.video ? convertEntriesToI18nRichText(t.video.descriptionEntriesBottom) : {},
        descriptionSide: t.video ? convertEntriesToI18nRichText(t.video.descriptionEntriesSide) : {},
        descriptionTop: t.video ? convertEntriesToI18nRichText(t.video.descriptionEntriesTop) : {}
      }
    }))
  };
}