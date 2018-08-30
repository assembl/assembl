// @flow
import React from 'react';
import sortBy from 'lodash/sortBy';
import { Link } from 'react-router';
import { compose, graphql, type ApolloClient } from 'react-apollo';
import { Translate } from 'react-redux-i18n';

import withLoadingIndicator from '../common/withLoadingIndicator';
import { get } from '../../utils/routeMap';
import ThematicsDataQuery from '../../graphql/ThematicsDataQuery.graphql';
import { getTree } from '../../utils/tree';

type ThematicWithChildren = {
  id: string,
  order: number,
  children: Array<ThematicWithChildren>
};

type Thematic = {
  id: string,
  ancestors: Array<string>,
  order: number
};

type Data = {
  thematicsData: Array<Thematic>,
  rootIdea: { id: string }
};

type Props = {
  rootSection: string,
  section: { sectionId: string },
  slug: { slug: string | null },
  phase: Phase,
  data: Data
};

export const removeMenuItem = (id: string, client: ApolloClient, identifier: string) => {
  const query = { query: ThematicsDataQuery, variables: { identifier: identifier } };
  const data = client.readQuery(query);
  client.writeQuery({
    ...query,
    data: {
      thematicsData: data.thematicsData.filter(t => t.id !== id)
    }
  });
};

export const addMenuItem = (id: string, parentId: string, order: number, client: ApolloClient, identifier: string) => {
  const query = { query: ThematicsDataQuery, variables: { identifier: identifier } };
  const data = client.readQuery(query);
  const newMenuItem = {
    id: id,
    order: order,
    ancestors: parentId ? [parentId] : [],
    __typename: 'Idea'
  };
  client.writeQuery({
    ...query,
    data: {
      thematicsData: [...data.thematicsData, newMenuItem]
    }
  });
};

const flatThematics = (thematics: Array<ThematicWithChildren>, parents: Array<number> = []) => {
  const resultThematics = [];
  sortBy(thematics, 'order').forEach((thematic, index) => {
    const { children, ...thematicData } = thematic;
    const indexes = [...parents];
    indexes.push(index + 1);
    const newThematic = {
      ...thematicData,
      title: <Translate value="administration.menu.configureThematic" index={indexes.join('.')} />
    };
    resultThematics.push(newThematic);
    resultThematics.push(...flatThematics(children, indexes));
  });
  return resultThematics;
};

class ThematicsMenu extends React.PureComponent<Props> {
  render() {
    const { rootSection, section: { sectionId }, slug, phase, data: { thematicsData } } = this.props;
    // $FlowFixMe
    const tree: Array<ThematicWithChildren> = thematicsData ? getTree(thematicsData) : [];
    const thematics = flatThematics(tree);
    const sectionIndex = rootSection ? `${rootSection}.${sectionId}` : sectionId;
    const sectionQuery = `?section=${sectionIndex}`;
    return thematics.map(thematic => (
      <li key={thematic.id}>
        <Link
          to={`${get('administration', slug)}${get('adminPhase', {
            ...slug,
            phase: phase.identifier
          })}${sectionQuery}&thematicId=${thematic.id}`}
          activeClassName="active"
        >
          {thematic.title}
        </Link>
      </li>
    ));
  }
}

export default compose(
  graphql(ThematicsDataQuery, {
    options: ({ phase }) => ({
      variables: { identifier: phase.identifier }
    })
  }),
  withLoadingIndicator({ textHidden: true })
)(ThematicsMenu);