// @flow
import React, { Component, Fragment } from 'react';
import type { Node } from 'react';
import { I18n, Translate } from 'react-redux-i18n';
// Graphql imports
import { compose, graphql } from 'react-apollo';
// Helpers imports
import moment from 'moment';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import Permissions, { connectedUserCan } from '../../../utils/permissions';
// Optimization: Should create commentQuery.graphql and adapt the query
import CommentQuery from '../../../graphql/BrightMirrorFictionQuery.graphql';
// Components imports
import CircleAvatar from './circleAvatar';
import ToggleCommentButton from '../common/toggleCommentButton';
import ReplyToCommentButton from '../common/replyToCommentButton';
import FictionCommentForm from './fictionCommentForm';
import EditPostButton from '../common/editPostButton';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
// Constant imports
import { EMPTY_STRING } from '../../../constants';
import { editFictionCommentTooltip } from '../../common/tooltips';
// Types imports
import type { CircleAvatarProps } from './circleAvatar';
import type { FictionCommentFormProps } from './fictionCommentForm';
import type { ToggleCommentButtonProps } from '../common/toggleCommentButton';
import type { ReplyToCommentButtonProps } from '../common/replyToCommentButton';

export type FictionCommentExtraProps = {
  /** Submit comment callback used in order to catch a submit event from tree.jsx */
  submitCommentCallback: Function,
  /** Expand flag set from Tree.jsx */
  expandedFromTree?: ?boolean,
  /** Expand collapse callback function set from Tree.jsx  */
  expandCollapseCallbackFromTree?: ?Function
};

export type FictionCommentBaseProps = {
  /** Children node used in our case for integration purpose */
  children?: Node,
  /** Function that should be called when a comment is rendered */
  measureTreeHeight: (delay?: number) => void,
  /** Number of child comments */
  numChildren: number,
  /** Extra props defined from Tree.jsx */
  fictionCommentExtraProps: FictionCommentExtraProps
};

export type FictionCommentGraphQLProps = {
  /** Author user Id */
  authorUserId: number,
  /** Author fullname */
  authorFullname: string,
  /** Circle avatar props */
  circleAvatar: CircleAvatarProps,
  /** Comment content */
  commentContent: string,
  /** Comment parent id */
  commentParentId: string,
  /** Comment displayed published date */
  displayedPublishedDate: string,
  /** Parent post author fullname */
  parentPostAuthorFullname: string,
  /** Comment published date */
  publishedDate: string
};

type LocalFictionCommentProps = FictionCommentBaseProps & FictionCommentGraphQLProps;

type FictionCommentState = {
  showFictionCommentForm: boolean,
  isEditing: boolean
};

// Type use for creating a Bright Mirror comment with CreateCommentMutation
export type CreateCommentInputs = {
  /** Comment body content */
  body: string,
  /** Comment content locale */
  contentLocale: string,
  /** Comment idea identifier */
  ideaId: string,
  /** Comment parent identifier */
  parentId: string
};

export class FictionComment extends Component<LocalFictionCommentProps, FictionCommentState> {
  state = {
    showFictionCommentForm: false,
    isEditing: false
  };

  componentDidMount() {
    // Update tree height when component is rendered
    this.props.measureTreeHeight();
  }

  displayFictionCommentForm = (show: boolean) => {
    this.setState({ showFictionCommentForm: show }, this.props.measureTreeHeight());
  };

  toggleIsEditing = (value: boolean) => {
    this.setState({ isEditing: value }, this.props.measureTreeHeight());
  };

  render() {
    const {
      authorUserId,
      authorFullname,
      circleAvatar,
      children,
      commentContent,
      commentParentId,
      displayedPublishedDate,
      numChildren,
      parentPostAuthorFullname,
      publishedDate,
      fictionCommentExtraProps
    } = this.props;
    const { isEditing, showFictionCommentForm } = this.state;
    const { expandedFromTree, expandCollapseCallbackFromTree } = fictionCommentExtraProps;

    const toggleCommentButtonProps: ToggleCommentButtonProps = {
      isExpanded: expandedFromTree != null ? expandedFromTree : false,
      onClickCallback: expandCollapseCallbackFromTree != null ? expandCollapseCallbackFromTree : () => null
    };

    const replyToCommentButtonProps: ReplyToCommentButtonProps = {
      onClickCallback: () => this.displayFictionCommentForm(true)
    };

    const fictionCommentFormProps: FictionCommentFormProps = {
      onCancelCommentCallback: () => this.displayFictionCommentForm(false),
      onSubmitCommentCallback: (comment: string) => {
        this.displayFictionCommentForm(false);
        fictionCommentExtraProps.submitCommentCallback(comment, commentParentId);
      }
    };

    const editCommentFormProps: FictionCommentFormProps = {
      onCancelCommentCallback: () => this.toggleIsEditing(false),
      onSubmitCommentCallback: () => this.toggleIsEditing(false),
      commentValue: commentContent,
      editMode: true
    };

    // Display ToggleCommentButton only when there are answers to a comment
    const displayToggleCommentButton = numChildren > 0 ? <ToggleCommentButton {...toggleCommentButtonProps} /> : null;

    // Display FictionCommentForm when ReplyToCommentButton is clicked.
    // ReplyToCommentButton is hidden when FictionCommentForm is displayed
    const displayReplyToCommentButton = showFictionCommentForm ? null : <ReplyToCommentButton {...replyToCommentButtonProps} />;
    const displayFictionCommentForm = showFictionCommentForm ? <FictionCommentForm {...fictionCommentFormProps} /> : null;

    // Display EditPostButton only when the user have the required rights
    const userCanEdit = getConnectedUserId() === String(authorUserId) && connectedUserCan(Permissions.EDIT_MY_POST);
    const displayEditPostButton =
      userCanEdit && !isEditing ? (
        <ResponsiveOverlayTrigger placement="left" tooltip={editFictionCommentTooltip}>
          <EditPostButton handleClick={() => this.toggleIsEditing(true)} linkClassName="action-edit" />
        </ResponsiveOverlayTrigger>
      ) : null;

    const displayHeader = (
      <header className="meta">
        <p className="author">
          <strong>{authorFullname}</strong>
          <span className="parent-info">
            <span className="assembl-icon-back-arrow" />
            {parentPostAuthorFullname}
          </span>
        </p>
        <p className="published-date">
          <time dateTime={publishedDate} pubdate="true">
            -&nbsp;{displayedPublishedDate}
          </time>
        </p>
      </header>
    );

    const displayCommentContent = isEditing ? (
      <FictionCommentForm {...editCommentFormProps} />
    ) : (
      <p className="comment">{commentContent}</p>
    );

    const displayFooter = (
      <footer className="toolbar">
        <div className="left-content">
          <p>
            <Translate value="debate.brightMirror.numberOfResponses" count={numChildren} />
          </p>
          {displayToggleCommentButton}
          {displayReplyToCommentButton}
        </div>
        <div className="right-content">{displayEditPostButton}</div>
      </footer>
    );

    return (
      <Fragment>
        <article className="comment-container">
          <CircleAvatar {...circleAvatar} />
          <div className="content">
            {displayHeader}
            {displayCommentContent}
            {displayFooter}
            {displayFictionCommentForm}
          </div>
        </article>
        {children}
      </Fragment>
    );
  }
}

const mapQueryToProps = ({ data }) => {
  if (data.loading === false && data.error === undefined) {
    // Define variables
    const { fiction } = data;
    const { creator, parentPostCreator } = fiction;
    const { contentLocale, id } = data.variables;
    const noAuthorSpecified = I18n.t('debate.brightMirror.noAuthorSpecified');
    const circleAvatarProps: CircleAvatarProps = {
      username: fiction.creator.displayName,
      src:
        fiction.creator && fiction.creator.image && fiction.creator.image.externalUrl
          ? fiction.creator.image.externalUrl
          : EMPTY_STRING
    };
    const USER_ID_NOT_FOUND = -9999;

    // Map graphQL returned data with local props
    return {
      authorUserId: creator ? creator.userId : USER_ID_NOT_FOUND,
      authorFullname: creator ? creator.displayName : noAuthorSpecified,
      circleAvatar: circleAvatarProps,
      commentContent: fiction.body,
      commentParentId: id,
      displayedPublishedDate: moment(fiction.creationDate)
        .locale(contentLocale)
        .fromNow(),
      parentPostAuthorFullname: parentPostCreator ? parentPostCreator.displayName : noAuthorSpecified,
      publishedDate: fiction.creationDate
    };
  }
  // Return empty object when data is still loading or query is failed
  // TODO: display an alert if error/undefined and a loader
  return {};
};

export default compose(graphql(CommentQuery, { props: mapQueryToProps }))(FictionComment);