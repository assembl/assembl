// @flow
import React from 'react';
import { Link } from 'react-router';

export type Props = {
  handleClick: Function,
  linkClassName: ?string
};

const EditPostButton = ({ handleClick, linkClassName }: Props) => (
  <Link className={linkClassName} onClick={handleClick}>
    <span className="assembl-icon-edit" />
  </Link>
);

export default EditPostButton;