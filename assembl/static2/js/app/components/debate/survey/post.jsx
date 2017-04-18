import React from 'react';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { Translate } from 'react-redux-i18n';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import PostCreator from './postCreator';
import Circle from '../../svg/circle';
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';

class Post extends React.Component {
  constructor(props) {
    super(props);
    const { post } = this.props;
    this.state = {
      like: post.sentimentCounts.like,
      disagree: post.sentimentCounts.disagree,
      mySentiment: post.mySentiment
    };
    this.handleSentiment = this.handleSentiment.bind(this);
  }
  handleSentiment(event, type) {
    const isUserConnected = getConnectedUserId() !== null;
    const { redirectToLogin } = this.props;
    if (isUserConnected) {
      const { debateData } = this.props.debate;
      const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, 'survey');
      if (!isPhaseCompleted) {
        const target = event.currentTarget;
        const isMySentiment = this.state.mySentiment === type;
        if (isMySentiment) {
          this.deleteSentiment(target);
        } else {
          this.addSentiment(target, type);
        }
      }
    } else {
      redirectToLogin();
    }
  }
  addSentiment(target, type) {
    const { id } = this.props;
    this.props.addSentiment({ variables: { postId: id, type: type } })
    .then((sentiments) => {
      target.setAttribute('class', 'sentiment sentiment-active');
      this.setState({
        like: sentiments.data.addSentiment.post.sentimentCounts.like,
        disagree: sentiments.data.addSentiment.post.sentimentCounts.disagree,
        mySentiment: sentiments.data.addSentiment.post.mySentiment
      });
    }).catch((error) => {
      this.props.displayAlert('danger', `${error}`);
    });
  }
  deleteSentiment(target) {
    const { id } = this.props;
    this.props.deleteSentiment({ variables: { postId: id } })
    .then((sentiments) => {
      target.setAttribute('class', 'sentiment');
      this.setState({
        like: sentiments.data.deleteSentiment.post.sentimentCounts.like,
        disagree: sentiments.data.deleteSentiment.post.sentimentCounts.disagree,
        mySentiment: sentiments.data.deleteSentiment.post.mySentiment
      });
    }).catch((error) => {
      this.props.displayAlert('danger', `${error}`);
    });
  }
  render() {
    const { postIndex, moreProposals, post, id } = this.props;
    return (
      <div className={postIndex < 3 || moreProposals ? 'shown box' : 'hidden box'}>
        <div className="content">
          <PostCreator id={id} />
          <div className="body">{post.body}</div>
          <div className="sentiments">
            <div className="sentiment-label">
              <Translate value="debate.survey.react" />
            </div>
            <div
              className={this.state.mySentiment === 'LIKE' ? 'sentiment sentiment-active' : 'sentiment'}
              onClick={(event) => this.handleSentiment(event, 'LIKE')}
            >
              <Like size={25} />
            </div>
            <div
              className={this.state.mySentiment === 'DISAGREE' ? 'sentiment sentiment-active' : 'sentiment'}
              onClick={(event) => this.handleSentiment(event, 'DISAGREE')}
            >
              <Disagree size={25} />
            </div>
          </div>
        </div>
        <div className="statistic">
          <div className="totalSentimentsCount">
            {this.state.like + this.state.disagree}
          </div>
          <div className="sentimentsCountLabel">
            <Translate value="debate.survey.reactions" />
          </div>
          <Circle like={this.state.like} disagree={this.state.disagree} />
          <div className="stat-sentiment">
            <div>
              <div className="min-sentiment">
                <Like size={15} />&nbsp;<span className="txt">{this.state.like}</span>
              </div>
            </div>
            <div>
              <div className="min-sentiment">
                <Disagree size={15} />&nbsp;<span className="txt">{this.state.disagree}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="clear">&nbsp;</div>
      </div>
    );
  }
}

Post.propTypes = {
  addSentiment: React.PropTypes.func.isRequired,
  deleteSentiment: React.PropTypes.func.isRequired
};

const addSentiment = gql`
  mutation addSentiment($type: SentimentTypes!, $postId: ID!) {
    addSentiment(postId:$postId, type: $type) {
      post {
        ... on PropositionPost {
          id,
          sentimentCounts {
            like,
            disagree
          }
          mySentiment
        }
      }
    }
  }
`;

const deleteSentiment = gql`
  mutation deleteSentiment($postId: ID!) {
    deleteSentiment(postId:$postId) {
      post {
        ... on PropositionPost {
          id,
          sentimentCounts {
            like,
            disagree
          }
          mySentiment
        }
      }
    }
  }
`;

const PostWithMutations = compose(
  graphql(addSentiment, {
    name: 'addSentiment'
  }),
  graphql(deleteSentiment, {
    name: 'deleteSentiment'
  })
)(Post);

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

export default connect(mapStateToProps)(PostWithMutations);