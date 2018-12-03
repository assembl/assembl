// @flow
import sortBy from 'lodash/sortBy';
import type { ApolloClient } from 'react-apollo';

import { I18n } from 'react-redux-i18n';
import ThematicsQuery from '../../../graphql/ThematicsQuery.graphql';
import { convertEntriesToI18nValue, convertEntriesToI18nRichText } from '../../form/utils';
import ThematicsDataQuery from '../../../graphql/ThematicsDataQuery.graphql';
import type { FileValue } from '../../form/types.flow';
import { type Option } from '../../form/selectFieldAdapter';
import type { MediaValue, SurveyAdminValues, ThemeValue } from './types.flow';
import { getTree } from '../../../utils/tree';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy, discussionPhaseId: ?string, locale: string) => {
  const { data } = await client.query({
    query: ThematicsQuery,
    variables: { discussionPhaseId: discussionPhaseId },
    fetchPolicy: fetchPolicy
  });
  // Prefetch the ThematicsDataQuery for the admin menu
  client.query({
    query: ThematicsDataQuery,
    variables: { discussionPhaseId: discussionPhaseId, lang: locale }
  });
  return data;
};

type Video = {
  htmlCode: ?string,
  mediaFile: ?FileValue
};

type ThemeValueWithChildren = {
  children: ThemeValueWithChildren
} & ThemeValue;

export function convertMedia(video: Video): MediaValue {
  return {
    htmlCode: video.htmlCode || '',
    img: video.mediaFile || null
  };
}

const getMessageViewOverride = (key: ?string): Option => {
  if (key) {
    return { value: key, label: I18n.t(`administration.modules.${key}`) };
  }
  return { value: 'thread', label: I18n.t('administration.modules.thread') };
};

const getChildren = thematic =>
  sortBy(thematic.children, 'order').map(t => ({
    id: t.id,
    messageViewOverride: getMessageViewOverride(t.messageViewOverride),
    title: convertEntriesToI18nValue(t.titleEntries),
    img: t.img,
    children: getChildren(t)
  }));

export function postLoadFormat(data: ThematicsQueryQuery): SurveyAdminValues {
  const { rootIdea, thematics } = data;
  // $FlowFixMe
  const tree = thematics ? getTree(rootIdea && rootIdea.id, thematics) : [];
  return {
    themes: sortBy(tree, 'order').map(t => ({
      id: t.id,
      messageViewOverride: getMessageViewOverride(t.messageViewOverride),
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