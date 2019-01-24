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
import manageColor from '../../../components/common/manageColor';
import SemanticAnalysis from '../semanticAnalysis';

type Props = SemanticAnalysisForDiscussionQuery;

class SemanticAnalysisForDiscussion extends Component<Props> {
  render() {
    const { semanticAnalysisForDiscussionData } = this.props;
    const { topKeywords } = semanticAnalysisForDiscussionData;
    const topKeywordsCount = topKeywords.length;

    // Display content only when there are top keywords defined
    const content =
      topKeywordsCount > 0 ? (
        <SemanticAnalysis semanticAnalysisData={semanticAnalysisForDiscussionData} />
      ) : (
        <h1>display icon not enough data</h1>
      );

    return (
      <div className="semantic-analysis-container">
        <div className="banner">
          <Grid>
            <h1>Analyse sémantique</h1>
          </Grid>
        </div>
        <Grid id="semantic-analysis-discussion" className="semantic-analysis">
          {content}
        </Grid>
      </div>
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
  manageColor,
  manageErrorAndLoading({ displayLoader: true, loaderType: 'watson' })
)(SemanticAnalysisForDiscussion);