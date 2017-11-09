import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import ResourcesQuery from '../graphql/ResourcesQuery.graphql';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import ResourcesCenter from '../components/resourcesCenter/resourcesCenter';

const ResourcesCenterContainer = ({ data, debate }) => {
  return <ResourcesCenter {...data} headerBackgroundUrl={debate.debateData.headerBackgroundUrl} />;
};

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    lang: state.i18n.locale
  };
};

export default compose(connect(mapStateToProps), graphql(ResourcesQuery), withLoadingIndicator())(ResourcesCenterContainer);