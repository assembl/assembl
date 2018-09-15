// @flow
import React from 'react';
import FictionCommentForm from './fictionCommentForm';

import type { FictionCommentFormProps } from './fictionCommentForm';

export type FictionThreadViewProps = {
  contentLocale: string,
  ideaId: string,
  parentId: string,
  onSubmitCommentCallback: Function
};

const FictionThreadView = ({ contentLocale, ideaId, parentId, onSubmitCommentCallback }: FictionThreadViewProps) => {
  const fictionCommentFormProps: FictionCommentFormProps = {
    contentLocale: contentLocale,
    ideaId: ideaId,
    parentId: parentId,
    onSubmitCommentCallback: onSubmitCommentCallback
  };

  return <FictionCommentForm {...fictionCommentFormProps} />;
};

export default FictionThreadView;