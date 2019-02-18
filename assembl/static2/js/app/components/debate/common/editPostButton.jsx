// @flow
import React from 'react';
import { Button } from 'react-bootstrap';

import EditPostIcon from '../../common/icons/editPostIcon/editPostIcon';

export type Props = {
  handleClick: Function,
  linkClassName: ?string
};

const EditPostButton = ({ handleClick, linkClassName }: Props) => (
  <Button bsClass={linkClassName} onClick={handleClick}>
    <EditPostIcon />
  </Button>
);

export default EditPostButton;