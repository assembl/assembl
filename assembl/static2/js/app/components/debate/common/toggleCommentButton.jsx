// @flow
import React from 'react';
import { Link } from 'react-router';

// TODO: <span className="assembl-icon-up-open" />

const ToggleCommentButton = () => (
  <Link className="action-toggle">
    <span className="assembl-icon-down-open" />
  </Link>
);

export default ToggleCommentButton;