// @flow
import type { ApolloClient } from 'react-apollo';
import MultilingualSynthesisQuery from '../../../graphql/MultilingualSynthesisQuery.graphql';
import { convertEntriesToI18nRichText, convertEntriesToI18nValue } from '../../form/utils';
import type { MultilingualSynthesisPost, SynthesisFormValues } from './types.flow';

export const load = async (client: ApolloClient, fetchPolicy: FetchPolicy, id: ?string): Promise<{ synthesisPost: MultilingualSynthesisPost | null }> => {
  if (!id)
    return Promise.resolve({ synthesisPost: null });

  const { data } = await client.query({
    query: MultilingualSynthesisQuery,
    variables: {},
    fetchPolicy: fetchPolicy
  });
  return data;
};

export const postLoadFormat = ({ synthesisPost }: { synthesisPost: MultilingualSynthesisPost | null }): SynthesisFormValues => {
  if (!synthesisPost) {
    return { subject: {}, body: {}, image: null }
  }

  const synthesis = synthesisPost.publishesSynthesis;
  return {
    subject: !!synthesis.subjectEntries ? convertEntriesToI18nValue(synthesis.subjectEntries) : {},
    body: !!synthesis.bodyEntries ? convertEntriesToI18nRichText(synthesis.bodyEntries) : {},
    image: synthesis.img || null,
  };
};
