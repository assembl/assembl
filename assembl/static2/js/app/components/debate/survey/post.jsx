// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { Translate, I18n } from 'react-redux-i18n';

import { getConnectedUserId } from '../../../utils/globalFunctions';
import Permissions, { connectedUserCan } from '../../../utils/permissions';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import PostCreator from './postCreator';
import Like from '../../svg/like';
import Disagree from '../../svg/disagree';
import { inviteUserToLogin, displayAlert, displayModal } from '../../../utils/utilityManager';
import addSentimentMutation from '../../../graphql/mutations/addSentiment.graphql';
import deleteSentimentMutation from '../../../graphql/mutations/deleteSentiment.graphql';
import PostQuery from '../../../graphql/PostQuery.graphql';
import { deleteMessageTooltip, likeTooltip, disagreeTooltip } from '../../common/tooltips';
import { sentimentDefinitionsObject } from '../common/sentimentDefinitions';
import StatisticsDoughnut from '../common/statisticsDoughnut';
import { EXTRA_SMALL_SCREEN_WIDTH, DeletedPublicationStates } from '../../../constants';
import withLoadingIndicator from '../../common/withLoadingIndicator';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import { withScreenWidth } from '../../common/screenDimensions';
import PostBody from '../common/post/postBody';
import hashLinkScroll from '../../../utils/hashLinkScroll';
import DeletePostButton from '../common/deletePostButton';
import QuestionQuery from '../../../graphql/QuestionQuery.graphql';
import ThematicQuery from '../../../graphql/ThematicQuery.graphql';

type Props = {
  timeline: Timeline,
  addSentiment: Function,
  contentLocale: string,
  debate: DebateData,
  deleteSentiment: Function,
  data: {
    post: PostFragment
  },
  lang: string,
  originalLocale: string,
  questionId: string,
  screenWidth: number,
  themeId: string,
  isHarvesting: boolean
};

class Post extends React.Component<Props> {
  componentDidMount() {
    // If we have a hash in url and the post id match it, scroll to it.
    const postId = this.props.data.post.id;
    const { hash } = window.location;
    if (hash !== '') {
      const id = hash.replace('#', '').split('?')[0];
      if (id === postId) {
        // Wait an extra 1s to be sure that all previous posts are loaded
        setTimeout(hashLinkScroll, 1000);
      }
    }
  }

  handleSentiment = (event, type, refetchQueries, currentCounts: { disagree: number, like: number }) => {
    const { post } = this.props.data;
    const isUserConnected = getConnectedUserId() !== null;
    if (isUserConnected) {
      const { timeline } = this.props;
      const isPhaseCompleted = getIfPhaseCompletedByIdentifier(timeline, 'survey');
      if (!isPhaseCompleted) {
        const target = event.currentTarget;
        const isMySentiment = post.mySentiment === type;
        if (isMySentiment) {
          this.handleDeleteSentiment(refetchQueries, currentCounts);
        } else {
          this.handleAddSentiment(target, type, refetchQueries, currentCounts);
        }
      } else {
        const body = (
          <div>
            <Translate value="debate.isCompleted" />
          </div>
        );
        displayModal(null, body, true, null, null, true);
      }
    } else {
      inviteUserToLogin();
    }
  };

  handleAddSentiment(target, type, refetchQueries, currentCounts) {
    const { id, mySentiment } = this.props.data.post;
    this.props
      .addSentiment({
        variables: { postId: id, type: type },
        optimisticResponse: {
          addSentiment: {
            post: {
              id: id,
              sentimentCounts: {
                like: type === 'LIKE' ? currentCounts.like + 1 : currentCounts.like - (mySentiment === 'LIKE' ? 1 : 0),
                disagree:
                  type === 'DISAGREE'
                    ? currentCounts.disagree + 1
                    : currentCounts.disagree - (mySentiment === 'DISAGREE' ? 1 : 0),
                dontUnderstand: 0,
                moreInfo: 0,
                __typename: 'SentimentCounts'
              },
              mySentiment: type,
              __typename: 'Post'
            },
            __typename: 'AddSentiment'
          }
        },
        refetchQueries: refetchQueries
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  }

  handleDeleteSentiment(refetchQueries, currentCounts) {
    const { id, mySentiment } = this.props.data.post;
    this.props
      .deleteSentiment({
        variables: { postId: id },
        optimisticResponse: {
          deleteSentiment: {
            post: {
              id: id,
              sentimentCounts: {
                like: currentCounts.like - (mySentiment === 'LIKE' ? 1 : 0),
                disagree: currentCounts.disagree - (mySentiment === 'DISAGREE' ? 1 : 0),
                dontUnderstand: 0,
                moreInfo: 0,
                __typename: 'SentimentCounts'
              },
              mySentiment: null,
              __typename: 'Post'
            },
            __typename: 'DeleteSentiment'
          }
        },
        refetchQueries: refetchQueries
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  }

  render() {
    const { post } = this.props.data;
    const { bodyEntries, publicationState } = post;
    if (!publicationState || publicationState in DeletedPublicationStates) {
      return null;
    }

    const { contentLocale, lang, screenWidth, originalLocale, questionId, themeId, isHarvesting } = this.props;
    const { debateData } = this.props.debate;
    const translate = contentLocale !== originalLocale;

    // to update the question header when we delete the post or add/remove a sentiment
    const updateQuestionQuery = {
      query: QuestionQuery,
      variables: {
        id: questionId,
        lang: lang
      }
    };

    const updateThematicQuery = {
      query: ThematicQuery,
      variables: {
        id: themeId,
        lang: lang
      }
    };

    const refetchQueries = [updateQuestionQuery, updateThematicQuery];

    let body = '';
    if (bodyEntries) {
      if (bodyEntries.length > 1) {
        // first entry is the translated version, example localeCode "fr-x-mtfrom-en"
        // second entry is the original, example localeCode "en"
        body = translate ? bodyEntries[0] && bodyEntries[0].value : bodyEntries[1] && bodyEntries[1].value;
      } else {
        // translation is not enabled or the message is already in the desired locale
        body = bodyEntries[0] ? bodyEntries[0].value : '';
      }
    }

    const sentimentCounts = post.sentimentCounts;
    const currentCounts = {
      like: sentimentCounts && sentimentCounts.like ? sentimentCounts.like : 0,
      disagree: sentimentCounts && sentimentCounts.disagree ? sentimentCounts.disagree : 0
    };
    const likeComponent = (
      <div
        className={post.mySentiment === 'LIKE' ? 'sentiment sentiment-active' : 'sentiment'}
        onClick={(event) => {
          this.handleSentiment(event, 'LIKE', refetchQueries, currentCounts);
        }}
      >
        <Like size={25} />
      </div>
    );

    const disagreeComponent = (
      <div
        className={post.mySentiment === 'DISAGREE' ? 'sentiment sentiment-active' : 'sentiment'}
        onClick={(event) => {
          this.handleSentiment(event, 'DISAGREE', refetchQueries, currentCounts);
        }}
      >
        <Disagree size={25} />
      </div>
    );

    let creatorName = '';
    let userCanDeleteThisMessage = false;
    if (post.creator) {
      const { displayName, isDeleted } = post.creator;
      const connectedUserId = getConnectedUserId();
      userCanDeleteThisMessage =
        (post.creator && (connectedUserId === String(post.creator.userId) && connectedUserCan(Permissions.DELETE_MY_POST))) ||
        connectedUserCan(Permissions.DELETE_POST);
      creatorName = isDeleted ? I18n.t('deletedUser') : displayName;
    }

    const deleteButton = <DeletePostButton postId={post.id} refetchQueries={refetchQueries} linkClassName="overflow-action" />;

    return (
      <div className="shown box" id={post.id}>
        <div className="content">
          <PostCreator name={creatorName} />
          <PostBody
            dbId={post.dbId}
            translationEnabled={debateData.translationEnabled}
            contentLocale={contentLocale}
            extracts={post.extracts}
            id={post.id}
            lang={lang}
            translate={translate}
            originalLocale={originalLocale}
            body={body}
            bodyMimeType={post.bodyMimeType}
            isHarvesting={isHarvesting}
          />
          <div className="post-footer">
            <div className="sentiments">
              <div className="sentiment-label">
                <Translate value="debate.survey.react" />
              </div>
              <ResponsiveOverlayTrigger placement="top" tooltip={likeTooltip}>
                {likeComponent}
              </ResponsiveOverlayTrigger>
              <ResponsiveOverlayTrigger placement="top" tooltip={disagreeTooltip}>
                {disagreeComponent}
              </ResponsiveOverlayTrigger>
            </div>
            <div className="actions">
              {userCanDeleteThisMessage ? (
                <ResponsiveOverlayTrigger placement="top" tooltip={deleteMessageTooltip}>
                  {deleteButton}
                </ResponsiveOverlayTrigger>
              ) : null}
            </div>
          </div>
        </div>
        <div className="statistic">
          {screenWidth < EXTRA_SMALL_SCREEN_WIDTH && (
            <div className="sentiments">
              <ResponsiveOverlayTrigger placement="top" tooltip={likeTooltip}>
                {likeComponent}
              </ResponsiveOverlayTrigger>
              <ResponsiveOverlayTrigger placement="top" tooltip={disagreeTooltip}>
                {disagreeComponent}
              </ResponsiveOverlayTrigger>
            </div>
          )}
          <div>
            <StatisticsDoughnut
              elements={[
                { color: sentimentDefinitionsObject.like.color, count: currentCounts.like },
                { color: sentimentDefinitionsObject.disagree.color, count: currentCounts.disagree }
              ]}
            />
            <div className="stat-sentiment">
              <div>
                <div className="min-sentiment">
                  <Like size={15} />&nbsp;<span className="txt">{currentCounts.like}</span>
                </div>
              </div>
              <div>
                <div className="min-sentiment">
                  <Disagree size={15} />&nbsp;<span className="txt">{currentCounts.disagree}</span>
                </div>
              </div>
            </div>
          </div>
          {screenWidth < EXTRA_SMALL_SCREEN_WIDTH && (
            <div className="actions">
              {userCanDeleteThisMessage ? (
                <ResponsiveOverlayTrigger placement="top" tooltip={deleteMessageTooltip}>
                  {deleteButton}
                </ResponsiveOverlayTrigger>
              ) : null}
            </div>
          )}
        </div>
        <div className="clear">&nbsp;</div>
      </div>
    );
  }
}

const mapStateToProps = (state, { id }) => ({
  debate: state.debate,
  timeline: state.timeline,
  contentLocale: state.contentLocale.getIn([id, 'contentLocale']),
  lang: state.i18n.locale,
  isHarvesting: state.context.isHarvesting
});

export default compose(
  connect(mapStateToProps),
  graphql(PostQuery),
  graphql(addSentimentMutation, {
    name: 'addSentiment'
  }),
  graphql(deleteSentimentMutation, {
    name: 'deleteSentiment'
  }),
  withLoadingIndicator(),
  withScreenWidth,
  withApollo
)(Post);