import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import PostCreator from './postCreator';
import Doughnut from '../../svg/doughnut';
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import { inviteUserToLogin, displayAlert } from '../../../utils/utilityManager';
import addSentimentMutation from '../../../graphql/mutations/addSentiment.graphql';
import deleteSentimentMutation from '../../../graphql/mutations/deleteSentiment.graphql';
import { likeTooltip, disagreeTooltip } from '../../common/tooltips';
import PostTranslate from '../common/postTranslate';

class Post extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showOriginal: false
    };
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
      inviteUserToLogin();
    }
  }
  handleAddSentiment(target, type) {
    const { refetchTheme } = this.props;
    this.props
      .addSentiment({ variables: { postId: this.props.post.id, type: type } })
      .then(() => {
        refetchTheme();
        target.setAttribute('class', 'sentiment sentiment-active');
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  }
  handleDeleteSentiment(target) {
    const { refetchTheme } = this.props;
    this.props
      .deleteSentiment({ variables: { postId: this.props.post.id } })
      .then(() => {
        refetchTheme();
        target.setAttribute('class', 'sentiment');
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  }
  render() {
    const { postIndex, moreProposals, post } = this.props;
    const { bodyEntries } = post;

    let body;
    let originalBodyLocale;
    if (bodyEntries.length > 1) {
      // first entry is the translated version, example localeCode "fr-x-mtfrom-en"
      // second entry is the original, example localeCode "en"
      body = this.state.showOriginal ? bodyEntries[1].value : bodyEntries[0].value;
      originalBodyLocale = bodyEntries[1].localeCode;
    } else {
      // translation is not enabled or the message is already in the desired locale
      body = bodyEntries[0].value;
    }

    return (
      <div className={postIndex < 3 || moreProposals ? 'shown box' : 'hidden box'}>
        <div className="content">
          <PostCreator name={post.creator.name} />
          {originalBodyLocale
            ? <PostTranslate
              id={post.id}
              showOriginal={this.state.showOriginal}
              originalBodyLocale={originalBodyLocale}
              toggle={() => {
                return this.setState((state) => {
                  return { showOriginal: !state.showOriginal };
                });
              }}
            />
            : null}
          <div
            className={`body ${post.bodyMimeType === 'text/plain' ? 'pre-wrap' : ''}`}
            dangerouslySetInnerHTML={{ __html: body }}
          />
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