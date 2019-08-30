// @flow
import React from 'react';
import sortBy from 'lodash/sortBy';
import { Link, withRouter } from 'react-router';
import { compose, graphql, type ApolloClient } from 'react-apollo';
import { Translate } from 'react-redux-i18n';

import manageErrorAndLoading from '../common/manageErrorAndLoading';
import { get } from '../../utils/routeMap';
import { getPartialTreeByParentId, getPath } from '../../utils/tree';
import { fromGlobalId } from '../../utils/globalFunctions';
import ThematicsDataQuery from '../../graphql/ThematicsDataQuery.graphql';
import { thematicTitle, CustomOverlayTrigger } from '../common/tooltips';
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
  thematicsData: Array<Thematic>,
  rootIdea: RootIdea
};

type ThematicsMenuProps = {
  /* The slug for the composition of the url */
  slug: { slug: string | null },
  phase: Phase
};

type ThematicsMenuItemProps = {
  /* A list of thematics */
  descendants: Array<Thematic>,
  /* The roots Ideas of the sub idea tree */
  roots: Array<Thematic>,
  /* The roots parents indexes */
  indexes: Array<number>,
  /* The menu section query */
  sectionQuery: { section: string }
} & ThematicsMenuProps;

type Props = {
  /* The menu item that calls this component. See constants/PHASES_ADMIN_MENU */
  menuItem: { sectionId: string, title: string },
  rootSectionId: string,
  /* The ThematicsDataQuery result */
  data: Data,
  location: { query: { section: string, thematicId: string } }
};

type QueryVariablesType = {
  discussionPhaseId: string,
  lang: string
};
/**
 * @param {string} id - The id of the removed thematic.
 * @param {ApolloClient} client - The apollo client.
 * @param {QueryVariablesType} variables - The ThematicsDataQuery variables.
 * Remove the thematic with id equal to id from the result of the ThematicsDataQuery query.
 */
export const removeMenuItem = (id: string, client: ApolloClient, variables: QueryVariablesType) => {
  const query = { query: ThematicsDataQuery, variables: variables };
  const data = client.readQuery(query);
  client.writeQuery({
    ...query,
    data: {
      ...data,
      thematicsData: data.thematicsData.filter(t => t.id !== id)
    }
  });
};

/**
 * @param {string} id - The id of the added thematic.
 * @param {string} parentId - The parent id of the added thematic.
 * @param {number} index - The index of the added thematic.
 * @param {ApolloClient} client - The apollo client.
 * @param {QueryVariablesType} variables - The ThematicsDataQuery variables.
 * Add a new thematic to the result of the ThematicsDataQuery query.
 */
export const addMenuItem = (id: string, parentId: string, index: number, client: ApolloClient, variables: QueryVariablesType) => {
  const query = { query: ThematicsDataQuery, variables: variables };
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
      ...data,
      thematicsData: [...data.thematicsData, newMenuItem]
    }
  });
};

/**
 * @param {string} id - The id of the added item.
 * @param {string} parentId - The parent id of the added item.
 * @param {number} index - The source index of the thematic.
 * @param {number} targetIndex - The target index of the thematic.
 * @param {ApolloClient} client - The apollo client.
 * @param {QueryVariablesType} variables - The ThematicsDataQuery variables.
 * Change the order of a themeatic to targetIndex.
 */
export const swapMenuItem = (
  id: string,
  parentId: string,
  index: number,
  targetIndex: number,
  client: ApolloClient,
  variables: QueryVariablesType
) => {
  const query = { query: ThematicsDataQuery, variables: variables };
  const data = client.readQuery(query);
  const isDownAction = targetIndex - index > 0;
  const newThematics = data.thematicsData.map((thematic) => {
    if (parentId && thematic.parentId !== parentId) return thematic;
    // if it's the swapped thematic
    if (thematic.id === id) return { ...thematic, order: targetIndex + 1 };
    // the item index in the array
    const itemIndex = thematic.order - 1;
    if (isDownAction) {
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
      ...data,
      thematicsData: newThematics
    }
  });
};

const ThematicsMenuItems = ({ roots, descendants, slug, phase, indexes, sectionQuery, ...menuProps }: ThematicsMenuItemProps) =>
  roots.map((thematic, index) => {
    const subIndexes = [...indexes];
    subIndexes.push(index + 1);
    const subMenuTree = getPartialTreeByParentId(thematic.id, descendants);
    const hasSubMenu = subMenuTree.roots.length > 0;
    const link = (
      <Link
        to={`${get('administration', { ...slug, id: phase.identifier }, { ...sectionQuery, thematicId: thematic.id })}`}
        activeClassName="active"
      >
        <Translate value="administration.menu.configureThematic" index={subIndexes.join('.')} />
      </Link>
    );
    return (
      <MenuItem
        key={thematic.id}
        {...menuProps}
        id={index}
        title={
          thematic.title ? (
            <CustomOverlayTrigger placement="top" overlay={thematicTitle(thematic.title)}>
              {link}
            </CustomOverlayTrigger>
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

const ThematicsMenu = ({
  slug,
  phase,
  rootSectionId,
  menuItem,
  data: { rootIdea, thematicsData },
  location
}: ThematicsMenuProps & Props) => {
  if (!thematicsData) return null;
  const orderedThematicsData = sortBy(thematicsData, 'order');
  const sectionIndex = rootSectionId ? `${rootSectionId}.${menuItem.sectionId}` : menuItem.sectionId;
  const sectionQuery = { section: sectionIndex };
  const { roots, descendants } = getPartialTreeByParentId(rootIdea && rootIdea.id, orderedThematicsData);
  if (roots.length === 0) return null;
  const firstThematic = roots[0];
  const firstThematicLink = `${get(
    'administration',
    { ...slug, id: phase.identifier },
    { ...sectionQuery, thematicId: firstThematic.id }
  )}`;
  const { section, thematicId } = location.query;
  const openedPath = [];
  if (sectionIndex === section) {
    openedPath.push(0);
    const requestThematic = orderedThematicsData.find(t => t.id === thematicId) || null;
    if (requestThematic) {
      openedPath.push(...getPath(requestThematic, orderedThematicsData));
    }
  }
  return (
    <Menu openedPath={openedPath}>
      <MenuItem
        className="thematics-menu-item"
        title={
          <Link to={firstThematicLink} activeClassName="active">
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
      variables: { discussionPhaseId: fromGlobalId(phase.id), lang: locale }
    })
  }),
  manageErrorAndLoading({ displayLoader: false }),
  withRouter
)(ThematicsMenu);