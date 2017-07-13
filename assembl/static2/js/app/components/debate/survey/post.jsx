import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
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
import addSentimentMutation from '../../../graphql/mutations/addSentiment.graphql';
import deleteSentimentMutation from '../../../graphql/mutations/deleteSentiment.graphql';

class Post extends React.Component {
  constructor(props) {
    super(props);
    this.handleSentiment = this.handleSentiment.bind(this);
  }
  handleSentiment(event, type) {
    const { post } = this.props;
    const isUserConnected = getConnectedUserId() !== null;
    if (isUserConnected) {
      const { debateData } = this.props.debate;
      const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, 'survey');
      if (!isPhaseCompleted) {
        const target = event.currentTarget;
        const isMySentiment = post.mySentiment === type;
        if (isMySentiment) {
          this.handleDeleteSentiment(target);
        } else {
          this.handleAddSentiment(target, type);
        }
      }
    } else {
      this.redirectToLogin();
    }
  }
  redirectToLogin() {
    const next = getCurrentView();
    const slug = { slug: this.props.debate.debateData.slug };
    const body = I18n.t('login.loginModalBody');
    const button = {
      link: `${getContextual('login', slug)}?next=${next}`,
      label: I18n.t('login.loginModalFooter'),
      internalLink: true
    };
    displayModal(null, body, true, null, button, true);
  }
  handleAddSentiment(target, type) {
    const { id, refetchTheme } = this.props;
    this.props
      .addSentiment({ variables: { postId: id, type: type } })
      .then(() => {
        refetchTheme();
        target.setAttribute('class', 'sentiment sentiment-active');
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  }
  handleDeleteSentiment(target) {
    const { id, refetchTheme } = this.props;
    this.props
      .deleteSentiment({ variables: { postId: id } })
      .then(() => {
        refetchTheme();
        target.setAttribute('class', 'sentiment');
      })
      .catch((error) => {
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
                className={post.mySentiment === 'LIKE' ? 'sentiment sentiment-active' : 'sentiment'}
                onClick={(event) => {
                  this.handleSentiment(event, 'LIKE');
                }}
              >
                <Like size={25} />
              </div>
            </OverlayTrigger>
            <OverlayTrigger placement="top" overlay={disagreeTooltip}>
              <div
                className={post.mySentiment === 'DISAGREE' ? 'sentiment sentiment-active' : 'sentiment'}
                onClick={(event) => {
                  this.handleSentiment(event, 'DISAGREE');
                }}
              >
                <Disagree size={25} />
              </div>
            </OverlayTrigger>
          </div>
        </div>
        <div className="statistic">
          <div className="totalSentimentsCount">
            {post.sentimentCounts.like + post.sentimentCounts.disagree}
          </div>
          <div className="sentimentsCountLabel">
            <Translate value="debate.survey.reactions" />
          </div>
          <Doughnut like={post.sentimentCounts.like} disagree={post.sentimentCounts.disagree} />
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
  }
}

Post.propTypes = {
  addSentiment: PropTypes.func.isRequired,
  deleteSentiment: PropTypes.func.isRequired
};

const PostWithMutations = compose(
  graphql(addSentimentMutation, {
    name: 'addSentiment'
  }),
  graphql(deleteSentimentMutation, {
    name: 'deleteSentiment'
  })
)(Post);

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

export default connect(mapStateToProps)(PostWithMutations);