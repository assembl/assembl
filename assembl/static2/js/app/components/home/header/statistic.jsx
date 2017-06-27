import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import RootIdeaStats from '../../../graphql/RootIdeaStats.graphql';
import withLoadingIndicator from '../../../components/common/withLoadingIndicator';
import { getCurrentPhaseIdentifier } from '../../../utils/timeline';

class Statistic extends React.Component {
  render() {
    const { rootIdea, numParticipants } = this.props.data;
    return (
      <div className="statistic">
        {rootIdea !== null &&
          <div className="inline">
            <div className="stat-box border-right">
              <div className="stat-icon assembl-icon-message white">&nbsp;</div>
              <div className="stat">
                <div className="stat-nb">{rootIdea.numPosts}&nbsp;</div>
                <div className="stat-nb">
                  <Translate value="home.contribution" />
                </div>
              </div>
            </div>
          </div>}
        <div className="inline">
          <div className="stat-box">
            <div className="stat-icon assembl-icon-profil white">&nbsp;</div>
            <div className="stat">
              <div className="stat-nb">{numParticipants}&nbsp;</div>
              <div className="stat-nb">
                <Translate value="home.participant" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    identifier: getCurrentPhaseIdentifier(state.debate.debateData.timeline) // used as variable in RootIdeaStats query
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(RootIdeaStats),
  withLoadingIndicator({ textHidden: true, color: 'white' })
)(Statistic);