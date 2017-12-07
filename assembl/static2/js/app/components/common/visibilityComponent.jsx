import React from 'react';

const VisibilityComponent = ({ classname, isVisible, children }) => (
  <div className={isVisible ? classname : 'hidden'}>{children}</div>
);

export default VisibilityComponent;