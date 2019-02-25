// @flow
import type { ApolloClient } from 'react-apollo';
import TimelineQuery from '../../../../graphql/Timeline.graphql';
import { convertEntriesToI18nValue } from '../../../form/utils';

// import type { LegalContentsFormValues } from './../types.flow';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy, lang: string) => {
  const { data } = await client.query({
    query: TimelineQuery,
    variables: { lang: lang },
    fetchPolicy: fetchPolicy
  });
  return data;
};

export const postLoadFormat = (data: Data) => ({
  phases: data.timeline.map(phase => ({
    title: convertEntriesToI18nValue(phase.titleEntries)
  }))
});