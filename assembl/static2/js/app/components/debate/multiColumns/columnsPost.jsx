// @flow
/* eslint react/jsx-boolean-value: 0 */ // FIXME: flow doesn't seem like empty boolean props
import React from 'react';

import Post, { type Props as PostProps } from '../common/post';

type Props = PostProps & {
  colColor: string
};

const ColumnsPost = (props: Props) => <Post {...props} borderLeftColor={props.colColor} multiColumns={true} />;

export default ColumnsPost;