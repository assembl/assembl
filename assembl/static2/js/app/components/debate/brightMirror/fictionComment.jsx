// @flow
import React from 'react';
// Graphql imports
import { compose, graphql } from 'react-apollo';
// Helpers imports
import moment from 'moment';
// Optimization: Should create commentQuery.graphql and adapt the query
import CommentQuery from '../../../graphql/BrightMirrorFictionQuery.graphql';
// HOC imports
import withLoadingIndicator from '../../../components/common/withLoadingIndicator';
// Components imports
import CircleAvatar from './circleAvatar';
import ToggleCommentButton from '../common/toggleCommentButton';
import ReplyToCommentButton from '../common/replyToCommentButton';
// Constant imports
import { NO_AUTHOR_SPECIFIED, EMPTY_STRING } from '../../../constants';
// Types imports
import type { CircleAvatarProps } from './circleAvatar';

// type FictionCommentProps = {};

export type FictionCommentGraphQLProps = {
  /** Author fullname */
  authorFullname: string,
  /** Circle avatar props */
  circleAvatar: CircleAvatarProps,
  /** Comment content */
  commentContent: string,
  /** Comment displayed published date */
  displayedPublishedDate: string,
  /** Number of child comments */
  numberOfChildComments: number,
  /** Comment published date, TODO: change it into moment date */
  publishedDate: string
};

type LocalFictionCommentProps = FictionCommentGraphQLProps; // & FictionCommentProps;

export const FictionComment = ({
  authorFullname,
  circleAvatar,
  commentContent,
  displayedPublishedDate,
  numberOfChildComments,
  publishedDate
}: LocalFictionCommentProps) => (
  <article className="comment-container">
    <CircleAvatar {...circleAvatar} />
    <div className="content">
      <header className="meta">
        <p>
          <strong>{authorFullname || NO_AUTHOR_SPECIFIED}</strong>
        </p>
        <p className="published-date">
          <time dateTime={publishedDate} pubdate="true">
            &nbsp;-&nbsp;{displayedPublishedDate}
          </time>
        </p>
      </header>
      <p className="comment">{commentContent}</p>
      <footer className="toolbar">
        <p>{numberOfChildComments} answers</p>
        <ToggleCommentButton />
        <ReplyToCommentButton />
      </footer>
    </div>
  </article>
);

const mapQueryToProps = ({ data }) => {
  if (data.loading === false && data.error === undefined) {
    // Define variables
    const { fiction } = data;
    const { contentLocale } = data.variables;
    const circleAvatarProps: CircleAvatarProps = {
      username: fiction.creator.displayName,
      src:
        fiction.creator && fiction.creator.image && fiction.creator.image.externalUrl
          ? fiction.creator.image.externalUrl
          : EMPTY_STRING
    };
    // Map graphQL returned data with local props
    return {
      authorFullname: fiction.creator.displayName,
      circleAvatar: circleAvatarProps,
      commentContent: fiction.body,
      displayedPublishedDate: moment(fiction.creationDate)
        .locale(contentLocale)
        .fromNow(),
      numberOfChildComments: -999,
      publishedDate: fiction.creationDate
    };
  }
  // Return empty object when data is still loading or query is failed
  // TODO: display an alert
  return {};
};

export default compose(graphql(CommentQuery, { props: mapQueryToProps }), withLoadingIndicator())(FictionComment);