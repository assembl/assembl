import React from 'react';
import { Translate } from 'react-redux-i18n';
import Post from './post';

class Proposals extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hideProposals: false };
    this.displayProposals = this.displayProposals.bind(this);
  }
  displayProposals() {
    this.setState({ hideProposals: !this.state.hideProposals });
  }
  render() {
    const { questionIndex, title, posts, moreProposals, refetchTheme } = this.props;
    return (
      <div className={questionIndex < 2 || moreProposals ? 'shown' : 'hidden'}>
        <h3 className="collapsed-title">
          <span>{`${questionIndex}/ ${title}`}</span>
          <div className={moreProposals && posts.length > 0 ? 'shown proposal-arrow' : 'hidden proposal-arrow'}>
            <span
              className={this.state.hideProposals ? 'assembl-icon-down-open color pointer' : 'assembl-icon-up-open color pointer'}
              onClick={this.displayProposals}
            />
          </div>
        </h3>
        {posts.length > 0 &&
          <div className={this.state.hideProposals ? 'hidden' : 'shown'}>
            {posts.map((post, index) => {
              return <Post refetchTheme={refetchTheme} post={post.node} postIndex={index} moreProposals={moreProposals} key={index} />;
            })}
          </div>}
        {posts.length === 0 &&
          <div className="no-proposals">
            <Translate value="debate.survey.noProposals" />
          </div>}
      </div>
    );
  }
}

export default Proposals;