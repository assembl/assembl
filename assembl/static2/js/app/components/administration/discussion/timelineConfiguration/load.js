// @flow
import type { ApolloClient } from 'react-apollo';
import TimelineQuery from '../../../../graphql/Timeline.graphql';
import type { PhasesValuesFromQuery, PhasesValues } from './type.flow';
import { convertEntriesToI18nValue, convertISO8601StringToDateTime } from '../../../form/utils';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy, lang: string) => {
  const { data } = await client.query({
    query: TimelineQuery,
    variables: { lang: lang },
    fetchPolicy: fetchPolicy
  });
  return data;
};

export const postLoadFormat = (data: PhasesValuesFromQuery): PhasesValues => ({
  phases: data.timeline.map(phase => ({
    title: convertEntriesToI18nValue(phase.titleEntries),
    description: convertEntriesToI18nValue(phase.descriptionEntries),
    image: phase.image,
    id: phase.id,
    identifier: phase.identifier,
    start: convertISO8601StringToDateTime(phase.start),
    end: convertISO8601StringToDateTime(phase.end),
    order: phase.order
  }))
});