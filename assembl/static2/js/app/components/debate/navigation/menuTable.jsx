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

export function prefetchMenuQuery(client: ApolloClient, variables: Object) {
  const query = queries[variables.identifier];
  client.query({
    query: query || queries.default,
    variables: variables
  });
}

type MenuTableProps = {
  identifier: string
};

function MenuTable(props: MenuTableProps) {
  switch (props.identifier) {
  case PHASES.survey:
    return <SurveyTable {...props} />;
  case PHASES.voteSession:
    return null;
  default:
    return <IdeasTable {...props} />;
  }
}

export default MenuTable;