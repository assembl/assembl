// @flow
import sortBy from 'lodash/sortBy';
import type { ApolloClient } from 'react-apollo';
import { PHASES } from '../../../constants';

import ThematicsQuery from '../../../graphql/ThematicsQuery.graphql';
import { convertEntries } from '../../form/utils';
import { convertEntriesToRawContentState } from '../../../utils/draftjs';
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
      title: convertEntries(t.titleEntries),
      description: convertEntries(t.descriptionEntries),
      announcement: {
        title: convertEntries(t.announcement.titleEntries),
        body: convertEntries(convertEntriesToRawContentState(t.announcement.bodyEntries))
      }
    }))
  };
}