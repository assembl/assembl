// @flow
import sortBy from 'lodash/sortBy';
import type { ApolloClient } from 'react-apollo';

import { I18n } from 'react-redux-i18n';
import ThematicsQuery from '../../../graphql/ThematicsQuery.graphql';
import { convertEntriesToI18nValue, convertEntriesToI18nRichText } from '../../form/utils';
import ThematicsDataQuery from '../../../graphql/ThematicsDataQuery.graphql';
import { type Option } from '../../form/selectFieldAdapter';
import type { ThemesAdminValues, ThemeValue, ThemeValueFromQuery } from './types.flow';
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

type ThemeValueWithChildren = {
  children: Array<ThemeValueWithChildren>
} & ThemeValue;

const getMessageViewOverride = (key: ?string): Option => {
  if (key) {
    return { value: key, label: I18n.t(`administration.modules.${key}`) };
  }
  return { value: 'noModule', label: I18n.t('administration.modules.noModule') };
};

const getThemeData = (t: ThemeValueFromQuery): ThemeValueWithChildren => {
  const announcement = {
    title: convertEntriesToI18nValue(t.announcement ? t.announcement.titleEntries : []),
    body: convertEntriesToI18nRichText(t.announcement ? t.announcement.bodyEntries : []),
    quote: convertEntriesToI18nRichText(t.announcement ? t.announcement.quoteEntries : [])
  };
  return {
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
    description: convertEntriesToI18nValue(t.descriptionEntries),
    announcement: announcement,
    order: t.order,
    children: sortBy(t.children, 'order').map(t2 => getThemeData(t2))
  };
};

export function postLoadFormat(data: ThematicsQueryQuery): ThemesAdminValues {
  const { rootIdea, thematics } = data;
  // $FlowFixMe
  const tree = thematics ? getTree(rootIdea && rootIdea.id, thematics) : [];
  return {
    themes: sortBy(tree, 'order').map(t => getThemeData(t))
  };
}