// @flow
import * as React from 'react';
import type { ApolloClient } from 'react-apollo';

import { SurveyTable, IdeasTable } from './tables';
import AllIdeasQuery from '../../../graphql/AllIdeasQuery.graphql';
import DebateThematicsQuery from '../../../graphql/DebateThematicsQuery.graphql';
import { PHASES } from '../../../constants';

const queries = {
  [PHASES.survey]: DebateThematicsQuery,
  default: AllIdeasQuery
};

export function prefetchMenuQuery(
  client: ApolloClient,
  variables: { identifier: string, discussionPhaseId: string, lang: string }
) {
  const query = queries[variables.identifier];
  client.query({
    query: query || queries.default,
    variables: variables
  });
}

type MenuTableProps = {
  identifier: string,
  phaseId: string
};

function MenuTable(props: MenuTableProps) {
  const { identifier, phaseId } = props;
  const discussionPhaseId = phaseId ? atob(phaseId).split(':')[1] : null;
  switch (identifier) {
  case PHASES.survey:
    return <SurveyTable {...props} discussionPhaseId={discussionPhaseId} />;
  case PHASES.voteSession:
    return null;
  default:
    return <IdeasTable {...props} discussionPhaseId={discussionPhaseId} />;
  }
}

export default MenuTable;