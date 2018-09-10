// @flow
import sortBy from 'lodash/sortBy';
import type { ApolloClient } from 'react-apollo';
import { PHASES } from '../../../constants';

import ThematicsQuery from '../../../graphql/ThematicsQuery.graphql';
import { convertEntriesToI18nValue, convertEntriesToI18nRichText } from '../../form/utils';
import type { BrightMirrorAdminValues } from './types.flow';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy) => {
  const { data } = await client.query({
    query: ThematicsQuery,
    variables: { identifier: PHASES.brightMirror },
    fetchPolicy: fetchPolicy
  });
  return data;
};

export function postLoadFormat(data: ThematicsQueryQuery): BrightMirrorAdminValues {
  return {
    themes: sortBy(data.thematics, 'order').map(t => ({
      id: t.id,
      img: t.img,
      title: convertEntriesToI18nValue(t.titleEntries),
      description: convertEntriesToI18nValue(t.descriptionEntries),
      announcement: {
        title: convertEntriesToI18nValue(t.announcement.titleEntries),
        body: convertEntriesToI18nRichText(t.announcement.bodyEntries)
      }
    }))
  };
}