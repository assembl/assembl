// @flow
import * as React from 'react';
import type { ApolloClient } from 'react-apollo';

import { IdeasTable } from './tables';
import AllIdeasQuery from '../../../graphql/AllIdeasQuery.graphql';
import { PHASES } from '../../../constants';
import { fromGlobalId } from '../../../utils/globalFunctions';

const queries = {
  default: AllIdeasQuery
};

export function prefetchMenuQuery(
  client: ApolloClient,
  variables: { identifier: string, discussionPhaseId: string, lang: string }
) {
  const query = queries[variables.identifier];
  client.query({
    query: query || queries.default,
    variables: { lang: variables.lang, discussionPhaseId: variables.discussionPhaseId }
    // need the same variables order than the query for deduplication to work
  });
}

type MenuTableProps = {
  identifier: string,
  phaseId: string
};

function MenuTable(props: MenuTableProps) {
  const { identifier, phaseId } = props;
  const discussionPhaseId = fromGlobalId(phaseId);
  switch (identifier) {
  case PHASES.voteSession:
    return null;
  default:
    return <IdeasTable {...props} discussionPhaseId={discussionPhaseId} />;
  }
}

export default MenuTable;