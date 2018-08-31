// @flow
import React from 'react';
import sortBy from 'lodash/sortBy';
import { Link } from 'react-router';
import { compose, graphql, type ApolloClient } from 'react-apollo';
import { Translate } from 'react-redux-i18n';

import withLoadingIndicator from '../common/withLoadingIndicator';
import { get } from '../../utils/routeMap';
import { getPartialTreeByParentId } from '../../utils/tree';
import ThematicsDataQuery from '../../graphql/ThematicsDataQuery.graphql';

type Thematic = {
  /* The thematic id */
  id: string,
  /* The id of the thematic's parent */
  parentId: string,
  /* The order Thematic in the idea tree. */
  order: number
};

type Data = {
  /* A liste of thematics */
  thematicsData: Array<Thematic>,
  /* The root Idea of the idea tree */
  rootIdea: { id: string }
};

type Props = {
  /* The root sction id */
  rootSectionId: string,
  /* The menu item that calls this component. See constants/PHASES_ADMIN_MENU */
  menuItem: { sectionId: string },
  /* The slug for the composition of the url */
  slug: { slug: string | null },
  phase: Phase,
  /* The result returned by ThematicsDataQuery */
  data: Data
};

/**
 * @param {string} The id of the removed thematic.
 * @param {ApolloClient} The apollo client.
 * @param {string} The phase identifier.
 * Remove the thematic with id equal to id from the result of the ThematicsDataQuery query.
 */
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

/**
 * @param {string} The id of the added thematic.
 * @param {string} The parent id of the added thematic.
 * @param {string} The index of the added thematic.
 * @param {ApolloClient} The apollo client.
 * @param {string} The phase identifier.
 * Add a new thematic to the result of the ThematicsDataQuery query.
 */
export const addMenuItem = (id: string, parentId: string, index: number, client: ApolloClient, identifier: string) => {
  const query = { query: ThematicsDataQuery, variables: { identifier: identifier } };
  const data = client.readQuery(query);
  const newMenuItem = {
    id: id,
    order: index + 1,
    parentId: parentId,
    __typename: 'Idea'
  };
  client.writeQuery({
    ...query,
    data: {
      thematicsData: [...data.thematicsData, newMenuItem]
    }
  });
};

/**
 * @param {string} The id of the added item.
 * @param {string} The parent id of the added item.
 * @param {string} The source index of the thematic.
 * @param {string} The target index of the thematic.
 * @param {ApolloClient} The apollo client.
 * @param {string} The phase identifier.
 * Change the order of a themeatic to targetIndex.
 */
export const swapMenuItem = (
  id: string,
  parentId: string,
  index: number,
  targetIndex: number,
  client: ApolloClient,
  identifier: string
) => {
  const query = { query: ThematicsDataQuery, variables: { identifier: identifier } };
  const data = client.readQuery(query);
  const isDown = targetIndex - index > 0;
  const newThematics = data.thematicsData.map((thematic) => {
    if (parentId && thematic.parentId !== parentId) return thematic;
    // if it's the swapped thematic
    if (thematic.id === id) return { ...thematic, order: targetIndex + 1 };
    // the item index in the array
    const itemIndex = thematic.order - 1;
    if (isDown) {
      if (itemIndex >= index + 1 && itemIndex <= targetIndex) {
        // order to order -1
        return { ...thematic, order: itemIndex };
      }
    } else if (itemIndex <= index - 1 && itemIndex >= targetIndex) {
      // order to order + 1
      return { ...thematic, order: itemIndex + 2 };
    }
    return thematic;
  });
  client.writeQuery({
    ...query,
    data: {
      thematicsData: newThematics
    }
  });
};

class ThematicsMenu extends React.PureComponent<Props> {
  renderMenu = (rootItem: string, thematics: Array<Thematic>, sectionQuery: string, parents: Array<string> = []) => {
    const { roots, descendants } = getPartialTreeByParentId(rootItem, thematics);
    if (roots.length === 0) return null;
    const { slug, phase } = this.props;
    return sortBy(roots, 'order').map((thematic, index) => {
      const indexes = [...parents];
      indexes.push(index + 1);
      return (
        <React.Fragment>
          <li key={thematic.id}>
            <Link
              to={`${get('administration', slug)}${get('adminPhase', {
                ...slug,
                phase: phase.identifier
              })}${sectionQuery}&thematicId=${thematic.id}`}
              activeClassName="active"
            >
              <Translate value="administration.menu.configureThematic" index={indexes.join('.')} />
            </Link>
          </li>
          {this.renderMenu(thematic.id, descendants, sectionQuery, indexes)}
        </React.Fragment>
      );
    });
  };

  render() {
    const { rootSectionId, menuItem: { sectionId }, data: { thematicsData, rootIdea } } = this.props;
    if (!thematicsData) return null;
    const sectionIndex = rootSectionId ? `${rootSectionId}.${sectionId}` : sectionId;
    const sectionQuery = `?section=${sectionIndex}`;
    return this.renderMenu(rootIdea && rootIdea.id, thematicsData, sectionQuery);
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