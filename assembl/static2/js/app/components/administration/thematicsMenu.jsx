// @flow
import React from 'react';
import sortBy from 'lodash/sortBy';
import { Link, withRouter } from 'react-router';
import { OverlayTrigger } from 'react-bootstrap';
import { compose, graphql, type ApolloClient } from 'react-apollo';
import { Translate } from 'react-redux-i18n';

import withLoadingIndicator from '../common/withLoadingIndicator';
import { get } from '../../utils/routeMap';
import { getPartialTreeByParentId, getPath } from '../../utils/tree';
import ThematicsDataQuery from '../../graphql/ThematicsDataQuery.graphql';
import { thematicTitle } from '../common/tooltips';
import { Menu, MenuItem } from '../common/menu';

type Thematic = {
  /* The thematic id */
  id: string,
  /* The id of the thematic's parent */
  parentId: string,
  /* The order Thematic in the idea tree. */
  order: number,
  /* The Thematic title. */
  title: string
};

type RootIdea = {
  id: string
};

type Data = {
  /* A liste of thematics */
  thematicsData: Array<Thematic>,
  /* The root Idea of the idea tree */
  rootIdea: RootIdea
};

type ThematicsMenuProps = {
  /* The slug for the composition of the url */
  slug: { slug: string | null },
  phase: Phase
};

type ThematicsMenuItemProps = {
  /* A liste of thematics */
  descendants: Array<Thematic>,
  /* The root Idea of the idea tree */
  roots: Array<Thematic>,
  /* The roots parents indexes */
  indexes: Array<number>,
  /* The menu section query */
  sectionQuery: string
} & ThematicsMenuProps;

type Props = {
  /* The menu item that calls this component. See constants/PHASES_ADMIN_MENU */
  menuItem: { sectionId: string, title: string },
  /* The root sction id */
  rootSectionId: string,
  /* The ThematicsDataQuery result */
  data: Data,
  /* The router location */
  location: { query: { section: string, thematicId: string } }
};

/**
 * @param {string} The id of the removed thematic.
 * @param {ApolloClient} The apollo client.
 * @param {string} The phase identifier.
 * Remove the thematic with id equal to id from the result of the ThematicsDataQuery query.
 */
export const removeMenuItem = (id: string, client: ApolloClient, identifier: string, locale: string) => {
  const query = { query: ThematicsDataQuery, variables: { identifier: identifier, lang: locale } };
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
export const addMenuItem = (
  id: string,
  parentId: string,
  index: number,
  client: ApolloClient,
  identifier: string,
  locale: string
) => {
  const query = { query: ThematicsDataQuery, variables: { identifier: identifier, lang: locale } };
  const data = client.readQuery(query);
  const newMenuItem = {
    id: id,
    order: index + 1,
    parentId: parentId,
    title: '',
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
  identifier: string,
  locale: string
) => {
  const query = { query: ThematicsDataQuery, variables: { identifier: identifier, lang: locale } };
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

const ThematicsMenuItems = ({ roots, descendants, slug, phase, indexes, sectionQuery, ...menuProps }: ThematicsMenuItemProps) =>
  sortBy(roots, 'order').map((thematic, index) => {
    const subIndexes = [...indexes];
    subIndexes.push(index + 1);
    const subMenuTree = getPartialTreeByParentId(thematic.id, descendants);
    const hasSubMenu = subMenuTree.roots.length > 0;
    const link = (
      <Link
        to={`${get('administration', slug)}${get('adminPhase', {
          ...slug,
          phase: phase.identifier
        })}${sectionQuery}&thematicId=${thematic.id}`}
        activeClassName="active"
      >
        <Translate value="administration.menu.configureThematic" index={subIndexes.join('.')} />
      </Link>
    );
    return (
      <MenuItem
        {...menuProps}
        id={index}
        title={
          thematic.title ? (
            <OverlayTrigger placement="top" overlay={thematicTitle(thematic.title)}>
              {link}
            </OverlayTrigger>
          ) : (
            link
          )
        }
      >
        {hasSubMenu ? (
          <Menu>
            <ThematicsMenuItems
              slug={slug}
              phase={phase}
              descendants={subMenuTree.descendants}
              roots={subMenuTree.roots}
              sectionQuery={sectionQuery}
              indexes={subIndexes}
            />
          </Menu>
        ) : null}
      </MenuItem>
    );
  });

ThematicsMenuItems.defaultProps = {
  indexes: []
};

function sortThematics(items) {
  return sortBy(items, 'order');
}

const ThematicsMenu = ({
  slug,
  phase,
  rootSectionId,
  menuItem,
  data: { rootIdea, thematicsData },
  location
}: ThematicsMenuProps & Props) => {
  if (!thematicsData) return null;
  const sectionIndex = rootSectionId ? `${rootSectionId}.${menuItem.sectionId}` : menuItem.sectionId;
  const sectionQuery = `?section=${sectionIndex}`;
  const { roots, descendants } = getPartialTreeByParentId(rootIdea && rootIdea.id, thematicsData);
  if (roots.length === 0) return null;
  const firstThematics = sortBy(roots, 'order')[0];
  const to = `${get('administration', slug)}${get('adminPhase', {
    ...slug,
    phase: phase.identifier
  })}${sectionQuery}&thematicId=${firstThematics.id}`;
  const { section, thematicId } = location.query;
  const openedPath = [];
  if (sectionIndex === section) {
    const requestThematic = thematicsData.find(t => t.id === thematicId) || null;
    openedPath.push(0);
    openedPath.push(...getPath(requestThematic, thematicsData, sortThematics));
  }
  return (
    <Menu openedPath={openedPath}>
      <MenuItem
        className="thematics-menu-item"
        title={
          <Link to={to} activeClassName="active">
            <Translate value={menuItem.title} />
          </Link>
        }
      >
        <Menu>
          <ThematicsMenuItems slug={slug} phase={phase} descendants={descendants} roots={roots} sectionQuery={sectionQuery} />
        </Menu>
      </MenuItem>
    </Menu>
  );
};

export default compose(
  graphql(ThematicsDataQuery, {
    options: ({ phase, locale }) => ({
      variables: { identifier: phase.identifier, lang: locale },
      fetchPolicy: 'cache-first'
    })
  }),
  withLoadingIndicator({ textHidden: true }),
  withRouter
)(ThematicsMenu);