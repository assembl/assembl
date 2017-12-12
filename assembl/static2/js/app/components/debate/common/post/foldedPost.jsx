// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = {
  nbPosts: number
};

const FoldedPost = ({ nbPosts }: Props) => <Translate value="debate.thread.foldedPostLink" count={nbPosts} />;

export default FoldedPost;