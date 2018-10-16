// @flow
import React, { Component, Fragment } from 'react';
import type { Node } from 'react';
import { I18n, Translate } from 'react-redux-i18n';
// Graphql imports
import { compose, graphql } from 'react-apollo';
// Helpers imports
import moment from 'moment';
// Optimization: Should create commentQuery.graphql and adapt the query
import CommentQuery from '../../../graphql/BrightMirrorFictionQuery.graphql';
// Components imports
import CircleAvatar from './circleAvatar';
import ToggleCommentButton from '../common/toggleCommentButton';
import ReplyToCommentButton from '../common/replyToCommentButton';
import FictionCommentForm from './fictionCommentForm';
// Constant imports
import { EMPTY_STRING } from '../../../constants';
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
  showFictionCommentForm: boolean
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
  constructor(props: LocalFictionCommentProps) {
    super(props);
    this.state = {
      showFictionCommentForm: false
    };
  }

  displayFictionCommentForm = (show: boolean) => {
    this.setState({ showFictionCommentForm: show });
    // Update tree height when comment form is toggled
    this.props.measureTreeHeight();
  };

  render() {
    const {
      authorFullname,
      circleAvatar,
      children,
      commentContent,
      commentParentId,
      displayedPublishedDate,
      measureTreeHeight,
      numChildren,
      parentPostAuthorFullname,
      publishedDate,
      fictionCommentExtraProps
    } = this.props;
    const { showFictionCommentForm } = this.state;
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

    const displayToggleCommentButton = numChildren > 0 ? <ToggleCommentButton {...toggleCommentButtonProps} /> : null;

    // Display FictionCommentForm when ReplyToCommentButton is clicked.
    // ReplyToCommentButton is hidden when FictionCommentForm is displayed
    const displayFictionCommentForm = showFictionCommentForm ? (
      <FictionCommentForm {...fictionCommentFormProps} />
    ) : (
      <ReplyToCommentButton {...replyToCommentButtonProps} />
    );

    // Update tree height when component is rendered
    measureTreeHeight();

    return (
      <Fragment>
        <article className="comment-container">
          <CircleAvatar {...circleAvatar} />
          <div className="content">
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
                  &nbsp;-&nbsp;{displayedPublishedDate}
                </time>
              </p>
            </header>
            <p className="comment">{commentContent}</p>
            <footer className="toolbar">
              <p>
                <Translate value="debate.brightMirror.numberOfResponses" count={numChildren} />
              </p>
              {displayToggleCommentButton}
              {displayFictionCommentForm}
            </footer>
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
    // Map graphQL returned data with local props
    return {
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