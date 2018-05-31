// @flow
import * as React from 'react';
import { Button } from 'react-bootstrap';

type ToolbarButtonProps = {
  icon: string,
  isActive: boolean,
  label: string,
  onToggle: Function
};

const ToolbarButton = ({ icon, isActive, label, onToggle }: ToolbarButtonProps) => {
  const className = isActive ? 'active' : '';
  const onMouseDown = (e: Event) => {
    e.preventDefault();
  };
  return (
    <Button className={className} onMouseDown={onMouseDown} onClick={onToggle} title={label}>
      <span className={`assembl-icon-${icon}`} />
    </Button>
  );
};

export default ToolbarButton;