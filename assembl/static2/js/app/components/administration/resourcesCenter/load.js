// @flow
import type { ApolloClient } from 'react-apollo';

import type { ResourcesValues } from './types.flow';
import ResourcesCenterPageQuery from '../../../graphql/ResourcesCenterPage.graphql';
import ResourcesQuery from '../../../graphql/ResourcesQuery.graphql';
import { convertEntriesToI18nValue, convertEntriesToI18nRichText } from '../../form/utils';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy, lang: string) => {
  const { data: resourcesCenterData } = await client.query({
    query: ResourcesCenterPageQuery,
    variables: { lang: lang },
    fetchPolicy: fetchPolicy
  });

  const { data: resourcesData } = await client.query({
    query: ResourcesQuery,
    variables: { lang: lang },
    fetchPolicy: fetchPolicy
  });

  return {
    ...resourcesCenterData,
    ...resourcesData
  };
};

type Data = ResourcesCenterPageQuery & ResourcesQueryQuery;

export function postLoadFormat(data: Data): ResourcesValues {
  return {
    pageTitle: convertEntriesToI18nValue(data.resourcesCenter.titleEntries),
    pageHeader: data.resourcesCenter.headerImage,
    resources: data.resources.map(r => ({
      doc: r.doc,
      embedCode: r.embedCode,
      id: r.id,
      img: r.image,
      text: convertEntriesToI18nRichText(r.textEntries),
      title: convertEntriesToI18nValue(r.titleEntries)
    }))
  };
}