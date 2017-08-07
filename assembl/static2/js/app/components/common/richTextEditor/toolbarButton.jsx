import React from 'react';
import { Button } from 'react-bootstrap';

const ToolbarButton = ({ isActive, icon, onToggle }) => {
  const className = isActive ? 'active' : '';
  return (
    <Button className={className} onClick={onToggle} title="Yeah">
      <span className={`assembl-icon-${icon}`} />
    </Button>
  );
};

export default ToolbarButton;