import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { Translate, I18n } from 'react-redux-i18n';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import PostCreator from './postCreator';
import Doughnut from '../../svg/doughnut';
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import { displayModal, displayAlert } from '../../../utils/utilityManager';
import { getCurrentView, getContextual } from '../../../utils/routeMap';

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
      this.redirectToLogin();
    }
  }
  redirectToLogin() {
    const next = getCurrentView();
    const slug = { slug: this.props.debate.debateData.slug };
    const body = I18n.t('debate.survey.modalBody');
    const button = { link: `${getContextual('login', slug)}?next=${next}`, label: I18n.t('debate.survey.modalFooter'), internalLink: true };
    displayModal(null, body, true, null, button, true);
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
      displayAlert('danger', `${error}`);
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
      displayAlert('danger', `${error}`);
    });
  }
  render() {
    const { postIndex, moreProposals, post, id } = this.props;
    const likeTooltip = (
      <Tooltip id="likeTooltip">
        <Translate value="debate.like" />
      </Tooltip>
    );
    const disagreeTooltip = (
      <Tooltip id="disagreeTooltip">
        <Translate value="debate.disagree" />
      </Tooltip>
    );
    return (
      <div className={postIndex < 3 || moreProposals ? 'shown box' : 'hidden box'}>
        <div className="content">
          <PostCreator id={id} />
          <div className="body">{post.body}</div>
          <div className="sentiments">
            <div className="sentiment-label">
              <Translate value="debate.survey.react" />
            </div>
            <OverlayTrigger placement="top" overlay={likeTooltip}>
              <div
                className={this.state.mySentiment === 'LIKE' ? 'sentiment sentiment-active' : 'sentiment'}
                onClick={(event) => { this.handleSentiment(event, 'LIKE'); }}
              >
                <Like size={25} />
              </div>
            </OverlayTrigger>
            <OverlayTrigger placement="top" overlay={disagreeTooltip}>
              <div
                className={this.state.mySentiment === 'DISAGREE' ? 'sentiment sentiment-active' : 'sentiment'}
                onClick={(event) => { this.handleSentiment(event, 'DISAGREE'); }}
              >
                <Disagree size={25} />
              </div>
            </OverlayTrigger>
          </div>
        </div>
        <div className="statistic">
          <div className="totalSentimentsCount">
            {this.state.like + this.state.disagree}
          </div>
          <div className="sentimentsCountLabel">
            <Translate value="debate.survey.reactions" />
          </div>
          <Doughnut like={this.state.like} disagree={this.state.disagree} />
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
  addSentiment: PropTypes.func.isRequired,
  deleteSentiment: PropTypes.func.isRequired
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