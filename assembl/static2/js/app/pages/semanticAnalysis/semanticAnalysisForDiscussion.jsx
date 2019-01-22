// @flow
import React, { Component } from 'react';
import { Grid } from 'react-bootstrap';
// Helper imports
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
// Type imports
import type { OperationComponent } from 'react-apollo';
import type { State } from '../../reducers/rootReducer';
// Graphql imports
import SemanticAnalysisForDiscussionQuery from '../../graphql/SemanticAnalysisForDiscussionQuery.graphql';
// Component imports
import manageErrorAndLoading from '../../components/common/manageErrorAndLoading';
import SemanticAnalysis from './semanticAnalysis';

type Props = SemanticAnalysisForDiscussionQuery;

// TOFIX: Should be generated in graphql_types.flow.js
type SemanticAnalysisForDiscussionVariables = {
  lang?: ?string
};

class SemanticAnalysisForDiscussion extends Component<Props> {
  render() {
    const { title } = this.props.discussion;

    return (
      <Grid id="semantic-analysis" className="semantic-analysis">
        <h1>TODO: Banner with title {title}</h1>
        <h1>TODO: Create HOC for loader</h1>
        <h1>TODO: Fix CSS issues</h1>
        <SemanticAnalysis />
      </Grid>
    );
  }
}

const mapStateToProps: State => SemanticAnalysisForDiscussionVariables = state => ({
  lang: state.i18n.locale
});

const semanticAnalysisForDiscussionQuery: OperationComponent<SemanticAnalysisForDiscussionQuery,
  SemanticAnalysisForDiscussionVariables,
  Props> = graphql(SemanticAnalysisForDiscussionQuery, {
    props: ({ data }) => data
  });

export default compose(
  connect(mapStateToProps),
  semanticAnalysisForDiscussionQuery,
  manageErrorAndLoading({ displayLoader: true })
)(SemanticAnalysisForDiscussion);