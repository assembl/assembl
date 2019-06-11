// @flow
import type { ApolloClient } from 'react-apollo';
import type { MultilingualTextMultimedia, TextMultimediaValues } from './types.flow';
import { convertEntriesToI18nRichText, convertEntriesToI18nValue } from '../../../form/utils';
import MultilingualDiscussionQuery from '../../../../graphql/MultilingualDiscussionQuery.graphql';

export const load = async (
  client: ApolloClient,
  fetchPolicy: FetchPolicy
): Promise<{ discussion: MultilingualTextMultimedia | null }> => {
  const { data } = await client.query({
    query: MultilingualDiscussionQuery,
    fetchPolicy: fetchPolicy
  });
  return data;
};

export const postLoadFormat = ({ discussion }: { discussion: MultilingualTextMultimedia | null }): TextMultimediaValues => {
  if (!discussion) {
    return { textMultimediaBody: {}, textMultimediaTitle: {} };
  }
  return {
    textMultimediaBody: discussion.textMultimediaBodyEntries
      ? convertEntriesToI18nRichText(discussion.textMultimediaBodyEntries)
      : {},
    textMultimediaTitle: discussion.textMultimediaTitleEntries
      ? convertEntriesToI18nValue(discussion.textMultimediaTitleEntries)
      : {}
  };
};