import React from 'react';
import { Translate } from 'react-redux-i18n';
import Circle from '../../svg/circle';
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';

class Proposals extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hideProposals: false };
    this.displayProposals = this.displayProposals.bind(this);
  }
  displayProposals() {
    if (this.state.hideProposals) this.setState({ hideProposals: false });
    if (!this.state.hideProposals) this.setState({ hideProposals: true });
  }
  render() {
    const { index, title, posts, moreProposals } = this.props;
    return (
      <div className={index < 2 || moreProposals ? 'shown' : 'hidden'}>
        <h3 className="collapsed-title">
          <span>{`${index}/ ${title}`}</span>
          <div className={moreProposals && posts ? 'shown inline right' : 'hidden inline right'}>
            <span className={this.state.hideProposals ? 'assembl-icon-down-open color pointer' : 'assembl-icon-up-open color pointer'} onClick={this.displayProposals} />
          </div>
        </h3>
        {posts &&
          <div className={this.state.hideProposals ? 'hidden' : 'shown'}>
            {posts.map((post, index) => {
              return (
                <div className={index < 3 || moreProposals ? 'shown box' : 'hidden box'} key={index}>
                  <div className="content">
                    <div className="user">
                      <span className="assembl-icon-profil grey">&nbsp;</span>
                      <span className="username">Pauline</span>
                    </div>
                    <div className="body">{post.body}</div>
                    <div className="sentiments">
                      <Translate value="debate.survey.react" />
                      <div className="sentiment">
                        <Like size={25} />
                      </div>
                      <div className="sentiment">
                        <Disagree size={25} />
                      </div>
                    </div>
                  </div>
                  <div className="statistic">
                    <div className="totalSentimentsCount">
                      {post.sentimentCounts.like + post.sentimentCounts.disagree}
                    </div>
                    <div className="sentimentsCountLabel">
                      <Translate value="debate.survey.reactions" />
                    </div>
                    <Circle like={post.sentimentCounts.like} disagree={post.sentimentCounts.disagree} />
                    <div className="stat-sentiment">
                      <div>
                        <div className="min-sentiment">
                          <Like size={15} />&nbsp;<span className="txt">{post.sentimentCounts.like}</span>
                        </div>
                      </div>
                      <div>
                        <div className="min-sentiment">
                          <Disagree size={15} />&nbsp;<span className="txt">{post.sentimentCounts.disagree}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="clear">&nbsp;</div>
                </div>
              );
            })}
          </div>
        }
        {!posts &&
          <Translate value="debate.survey.noProposals" />
        }
      </div>
    );
  }
}

export default Proposals;