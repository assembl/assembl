// @flow
import React from 'react';
import { Button } from 'react-bootstrap';

type ToolbarButtonProps = {
  icon: string,
  isActive: boolean,
  label: string,
  onToggle: Function
};

const ToolbarButton = ({ icon, isActive, label, onToggle }: ToolbarButtonProps) => {
  const className = isActive ? 'active' : '';
  return (
    <Button className={className} onClick={onToggle} title={label}>
      <span className={`assembl-icon-${icon}`} />
    </Button>
  );
};

export default ToolbarButton;