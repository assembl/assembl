// @flow
import React from 'react';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';
import DebateThematicsQuery from '../../../../graphql/DebateThematicsQuery.graphql';
import MenuList, { type ItemNode } from './menuList';
import withLoadingIndicator from '../../../common/withLoadingIndicator';

type SurveyTableProps = {
  identifier: string,
  onMenuItemClick: Function,
  data: {
    loading: boolean,
    error: Object,
    thematics: Array<ItemNode>
  }
};

export function DumbSurveyTable(props: SurveyTableProps) {
  const { identifier, onMenuItemClick, data } = props;
  const { thematics } = data;
  return <MenuList items={thematics} identifier={identifier} onMenuItemClick={onMenuItemClick} />;
}

const SurveyTableWithData = graphql(DebateThematicsQuery);

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  debate: state.debate
});

export default compose(connect(mapStateToProps), SurveyTableWithData, withLoadingIndicator())(DumbSurveyTable);