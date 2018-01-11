import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';

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
    const { questionIndex, questionId, title, posts, refetchTheme, nbPostsToShow, phaseUrl } = this.props;
    const postsToShow = posts.slice(0, nbPostsToShow);
    const link = `${phaseUrl}${getRoute('question', { questionId: questionId, questionIndex: questionIndex })}`;
    return (
      <div className={'shown'}>
        <h3 className="collapsed-title">
          <span>{`${questionIndex}/ ${title}`}</span>
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
                refetchTheme={refetchTheme}
                id={post.node.id}
                originalLocale={post.node.originalLocale}
                postIndex={index}
                key={post.node.id}
              />
            ))}
          </div>
        )}
        {postsToShow.length === 0 ? (
          <div className="no-proposals">
            <Translate value="debate.survey.noProposals" />
          </div>
        ) : (
          <div className="all-proposals">
            <Link to={link} className="button-submit button-light">
              <Translate value="debate.survey.allProposals" />
            </Link>
          </div>
        )}
      </div>
    );
  }
}

export default Proposals;