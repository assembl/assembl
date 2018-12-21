// @flow
import React from 'react';
import { Button } from 'react-bootstrap';

export type Props = {
  /** Callback function handled by the parent component */
  onClickCallback: Function,
  /** Custom CSS class */
  linkClassName: ?string
};

const CommentHelperButton = ({ onClickCallback, linkClassName }: Props) => (
  <Button bsClass={linkClassName} onClick={onClickCallback}>
    <span className="assembl-icon-suggest" />
  </Button>
);

export default CommentHelperButton;