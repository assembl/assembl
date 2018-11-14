// @flow
import React from 'react';
import { Button } from 'react-bootstrap';

export type Props = {
  handleClick: Function,
  linkClassName: ?string
};

const EditPostButton = ({ handleClick, linkClassName }: Props) => (
  <Button className={linkClassName} onClick={handleClick}>
    <span className="assembl-icon-edit" />
  </Button>
);

export default EditPostButton;