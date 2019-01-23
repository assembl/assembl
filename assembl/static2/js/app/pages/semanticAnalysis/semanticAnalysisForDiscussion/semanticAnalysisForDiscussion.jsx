// @flow
import React, { Component } from 'react';
import { Grid } from 'react-bootstrap';
// Helper imports
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
// Type imports
import type { OperationComponent } from 'react-apollo';
import type { State } from '../../../reducers/rootReducer';
// Graphql imports
import SemanticAnalysisForDiscussionQuery from '../../../graphql/SemanticAnalysisForDiscussionQuery.graphql';
// Component imports
import manageErrorAndLoading from '../../../components/common/manageErrorAndLoading';
import SemanticAnalysis from '../semanticAnalysis';

type Props = SemanticAnalysisForDiscussionQuery;

class SemanticAnalysisForDiscussion extends Component<Props> {
  render() {
    const { semanticAnalysisForThematicData } = this.props;
    const { title } = semanticAnalysisForThematicData;

    return (
      <Grid id="semantic-analysis-discussion" className="semantic-analysis">
        <h1>TODO: Banner with title {title}</h1>
        <h1>TODO: Create HOC for loader</h1>
        <h1>TODO: Fix CSS issues</h1>
        <h1>TODO: Map GraphQL structure with the required structure for SemanticAnalysis</h1>
        <SemanticAnalysis semanticAnalysisData={semanticAnalysisForThematicData} />
      </Grid>
    );
  }
}

const mapStateToProps: State => DiscussionDataQueryVariables = state => ({
  lang: state.i18n.locale
});

const semanticAnalysisForDiscussionQuery: OperationComponent<SemanticAnalysisForDiscussionQuery,
  DiscussionDataQueryVariables,
  Props> = graphql(SemanticAnalysisForDiscussionQuery, {
    props: ({ data }) => data
  });

export default compose(
  connect(mapStateToProps),
  semanticAnalysisForDiscussionQuery,
  manageErrorAndLoading({ displayLoader: true })
)(SemanticAnalysisForDiscussion);