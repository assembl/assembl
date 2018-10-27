// @flow
import React, { Fragment, Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import head from 'lodash/head';
import type { OperationComponent } from 'react-apollo';
// Graphql imports
import { compose, graphql } from 'react-apollo';
import BrightMirrorFictionQuery from '../graphql/BrightMirrorFictionQuery.graphql';
// Optimization: Should create createBrightMirrorComment.graphql and adapt the mutation
import CreateBrightMirrorCommentMutation from '../graphql/mutations/createPost.graphql';
// Optimization: Should create ideaWithCommentsQuery.graphql and adapt the query
import IdeaWithCommentsQuery from '../graphql/IdeaWithPostsQuery.graphql';
// Route helpers imports
import { browserHistory } from '../router';
import { get } from '../utils/routeMap';
// HOC imports
import manageErrorAndLoading from '../components/common/manageErrorAndLoading';
// Components imports
import FictionHeader from '../components/debate/brightMirror/fictionHeader';
import FictionToolbar from '../components/debate/brightMirror/fictionToolbar';
import FictionBody from '../components/debate/brightMirror/fictionBody';
import BackButton from '../components/debate/common/backButton';
import FictionCommentHeader from '../components/debate/brightMirror/fictionCommentHeader';
import FictionCommentForm from '../components/debate/brightMirror/fictionCommentForm';
import FictionCommentList from '../components/debate/brightMirror/fictionCommentList';
// Utils imports
import { transformPosts } from './idea';
import { displayAlert } from '../utils/utilityManager';
import { getConnectedUserId } from '../utils/globalFunctions';
import Permissions, { connectedUserCan } from '../utils/permissions';
// Constant imports
import { FICTION_DELETE_CALLBACK, EMPTY_STRING, PublicationStates, USER_ID_NOT_FOUND } from '../constants';
// Type imports
import type { ContentLocaleMapping } from '../actions/actionTypes';
import type { CircleAvatarProps } from '../components/debate/brightMirror/circleAvatar';
import type { FictionHeaderProps } from '../components/debate/brightMirror/fictionHeader';
import type { FictionToolbarProps } from '../components/debate/brightMirror/fictionToolbar';
import type { Props as FictionBodyProps } from '../components/debate/brightMirror/fictionBody';
import type { FictionCommentHeaderProps } from '../components/debate/brightMirror/fictionCommentHeader';
import type { FictionCommentFormProps } from '../components/debate/brightMirror/fictionCommentForm';
import type { FictionCommentListProps } from '../components/debate/brightMirror/fictionCommentList';
import type { CreateCommentInputs } from '../components/debate/brightMirror/fictionComment';

// Define types
export type BrightMirrorFictionData = {
  /** Fiction object formatted through GraphQL  */
  fiction: BrightMirrorFictionFragment,
  /** GraphQL error object used to handle fetching errors */
  error: any,
  /** GraphQL flag that checks the query/mutation state */
  loading: boolean,
  refetch: () => void
};

export type BrightMirrorFictionProps = {
  /** URL slug */
  slug: string,
  /** Fiction phase */
  phase: string,
  /** Fiction theme identifier */
  themeId: string,
  /** Fiction identifier */
  fictionId: string
};

type BrightMirrorFictionReduxProps = {
  /** Fiction locale fetched from mapStateToProps */
  contentLocale: string,
  /** Fiction locale mapping fetched from mapStateToProps */
  contentLocaleMapping: ContentLocaleMapping
};

export type IdeaWithCommentsData = {
  /**  Idea object formatted through GraphQL */
  idea: IdeaWithCommentsQuery,
  /** GraphQL flag that checks the query/mutation state */
  loading: boolean,
  /** GraphQL error object used to handle fetching errors */
  error: any,
  /** GraphQL refetch function in order to refresh data once a comment is submitted */
  refetch: Function
};

type BrightMirrorFictionGraphQLProps = {
  /** Fiction data information fetched from GraphQL */
  brightMirrorFictionData: BrightMirrorFictionData,
  /** Create comment mutation from GraphQL */
  createComment: Function,
  /** Fiction data information fetched from GraphQL */
  ideaWithCommentsData: IdeaWithCommentsData
};

type LocalBrightMirrorFictionProps = BrightMirrorFictionProps & BrightMirrorFictionReduxProps & BrightMirrorFictionGraphQLProps;

type BrightMirrorFictionState = {
  /** Fiction title */
  title: string,
  /** Fiction content */
  content: string,
  /** GraphQL loading flag */
  loading: boolean,
  /** Fiction publication state */
  publicationState: string
};

export class BrightMirrorFiction extends Component<LocalBrightMirrorFictionProps, BrightMirrorFictionState> {
  static getDerivedStateFromProps(nextProps: LocalBrightMirrorFictionProps) {
    // Sync state
    const { loading } = nextProps.brightMirrorFictionData;
    if (loading) return null;

    const { subject, body, publicationState } = nextProps.brightMirrorFictionData.fiction;

    return {
      title: subject || EMPTY_STRING,
      content: body || EMPTY_STRING,
      loading: nextProps.brightMirrorFictionData.loading || nextProps.ideaWithCommentsData.loading,
      publicationState: publicationState || PublicationStates.PUBLISHED
    };
  }

  // Lifecycle functions
  constructor(props: LocalBrightMirrorFictionProps) {
    super(props);
    this.state = {
      title: EMPTY_STRING,
      content: EMPTY_STRING,
      loading: props.brightMirrorFictionData.loading,
      publicationState: PublicationStates.PUBLISHED
    };
  }

  // Define callback functions
  submitCommentHandler = (comment: string, commentParentId: string) => {
    displayAlert('success', I18n.t('loading.wait'));

    // Define variables
    const { contentLocale, themeId, fictionId, createComment, ideaWithCommentsData } = this.props;
    const parentId = commentParentId || fictionId;
    const createPostInputs: CreateCommentInputs = {
      body: comment,
      contentLocale: contentLocale,
      ideaId: themeId,
      parentId: parentId
    };

    // Call the mutation function to create a comment
    createComment({ variables: createPostInputs })
      .then(() => {
        // If needed post result can be fetched with `result.data.createPost.post`
        displayAlert('success', I18n.t('debate.thread.postSuccess'));
        // Set state here to update UI

        // Refetch 'ideaWithCommentsData' to display the updated list of comments
        ideaWithCommentsData.refetch().then(() => {
          // Force scroll by 1px down in order to display the new comment
          window.scrollBy(0, 1);
        });
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };

  // Create an array of comments from the current fiction
  // The fiction is the main post, a post (or comment) with a parentId identical to the fictionId
  // will be considered as the top level of comments of the fiction
  getTopComments() {
    const { fictionId, ideaWithCommentsData } = this.props;
    const { edges } = ideaWithCommentsData.idea.posts;
    const { idea, refetch } = ideaWithCommentsData;

    if (!ideaWithCommentsData.idea) return [];

    const topComments = head(
      transformPosts(edges, [], {
        refetchIdea: refetch,
        ideaId: idea.id
      }).filter(post => post.id === fictionId)
    ).children;

    return topComments;
  }

  render() {
    const { title, content, loading, publicationState } = this.state;
    // Display nothing/loader when graphQL is still loading datas
    if (loading) return null;

    const {
      brightMirrorFictionData,
      contentLocale,
      contentLocaleMapping,
      fictionId,
      ideaWithCommentsData,
      phase,
      slug,
      themeId
    } = this.props;
    // Handle fetching error
    if (brightMirrorFictionData.error || ideaWithCommentsData.error) {
      displayAlert('danger', I18n.t('error.loading'));
      return null;
    }

    // Define variables
    const { fiction } = brightMirrorFictionData;
    const getDisplayName = () => (fiction.creator && fiction.creator.displayName ? fiction.creator.displayName : EMPTY_STRING);
    const displayName = fiction.creator && fiction.creator.isDeleted ? I18n.t('deletedUser') : getDisplayName();
    const topComments = this.getTopComments();

    // Define user permission
    const userId = fiction.creator ? fiction.creator.userId : USER_ID_NOT_FOUND;
    const connectedUserId = getConnectedUserId();
    const userCanPost = connectedUserId && connectedUserCan(Permissions.ADD_POST);
    const userCanDelete =
      (connectedUserId === String(userId) && connectedUserCan(Permissions.DELETE_MY_POST)) ||
      connectedUserCan(Permissions.DELETE_POST);
    const userCanEdit = connectedUserId === String(userId) && connectedUserCan(Permissions.EDIT_MY_POST);

    // Define callback functions - TODO: move the logic out of render
    const deleteFictionCallback = () => {
      // Route to fiction list page
      const fictionListParams = { slug: slug, phase: phase, themeId: themeId };
      const fictionListURL = get('idea', fictionListParams);
      // Set a callback state in order to display a delete fiction confirmation message
      browserHistory.push({
        pathname: fictionListURL,
        state: { callback: FICTION_DELETE_CALLBACK }
      });
    };
    const modifyFictionCallback = (subject, body, state) => {
      this.setState({ title: subject, content: body, publicationState: state });
    };
    const backBtnCallback = () => {
      browserHistory.push(`${get('idea', { slug: slug, phase: phase, themeId: themeId })}`);
    };
    // Define components props
    const circleAvatarProps: CircleAvatarProps = {
      username: displayName,
      src:
        fiction.creator && fiction.creator.image && fiction.creator.image.externalUrl
          ? fiction.creator.image.externalUrl
          : EMPTY_STRING
    };

    const fictionHeaderProps: FictionHeaderProps = {
      authorFullname: displayName,
      publishedDate: fiction.creationDate ? fiction.creationDate.toString() : EMPTY_STRING,
      displayedPublishedDate: I18n.l(fiction.creationDate, { dateFormat: 'date.format' }),
      circleAvatar: { ...circleAvatarProps }
    };

    const fictionToolbarProps: FictionToolbarProps = {
      fictionId: fictionId,
      title: title,
      originalBody: content,
      lang: contentLocale,
      publicationState: publicationState,
      userCanEdit: userCanEdit,
      userCanDelete: userCanDelete,
      onModifyCallback: modifyFictionCallback,
      onDeleteCallback: deleteFictionCallback
    };

    const fictionBodyProps: FictionBodyProps = {
      id: fictionId,
      title: title,
      content: content,
      contentLocale: contentLocale,
      lang: contentLocale,
      isAuthorAccountDeleted: fiction.creator && fiction.creator.isDeleted ? fiction.creator.isDeleted : false,
      // $FlowFixMe extracts are never null
      extracts: fiction.extracts,
      bodyMimeType: fiction.bodyMimeType,
      // $FlowFixMe dbId is never null
      dbId: fiction.dbId,
      refetchPost: brightMirrorFictionData.refetch
    };

    const fictionCommentFormProps: FictionCommentFormProps = {
      onSubmitCommentCallback: this.submitCommentHandler
    };

    const fictionCommentHeaderProps: FictionCommentHeaderProps = {
      strongTitle: I18n.t('debate.brightMirror.commentFiction.strongTitle'),
      title: I18n.t('debate.brightMirror.commentFiction.title'),
      imgSrc: '/static2/img/illustration-mechanisme.png',
      imgAlt: I18n.t('debate.brightMirror.commentFiction.imageAlt'),
      commentsCount: topComments.length
    };

    const fictionCommentListProps: FictionCommentListProps = {
      comments: topComments,
      contentLocale: contentLocale,
      contentLocaleMapping: contentLocaleMapping,
      identifier: phase,
      onSubmitHandler: this.submitCommentHandler
    };

    const displayFictionCommentForm = userCanPost ? <FictionCommentForm {...fictionCommentFormProps} /> : null;

    return (
      <Fragment>
        <div className="bright-mirror-fiction background-fiction-default">
          <BackButton handleClick={backBtnCallback} linkClassName="back-btn" />
          <Grid fluid>
            <Row>
              <Col xs={10}>
                <article>
                  <FictionHeader {...fictionHeaderProps} />
                  <FictionToolbar {...fictionToolbarProps} />
                  <FictionBody {...fictionBodyProps} />
                </article>
              </Col>
            </Row>
          </Grid>
        </div>
        <Grid fluid className="bright-mirror-comments background-comments-default">
          <Row>
            <Col xs={12}>
              <FictionCommentHeader {...fictionCommentHeaderProps} />
              <article className="comments-content">
                {displayFictionCommentForm}
                <FictionCommentList {...fictionCommentListProps} />
              </article>
            </Col>
          </Row>
        </Grid>
      </Fragment>
    );
  }
}
const mapStateToProps = state => ({
  contentLocale: state.i18n.locale,
  contentLocaleMapping: state.contentLocale
});

const withData: OperationComponent<Response> = graphql(BrightMirrorFictionQuery, {
  // GraphQL custom data name
  name: 'brightMirrorFictionData',
  // GraphQL needed input variables
  options: ({ fictionId, contentLocale }) => ({
    variables: {
      id: fictionId,
      contentLocale: contentLocale
    }
  })
});

export default compose(
  connect(mapStateToProps),
  withData,
  graphql(IdeaWithCommentsQuery, {
    // GraphQL custom data name
    name: 'ideaWithCommentsData',
    // GraphQL needed input variables
    options: ({ themeId, contentLocale }) => ({
      variables: {
        additionalFields: true,
        id: themeId,
        lang: contentLocale
      }
    })
  }),
  graphql(CreateBrightMirrorCommentMutation, {
    // GraphQL custom function name
    name: 'createComment'
  }),
  manageErrorAndLoading({ displayLoader: true })
)(BrightMirrorFiction);