import React from 'react';
import { graphql, compose } from 'react-apollo';
import update from 'immutability-helper';
import gql from 'graphql-tag';
import { Translate } from 'react-redux-i18n';
import { getConnectedUserId } from '../../../utils/globalFunctions';
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
      disagree: post.sentimentCounts.disagree
    };
    this.handleLike = this.handleLike.bind(this);
    this.handleDisagree = this.handleDisagree.bind(this);
  }
  handleLike(event) {
    const { post, id } = this.props;
    const target = event.currentTarget;
    const type = 'LIKE';
    const isMySentiment = post.mySentiment === 'like';
    if(isMySentiment) {
      this.deleteSentiment(target, type);
    } else {
      this.addSentiment(target, type);
    }
  }
  handleDisagree(event) {
    const { post } = this.props;
    const target = event.currentTarget;
    const type = 'DISAGREE';
    const isMySentiment = post.mySentiment === 'disagree';
    if(isMySentiment) {
      this.deleteSentiment(target, type);
    } else {
      this.addSentiment(target, type);
    }
  }
  addSentiment(target, type) {
    const { id } = this.props;
    this.props.addSentiment({ variables: { postId: id, type: type } })
    .then((sentiments) => {
      target.setAttribute("class", "sentiment sentiment-active");
      this.setState({
        like: sentiments.data.addSentiment.like,
        disagree: sentiments.data.addSentiment.disagree
      });
    }).catch((error) => {
      this.props.displayAlert('danger', `${error}`);
    });
  }
  deleteSentiment(target, type) {
    console.log('delete a sentiment');
    const { id } = this.props;
    // this.props.deleteSentiment({ variables: { postId: id, type: type } })
    // .then((sentiments) => {
    //   target.setAttribute("class", "sentiment");
    //   this.setState({
    //     like: sentiments.data.addSentiment.like,
    //     disagree: sentiments.data.addSentiment.disagree
    //   });
    // }).catch((error) => {
    //   this.props.displayAlert('danger', `${error}`);
    // });
  }
  render() {
    const isUserConnected = getConnectedUserId() !== null;
    const { postIndex, moreProposals, post, redirectToLogin, id } = this.props;
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
              className={post.mySentiment === 'like' ? 'sentiment sentiment-active' : 'sentiment'}
              onClick={(event) => { isUserConnected ? this.handleLike(event) : redirectToLogin(); }}
            >
              <Like size={25} />
            </div>
            <div
              className={post.mySentiment === 'disagree' ? 'sentiment sentiment-active' : 'sentiment'}
              onClick={(event) => { isUserConnected ? this.handleDisagree(event) : redirectToLogin(); }}
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
  mutation addSentiment($type: SentimentType!, $postId: ID!) {
    addSentiment(postId:$postId, type: $type) {
      like,
      disagree
    }
  }
`;

const deleteSentiment = gql`
  mutation deleteSentiment($type: SentimentType!, $postId: ID!) {
    deleteSentiment(postId:$postId, type: $type) {
      like,
      disagree
    }
  }
`;

const PostWithMutations =  compose(
  graphql(addSentiment, {
    name: 'addSentiment'
  }),
  graphql(deleteSentiment, {
    name: 'deleteSentiment'  
  })
)(Post);

export default PostWithMutations;
