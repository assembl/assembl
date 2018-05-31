// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';

import AllIdeasQuery from '../../../../graphql/AllIdeasQuery.graphql';
import MenuList, { type ItemNode } from './menuList';
import withLoadingIndicator from '../../../common/withLoadingIndicator';

type IdeasTableProps = {
  identifier: string,
  onMenuItemClick: Function,
  data: {
    loading: boolean,
    error: Object,
    ideas: Array<ItemNode>,
    rootIdea: ItemNode
  }
};

export function DumbIdeasTable(props: IdeasTableProps) {
  const { identifier, onMenuItemClick, data } = props;
  const { ideas, rootIdea } = data;
  return <MenuList items={ideas} rootItem={rootIdea && rootIdea.id} identifier={identifier} onMenuItemClick={onMenuItemClick} />;
}

const IdeasTableWithData = graphql(AllIdeasQuery);

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  debate: state.debate
});

export default compose(connect(mapStateToProps), IdeasTableWithData, withLoadingIndicator())(DumbIdeasTable);