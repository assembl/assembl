import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Translate } from 'react-redux-i18n';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import Circle from '../../svg/circle';
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';


class Post extends React.Component {
  constructor(props) {
    super(props);
    const { post } = this.props;
    this.state = {
      like: post.sentimentCounts.like,
      disagree: post.sentimentCounts.disagree
    };
    this.handleLike = this.handleLike.bind(this);
    this.handleDisagree = this.handleDisagree.bind(this);
  }
  handleLike() {
    const postId = this.props.post.id;
    const type = 'LIKE';
    this.props.mutate({ variables: { postId: postId, type: type } })
    .then((sentiments) => {
      this.setState({
        like: sentiments.data.addSentiment.like
      });
    });
  }
  handleDisagree() {
    const postId = this.props.post.id;
    const type = 'DISAGREE';
    this.props.mutate({ variables: { postId: postId, type: type } })
    .then((sentiments) => {
      this.setState({
        disagree: sentiments.data.addSentiment.disagree
      });
    });
  }
  render() {
    const isUserConnected = getConnectedUserId() !== null;
    const { postIndex, moreProposals, post, redirectToLogin } = this.props;
    return (
      <div className={postIndex < 3 || moreProposals ? 'shown box' : 'hidden box'}>
        <div className="content">
          <div className="user">
            <span className="assembl-icon-profil grey">&nbsp;</span>
            <span className="username">Pauline</span>
          </div>
          <div className="body">{post.body}</div>
          <div className="sentiments">
            <Translate value="debate.survey.react" />
            <div
              className="sentiment"
              onClick={() => { isUserConnected ? this.handleLike() : redirectToLogin(); }}
            >
              <Like size={25} />
            </div>
            <div
              className="sentiment"
              onClick={() => { isUserConnected ? this.handleDisagree() : redirectToLogin(); }}
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
  mutate: React.PropTypes.func.isRequired
};

const addSentimentMutation = gql`
  mutation addSentiment($type: SentimentType!, $postId: ID!) {
    addSentiment(postId:$postId, type: $type) {
      like,
      disagree
    }
  }
`;

const PostWithMutation = graphql(addSentimentMutation)(Post);

export default PostWithMutation;