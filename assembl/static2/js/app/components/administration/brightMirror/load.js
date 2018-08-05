// @flow
import type { ApolloClient } from 'react-apollo';

import type { ResourcesValues } from './types.flow';
import ResourcesCenterPageQuery from '../../../graphql/ResourcesCenterPage.graphql';
import ResourcesQuery from '../../../graphql/ResourcesQuery.graphql';
import { convertEntries } from '../../form/utils';
import { convertEntriesToRawContentState } from '../../../utils/draftjs';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy) => {
  const { data: resourcesCenterData } = await client.query({
    query: ResourcesCenterPageQuery,
    fetchPolicy: fetchPolicy
  });

  const { data: resourcesData } = await client.query({
    query: ResourcesQuery,
    variables: { identifier: 'survey' },
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
    pageTitle: convertEntries(data.resourcesCenter.titleEntries),
    pageHeader: data.resourcesCenter.headerImage,
    resources: data.resources.map(r => ({
      doc: r.doc,
      embedCode: r.embedCode,
      id: r.id,
      img: r.image,
      text: convertEntries(convertEntriesToRawContentState(r.textEntries)),
      title: convertEntries(r.titleEntries)
    }))
  };
}