import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';

import { connectedUserIsModerator } from '../../../utils/permissions';
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
      identifier,
      isPhaseCompleted,
      onHashtagClick,
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
        <div onClick={this.displayProposals} className="pointer">
          <h3 className="collapsed-title padding-title">
            <span className="title-txt">{questionTitle}</span>
            <div className={postsToShow.length > 0 ? 'shown proposal-arrow' : 'hidden proposal-arrow'}>
              <span
                className={
                  this.state.hideProposals ? 'assembl-icon-angle-right color pointer' : 'assembl-icon-angle-down color pointer'
                }
              />
            </div>
          </h3>
        </div>
        {postsToShow.length > 0 ? (
          <div className={this.state.hideProposals ? 'hidden' : 'shown'}>
            {postsToShow.map((post, index) => (
              <Post
                onHashtagClick={onHashtagClick}
                id={post.node.id}
                identifier={identifier}
                isPhaseCompleted={isPhaseCompleted}
                key={post.node.id}
                originalLocale={post.node.originalLocale}
                postIndex={index}
                questionId={questionId}
                questionIndex={questionIndex}
                themeId={themeId}
              />
            ))}
          </div>
        ) : null}
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
          {hasPendingPosts && connectedUserIsModerator() ? (
            <span className="pending-proposals">
              <Link to={pendingProposalsLink} className="button-submit button-pending">
                <Translate value="debate.survey.pendingProposals" />
              </Link>
            </span>
          ) : null}
        </div>
      </div>
    );
  }
}

export default Proposals;