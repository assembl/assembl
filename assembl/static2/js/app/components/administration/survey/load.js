// @flow
import sortBy from 'lodash/sortBy';
import type { ApolloClient } from 'react-apollo';

import ThematicsQuery from '../../../graphql/ThematicsQuery.graphql';
import { convertEntriesToI18nValue, convertEntriesToI18nRichText } from '../../form/utils';
import type { FileValue } from '../../form/types.flow';
import { PHASES } from '../../../constants';
import type { MediaValue, SurveyAdminValues } from './types.flow';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy) => {
  const { data } = await client.query({
    query: ThematicsQuery,
    variables: { identifier: PHASES.survey },
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

const getChildren = thematic =>
  sortBy(thematic.children, 'order').map(t => ({
    id: t.id,
    title: convertEntriesToI18nValue(t.titleEntries),
    img: t.img,
    children: getChildren(t)
  }));

export function postLoadFormat(data: ThematicsQueryQuery): SurveyAdminValues {
  const { rootIdea, thematics } = data;
  const rootThematics =
    // $FlowFixMe
    rootIdea && thematics ? thematics.filter(t => !t.parentId || (t.parentId && t.parentId === rootIdea.id)) : [];
  return {
    themes: sortBy(rootThematics, 'order').map(t => ({
      id: t.id,
      img: t.img,
      questions:
        (t.questions &&
          t.questions.map(q => ({
            id: q.id,
            title: convertEntriesToI18nValue(q.titleEntries)
          }))) ||
        [],
      title: convertEntriesToI18nValue(t.titleEntries),
      video: {
        media: t.video ? convertMedia(t.video) : null,
        title: t.video ? convertEntriesToI18nValue(t.video.titleEntries) : {},
        descriptionBottom: t.video ? convertEntriesToI18nRichText(t.video.descriptionEntriesBottom) : {},
        descriptionSide: t.video ? convertEntriesToI18nRichText(t.video.descriptionEntriesSide) : {},
        descriptionTop: t.video ? convertEntriesToI18nRichText(t.video.descriptionEntriesTop) : {}
      },
      children: getChildren(t)
    }))
  };
}