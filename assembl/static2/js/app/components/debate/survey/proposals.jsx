import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';

import { connectedUserIsAdmin } from '../../../utils/permissions';
import { get as getRoute } from '../../../utils/routeMap';
import Post from './post';

class Proposals extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hideProposals: false };
  }

  displayProposals = () => {
    this.setState({ hideProposals: !this.state.hideProposals });
  };

  render() {
    const {
      hasPendingPosts,
      isPhaseCompleted,
      questionIndex,
      questionId,
      themeId,
      title,
      posts,
      nbPostsToShow,
      phaseUrl,
      questionsLength
    } = this.props;
    const questionTitle = questionsLength > 1 ? `${questionIndex}/ ${title}` : title;
    const postsToShow = posts.slice(0, nbPostsToShow);
    const allProposalsLink = `${phaseUrl}${getRoute('question', {
      pending: '',
      questionId: questionId,
      questionIndex: questionIndex
    })}`;
    const pendingProposalsLink = `${phaseUrl}${getRoute('questionModeratePosts', {
      pending: 'pending',
      questionId: questionId,
      questionIndex: questionIndex
    })}`;
    return (
      <div className="shown">
        <h3 className="collapsed-title">
          <span>{questionTitle}</span>
          <div className={postsToShow.length > 0 ? 'shown proposal-arrow' : 'hidden proposal-arrow'}>
            <span
              className={this.state.hideProposals ? 'assembl-icon-down-open color pointer' : 'assembl-icon-up-open color pointer'}
              onClick={this.displayProposals}
            />
          </div>
        </h3>
        {postsToShow.length > 0 && (
          <div className={this.state.hideProposals ? 'hidden' : 'shown'}>
            {postsToShow.map((post, index) => (
              <Post
                themeId={themeId}
                id={post.node.id}
                originalLocale={post.node.originalLocale}
                postIndex={index}
                questionId={questionId}
                key={post.node.id}
                isPhaseCompleted={isPhaseCompleted}
              />
            ))}
          </div>
        )}
        <div className="question-footer">
          {postsToShow.length === 0 ? (
            <span className="no-proposals">
              <Translate value="debate.survey.noProposals" />
            </span>
          ) : (
            <span className="all-proposals">
              <Link to={allProposalsLink} className="button-submit button-light">
                <Translate value="debate.survey.allProposals" />
              </Link>
            </span>
          )}
          {hasPendingPosts &&
            connectedUserIsAdmin() && (
              <span className="pending-proposals">
                <Link to={pendingProposalsLink} className="button-submit button-pending">
                  <Translate value="debate.survey.pendingProposals" />
                </Link>
              </span>
            )}
        </div>
      </div>
    );
  }
}

export default Proposals;